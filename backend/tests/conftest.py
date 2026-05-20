"""Shared pytest fixtures.

- `client`: FastAPI TestClient (no DB rollback — for e2e)
- `db_session`: transactional SQLAlchemy session (auto-rollback per test) — for integration
"""
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from obione.main import app
from obione.shared.database import SessionLocal, engine


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
