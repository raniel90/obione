"""Unit of Work pattern. Services manipulate UoW, never Session directly.

Concrete repositories are attached as attributes on the UoW instance — added
incrementally as each bounded context phase lands.

The context manager is *reentrant*: nesting `with uow:` (e.g. a service that
calls `get_project_for_user` inside its own `with uow:` block) reuses the
outermost session instead of opening a fresh one and rebinding repositories.
Without that, ORM objects loaded in the outer scope become orphaned on a
closed session when the inner block exits, producing
`InvalidRequestError: Object ... is already attached to session ...`.
"""

from __future__ import annotations

import abc
from collections.abc import Callable

from sqlalchemy.orm import Session

from obione.shared.database import SessionLocal


class AbstractUnitOfWork(abc.ABC):
    """Reentrant context manager that wraps a transaction boundary.

    Concrete implementations attach repositories as attributes (e.g. self.users).
    Services call uow.commit() to persist; otherwise everything rolls back.
    """

    def __init__(self):
        self._depth: int = 0

    def __enter__(self) -> AbstractUnitOfWork:
        self._depth += 1
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self._depth -= 1
        if exc_type is not None:
            # Always rollback when an exception propagates, even in nested scopes.
            self.rollback()

    @abc.abstractmethod
    def commit(self) -> None: ...

    @abc.abstractmethod
    def rollback(self) -> None: ...


class SqlAlchemyUnitOfWork(AbstractUnitOfWork):
    """Real implementation. Opens a Session and binds repositories to it.

    Only the *outermost* `with` opens a Session; nested `with`s are no-ops
    aside from the depth counter so the inner service can call repositories
    against the same session as its caller.
    """

    def __init__(self, session_factory: Callable[[], Session] = SessionLocal):
        super().__init__()
        self._session_factory = session_factory
        self.session: Session | None = None

    def __enter__(self) -> SqlAlchemyUnitOfWork:
        super().__enter__()
        if self.session is not None:
            return self  # reentrant — reuse existing session + repos
        self.session = self._session_factory()
        from obione.auth.repository import SqlAlchemyUserRepository
        from obione.comments.repository import SqlAlchemyCommentRepository
        from obione.documents.repository import SqlAlchemyDocumentRepository
        from obione.drafts.repository import SqlAlchemyDraftRepository
        from obione.extractions.repository import SqlAlchemyExtractionRepository
        from obione.likert.repository import SqlAlchemyLikertRepository
        from obione.projects.repository import SqlAlchemyProjectRepository
        from obione.resumos.repository import SqlAlchemyResumoRepository

        self.users: SqlAlchemyUserRepository = SqlAlchemyUserRepository(self.session)
        self.projects: SqlAlchemyProjectRepository = SqlAlchemyProjectRepository(self.session)
        self.documents: SqlAlchemyDocumentRepository = SqlAlchemyDocumentRepository(self.session)
        self.extractions: SqlAlchemyExtractionRepository = SqlAlchemyExtractionRepository(
            self.session
        )
        self.comments: SqlAlchemyCommentRepository = SqlAlchemyCommentRepository(self.session)
        self.likert: SqlAlchemyLikertRepository = SqlAlchemyLikertRepository(self.session)
        self.resumos: SqlAlchemyResumoRepository = SqlAlchemyResumoRepository(self.session)
        self.drafts: SqlAlchemyDraftRepository = SqlAlchemyDraftRepository(self.session)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        # Compute outermost-ness BEFORE the parent decrements the depth.
        is_outermost = self._depth == 1
        try:
            super().__exit__(exc_type, exc_val, exc_tb)
        finally:
            if is_outermost and self.session is not None:
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
        super().__init__()
        self.committed = False
        from obione.auth.repository import FakeUserRepository
        from obione.comments.repository import FakeCommentRepository
        from obione.documents.repository import FakeDocumentRepository
        from obione.drafts.repository import FakeDraftRepository
        from obione.extractions.repository import FakeExtractionRepository
        from obione.likert.repository import FakeLikertRepository
        from obione.projects.repository import FakeProjectRepository
        from obione.resumos.repository import FakeResumoRepository

        self.users: FakeUserRepository = FakeUserRepository()
        self.projects: FakeProjectRepository = FakeProjectRepository()
        self.documents: FakeDocumentRepository = FakeDocumentRepository()
        self.extractions: FakeExtractionRepository = FakeExtractionRepository()
        self.comments: FakeCommentRepository = FakeCommentRepository()
        self.likert: FakeLikertRepository = FakeLikertRepository()
        self.resumos: FakeResumoRepository = FakeResumoRepository()
        self.drafts: FakeDraftRepository = FakeDraftRepository()

    def commit(self) -> None:
        self.committed = True

    def rollback(self) -> None:
        pass
