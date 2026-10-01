import argparse
import json
from pathlib import Path
from ml.inspect_dataset import find_dataset
from ml.preprocess import BACKEND, preprocess
from ml.train_intent import train_intent
from ml.train_sentiment import train_sentiment
from ml.train_clusters import train_clusters
from ml.similarity import save_similarity_index


def train_all(path):
    data = preprocess(path)
    folder = BACKEND / "saved_models"
    folder.mkdir(exist_ok=True)
    print("Training descriptor classifier…", flush=True)
    intent = train_intent(data, folder)
    print("Evaluating K-Means…", flush=True)
    clusters = train_clusters(data, folder)
    sentiment = train_sentiment(folder)
    save_similarity_index(data, folder)
    report = {"intent": intent, "sentiment": sentiment, "clustering": clusters}
    (folder / "evaluation.json").write_text(json.dumps(report, indent=2))
    print("Saved models and evaluation.json. Accuracy:", intent["accuracy"])
    print(intent["warning"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path)
    args = parser.parse_args()
    train_all(args.dataset or find_dataset())
