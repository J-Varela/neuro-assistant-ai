import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import ALLOWED_ORIGINS, validate_config
from app.core.limiter import limiter
from app.routes.auth import router as auth_router
from app.routes.breakdown import router as breakdown_router
from app.routes.simplify import router as simplify_router
from app.routes.focus import router as focus_router
from app.routes.history import router as history_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


class _RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()
    logger.info("Starting up — ensure 'alembic upgrade head' has been run.")
    yield
    logger.info("Shutting down.")


def create_app(api_prefix: str = "/api") -> FastAPI:
    app = FastAPI(title="Neuro Assistant API", lifespan=lifespan)

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )
    app.add_middleware(_RequestIDMiddleware)

    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(breakdown_router, prefix=api_prefix)
    app.include_router(simplify_router, prefix=api_prefix)
    app.include_router(focus_router, prefix=api_prefix)
    app.include_router(history_router, prefix=api_prefix)

    @app.get("/")
    def read_root():
        return {"message": "Neuro Assistant API is running!"}

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()

