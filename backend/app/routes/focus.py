import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request

from app.core.limiter import limiter
from app.schemas.focus import FocusRequest, FocusResponse
from app.services.ai_service import generate_focus_session as generate_focus_session_ai

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Focus"])


@router.post("/generate-focus-session", response_model=FocusResponse)
@limiter.limit("20/minute")
async def generate_focus_session(
    request: Request,
    payload: FocusRequest,
):
    try:
        result = await asyncio.to_thread(generate_focus_session_ai, payload.step_text, payload.support_mode)

        # Safely parse AI-suggested duration; fall back to user-requested value.
        try:
            suggested = int(result.get("suggested_duration_minutes", payload.duration_minutes))
            clamped_duration = max(1, min(120, suggested))
        except (TypeError, ValueError):
            logger.warning("Could not parse AI-suggested duration; using request value.")
            clamped_duration = payload.duration_minutes

        response_data = FocusResponse(
            step_text=payload.step_text,
            duration_minutes=clamped_duration,
            supportive_prompt=result["supportive_prompt"],
        )
        return response_data
    except ValueError as exc:
        logger.error("Focus session ValueError: %s", exc)
        raise HTTPException(status_code=502, detail="AI service returned an invalid response.")
    except Exception as exc:
        logger.exception("Focus session generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Focus session generation failed.")
