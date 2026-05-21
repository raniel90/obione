"""Resumo repository (abstract + SqlAlchemy + Fake)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.resumos.models import Resumo


class AbstractResumoRepository(Protocol):
    def add(self, resumo: Resumo) -> None: ...
    def get(self, resumo_id: uuid.UUID) -> Resumo | None: ...
    def list_by_project(
        self, project_id: uuid.UUID, *, only_published: bool = False
    ) -> list[Resumo]: ...


class SqlAlchemyResumoRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, resumo: Resumo) -> None:
        self._session.add(resumo)

    def get(self, resumo_id: uuid.UUID) -> Resumo | None:
        return self._session.get(Resumo, resumo_id)

    def list_by_project(
        self, project_id: uuid.UUID, *, only_published: bool = False
    ) -> list[Resumo]:
        stmt = select(Resumo).where(Resumo.project_id == project_id)
        if only_published:
            stmt = stmt.where(Resumo.status == "published")
        return list(self._session.execute(stmt.order_by(Resumo.created_at.desc())).scalars())


class FakeResumoRepository:
    def __init__(self):
        self._items: dict[uuid.UUID, Resumo] = {}

    def add(self, resumo: Resumo) -> None:
        if resumo.id is None:
            from obione.shared.ids import new_id

            resumo.id = new_id()
        if resumo.created_at is None:
            resumo.created_at = datetime.now(tz=UTC)
        if resumo.updated_at is None:
            resumo.updated_at = resumo.created_at
        self._items[resumo.id] = resumo

    def get(self, resumo_id: uuid.UUID) -> Resumo | None:
        return self._items.get(resumo_id)

    def list_by_project(
        self, project_id: uuid.UUID, *, only_published: bool = False
    ) -> list[Resumo]:
        items = [r for r in self._items.values() if r.project_id == project_id]
        if only_published:
            items = [r for r in items if r.status == "published"]
        return sorted(items, key=lambda r: r.created_at or 0, reverse=True)
