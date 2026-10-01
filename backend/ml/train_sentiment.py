import joblib


def train_sentiment(folder):
    # VADER ships its lexicon: there is no download or invented training label.
    settings = {
        "method": "VADER plus explicit restaurant phrase rules in ml/domain_rules.py",
        "positive_threshold": 0.05,
        "negative_threshold": -0.05,
    }
    joblib.dump(settings, folder / "sentiment_settings.joblib")
    return {
        **settings,
        "warning": "Derived sentiment, not source labels. Compound score is polarity, not probability. Short administrative descriptors often read neutral; neutral does not imply low severity.",
    }
