import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split


def train_intent(data, folder):
    counts = data.intent_label.value_counts()
    # All 32 source classes have at least 16 rows, so none need merging.
    usable = data[data.intent_label.map(counts) >= 5]
    x_train, x_test, y_train, y_test = train_test_split(
        usable.cleaned_text,
        usable.intent_label,
        test_size=0.2,
        random_state=42,
        stratify=usable.intent_label,
    )
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
    train_vectors = vectorizer.fit_transform(x_train)
    model = LogisticRegression(max_iter=400, class_weight="balanced", random_state=42)
    model.fit(train_vectors, y_train)
    predictions = model.predict(vectorizer.transform(x_test))
    report = {
        "accuracy": accuracy_score(y_test, predictions),
        "classification_report": classification_report(
            y_test, predictions, output_dict=True, zero_division=0
        ),
        "confusion_matrix": confusion_matrix(
            y_test, predictions, labels=model.classes_
        ).tolist(),
        "labels": model.classes_.tolist(),
        "class_counts": {str(k): int(v) for k, v in counts.items()},
        "removed_classes": counts[counts < 5].index.tolist(),
        "train_rows": len(x_train),
        "test_rows": len(x_test),
        "unique_texts": int(usable.cleaned_text.nunique()),
        "warning": "Descriptor reconstruction benchmark only. Input descriptors are also labels and repeat across the split. Scores do NOT measure generalization to free-form customer complaints. Independent labeled narratives are required for that evaluation.",
    }
    joblib.dump(model, folder / "intent_model.joblib")
    joblib.dump(vectorizer, folder / "intent_vectorizer.joblib")
    return report
