"""Generate local-only secrets. Existing configuration is never overwritten."""

import secrets
from pathlib import Path


def setup_local():
    root = Path(__file__).resolve().parents[2]
    path = root / ".env"
    if path.exists():
        if "POSTGRES_PASSWORD=" not in path.read_text():
            with path.open("a") as file:
                file.write(f"\nPOSTGRES_PASSWORD={secrets.token_hex(24)}\n")
            print(
                "Added a random Docker PostgreSQL password; existing settings unchanged."
            )
        else:
            print(".env already exists; leaving it unchanged.")
        return
    lines = [
        f"DATABASE_URL=sqlite:///{root / 'backend' / 'supportiq.db'}",
        f"SECRET_KEY={secrets.token_urlsafe(48)}",
        "ADMIN_EMAIL=admin@urbanbite.example",
        f"ADMIN_PASSWORD={secrets.token_urlsafe(18)}",
        "FRONTEND_URL=http://localhost:5173",
        "VITE_API_URL=http://localhost:8000/api",
        f"POSTGRES_PASSWORD={secrets.token_hex(24)}",
    ]
    path.write_text("\n".join(lines) + "\n")
    path.chmod(0o600)
    print(
        "Created private .env for SQLite development. Open it locally for your admin credentials."
    )


if __name__ == "__main__":
    setup_local()
