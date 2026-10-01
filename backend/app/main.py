import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import get_secret
from app.database import Base, engine
from app.routes import auth, complaints, dashboard, ml
from app.services.ml_service import load_models, models


@asynccontextmanager
async def lifespan(app):
    get_secret()
    Base.metadata.create_all(engine)
    load_models()
    yield


app = FastAPI(title="SupportIQ API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
for router in [auth.router, complaints.router, dashboard.router, ml.router]:
    app.include_router(router)


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "models_loaded": len(models) == 6}
