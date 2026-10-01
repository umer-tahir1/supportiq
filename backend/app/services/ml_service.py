"""Models are loaded once. Each optional analysis can fail independently."""

import json
import logging
from pathlib import Path
import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from ml.preprocess import clean_text
from ml.domain_rules import expand_complaint_terms, sentiment_input, SENTIMENT_LEXICON

logger = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).resolve().parents[2] / "saved_models"
models = {}
evaluation = {}
sentiment_analyzer = SentimentIntensityAnalyzer()
sentiment_analyzer.lexicon.update(SENTIMENT_LEXICON)


def load_models():
    models.clear()
    evaluation.clear()
    for name in [
        "intent_model",
        "intent_vectorizer",
        "cluster_model",
        "cluster_vectorizer",
        "historical_vectors",
        "historical_records",
    ]:
        try:
            models[name] = joblib.load(MODEL_DIR / f"{name}.joblib")
        except Exception:
            logger.warning(
                "Model unavailable: %s. Train with python -m ml.train_all.", name
            )
    path = MODEL_DIR / "evaluation.json"
    if path.exists():
        evaluation.update(json.loads(path.read_text()))


def predict_intent(text):
    vector = models["intent_vectorizer"].transform(
        [clean_text(expand_complaint_terms(text))]
    )
    if vector.nnz == 0:
        return {"predicted_intent": "Needs review", "intent_confidence": 0.0}
    probabilities = models["intent_model"].predict_proba(vector)[0]
    index = int(np.argmax(probabilities))
    confidence = float(probabilities[index])
    label = (
        str(models["intent_model"].classes_[index])
        if confidence >= 0.35
        else "Needs review"
    )
    return {"predicted_intent": label, "intent_confidence": confidence}


def predict_sentiment(text):
    score = sentiment_analyzer.polarity_scores(sentiment_input(text))["compound"]
    label = "Positive" if score >= 0.05 else "Negative" if score <= -0.05 else "Neutral"
    return {"sentiment": label, "sentiment_score": score}


def assign_cluster(text):
    vector = models["cluster_vectorizer"].transform(
        [clean_text(expand_complaint_terms(text))]
    )
    return {
        "cluster_id": (
            int(models["cluster_model"].predict(vector)[0]) if vector.nnz else None
        )
    }


def analyze_complaint(text):
    result = {}
    warnings = []
    for function in [predict_intent, predict_sentiment, assign_cluster]:
        try:
            result.update(function(text))
        except Exception:
            logger.exception("Analysis unavailable: %s", function.__name__)
            warnings.append(function.__name__)
    result["analysis_warning"] = (
        "Unavailable: " + ", ".join(warnings) if warnings else None
    )
    return result


def find_similar_complaints(text, top_n=5, exclude_ticket=None):
    vector = models["cluster_vectorizer"].transform(
        [clean_text(expand_complaint_terms(text))]
    )
    scores = cosine_similarity(vector, models["historical_vectors"]).ravel()
    results = []
    for index in np.argsort(-scores, kind="stable"):
        record = models["historical_records"][int(index)]
        if scores[index] <= 0:
            break
        if record["ticket_id"] == exclude_ticket:
            continue
        results.append({**record, "similarity": round(float(scores[index]) * 100, 1)})
        if len(results) == top_n:
            break
    return results
