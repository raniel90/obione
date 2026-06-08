import pytest

from obione.auth.models import User
from obione.auth.repository import SqlAlchemyUserRepository
from obione.auth.security import hash_password


@pytest.mark.integration
def test_add_and_get_user(db_session):
    repo = SqlAlchemyUserRepository(db_session)
    user = User(email="i@t.com", password_hash=hash_password("x"), name="I", role="consultant")
    repo.add(user)
    db_session.flush()
    assert repo.get(user.id) is not None
    assert repo.get_by_email("i@t.com") is not None
    assert repo.get_by_email("nobody@x.com") is None


@pytest.mark.integration
def test_email_unique_constraint(db_session):
    repo = SqlAlchemyUserRepository(db_session)
    repo.add(User(email="dup@t.com", password_hash="x", name="A", role="consultant"))
    db_session.flush()
    repo.add(User(email="dup@t.com", password_hash="y", name="B", role="client"))
    with pytest.raises(Exception):
        db_session.flush()


@pytest.mark.integration
def test_invalid_role_rejected_by_check_constraint(db_session):
    repo = SqlAlchemyUserRepository(db_session)
    repo.add(User(email="r@t.com", password_hash="x", name="R", role="god"))
    with pytest.raises(Exception):
        db_session.flush()
