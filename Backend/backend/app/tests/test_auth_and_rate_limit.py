from __future__ import annotations

import json
import os

from fastapi.testclient import TestClient

from app.main import create_app


def create_test_client(require_api_key: bool = False) -> TestClient:
    os.environ["APP_ENV"] = "local"
    os.environ["REQUIRE_API_KEY"] = "true" if require_api_key else "false"
    os.environ.pop("DASHBOARD_API_KEY", None)
    app = create_app()
    return TestClient(app)


def test_health_unauthenticated_allowed():
    client = create_test_client(require_api_key=False)
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_analyze_requires_api_key_when_enabled():
    os.environ["DASHBOARD_API_KEY"] = "secret"
    client = create_test_client(require_api_key=True)
    resp = client.post("/api/v1/analyze", json={"prompt": "hi", "session_id": "s", "provider": "local"})
    assert resp.status_code == 401

    resp_ok = client.post(
        "/api/v1/analyze",
        headers={"x-guardaiian-api-key": "secret"},
        json={"prompt": "hi", "session_id": "s", "provider": "local"},
    )
    assert resp_ok.status_code == 200


def test_request_size_limit_returns_413_json():
    previous = os.environ.get("MAX_REQUEST_BODY_BYTES")
    os.environ["MAX_REQUEST_BODY_BYTES"] = "1024"
    try:
        client = create_test_client(require_api_key=False)
        payload = {"prompt": "x" * 5000, "session_id": "s", "provider": "local"}
        body = json.dumps(payload)
        response = client.post(
            "/api/v1/analyze",
            data=body,
            headers={"content-type": "application/json", "content-length": str(len(body))},
        )
        assert response.status_code == 413
        assert response.json()["detail"] == "Request body too large"
    finally:
        if previous is None:
            os.environ.pop("MAX_REQUEST_BODY_BYTES", None)
        else:
            os.environ["MAX_REQUEST_BODY_BYTES"] = previous


def test_rate_limit_returns_429_json():
    previous_limit = os.environ.get("RATE_LIMIT_REQUESTS_PER_MINUTE")
    previous_redis = os.environ.get("REDIS_URL")
    os.environ["RATE_LIMIT_REQUESTS_PER_MINUTE"] = "1"
    os.environ["REDIS_URL"] = ""
    try:
        client = create_test_client(require_api_key=False)
        first = client.get("/api/v1/health")
        assert first.status_code == 200

        second = client.get("/api/v1/health")
        assert second.status_code == 429
        assert second.json()["detail"] == "Rate limit exceeded"
    finally:
        if previous_limit is None:
            os.environ.pop("RATE_LIMIT_REQUESTS_PER_MINUTE", None)
        else:
            os.environ["RATE_LIMIT_REQUESTS_PER_MINUTE"] = previous_limit
        if previous_redis is None:
            os.environ.pop("REDIS_URL", None)
        else:
            os.environ["REDIS_URL"] = previous_redis

