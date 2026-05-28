from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.config import settings
from app.core.logger import get_logger


logger = get_logger(__name__)


class InMemoryRateLimitMiddleware(BaseHTTPMiddleware):
    """Local-only per-IP sliding-window limiter."""

    def __init__(self, app) -> None:
        super().__init__(app)
        self.requests: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        client = request.client.host if request.client else "unknown"
        now = time.time()
        bucket = self.requests[client]
        while bucket and now - bucket[0] > 60:
            bucket.popleft()
        if len(bucket) >= settings.RATE_LIMIT_REQUESTS_PER_MINUTE:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded"},
            )
        bucket.append(now)
        return await call_next(request)


class RedisRateLimitMiddleware(BaseHTTPMiddleware):
    """Distributed Redis-backed limiter for staging/production."""

    def __init__(self, app) -> None:
        super().__init__(app)
        self.redis = None

    async def dispatch(self, request: Request, call_next):
        if not settings.REDIS_URL:
            if settings.is_production or settings.RATE_LIMIT_FAIL_CLOSED:
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={"detail": "Distributed rate limiting is not configured."},
                )
            return await call_next(request)

        key = f"guardaiian:rate-limit:{request.client.host if request.client else 'unknown'}"
        now_ms = int(time.time() * 1000)
        window_start = now_ms - 60_000

        try:
            redis = await self._redis()
            pipe = redis.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(now_ms): now_ms})
            pipe.zcard(key)
            pipe.expire(key, 120)
            results = await pipe.execute()
            request_count = int(results[2])
        except Exception:
            logger.exception("Redis rate limit check failed")
            if settings.RATE_LIMIT_FAIL_CLOSED or settings.is_production:
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={"detail": "Rate limiting service unavailable."},
                )
            return await call_next(request)

        if request_count > settings.RATE_LIMIT_REQUESTS_PER_MINUTE:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded"},
            )
        return await call_next(request)

    async def _redis(self):
        if self.redis is None:
            from redis.asyncio import from_url

            self.redis = from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        return self.redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Select local or Redis rate limiting from the current environment."""

    def __init__(self, app) -> None:
        super().__init__(app)
        middleware_cls = RedisRateLimitMiddleware if settings.REDIS_URL else InMemoryRateLimitMiddleware
        self.delegate = middleware_cls(app)

    async def dispatch(self, request: Request, call_next):
        return await self.delegate.dispatch(request, call_next)
