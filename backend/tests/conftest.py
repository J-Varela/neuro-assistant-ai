"""
Shared test fixtures.

Environment variables MUST be set before any app module is imported,
because config.py reads them at module load time.
"""
import os

os.environ.setdefault("AZURE_OPENAI_API_KEY", "test-api-key-00000000000000000000000000000000")
os.environ.setdefault("AZURE_OPENAI_ENDPOINT", "https://test.openai.azure.com/")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only-not-for-production")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool


@pytest_asyncio.fixture
async def client():
    """
    Provide an isolated async HTTP client backed by a fresh in-memory SQLite DB.

    ASGITransport does NOT trigger the ASGI lifespan, so tables are created
    explicitly here. StaticPool ensures all SQLAlchemy connections share a
    single underlying sqlite3 connection, keeping in-memory tables visible
    across get_db calls.
    """
    from app.main import app
    from app.db.database import get_db, Base
    from app.db import models  # noqa: F401 — registers all ORM models

    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = async_sessionmaker(test_engine, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    await test_engine.dispose()
