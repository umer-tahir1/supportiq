from datetime import datetime, timezone
from uuid import uuid4
from app.models import Complaint
from app.services.ml_service import analyze_complaint
from ml.preprocess import clean_text


def serialize_complaint(complaint):
    return {
        column.name: getattr(complaint, column.name)
        for column in Complaint.__table__.columns
    }


def create_complaint(db, data):
    complaint = Complaint(
        **data.model_dump(),
        external_ticket_id="UB-" + uuid4().hex[:12].upper(),
        cleaned_text=clean_text(data.complaint_text),
        source="customer_portal",
        status="Open",
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        **analyze_complaint(data.complaint_text)
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint
