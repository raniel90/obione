import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from obione.shared.middleware import register_middleware


@pytest.fixture
def app():
    a = FastAPI()
    register_middleware(a)

    @a.get("/ping")
    def ping():
        return {"ok": True}

    return a


@pytest.mark.unit
def test_request_id_generated_when_absent(app):
    with TestClient(app) as c:
        r = c.get("/ping")
    assert r.status_code == 200
    rid = r.headers.get("x-request-id")
    assert rid and len(rid) >= 16


@pytest.mark.unit
def test_request_id_propagated_when_present(app):
    with TestClient(app) as c:
        r = c.get("/ping", headers={"x-request-id": "client-supplied"})
    assert r.headers["x-request-id"] == "client-supplied"
