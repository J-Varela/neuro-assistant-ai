import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session_id
from app.core.limiter import limiter
from app.schemas.breakdown import BreakdownRequest, BreakdownResponse
from app.services.ai_service import generate_breakdown
from app.db.database import get_db
from app.db import crud

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Breakdown"])


@router.post("/breakdown-task", response_model=BreakdownResponse)
@limiter.limit("10/minute")
async def breakdown_task(
    request: Request,
    payload: BreakdownRequest,
    db: AsyncSession = Depends(get_db),
    session_id: str = Depends(get_session_id),
):
    try:
        result = await asyncio.to_thread(generate_breakdown, payload.text, payload.support_mode)
        await crud.create_history_entry(
            db,
            session_id=session_id,
            entry_type="Task Breakdown",
            input_text=payload.text,
            support_mode=payload.support_mode,
            output=result,
        )
        return BreakdownResponse(**result)
    except Exception as exc:
        logger.exception("Breakdown generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Breakdown generation failed.")