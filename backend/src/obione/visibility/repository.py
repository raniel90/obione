"""Repositories for the CBAC tables."""

from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.visibility.models import ProjectAttributeVisibility, ProjectCategoryVisibility


class AbstractVisibilityRepository(Protocol):
    def list_categories(self, project_id: uuid.UUID) -> list[ProjectCategoryVisibility]: ...

    def list_attributes(self, project_id: uuid.UUID) -> list[ProjectAttributeVisibility]: ...

    def upsert_category(self, project_id: uuid.UUID, category_key: str, visible: bool) -> None: ...

    def upsert_attribute(
        self, project_id: uuid.UUID, attribute_key: str, visible: bool
    ) -> None: ...

    def delete_attribute(self, project_id: uuid.UUID, attribute_key: str) -> None: ...


class SqlAlchemyVisibilityRepository:
    def __init__(self, session: Session):
        self._s = session

    def list_categories(self, project_id: uuid.UUID) -> list[ProjectCategoryVisibility]:
        return list(
            self._s.execute(
                select(ProjectCategoryVisibility).where(
                    ProjectCategoryVisibility.project_id == project_id
                )
            ).scalars()
        )

    def list_attributes(self, project_id: uuid.UUID) -> list[ProjectAttributeVisibility]:
        return list(
            self._s.execute(
                select(ProjectAttributeVisibility).where(
                    ProjectAttributeVisibility.project_id == project_id
                )
            ).scalars()
        )

    def upsert_category(self, project_id, category_key, visible):
        existing = self._s.get(ProjectCategoryVisibility, (project_id, category_key))
        if existing is not None:
            existing.visible = visible
        else:
            self._s.add(
                ProjectCategoryVisibility(
                    project_id=project_id, category_key=category_key, visible=visible
                )
            )

    def upsert_attribute(self, project_id, attribute_key, visible):
        existing = self._s.get(ProjectAttributeVisibility, (project_id, attribute_key))
        if existing is not None:
            existing.visible = visible
        else:
            self._s.add(
                ProjectAttributeVisibility(
                    project_id=project_id, attribute_key=attribute_key, visible=visible
                )
            )

    def delete_attribute(self, project_id, attribute_key):
        existing = self._s.get(ProjectAttributeVisibility, (project_id, attribute_key))
        if existing is not None:
            self._s.delete(existing)


class FakeVisibilityRepository:
    """In-memory implementation for unit tests."""

    def __init__(self):
        self._cats: dict[tuple[uuid.UUID, str], ProjectCategoryVisibility] = {}
        self._attrs: dict[tuple[uuid.UUID, str], ProjectAttributeVisibility] = {}

    def list_categories(self, project_id):
        return [v for (pid, _), v in self._cats.items() if pid == project_id]

    def list_attributes(self, project_id):
        return [v for (pid, _), v in self._attrs.items() if pid == project_id]

    def upsert_category(self, project_id, category_key, visible):
        self._cats[(project_id, category_key)] = ProjectCategoryVisibility(
            project_id=project_id, category_key=category_key, visible=visible
        )

    def upsert_attribute(self, project_id, attribute_key, visible):
        self._attrs[(project_id, attribute_key)] = ProjectAttributeVisibility(
            project_id=project_id, attribute_key=attribute_key, visible=visible
        )

    def delete_attribute(self, project_id, attribute_key):
        self._attrs.pop((project_id, attribute_key), None)
