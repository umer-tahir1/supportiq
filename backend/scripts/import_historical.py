"""Explicit, repeatable import. API startup never imports the dataset."""

from datetime import datetime
import pandas as pd
from sqlalchemy import select
from app.database import Base, SessionLocal, engine
from app.models import Complaint
from app.services.ml_service import analyze_complaint, load_models, models
from ml.preprocess import PROCESSED


def parse_date(value):
    return datetime.fromisoformat(value) if value else None


def import_historical():
    load_models()
    if len(models) != 6:
        raise RuntimeError("Train models before importing historical complaints.")
    data = pd.read_csv(PROCESSED / "complaints.csv", dtype=str, keep_default_na=False)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        existing = set(db.scalars(select(Complaint.external_ticket_id)).all())
        data = data.loc[~data.ticket_id.isin(existing)]
        # This dataset repeats 32 descriptors. Analyze each once, then reuse the result.
        analysis = {
            text: analyze_complaint(text) for text in data.complaint_text.unique()
        }
        if any(value["analysis_warning"] for value in analysis.values()):
            raise RuntimeError(
                "An analysis component failed; resolve it before import."
            )
        batch = []
        for row in data.to_dict("records"):
            batch.append(
                Complaint(
                    external_ticket_id=row["ticket_id"],
                    complaint_text=row["complaint_text"],
                    cleaned_text=row["cleaned_text"],
                    complaint_type=row["complaint_type"],
                    location=row["location"],
                    borough=row["borough"],
                    status=row["status"],
                    source="historical_dataset",
                    created_at=parse_date(row["created_at"]),
                    closed_at=parse_date(row["closed_at"]),
                    **analysis[row["complaint_text"]],
                )
            )
            if len(batch) == 2000:
                db.add_all(batch)
                db.commit()
                batch = []
        db.add_all(batch)
        db.commit()
    print(f"Imported {len(data):,} complaints; existing ticket IDs skipped.")


if __name__ == "__main__":
    import_historical()
