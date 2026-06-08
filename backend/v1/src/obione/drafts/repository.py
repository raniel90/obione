"""Draft repository (abstract + SqlAlchemy + Fake)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.drafts.models import Draft


class AbstractDraftRepository(Protocol):
    def add(self, draft: Draft) -> None: ...
    def get(self, draft_id: uuid.UUID) -> Draft | None: ...
    def delete(self, draft: Draft) -> None: ...
    def list_by_project(
        self, project_id: uuid.UUID, *, only_published: bool = False
    ) -> list[Draft]: ...


class SqlAlchemyDraftRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, draft: Draft) -> None:
        self._session.add(draft)

    def get(self, draft_id: uuid.UUID) -> Draft | None:
        return self._session.get(Draft, draft_id)

    def delete(self, draft: Draft) -> None:
        self._session.delete(draft)

    def list_by_project(
        self, project_id: uuid.UUID, *, only_published: bool = False
    ) -> list[Draft]:
        stmt = select(Draft).where(Draft.project_id == project_id)
        if only_published:
            stmt = stmt.where(Draft.status == "published")
        return list(self._session.execute(stmt.order_by(Draft.created_at.desc())).scalars())


class FakeDraftRepository:
    def __init__(self):
        self._items: dict[uuid.UUID, Draft] = {}

    def add(self, draft: Draft) -> None:
        if draft.id is None:
            from obione.shared.ids import new_id

            draft.id = new_id()
        if draft.created_at is None:
            draft.created_at = datetime.now(tz=UTC)
        if draft.updated_at is None:
            draft.updated_at = draft.created_at
        self._items[draft.id] = draft

    def get(self, draft_id: uuid.UUID) -> Draft | None:
        return self._items.get(draft_id)

    def delete(self, draft: Draft) -> None:
        self._items.pop(draft.id, None)

    def list_by_project(
        self, project_id: uuid.UUID, *, only_published: bool = False
    ) -> list[Draft]:
        items = [d for d in self._items.values() if d.project_id == project_id]
        if only_published:
            items = [d for d in items if d.status == "published"]
        return sorted(items, key=lambda d: d.created_at or 0, reverse=True)
