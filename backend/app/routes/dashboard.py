from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.auth import require_admin
from app.database import get_db
from app.models import Complaint
from app.services.dashboard_service import (
    calculate_dashboard_metrics,
    count_groups,
    get_trends,
)
from app.services.ml_service import evaluation

router = APIRouter(
    prefix="/api", tags=["Analytics"], dependencies=[Depends(require_admin)]
)


@router.get("/dashboard/summary")
def summary(db: Session = Depends(get_db)):
    return calculate_dashboard_metrics(db)


@router.get("/dashboard/trends")
def trends(db: Session = Depends(get_db)):
    return get_trends(db)


@router.get("/analytics/categories")
def categories(db: Session = Depends(get_db)):
    return {
        "categories": count_groups(db, Complaint.complaint_type),
        "issues": count_groups(db, Complaint.predicted_intent),
        "locations": count_groups(db, Complaint.borough),
        "sources": count_groups(db, Complaint.source),
        "statuses": count_groups(db, Complaint.status),
    }


@router.get("/analytics/sentiment")
def sentiment(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Complaint.predicted_intent, Complaint.sentiment, func.count()).group_by(
            Complaint.predicted_intent, Complaint.sentiment
        )
    ).all()
    groups = {}
    for category, label, count in rows:
        key = category or "Unanalyzed"
        groups.setdefault(
            key,
            {"name": key, "Positive": 0, "Neutral": 0, "Negative": 0, "Unanalyzed": 0},
        )
        groups[key][label or "Unanalyzed"] = count
    return {
        "distribution": count_groups(db, Complaint.sentiment),
        "by_category": sorted(
            groups.values(),
            key=lambda row: row["Positive"] + row["Neutral"] + row["Negative"],
            reverse=True,
        ),
    }


@router.get("/clusters")
def clusters(db: Session = Depends(get_db)):
    counts = {
        row["name"]: row["count"] for row in count_groups(db, Complaint.cluster_id)
    }
    total = sum(counts.values())
    output = []
    for cluster in evaluation.get("clustering", {}).get("clusters", []):
        count = counts.get(cluster["cluster_id"], 0)
        output.append(
            {
                **cluster,
                "count": count,
                "percentage": round(100 * count / total, 1) if total else 0,
            }
        )
    return {
        "items": output,
        "experiments": evaluation.get("clustering", {}).get("experiments", []),
        "unassigned": counts.get("Unanalyzed", 0),
    }
