"""Comment repository (abstract + SqlAlchemy + Fake)."""
from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.comments.models import Comment


class AbstractCommentRepository(Protocol):
    def add(self, comment: Comment) -> None: ...
    def get(self, comment_id: uuid.UUID) -> Comment | None: ...
    def list_by_project(self, project_id: uuid.UUID) -> list[Comment]: ...
    def delete(self, comment: Comment) -> None: ...


class SqlAlchemyCommentRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, comment: Comment) -> None:
        self._session.add(comment)

    def get(self, comment_id: uuid.UUID) -> Comment | None:
        return self._session.get(Comment, comment_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[Comment]:
        return list(
            self._session.execute(
                select(Comment)
                .where(Comment.project_id == project_id)
                .order_by(Comment.created_at.asc())
            ).scalars()
        )

    def delete(self, comment: Comment) -> None:
        self._session.delete(comment)


class FakeCommentRepository:
    def __init__(self):
        self._comments: dict[uuid.UUID, Comment] = {}

    def add(self, comment: Comment) -> None:
        if comment.id is None:
            from obione.shared.ids import new_id
            comment.id = new_id()
        self._comments[comment.id] = comment

    def get(self, comment_id: uuid.UUID) -> Comment | None:
        return self._comments.get(comment_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[Comment]:
        return sorted(
            (c for c in self._comments.values() if c.project_id == project_id),
            key=lambda c: c.created_at or 0,
        )

    def delete(self, comment: Comment) -> None:
        self._comments.pop(comment.id, None)
        # Cascade replies (mimics ON DELETE CASCADE on parent_id).
        for cid in [c.id for c in self._comments.values() if c.parent_id == comment.id]:
            self._comments.pop(cid, None)
