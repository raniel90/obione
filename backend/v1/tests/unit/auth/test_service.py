import pytest

from obione.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    RoleNotAllowedError,
)
from obione.auth.models import User
from obione.auth.schemas import UserCreate
from obione.auth.security import hash_password
from obione.auth.service import authenticate, create_user
from obione.unit_of_work import FakeUnitOfWork


def _make_user(
    email: str = "a@b.com", password: str = "secret123", role: str = "consultant"
) -> User:
    u = User(email=email, password_hash=hash_password(password), name="X", role=role)
    return u


@pytest.mark.unit
def test_authenticate_success_returns_token():
    uow = FakeUnitOfWork()
    uow.users.add(_make_user())
    token, expires_in, user = authenticate(uow, email="a@b.com", password="secret123")
    assert isinstance(token, str) and len(token) > 20
    assert expires_in > 0
    assert user.email == "a@b.com"


@pytest.mark.unit
def test_authenticate_wrong_password_raises():
    uow = FakeUnitOfWork()
    uow.users.add(_make_user())
    with pytest.raises(InvalidCredentialsError):
        authenticate(uow, email="a@b.com", password="wrong")


@pytest.mark.unit
def test_authenticate_unknown_email_raises():
    uow = FakeUnitOfWork()
    with pytest.raises(InvalidCredentialsError):
        authenticate(uow, email="nobody@x.com", password="x")


@pytest.mark.unit
def test_create_user_success_commits():
    uow = FakeUnitOfWork()
    data = UserCreate(email="new@x.com", password="strong-pwd", name="N", role="consultant")
    user = create_user(uow, data)
    assert user.email == "new@x.com"
    assert uow.committed is True
    assert uow.users.get_by_email("new@x.com") is not None


@pytest.mark.unit
def test_create_user_duplicate_email_raises():
    uow = FakeUnitOfWork()
    uow.users.add(_make_user(email="dup@x.com"))
    data = UserCreate(email="dup@x.com", password="strong-pwd", name="N", role="consultant")
    with pytest.raises(EmailAlreadyExistsError):
        create_user(uow, data)


@pytest.mark.unit
def test_create_user_invalid_role_raises():
    uow = FakeUnitOfWork()
    data = UserCreate.model_construct(
        email="x@x.com",
        password="pwd",
        name="N",
        role="superuser",
    )
    with pytest.raises(RoleNotAllowedError):
        create_user(uow, data)
