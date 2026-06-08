"""Likert repository (abstract + SqlAlchemy + Fake)."""

from __future__ import annotations

import uuid
from datetime import UTC
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.likert.models import LikertResponse


class AbstractLikertRepository(Protocol):
    def add(self, response: LikertResponse) -> None: ...
    def list_by_kind(self, kind: str) -> list[LikertResponse]: ...
    def list_by_project(self, project_id: uuid.UUID) -> list[LikertResponse]: ...


class SqlAlchemyLikertRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, response: LikertResponse) -> None:
        self._session.add(response)

    def list_by_kind(self, kind: str) -> list[LikertResponse]:
        return list(
            self._session.execute(
                select(LikertResponse)
                .where(LikertResponse.kind == kind)
                .order_by(LikertResponse.created_at.asc())
            ).scalars()
        )

    def list_by_project(self, project_id: uuid.UUID) -> list[LikertResponse]:
        return list(
            self._session.execute(
                select(LikertResponse)
                .where(LikertResponse.project_id == project_id)
                .order_by(LikertResponse.created_at.asc())
            ).scalars()
        )


class FakeLikertRepository:
    def __init__(self):
        self._items: dict[uuid.UUID, LikertResponse] = {}

    def add(self, response: LikertResponse) -> None:
        if response.id is None:
            from obione.shared.ids import new_id

            response.id = new_id()
        if response.created_at is None:
            from datetime import datetime

            response.created_at = datetime.now(tz=UTC)
        self._items[response.id] = response

    def list_by_kind(self, kind: str) -> list[LikertResponse]:
        return sorted(
            (r for r in self._items.values() if r.kind == kind),
            key=lambda r: r.created_at or 0,
        )

    def list_by_project(self, project_id: uuid.UUID) -> list[LikertResponse]:
        return sorted(
            (r for r in self._items.values() if r.project_id == project_id),
            key=lambda r: r.created_at or 0,
        )
