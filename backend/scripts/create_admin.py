import os
from sqlalchemy import select
from app.database import Base, SessionLocal, engine
from app.models import User
from app.auth import password_hash
from pydantic import TypeAdapter, EmailStr


def create_admin():
    email = str(
        TypeAdapter(EmailStr).validate_python(os.environ["ADMIN_EMAIL"])
    ).lower()
    password = os.environ["ADMIN_PASSWORD"]
    if len(password) < 12 or password.startswith("REPLACE_"):
        raise ValueError(
            "ADMIN_PASSWORD must be a real password of at least 12 characters."
        )
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            print("Administrator already exists; password unchanged.")
            return
        db.add(
            User(email=email, password_hash=password_hash.hash(password), role="admin")
        )
        db.commit()
    print("Administrator created from environment variables.")


if __name__ == "__main__":
    create_admin()
