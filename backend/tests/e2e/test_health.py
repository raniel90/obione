import pytest


@pytest.mark.e2e
def test_health_liveness(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.e2e
def test_health_db(client):
    r = client.get("/health/db")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "PostgreSQL" in body["postgres"]
