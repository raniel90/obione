"""Repositories for theme suggestions."""

from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.themes.models import ThemeSuggestion


class AbstractThemeRepository(Protocol):
    def add(self, suggestion: ThemeSuggestion) -> None: ...

    def get(self, suggestion_id: uuid.UUID) -> ThemeSuggestion | None: ...

    def list_by_project(self, project_id: uuid.UUID) -> list[ThemeSuggestion]: ...


class SqlAlchemyThemeRepository:
    def __init__(self, session: Session):
        self._s = session

    def add(self, suggestion: ThemeSuggestion) -> None:
        self._s.add(suggestion)

    def get(self, suggestion_id: uuid.UUID) -> ThemeSuggestion | None:
        return self._s.get(ThemeSuggestion, suggestion_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[ThemeSuggestion]:
        return list(
            self._s.execute(
                select(ThemeSuggestion)
                .where(ThemeSuggestion.project_id == project_id)
                .order_by(ThemeSuggestion.created_at.desc())
            ).scalars()
        )


class FakeThemeRepository:
    def __init__(self):
        self._items: dict[uuid.UUID, ThemeSuggestion] = {}

    def add(self, suggestion: ThemeSuggestion) -> None:
        self._items[suggestion.id] = suggestion

    def get(self, suggestion_id: uuid.UUID) -> ThemeSuggestion | None:
        return self._items.get(suggestion_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[ThemeSuggestion]:
        return sorted(
            (s for s in self._items.values() if s.project_id == project_id),
            key=lambda s: s.created_at or "",
            reverse=True,
        )
