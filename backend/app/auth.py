import os
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def get_secret():
    secret = os.getenv("SECRET_KEY", "")
    if len(secret) < 32 or secret.startswith("REPLACE_"):
        raise RuntimeError("Set SECRET_KEY to at least 32 random characters in .env.")
    return secret


def create_token(user):
    return jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(hours=8)},
        get_secret(),
        algorithm="HS256",
    )


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    unauthorized = HTTPException(
        status_code=401, detail="Please sign in as an administrator."
    )
    if not credentials:
        raise unauthorized
    try:
        claims = jwt.decode(
            credentials.credentials,
            get_secret(),
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        user = db.get(User, int(claims["sub"]))
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise unauthorized
    if not user or user.role != "admin":
        raise unauthorized
    return user
