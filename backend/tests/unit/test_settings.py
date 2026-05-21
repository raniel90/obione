import pytest

from obione.settings import Settings


@pytest.mark.unit
def test_settings_loads_required_fields(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "a" * 32)
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@h:5432/d")
    s = Settings(_env_file=None)
    assert s.JWT_SECRET.get_secret_value() == "a" * 32
    assert s.DATABASE_URL == "postgresql+psycopg://u:p@h:5432/d"
    assert s.JWT_ALGORITHM == "HS256"
    assert s.LOG_FORMAT == "plain"


@pytest.mark.unit
def test_settings_rejects_short_jwt_secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "too-short")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@h:5432/d")
    with pytest.raises(ValueError):
        Settings(_env_file=None)
