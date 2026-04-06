import logging
from datetime import datetime, timedelta, UTC

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.dependencies import get_current_user
from app.core.security import (
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.db import crud
from app.db.database import get_db
from app.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    RefreshRequest,
    Token,
    UserCreate,
    UserOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = await crud.create_user(db, email=payload.email, hashed_password=hash_password(payload.password))
    logger.info("New user registered: %s", user.email)
    return user


@router.post("/token", response_model=Token)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    # OAuth2 form uses `username` field; we treat it as the email address
    user = await crud.get_user_by_email(db, form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    access_token = create_access_token(user.id)
    refresh = create_refresh_token()
    expires_at = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    await crud.create_refresh_token(db, user.id, hash_token(refresh), expires_at)
    return Token(access_token=access_token, refresh_token=refresh)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(payload.refresh_token)
    stored = await crud.get_refresh_token(db, token_hash)
    if not stored or stored.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")
    # Rotate: delete old token, issue new pair
    await crud.delete_refresh_token(db, token_hash)
    new_refresh = create_refresh_token()
    expires_at = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    await crud.create_refresh_token(db, stored.user_id, hash_token(new_refresh), expires_at)
    return Token(access_token=create_access_token(stored.user_id), refresh_token=new_refresh)


@router.post("/forgot-password", response_model=PasswordResetRequestResponse)
async def forgot_password(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    message = "If that email is registered, a password reset token has been generated."
    user = await crud.get_user_by_email(db, payload.email)
    if not user:
        return PasswordResetRequestResponse(message=message)

    await crud.delete_password_reset_tokens_for_user(db, user.id)
    reset_token = create_password_reset_token()
    expires_at = datetime.now(UTC) + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    await crud.create_password_reset_token(db, user.id, hash_token(reset_token), expires_at)

    logger.info("Password reset requested for: %s", user.email)
    return PasswordResetRequestResponse(
        message=message,
        reset_token=reset_token if config.PASSWORD_RESET_RETURN_TOKEN else None,
    )


@router.post("/reset-password", status_code=204)
async def reset_password(payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(payload.token)
    stored = await crud.get_password_reset_token(db, token_hash)
    if (
        not stored
        or stored.used_at is not None
        or stored.expires_at.replace(tzinfo=UTC) < datetime.now(UTC)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")

    await crud.update_user_password(db, stored.user_id, hash_password(payload.new_password))
    await crud.mark_password_reset_token_used(db, token_hash)
    await crud.delete_password_reset_tokens_for_user(db, stored.user_id)
    await crud.delete_refresh_tokens_for_user(db, stored.user_id)
    logger.info("Password reset completed for user_id=%s", stored.user_id)


@router.post("/logout", status_code=204)
async def logout(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Revoke a refresh token server-side. Idempotent — no error if token is already gone."""
    await crud.delete_refresh_token(db, hash_token(payload.refresh_token))


@router.get("/me", response_model=UserOut)
async def get_me(current_user=Depends(get_current_user)):
    return current_user
