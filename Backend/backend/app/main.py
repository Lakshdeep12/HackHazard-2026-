from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import ORJSONResponse

from app.api.middleware.rate_limit import RateLimitMiddleware
from app.api.middleware.request_logger import RequestLoggerMiddleware
from app.api.middleware.request_size import RequestSizeLimitMiddleware
from app.api.middleware.security_headers import SecurityHeadersMiddleware
from app.api.v1.router import api_router
from app.core.config import reload_settings, settings
from app.core.logger import configure_logging, get_logger
from app.lifecycle import run_startup_checks
from app.websocket.connection_manager import manager


logger = get_logger(__name__)

try:
    import orjson  # noqa: F401
except ModuleNotFoundError:  # pragma: no cover - supports slim local test envs
    DefaultJSONResponse = JSONResponse
else:
    DefaultJSONResponse = ORJSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifecycle manager.

    Performs startup validation (DB, Chroma, models) and
    coordinates graceful shutdown if needed.
    """

    configure_logging()
    logger.info("Starting GuardAIian backend", extra={"env": settings.APP_ENV})

    await run_startup_checks()
    pubsub_task: asyncio.Task[None] | None = None
    if settings.REDIS_URL:
        pubsub_task = asyncio.create_task(manager.start_pubsub_listener())

    yield

    await manager.close()
    if pubsub_task is not None:
        pubsub_task.cancel()
        try:
            await pubsub_task
        except asyncio.CancelledError:
            pass

    logger.info("Shutting down GuardAIian backend")


def create_app() -> FastAPI:
    """Application factory to create a configured FastAPI instance."""

    reload_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        default_response_class=DefaultJSONResponse,
        lifespan=lifespan,
    )

    # CORS
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.BACKEND_CORS_ORIGINS),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggerMiddleware)
    app.add_middleware(RequestSizeLimitMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # API routes
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"service": settings.APP_NAME, "status": "running"}

    return app


app = create_app()

