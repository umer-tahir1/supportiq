"""Inspect the actual source before choosing fields for the application."""

import argparse
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]


def find_dataset():
    files = sorted(ROOT.glob("*.csv"))
    if len(files) != 1:
        raise ValueError(
            "Pass --dataset when the root contains zero or multiple CSV files."
        )
    return files[0]


def inspect_dataset(path):
    data = pd.read_csv(path, dtype=str, keep_default_na=False)
    print("Shape:", data.shape)
    print("Columns:", data.columns.tolist())
    print("First five rows:\n", data.head().to_string(index=False))
    print("Missing values:\n", data.eq("").sum().to_string())
    print("Duplicate rows:", data.duplicated().sum())
    print("Duplicate IDs:", data["Unique Key"].duplicated().sum())
    for column in [
        "Problem (formerly Complaint Type)",
        "Problem Detail (formerly Descriptor)",
    ]:
        print(column, "\n", data[column].value_counts().to_string())
    print("Text: Problem Detail (formerly Descriptor); no free-text narrative exists.")
    print("Dates: Created Date, Closed Date, Resolution Action Updated Date.")
    print(
        "Location: Incident Address, City, Borough, Incident Zip, Latitude, Longitude."
    )
    print("No restaurant name or sentiment label exists in this export.")
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=None)
    args = parser.parse_args()
    inspect_dataset(args.dataset or find_dataset())
