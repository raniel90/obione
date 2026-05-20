import argparse

import pytest

from obione.auth.models import User
from obione.cli.main import cmd_create_user
from obione.shared.database import SessionLocal


@pytest.mark.integration
def test_cli_create_user_persists(capsys):
    s = SessionLocal()
    try:
        s.query(User).filter_by(email="cli-test@x.com").delete(synchronize_session=False)
        s.commit()
    finally:
        s.close()

    args = argparse.Namespace(
        email="cli-test@x.com", password="cli-pwd-12345",
        name="CLI User", role="admin",
    )
    exit_code = cmd_create_user(args)
    assert exit_code == 0
    out = capsys.readouterr().out
    assert "User created" in out

    s = SessionLocal()
    try:
        u = s.query(User).filter_by(email="cli-test@x.com").one_or_none()
        assert u is not None
        assert u.role == "admin"
        s.delete(u)
        s.commit()
    finally:
        s.close()
