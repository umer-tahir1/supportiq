"""Keep source descriptors intact; never manufacture customer narratives."""

import argparse
import json
import re
from pathlib import Path
import pandas as pd
from ml.inspect_dataset import find_dataset

BACKEND = Path(__file__).resolve().parents[1]
PROCESSED = BACKEND / "data" / "processed"


def clean_text(text):
    text = str(text or "").lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def preprocess(path):
    raw = pd.read_csv(path, dtype=str, keep_default_na=False)
    original_count = len(raw)
    raw = raw.drop_duplicates(subset="Unique Key")
    data = pd.DataFrame()
    data["ticket_id"] = raw["Unique Key"]
    data["complaint_text"] = raw["Problem Detail (formerly Descriptor)"].str.strip()
    data["cleaned_text"] = data["complaint_text"].map(clean_text)
    data["complaint_type"] = raw["Problem (formerly Complaint Type)"]
    data["intent_label"] = data["complaint_text"]
    for target, source in [
        ("created_at", "Created Date"),
        ("closed_at", "Closed Date"),
    ]:
        # Source dates are NYC local wall times; retain them without inventing a zone.
        data[target] = pd.to_datetime(
            raw[source], format="%Y %b %d %I:%M:%S %p", errors="coerce"
        )
    data["location"] = raw[["Incident Address", "Borough", "Incident Zip"]].apply(
        lambda row: ", ".join(
            value for value in row if value and value != "Unspecified"
        ),
        axis=1,
    )
    data["borough"] = raw["Borough"].replace("Unspecified", "Unknown")
    data["status"] = raw["Status"].replace("Unspecified", "Unknown")
    data["source"] = "historical_dataset"
    empty_text = data["cleaned_text"].eq("")
    report = {
        "source_rows": original_count,
        "duplicate_ids_removed": original_count - len(raw),
        "empty_descriptors_removed": int(empty_text.sum()),
        "invalid_created_dates": int(data.created_at.isna().sum()),
        "missing_or_invalid_closed_dates": int(data.closed_at.isna().sum()),
        "negative_resolution_intervals": int((data.closed_at < data.created_at).sum()),
        "text_source": "Problem Detail (formerly Descriptor), not a customer narrative",
        "business_name": "Not available; omitted",
    }
    data = data.loc[~empty_text & data.ticket_id.ne("")].copy()
    report["processed_rows"] = len(data)
    PROCESSED.mkdir(parents=True, exist_ok=True)
    data.to_csv(PROCESSED / "complaints.csv", index=False)
    (PROCESSED / "cleaning_report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path)
    args = parser.parse_args()
    preprocess(args.dataset or find_dataset())
