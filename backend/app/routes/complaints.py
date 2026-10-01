from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from app.auth import require_admin
from app.database import get_db
from app.models import Complaint
from app.schemas import ComplaintCreate, StatusUpdate
from app.services.complaint_service import create_complaint, serialize_complaint
from app.services.ml_service import find_similar_complaints

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.post("", status_code=201)
def submit(data: ComplaintCreate, db: Session = Depends(get_db)):
    complaint = create_complaint(db, data)
    # Public responses do not disclose customer details or internal analysis.
    return {
        "ticket_id": complaint.external_ticket_id,
        "message": "Your complaint has been submitted successfully.",
    }


@router.get("", dependencies=[Depends(require_admin)])
def list_complaints(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=200),
    sentiment: str | None = None,
    category: str | None = None,
    cluster: int | None = None,
    source: str | None = None,
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    statement = select(Complaint)
    if search:
        statement = statement.where(
            or_(
                Complaint.complaint_text.icontains(search, autoescape=True),
                Complaint.external_ticket_id.icontains(search, autoescape=True),
                Complaint.subject.icontains(search, autoescape=True),
            )
        )
    for column, value in [
        (Complaint.sentiment, sentiment),
        (Complaint.complaint_type, category),
        (Complaint.cluster_id, cluster),
        (Complaint.source, source),
        (Complaint.status, status),
    ]:
        if value is not None:
            statement = statement.where(column == value)
    if date_from:
        statement = statement.where(Complaint.created_at >= date_from)
    if date_to:
        statement = statement.where(Complaint.created_at < date_to + timedelta(days=1))
    total = db.scalar(select(func.count()).select_from(statement.subquery()))
    rows = db.scalars(
        statement.order_by(Complaint.created_at.desc(), Complaint.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [serialize_complaint(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{ticket_id}", dependencies=[Depends(require_admin)])
def details(ticket_id: str, db: Session = Depends(get_db)):
    complaint = db.scalar(
        select(Complaint).where(Complaint.external_ticket_id == ticket_id)
    )
    if not complaint:
        raise HTTPException(404, "Ticket not found.")
    result = serialize_complaint(complaint)
    try:
        result["similar_cases"] = find_similar_complaints(
            complaint.complaint_text, exclude_ticket=ticket_id
        )
        result["similarity_available"] = True
    except Exception:
        result["similar_cases"] = []
        result["similarity_available"] = False
    return result


@router.patch("/{ticket_id}", dependencies=[Depends(require_admin)])
def update_status(ticket_id: str, data: StatusUpdate, db: Session = Depends(get_db)):
    complaint = db.scalar(
        select(Complaint).where(Complaint.external_ticket_id == ticket_id)
    )
    if not complaint:
        raise HTTPException(404, "Ticket not found.")
    if data.status != complaint.status:
        complaint.status = data.status
        complaint.closed_at = (
            datetime.now(timezone.utc).replace(tzinfo=None)
            if data.status == "Closed"
            else None
        )
        db.commit()
    return serialize_complaint(complaint)
