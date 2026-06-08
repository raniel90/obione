"""Synthesis repository (abstract + SqlAlchemy + Fake)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.synthesis.models import Synthesis


class AbstractSynthesisRepository(Protocol):
    def add(self, synthesis: Synthesis) -> None: ...
    def get(self, synthesis_id: uuid.UUID) -> Synthesis | None: ...
    def delete(self, synthesis: Synthesis) -> None: ...
    def list_by_domain(self, domain: str, *, only_published: bool = False) -> list[Synthesis]: ...


class SqlAlchemySynthesisRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, synthesis: Synthesis) -> None:
        self._session.add(synthesis)

    def get(self, synthesis_id: uuid.UUID) -> Synthesis | None:
        return self._session.get(Synthesis, synthesis_id)

    def delete(self, synthesis: Synthesis) -> None:
        self._session.delete(synthesis)

    def list_by_domain(self, domain: str, *, only_published: bool = False) -> list[Synthesis]:
        stmt = select(Synthesis).where(Synthesis.domain == domain)
        if only_published:
            stmt = stmt.where(Synthesis.status == "published")
        return list(self._session.execute(stmt.order_by(Synthesis.created_at.desc())).scalars())


class FakeSynthesisRepository:
    def __init__(self):
        self._items: dict[uuid.UUID, Synthesis] = {}

    def add(self, synthesis: Synthesis) -> None:
        if synthesis.id is None:
            from obione.shared.ids import new_id

            synthesis.id = new_id()
        if synthesis.created_at is None:
            synthesis.created_at = datetime.now(tz=UTC)
        if synthesis.updated_at is None:
            synthesis.updated_at = synthesis.created_at
        self._items[synthesis.id] = synthesis

    def get(self, synthesis_id: uuid.UUID) -> Synthesis | None:
        return self._items.get(synthesis_id)

    def delete(self, synthesis: Synthesis) -> None:
        self._items.pop(synthesis.id, None)

    def list_by_domain(self, domain: str, *, only_published: bool = False) -> list[Synthesis]:
        items = [s for s in self._items.values() if s.domain == domain]
        if only_published:
            items = [s for s in items if s.status == "published"]
        return sorted(items, key=lambda s: s.created_at or 0, reverse=True)
