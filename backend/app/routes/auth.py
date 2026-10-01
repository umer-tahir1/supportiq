from collections import defaultdict, deque
from time import monotonic
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.auth import create_token, password_hash, require_admin
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
attempts = defaultdict(deque)
dummy_hash = password_hash.hash("unused-dummy-password")


@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    key = request.client.host if request.client else "unknown"
    now = monotonic()
    recent = attempts[key]
    while recent and recent[0] < now - 60:
        recent.popleft()
    if len(recent) >= 10:
        raise HTTPException(429, "Too many login attempts. Try again in a minute.")
    recent.append(now)
    user = db.scalar(select(User).where(User.email == str(data.email).lower()))
    valid = password_hash.verify(
        data.password, user.password_hash if user else dummy_hash
    )
    if not user or not valid or user.role != "admin":
        raise HTTPException(401, "Incorrect email or password.")
    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "email": user.email,
    }


@router.get("/me")
def me(user: User = Depends(require_admin)):
    return {"email": user.email, "role": user.role}
