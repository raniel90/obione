"""Auth use cases. Pure functions; no FastAPI."""

from obione.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    RoleNotAllowedError,
)
from obione.auth.models import USER_ROLES, User
from obione.auth.schemas import Role, UserCreate
from obione.auth.security import encode_token, hash_password, verify_password
from obione.unit_of_work import AbstractUnitOfWork


def authenticate(uow: AbstractUnitOfWork, *, email: str, password: str) -> tuple[str, int, User]:
    with uow:
        user = uow.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password.")
        token, expires_in = encode_token(sub=str(user.id), extra={"role": user.role})
        return token, expires_in, user


def list_users(uow: AbstractUnitOfWork, *, role: Role | None = None) -> list[User]:
    """List users, optionally filtered by role, ordered by name.

    Used by staff to pick a client when linking one to a project.
    """
    with uow:
        users = uow.users.list()
        if role is not None:
            users = [u for u in users if u.role == role]
        return sorted(users, key=lambda u: u.name.lower())


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
