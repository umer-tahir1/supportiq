from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="admin")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class Complaint(Base):
    __tablename__ = "complaints"
    id: Mapped[int] = mapped_column(primary_key=True)
    external_ticket_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    complaint_text: Mapped[str] = mapped_column(Text)
    cleaned_text: Mapped[str] = mapped_column(Text)
    complaint_type: Mapped[str | None] = mapped_column(
        String(120), nullable=True, index=True
    )
    predicted_intent: Mapped[str | None] = mapped_column(String(120), nullable=True)
    intent_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    cluster_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default="Open", index=True)
    location: Mapped[str | None] = mapped_column(String(400), nullable=True)
    borough: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source: Mapped[str] = mapped_column(String(30), index=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, index=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(160), nullable=True)
    analysis_warning: Mapped[str | None] = mapped_column(Text, nullable=True)
