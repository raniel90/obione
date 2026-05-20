"""Unit of Work pattern. Services manipulate UoW, never Session directly.

Concrete repositories are attached as attributes on the UoW instance — added
incrementally as each bounded context phase lands.
"""
from __future__ import annotations

import abc
from collections.abc import Callable

from sqlalchemy.orm import Session

from obione.shared.database import SessionLocal


class AbstractUnitOfWork(abc.ABC):
    """Context manager that wraps a transaction boundary.

    Concrete implementations attach repositories as attributes (e.g. self.users).
    Services call uow.commit() to persist; otherwise everything rolls back.
    """

    def __enter__(self) -> AbstractUnitOfWork:
        return self

    def __exit__(self, *args) -> None:
        self.rollback()

    @abc.abstractmethod
    def commit(self) -> None: ...

    @abc.abstractmethod
    def rollback(self) -> None: ...


class SqlAlchemyUnitOfWork(AbstractUnitOfWork):
    """Real implementation. Opens a Session and binds repositories to it.

    Repositories are attached in __enter__ — added in subsequent phases.
    """

    def __init__(self, session_factory: Callable[[], Session] = SessionLocal):
        self._session_factory = session_factory
        self.session: Session | None = None

    def __enter__(self) -> SqlAlchemyUnitOfWork:
        self.session = self._session_factory()
        from obione.auth.repository import SqlAlchemyUserRepository
        self.users: SqlAlchemyUserRepository = SqlAlchemyUserRepository(self.session)
        return super().__enter__()  # type: ignore[return-value]

    def __exit__(self, *args) -> None:
        super().__exit__(*args)
        if self.session is not None:
            self.session.close()
            self.session = None

    def commit(self) -> None:
        if self.session is not None:
            self.session.commit()

    def rollback(self) -> None:
        if self.session is not None:
            self.session.rollback()


class FakeUnitOfWork(AbstractUnitOfWork):
    """In-memory UoW for unit tests. Fake repositories attached as needed."""

    def __init__(self):
        self.committed = False
        from obione.auth.repository import FakeUserRepository
        self.users: FakeUserRepository = FakeUserRepository()

    def commit(self) -> None:
        self.committed = True

    def rollback(self) -> None:
        pass
