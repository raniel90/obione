"""Extraction repository (abstract + SqlAlchemy + Fake)."""

from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.extractions.models import Extraction


class AbstractExtractionRepository(Protocol):
    def add(self, extraction: Extraction) -> None: ...
    def get(self, extraction_id: uuid.UUID) -> Extraction | None: ...
    def list_by_project(self, project_id: uuid.UUID) -> list[Extraction]: ...


class SqlAlchemyExtractionRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, extraction: Extraction) -> None:
        self._session.add(extraction)

    def get(self, extraction_id: uuid.UUID) -> Extraction | None:
        return self._session.get(Extraction, extraction_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[Extraction]:
        return list(
            self._session.execute(
                select(Extraction)
                .where(Extraction.project_id == project_id)
                .order_by(Extraction.created_at.desc())
            ).scalars()
        )


class FakeExtractionRepository:
    def __init__(self):
        self._extractions: dict[uuid.UUID, Extraction] = {}

    def add(self, extraction: Extraction) -> None:
        if extraction.id is None:
            from obione.shared.ids import new_id

            extraction.id = new_id()
        self._extractions[extraction.id] = extraction

    def get(self, extraction_id: uuid.UUID) -> Extraction | None:
        return self._extractions.get(extraction_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[Extraction]:
        return [e for e in self._extractions.values() if e.project_id == project_id]
