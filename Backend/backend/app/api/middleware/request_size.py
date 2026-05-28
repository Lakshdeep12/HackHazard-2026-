from __future__ import annotations

from fastapi import status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import settings


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized requests before they reach route handlers."""

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": "Request body too large"},
            )
        return await call_next(request)
