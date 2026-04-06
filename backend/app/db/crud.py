import uuid
from datetime import datetime, UTC

from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import HistoryEntry, PasswordResetToken, RefreshToken, User


async def create_history_entry(
    db: AsyncSession,
    session_id: str,
    entry_type: str,
    input_text: str,
    support_mode: str,
    output: dict,
) -> HistoryEntry:
    entry = HistoryEntry(
        id=str(uuid.uuid4()),
        session_id=session_id,
        type=entry_type,
        input_text=input_text,
        support_mode=support_mode,
        output=output,
        created_at=datetime.now(UTC),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_history(
    db: AsyncSession,
    session_id: str,
    limit: int = 20,
) -> list[HistoryEntry]:
    result = await db.execute(
        select(HistoryEntry)
        .where(HistoryEntry.session_id == session_id)
        .order_by(HistoryEntry.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def delete_history_entry(
    db: AsyncSession,
    entry_id: str,
    session_id: str,
) -> bool:
    result = await db.execute(
        delete(HistoryEntry).where(
            HistoryEntry.id == entry_id,
            HistoryEntry.session_id == session_id,
        )
    )
    await db.commit()
    return result.rowcount > 0


# --- User CRUD ---

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, hashed_password: str) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hashed_password,
        created_at=datetime.now(UTC),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user_password(db: AsyncSession, user_id: str, hashed_password: str) -> None:
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(hashed_password=hashed_password)
    )
    await db.commit()


# --- Refresh token CRUD ---

async def create_refresh_token(
    db: AsyncSession,
    user_id: str,
    token_hash: str,
    expires_at: datetime,
) -> RefreshToken:
    rt = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(rt)
    await db.commit()
    return rt


async def get_refresh_token(db: AsyncSession, token_hash: str) -> RefreshToken | None:
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    return result.scalar_one_or_none()


async def delete_refresh_token(db: AsyncSession, token_hash: str) -> None:
    await db.execute(delete(RefreshToken).where(RefreshToken.token_hash == token_hash))
    await db.commit()


async def delete_refresh_tokens_for_user(db: AsyncSession, user_id: str) -> None:
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
    await db.commit()


# --- Password reset token CRUD ---

async def create_password_reset_token(
    db: AsyncSession,
    user_id: str,
    token_hash: str,
    expires_at: datetime,
) -> PasswordResetToken:
    reset_token = PasswordResetToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(reset_token)
    await db.commit()
    return reset_token


async def get_password_reset_token(db: AsyncSession, token_hash: str) -> PasswordResetToken | None:
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    return result.scalar_one_or_none()


async def delete_password_reset_tokens_for_user(db: AsyncSession, user_id: str) -> None:
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user_id))
    await db.commit()


async def mark_password_reset_token_used(db: AsyncSession, token_hash: str) -> None:
    await db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
        .values(used_at=datetime.now(UTC))
    )
    await db.commit()
