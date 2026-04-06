import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session_id
from app.core.limiter import limiter
from app.schemas.simplify import SimplifyRequest, SimplifyResponse
from app.services.ai_service import generate_simplified_text
from app.db.database import get_db
from app.db import crud

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Simplify"])


@router.post("/simplify-text", response_model=SimplifyResponse)
@limiter.limit("10/minute")
async def simplify_text(
    request: Request,
    payload: SimplifyRequest,
    db: AsyncSession = Depends(get_db),
    session_id: str = Depends(get_session_id),
):
    try:
        result = await asyncio.to_thread(generate_simplified_text, payload.text, payload.support_mode)
        await crud.create_history_entry(
            db,
            session_id=session_id,
            entry_type="Text Simplification",
            input_text=payload.text,
            support_mode=payload.support_mode,
            output=result,
        )
        return SimplifyResponse(**result)
    except Exception as exc:
        logger.exception("Simplification failed: %s", exc)
        raise HTTPException(status_code=500, detail="Simplification failed.")