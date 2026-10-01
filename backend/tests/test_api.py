"""Integration checks use an isolated temporary DB and the real trained models."""

import os
import secrets
import tempfile
from pathlib import Path

TEST_DIRECTORY = tempfile.TemporaryDirectory(prefix="supportiq-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(TEST_DIRECTORY.name) / 'test.db'}"
os.environ["SECRET_KEY"] = secrets.token_urlsafe(48)

import pytest
from fastapi.testclient import TestClient
from app.auth import password_hash
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import User
from app.services import ml_service

TEST_PASSWORD = "a-test-password-only-123"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as client:
        with SessionLocal() as db:
            db.add(
                User(
                    email="admin@example.com",
                    password_hash=password_hash.hash(TEST_PASSWORD),
                    role="admin",
                )
            )
            db.commit()
        yield client
    engine.dispose()
    TEST_DIRECTORY.cleanup()


@pytest.fixture
def headers(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    return {"Authorization": "Bearer " + response.json()["access_token"]}


def test_protected_routes_and_login(client):
    for path in [
        "/api/auth/me",
        "/api/complaints",
        "/api/complaints/123",
        "/api/dashboard/summary",
        "/api/dashboard/trends",
        "/api/analytics/categories",
        "/api/analytics/sentiment",
        "/api/clusters",
        "/api/ml/evaluation",
    ]:
        assert client.get(path).status_code == 401
    for path in ["/api/ml/predict", "/api/ml/similar"]:
        assert client.post(path, json={"text": "Food spoiled"}).status_code == 401
    assert (
        client.patch("/api/complaints/123", json={"status": "Closed"}).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": "admin@example.com", "password": "wrong"}
        ).status_code
        == 401
    )
    assert (
        client.get(
            "/api/dashboard/summary", headers={"Authorization": "Bearer forged"}
        ).status_code
        == 401
    )


def test_submission_analysis_summary_and_status(client, headers):
    payload = {
        "customer_name": "Test Customer",
        "email": "customer@example.com",
        "subject": "Late and cold order",
        "complaint_text": "My order arrived almost one hour late and the food was completely cold.",
    }
    response = client.post("/api/complaints", json=payload)
    assert response.status_code == 201
    assert "email" not in response.json()
    ticket_id = response.json()["ticket_id"]
    assert ticket_id.startswith("UB-")
    details = client.get(f"/api/complaints/{ticket_id}", headers=headers).json()
    assert details["source"] == "customer_portal"
    assert details["predicted_intent"] == "Food Temperature"
    assert details["sentiment"] == "Negative"
    assert details["cluster_id"] is not None
    assert len(details["similar_cases"]) == 5
    assert details["analysis_warning"] is None
    summary = client.get("/api/dashboard/summary", headers=headers).json()
    assert summary["total"] >= 1 and summary["live"] >= 1
    assert summary["recent_live"][0]["external_ticket_id"] == ticket_id
    trends = client.get("/api/dashboard/trends", headers=headers).json()
    assert sum(row["count"] for row in trends) == summary["total"]
    assert sum(sum(row["issues"].values()) for row in trends) == summary["total"]
    for status in ["Closed", "Open"]:
        result = client.patch(
            f"/api/complaints/{ticket_id}", json={"status": status}, headers=headers
        )
        assert result.status_code == 200
        assert bool(result.json()["closed_at"]) == (status == "Closed")
    filtered = client.get(
        "/api/complaints",
        params={
            "source": "customer_portal",
            "search": ticket_id,
            "sentiment": "Negative",
        },
        headers=headers,
    ).json()
    assert filtered["total"] == 1


def test_ml_prediction_and_similarity(client, headers):
    prediction = client.post(
        "/api/ml/predict",
        json={"text": "Food Contains Foreign Object"},
        headers=headers,
    )
    assert prediction.json()["predicted_intent"] == "Food Contains Foreign Object"
    results = client.post(
        "/api/ml/similar", json={"text": "Rodents insects garbage"}, headers=headers
    ).json()["items"]
    assert len(results) == 5
    assert results[0]["complaint_category"] == "Rodents/Insects/Garbage"
    assert 0 < results[0]["similarity"] <= 100
    assert (
        client.post(
            "/api/ml/similar", json={"text": "xyzzyqwerty"}, headers=headers
        ).json()["items"]
        == []
    )
    assert (
        ml_service.predict_intent("xyzzyqwerty")["predicted_intent"] == "Needs review"
    )


def test_validation(client, headers):
    assert (
        client.post("/api/complaints", json={"complaint_text": "bad"}).status_code
        == 422
    )
    assert client.get("/api/complaints?page=0", headers=headers).status_code == 422
    assert client.get("/api/complaints/nonexistent", headers=headers).status_code == 404
    assert (
        client.post(
            "/api/ml/predict", json={"text": " " * 50}, headers=headers
        ).status_code
        == 422
    )


def test_submission_survives_optional_model_failure(client, monkeypatch):
    def broken_model(text):
        raise RuntimeError("Simulated unavailable model")

    monkeypatch.setattr(ml_service, "predict_intent", broken_model)
    result = client.post(
        "/api/complaints",
        json={
            "customer_name": "Fallback Test",
            "email": "test@example.com",
            "subject": "Submission during outage",
            "complaint_text": "The food was spoiled and I am very disappointed.",
        },
    )
    assert result.status_code == 201


def test_sentiment_rules_are_explicit():
    assert (
        ml_service.predict_sentiment("The food was completely cold.")["sentiment"]
        == "Negative"
    )
    assert (
        ml_service.predict_sentiment("Excellent service, delicious food, I loved it!")[
            "sentiment"
        ]
        == "Positive"
    )
    assert ml_service.predict_sentiment("Letter Grading")["sentiment"] == "Neutral"
