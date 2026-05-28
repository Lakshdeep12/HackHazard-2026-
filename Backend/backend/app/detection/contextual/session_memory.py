from __future__ import annotations

import json
from collections import defaultdict, deque
from contextlib import suppress
from dataclasses import asdict
from dataclasses import dataclass, field

from app.core.config import settings


@dataclass
class SessionTurn:
    prompt: str
    risk_score: float
    decision: str
    category: str


@dataclass
class SessionState:
    turns: deque[SessionTurn] = field(
        default_factory=lambda: deque(maxlen=settings.HIGH_RISK_CONTEXT_WINDOW)
    )


class SessionMemory:
    """In-process session memory for contextual risk during demo/runtime."""

    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = defaultdict(SessionState)
        self._redis = None

    async def get_history(self, session_id: str) -> list[SessionTurn]:
        try:
            redis = await self._get_redis()
        except Exception:
            redis = None
        if redis is not None:
            try:
                key = self._session_key(session_id)
                raw_turns = await redis.lrange(key, 0, settings.HIGH_RISK_CONTEXT_WINDOW - 1)
                history: list[SessionTurn] = []
                for raw in raw_turns:
                    data = json.loads(raw)
                    history.append(SessionTurn(**data))
                return history
            except Exception:
                # Fail open to in-memory session history.
                pass

        return list(self._sessions[session_id].turns)

    async def add_turn(self, session_id: str, turn: SessionTurn) -> None:
        try:
            redis = await self._get_redis()
        except Exception:
            redis = None
        if redis is not None:
            try:
                key = self._session_key(session_id)
                turn_payload = json.dumps(asdict(turn))
                pipe = redis.pipeline()
                # Keep most recent turns at the head for cheap lrange.
                pipe.lpush(key, turn_payload)
                pipe.ltrim(key, 0, settings.HIGH_RISK_CONTEXT_WINDOW - 1)
                pipe.expire(key, 60 * 60 * 24)
                await pipe.execute()
                return
            except Exception:
                # Fail open to in-memory session history.
                pass

        self._sessions[session_id].turns.append(turn)

    async def _get_redis(self):
        if not settings.REDIS_URL:
            return None
        if self._redis is None:
            from redis.asyncio import from_url

            self._redis = from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        return self._redis

    @staticmethod
    def _session_key(session_id: str) -> str:
        return f"guardaiian:session-memory:{session_id}"

    async def close(self) -> None:
        if self._redis is not None:
            with suppress(Exception):
                await self._redis.aclose()
            self._redis = None


session_memory = SessionMemory()

