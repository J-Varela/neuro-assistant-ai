from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import DATABASE_URL

engine = None
AsyncSessionLocal = None


def _build_session_factory() -> async_sessionmaker[AsyncSession]:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured.")

    pool_kwargs: dict = {}
    if DATABASE_URL.startswith("postgresql"):
        pool_kwargs = {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_pre_ping": True,
            "pool_recycle": 1800,
        }

    global engine
    engine = create_async_engine(DATABASE_URL, echo=False, **pool_kwargs)
    return async_sessionmaker(engine, expire_on_commit=False)


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global AsyncSessionLocal
    if AsyncSessionLocal is None:
        AsyncSessionLocal = _build_session_factory()
    return AsyncSessionLocal


class Base(DeclarativeBase):
    pass


async def get_db():
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
