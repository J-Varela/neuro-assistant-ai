from fastapi import APIRouter
from app.schemas.focus import FocusRequest, FocusResponse

router = APIRouter(tags=["Focus"])


@router.post("/generate-focus-session", response_model=FocusResponse)
def generate_focus_session(payload: FocusRequest):
    return FocusResponse(
        step_text=payload.step_text,
        duration_minutes=payload.duration_minutes,
        supportive_prompt="Focus on just this step. You do not need to finish everything right now."
    )