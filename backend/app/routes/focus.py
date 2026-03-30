from fastapi import APIRouter, HTTPException
from app.schemas.focus import FocusRequest, FocusResponse
from app.services.ai_service import generate_focus_session as generate_focus_session_ai

router = APIRouter(tags=["Focus"])


@router.post("/generate-focus-session", response_model=FocusResponse)
async def generate_focus_session(payload: FocusRequest):
    try:
        result = generate_focus_session_ai(payload.step_text, payload.support_mode)
        suggested = result.get("suggested_duration_minutes", payload.duration_minutes)
        # Clamp to valid range
        clamped_duration = max(1, min(120, int(suggested)))
        return FocusResponse(
            step_text=payload.step_text,
            duration_minutes=clamped_duration,
            supportive_prompt=result["supportive_prompt"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Focus session generation failed.")