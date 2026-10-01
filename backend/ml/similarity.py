import joblib


def save_similarity_index(data, folder):
    vectorizer = joblib.load(folder / "cluster_vectorizer.joblib")
    joblib.dump(
        vectorizer.transform(data.cleaned_text), folder / "historical_vectors.joblib"
    )
    records = data[["ticket_id", "complaint_text", "intent_label"]].rename(
        columns={"intent_label": "complaint_category"}
    )
    joblib.dump(records.to_dict("records"), folder / "historical_records.joblib")
