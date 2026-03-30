from fastapi import APIRouter, HTTPException
from app.schemas.breakdown import BreakdownRequest, BreakdownResponse
from app.services.ai_service import generate_breakdown

router = APIRouter(tags=["Breakdown"])


@router.post("/breakdown-task", response_model=BreakdownResponse)
def breakdown_task(payload: BreakdownRequest):
    try:
        result = generate_breakdown(payload.text, payload.support_mode)
        return BreakdownResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Breakdown generation failed: {str(e)}")