from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_session_id
from app.db.database import get_db
from app.db import crud
from app.schemas.history import HistoryEntryOut

router = APIRouter(tags=["History"])


@router.get("/history", response_model=list[HistoryEntryOut])
async def get_history(
    session_id: str = Depends(get_session_id),
    db: AsyncSession = Depends(get_db),
):
    entries = await crud.get_history(db, session_id)
    return [
        {
            "id": e.id,
            "type": e.type,
            "input": e.input_text,
            "output": e.output,
            "supportMode": e.support_mode,
            "createdAt": e.created_at.isoformat(),
        }
        for e in entries
    ]


@router.delete("/history/{entry_id}", status_code=204)
async def delete_history_entry(
    entry_id: str,
    session_id: str = Depends(get_session_id),
    db: AsyncSession = Depends(get_db),
):
    deleted = await crud.delete_history_entry(db, entry_id, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found.")
