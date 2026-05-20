"""Auth use cases. Pure functions; no FastAPI."""
from obione.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    RoleNotAllowedError,
)
from obione.auth.models import USER_ROLES, User
from obione.auth.schemas import UserCreate
from obione.auth.security import encode_token, hash_password, verify_password
from obione.unit_of_work import AbstractUnitOfWork


def authenticate(
    uow: AbstractUnitOfWork, *, email: str, password: str
) -> tuple[str, int, User]:
    with uow:
        user = uow.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password.")
        token, expires_in = encode_token(sub=str(user.id), extra={"role": user.role})
        return token, expires_in, user


def create_user(uow: AbstractUnitOfWork, data: UserCreate) -> User:
    if data.role not in USER_ROLES:
        raise RoleNotAllowedError(f"Role must be one of {USER_ROLES}.")
    with uow:
        if uow.users.get_by_email(data.email) is not None:
            raise EmailAlreadyExistsError(f"Email already in use: {data.email}")
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            name=data.name,
            role=data.role,
        )
        uow.users.add(user)
        uow.commit()
        return user
