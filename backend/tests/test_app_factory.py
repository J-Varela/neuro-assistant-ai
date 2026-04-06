from httpx import ASGITransport, AsyncClient

from app.main import create_app


async def test_vercel_app_uses_api_root_without_double_prefix():
    app = create_app(api_prefix="")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
