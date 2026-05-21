import time

import pytest

from obione.auth.exceptions import InvalidTokenError
from obione.auth.security import (
    decode_token,
    encode_token,
    hash_password,
    verify_password,
)


@pytest.mark.unit
def test_hash_and_verify_password():
    h = hash_password("secret-123")
    assert verify_password("secret-123", h) is True
    assert verify_password("wrong", h) is False


@pytest.mark.unit
def test_encode_decode_token_roundtrip():
    token, expires_in = encode_token(sub="user-123", extra={"role": "admin"})
    assert isinstance(token, str)
    assert expires_in > 0
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert "exp" in payload
    assert "iat" in payload


@pytest.mark.unit
def test_decode_invalid_token_raises():
    with pytest.raises(InvalidTokenError):
        decode_token("not-a-jwt")


@pytest.mark.unit
def test_decode_expired_token_raises(monkeypatch):
    from obione.settings import settings

    monkeypatch.setattr(settings, "JWT_EXPIRE_MINUTES", 0)
    token, _ = encode_token(sub="x")
    time.sleep(1)
    with pytest.raises(InvalidTokenError):
        decode_token(token)
