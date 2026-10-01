from collections import Counter, defaultdict
from sqlalchemy import func, select
from app.models import Complaint
from app.services.complaint_service import serialize_complaint


def count_groups(db, column):
    rows = db.execute(
        select(column, func.count()).group_by(column).order_by(func.count().desc())
    ).all()
    return [
        {"name": name if name is not None else "Unanalyzed", "count": count}
        for name, count in rows
    ]


def calculate_dashboard_metrics(db):
    total = db.scalar(select(func.count()).select_from(Complaint)) or 0
    sources = {row["name"]: row["count"] for row in count_groups(db, Complaint.source)}
    sentiments = {
        row["name"]: row["count"] for row in count_groups(db, Complaint.sentiment)
    }
    analyzed = sum(
        sentiments.get(label, 0) for label in ["Positive", "Neutral", "Negative"]
    )
    durations = db.execute(
        select(Complaint.created_at, Complaint.closed_at).where(
            Complaint.closed_at.is_not(None),
            Complaint.created_at.is_not(None),
            Complaint.closed_at >= Complaint.created_at,
        )
    ).all()
    hours = [(closed - created).total_seconds() / 3600 for created, closed in durations]
    recent = db.scalars(
        select(Complaint)
        .order_by(Complaint.created_at.desc(), Complaint.id.desc())
        .limit(6)
    ).all()
    live = db.scalars(
        select(Complaint)
        .where(Complaint.source == "customer_portal")
        .order_by(Complaint.id.desc())
        .limit(5)
    ).all()
    negative = db.scalars(
        select(Complaint)
        .where(Complaint.sentiment == "Negative")
        .order_by(Complaint.created_at.desc())
        .limit(5)
    ).all()
    categories = count_groups(db, Complaint.complaint_type)
    return {
        "total": total,
        "historical": sources.get("historical_dataset", 0),
        "live": sources.get("customer_portal", 0),
        "open": db.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.status.in_(["Open", "In Progress"]))
        ),
        "negative_percent": (
            round(100 * sentiments.get("Negative", 0) / analyzed, 1) if analyzed else 0
        ),
        "sentiment_analyzed": analyzed,
        "clusters": db.scalar(select(func.count(func.distinct(Complaint.cluster_id)))),
        "average_resolution_hours": (
            round(sum(hours) / len(hours), 1) if hours else None
        ),
        "resolution_sample_count": len(hours),
        "top_category": categories[0]["name"] if categories else None,
        "recent": [serialize_complaint(row) for row in recent],
        "recent_live": [serialize_complaint(row) for row in live],
        "negative_tickets": [serialize_complaint(row) for row in negative],
    }


def get_trends(db):
    rows = db.execute(
        select(Complaint.created_at, Complaint.predicted_intent, Complaint.source)
    ).all()
    months = defaultdict(Counter)
    issues = defaultdict(Counter)
    for created, category, source in rows:
        if created:
            month = created.strftime("%Y-%m")
            months[month]["count"] += 1
            months[month][source] += 1
            issues[month][category or "Unanalyzed"] += 1
    # Include missing months as zeros instead of visually connecting over gaps.
    if months:
        year, month = map(int, min(months).split("-"))
        last = max(months)
        while f"{year:04d}-{month:02d}" <= last:
            months[f"{year:04d}-{month:02d}"]
            month += 1
            if month == 13:
                year, month = year + 1, 1
    return [
        {
            "month": month,
            "count": counts["count"],
            "historical": counts["historical_dataset"],
            "live": counts["customer_portal"],
            "issues": dict(issues[month]),
        }
        for month, counts in sorted(months.items())
    ]
