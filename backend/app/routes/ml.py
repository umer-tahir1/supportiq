from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_admin
from app.schemas import TextRequest
from app.services.ml_service import (
    analyze_complaint,
    evaluation,
    find_similar_complaints,
)

router = APIRouter(
    prefix="/api/ml", tags=["Machine learning"], dependencies=[Depends(require_admin)]
)


@router.post("/predict")
def predict(data: TextRequest):
    return analyze_complaint(data.text)


@router.post("/similar")
def similar(data: TextRequest):
    try:
        return {"items": find_similar_complaints(data.text)}
    except Exception:
        raise HTTPException(
            503, "Similarity index unavailable. Run the model training command."
        )


@router.get("/evaluation")
def model_evaluation():
    return evaluation
