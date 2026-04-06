"""Shared FastAPI dependencies."""
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.database import get_db

_bearer_optional = HTTPBearer(auto_error=False)
_bearer_required = HTTPBearer(auto_error=True)


async def get_session_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_optional),
    x_session_id: str | None = Header(default=None),
) -> str:
    """Return the JWT user_id if present, otherwise require an explicit X-Session-ID."""
    if credentials:
        try:
            return decode_access_token(credentials.credentials)
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            ) from exc
    if not x_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Session-ID header is required when not authenticated.",
        )
    return x_session_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_required),
    db: AsyncSession = Depends(get_db),
):
    """Require a valid JWT and return the corresponding User. Raises 401 otherwise."""
    from app.db import crud  # local import avoids circular dependency at module load

    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return user
