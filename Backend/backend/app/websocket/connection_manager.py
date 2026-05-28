from __future__ import annotations

import json
from contextlib import suppress

from fastapi import WebSocket

from app.core.config import settings


class ConnectionManager:
    """Tracks active dashboard websocket clients and broadcasts events."""

    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()
        self._redis = None
        self._pubsub = None
        self._running = False

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict[str, object]) -> None:
        redis = await self._get_redis()
        if redis is not None:
            try:
                await redis.publish(self._channel_name(), json.dumps(message))
                return
            except Exception:
                # Fail open to local-only websocket broadcast.
                pass

        await self._broadcast_local(message)

    async def _broadcast_local(self, message: dict[str, object]) -> None:
        disconnected: list[WebSocket] = []
        for websocket in self.active_connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            self.disconnect(websocket)

    async def start_pubsub_listener(self) -> None:
        redis = await self._get_redis()
        if redis is None or self._running:
            return

        self._running = True
        self._pubsub = redis.pubsub()
        await self._pubsub.subscribe(self._channel_name())
        try:
            async for message in self._pubsub.listen():
                if not self._running:
                    break
                if message.get("type") != "message":
                    continue
                data = message.get("data")
                if not isinstance(data, str):
                    continue
                payload = json.loads(data)
                if isinstance(payload, dict):
                    await self._broadcast_local(payload)
        finally:
            await self.stop_pubsub_listener()

    async def stop_pubsub_listener(self) -> None:
        self._running = False
        if self._pubsub is not None:
            with suppress(Exception):
                await self._pubsub.unsubscribe(self._channel_name())
            with suppress(Exception):
                await self._pubsub.aclose()
            self._pubsub = None

    async def close(self) -> None:
        await self.stop_pubsub_listener()
        if self._redis is not None:
            with suppress(Exception):
                await self._redis.aclose()
            self._redis = None

    async def _get_redis(self):
        if not settings.REDIS_URL:
            return None
        if self._redis is None:
            from redis.asyncio import from_url

            self._redis = from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        return self._redis

    @staticmethod
    def _channel_name() -> str:
        return "guardaiian:ws-alerts"


manager = ConnectionManager()

