"""Shared pytest fixtures.

- `client`: FastAPI TestClient (no DB rollback — for e2e)
- `db_session`: transactional SQLAlchemy session (auto-rollback per test) — for integration
- autouse `_pin_llm_provider`: forces `settings.LLM_PROVIDER=mock` so no test
  ever hits a real LLM. Devs override their `.env` to point at Ollama for
  smoke runs; tests must be hermetic.
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from obione.main import app
from obione.settings import settings
from obione.shared.database import SessionLocal, engine


@pytest.fixture(autouse=True)
def _pin_llm_provider(monkeypatch):
    """Force every test path through the mock generators.

    Extractor, Resumo, and Drafts all read `settings.LLM_PROVIDER` to pick
    between mock and Instructor adapter. Without this fixture, a developer
    running tests on a machine where `.env` points at Ollama would hit the
    real network during e2e — fragile and slow.
    """
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Transactional session: every test runs in a transaction that's rolled back."""
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
