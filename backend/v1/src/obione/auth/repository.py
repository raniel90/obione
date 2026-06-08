"""User repository — abstract port + SqlAlchemy adapter + in-memory fake."""

from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.auth.models import User


class AbstractUserRepository(Protocol):
    def add(self, user: User) -> None: ...
    def get(self, user_id: uuid.UUID) -> User | None: ...
    def get_by_email(self, email: str) -> User | None: ...
    def list(self) -> list[User]: ...


class SqlAlchemyUserRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, user: User) -> None:
        self._session.add(user)

    def get(self, user_id: uuid.UUID) -> User | None:
        return self._session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self._session.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def list(self) -> list[User]:
        return list(self._session.execute(select(User)).scalars())


class FakeUserRepository:
    """In-memory repo for unit tests."""

    def __init__(self):
        self._users: dict[uuid.UUID, User] = {}

    def add(self, user: User) -> None:
        if user.id is None:
            from obione.shared.ids import new_id

            user.id = new_id()
        self._users[user.id] = user

    def get(self, user_id: uuid.UUID) -> User | None:
        return self._users.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        return next((u for u in self._users.values() if u.email == email), None)

    def list(self) -> list[User]:
        return list(self._users.values())
