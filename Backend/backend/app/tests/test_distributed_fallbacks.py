from __future__ import annotations

import asyncio
import json

from app.detection.contextual.session_memory import SessionTurn, session_memory
from app.websocket.connection_manager import ConnectionManager


class _FakeRedisSession:
    def __init__(self) -> None:
        self.storage: dict[str, list[str]] = {}

    async def lrange(self, key: str, start: int, end: int):  # noqa: ARG002
        return self.storage.get(key, [])

    def pipeline(self):
        return _FakeSessionPipeline(self.storage)


class _FakeSessionPipeline:
    def __init__(self, storage: dict[str, list[str]]) -> None:
        self.storage = storage
        self.ops: list[tuple[str, str, object]] = []

    def lpush(self, key: str, value: str):
        self.ops.append(("lpush", key, value))
        return self

    def ltrim(self, key: str, start: int, end: int):
        self.ops.append(("ltrim", key, (start, end)))
        return self

    def expire(self, key: str, ttl: int):  # noqa: ARG002
        self.ops.append(("expire", key, ttl))
        return self

    async def execute(self):
        for op, key, value in self.ops:
            if op == "lpush":
                self.storage.setdefault(key, []).insert(0, value)  # newest first
            elif op == "ltrim":
                start, end = value  # type: ignore[misc]
                self.storage[key] = self.storage.get(key, [])[start : end + 1]
        return [True] * len(self.ops)


class _FakeRedisPubSub:
    def __init__(self, payload: dict[str, object]) -> None:
        self.payload = payload

    async def subscribe(self, channel: str):  # noqa: ARG002
        return None

    async def unsubscribe(self, channel: str):  # noqa: ARG002
        return None

    async def aclose(self):
        return None

    async def listen(self):
        yield {"type": "message", "data": json.dumps(self.payload)}


class _FakeRedisWs:
    def __init__(self, payload: dict[str, object]) -> None:
        self.payload = payload
        self.published: list[tuple[str, str]] = []

    async def publish(self, channel: str, message: str):
        self.published.append((channel, message))
        return 1

    def pubsub(self):
        return _FakeRedisPubSub(self.payload)

    async def aclose(self):
        return None


class _FakeWebSocket:
    def __init__(self) -> None:
        self.messages: list[dict[str, object]] = []

    async def send_json(self, message: dict[str, object]):
        self.messages.append(message)


def test_session_memory_falls_back_to_local_if_redis_unavailable(monkeypatch):
    async def _raise():
        raise RuntimeError("redis down")

    monkeypatch.setattr(session_memory, "_get_redis", _raise)
    turn = SessionTurn(prompt="hello", risk_score=0.5, decision="warn", category="prompt_injection")
    asyncio.run(session_memory.add_turn("fallback-local", turn))
    history = asyncio.run(session_memory.get_history("fallback-local"))
    assert history[-1].prompt == "hello"


def test_session_memory_redis_pipeline_roundtrip(monkeypatch):
    fake = _FakeRedisSession()

    async def _get_fake():
        return fake

    monkeypatch.setattr(session_memory, "_get_redis", _get_fake)
    turn = SessionTurn(prompt="redis", risk_score=0.9, decision="block", category="jailbreak")
    asyncio.run(session_memory.add_turn("redis-session", turn))
    history = asyncio.run(session_memory.get_history("redis-session"))
    assert history
    assert history[0].decision == "block"


def test_connection_manager_publishes_to_redis_when_available(monkeypatch):
    manager = ConnectionManager()
    fake_redis = _FakeRedisWs({"type": "threat.blocked", "payload": {"id": "1"}})

    async def _get_fake():
        return fake_redis

    monkeypatch.setattr(manager, "_get_redis", _get_fake)
    asyncio.run(manager.broadcast({"type": "threat.blocked", "payload": {"id": "1"}}))
    assert len(fake_redis.published) == 1


def test_connection_manager_pubsub_listener_broadcasts_locally(monkeypatch):
    manager = ConnectionManager()
    fake_ws = _FakeWebSocket()
    manager.active_connections.add(fake_ws)  # type: ignore[arg-type]
    fake_redis = _FakeRedisWs({"type": "threat.allowed", "payload": {"session_id": "abc"}})

    async def _get_fake():
        return fake_redis

    monkeypatch.setattr(manager, "_get_redis", _get_fake)
    asyncio.run(manager.start_pubsub_listener())
    assert fake_ws.messages
    assert fake_ws.messages[0]["type"] == "threat.allowed"
