import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score


def train_clusters(data, folder):
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
    vectors = vectorizer.fit_transform(data.cleaned_text)
    # Evaluate unique descriptors to avoid millions of repeated pairwise comparisons.
    unique_vectors = vectorizer.transform(data.cleaned_text.drop_duplicates())
    experiments = []
    models = []
    for k in [5, 8, 10]:
        k = min(k, unique_vectors.shape[0] - 1)
        model = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = model.fit_predict(vectors)
        score = silhouette_score(unique_vectors, model.predict(unique_vectors))
        experiments.append(
            {
                "k": k,
                "silhouette_unique_descriptors": float(score),
                "inertia": float(model.inertia_),
            }
        )
        models.append((model, labels))
    best = int(np.argmax([row["silhouette_unique_descriptors"] for row in experiments]))
    model, labels = models[best]
    terms = vectorizer.get_feature_names_out()
    clusters = []
    for cluster_id in range(model.n_clusters):
        group = data.loc[labels == cluster_id]
        keywords = terms[
            model.cluster_centers_[cluster_id].argsort()[-6:][::-1]
        ].tolist()
        clusters.append(
            {
                "cluster_id": cluster_id,
                "name": " / ".join(keywords[:2]).title(),
                "keywords": keywords,
                "training_count": len(group),
                "dominant_category": group.intent_label.mode().iloc[0],
                "examples": group.complaint_text.drop_duplicates().head(3).tolist(),
            }
        )
    joblib.dump(model, folder / "cluster_model.joblib")
    joblib.dump(vectorizer, folder / "cluster_vectorizer.joblib")
    return {
        "selected_k": model.n_clusters,
        "experiments": experiments,
        "clusters": clusters,
    }
