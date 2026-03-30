from fastapi import APIRouter, HTTPException
from app.schemas.simplify import SimplifyRequest, SimplifyResponse
from app.services.ai_service import generate_simplified_text

router = APIRouter(tags=["Simplify"])


@router.post("/simplify-text", response_model=SimplifyResponse)
def simplify_text(payload: SimplifyRequest):
    try:
        result = generate_simplified_text(payload.text, payload.support_mode)
        return SimplifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simplification failed: {str(e)}")