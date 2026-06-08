"""FastAPI dependencies for the auth bounded context."""

import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from obione.auth.exceptions import InvalidTokenError
from obione.auth.models import User
from obione.auth.security import decode_token
from obione.shared.exceptions import ForbiddenError, UnauthorizedError
from obione.unit_of_work import SqlAlchemyUnitOfWork

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_uow() -> SqlAlchemyUnitOfWork:
    return SqlAlchemyUnitOfWork()


def get_current_user(
    token: Annotated[str | None, Depends(_oauth2_scheme)],
) -> User:
    if not token:
        raise UnauthorizedError("Authentication token missing.")
    try:
        payload = decode_token(token)
    except InvalidTokenError as e:
        raise UnauthorizedError(str(e)) from e
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Token has no subject.")
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as e:
        raise UnauthorizedError("Token subject is not a UUID.") from e
    with SqlAlchemyUnitOfWork() as uow:
        user = uow.users.get(user_id)
        if user is None:
            raise UnauthorizedError("User from token does not exist.")
        uow.session.expunge(user)
        return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*allowed: str):
    def _checker(user: CurrentUser) -> User:
        if user.role not in allowed:
            raise ForbiddenError(
                f"This action requires role in {allowed}. Current role: {user.role}."
            )
        return user

    return _checker
