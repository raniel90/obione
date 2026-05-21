"""Project repository (abstract + SqlAlchemy + Fake)."""

from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.projects.models import Project, ProjectClient


class AbstractProjectRepository(Protocol):
    def add(self, project: Project) -> None: ...
    def get(self, project_id: uuid.UUID) -> Project | None: ...
    def list_all(self) -> list[Project]: ...
    def list_by_consultant(self, consultant_id: uuid.UUID) -> list[Project]: ...
    def list_for_client(self, user_id: uuid.UUID) -> list[Project]: ...
    def delete(self, project: Project) -> None: ...
    def is_client_authorized(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool: ...
    def add_client(self, project_id: uuid.UUID, user_id: uuid.UUID) -> None: ...


class SqlAlchemyProjectRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, project: Project) -> None:
        self._session.add(project)

    def get(self, project_id: uuid.UUID) -> Project | None:
        return self._session.get(Project, project_id)

    def list_all(self) -> list[Project]:
        return list(
            self._session.execute(select(Project).order_by(Project.created_at.desc())).scalars()
        )

    def list_by_consultant(self, consultant_id: uuid.UUID) -> list[Project]:
        return list(
            self._session.execute(
                select(Project)
                .where(Project.consultant_id == consultant_id)
                .order_by(Project.created_at.desc())
            ).scalars()
        )

    def list_for_client(self, user_id: uuid.UUID) -> list[Project]:
        return list(
            self._session.execute(
                select(Project)
                .join(ProjectClient, ProjectClient.project_id == Project.id)
                .where(ProjectClient.user_id == user_id)
                .order_by(Project.created_at.desc())
            ).scalars()
        )

    def delete(self, project: Project) -> None:
        self._session.delete(project)

    def is_client_authorized(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        return (
            self._session.execute(
                select(ProjectClient).where(
                    ProjectClient.project_id == project_id,
                    ProjectClient.user_id == user_id,
                )
            ).scalar_one_or_none()
            is not None
        )

    def add_client(self, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
        existing = self._session.get(ProjectClient, (project_id, user_id))
        if existing is None:
            self._session.add(ProjectClient(project_id=project_id, user_id=user_id))


class FakeProjectRepository:
    def __init__(self):
        self._projects: dict[uuid.UUID, Project] = {}
        self._clients: set[tuple[uuid.UUID, uuid.UUID]] = set()

    def add(self, project: Project) -> None:
        if project.id is None:
            from obione.shared.ids import new_id

            project.id = new_id()
        self._projects[project.id] = project

    def get(self, project_id: uuid.UUID) -> Project | None:
        return self._projects.get(project_id)

    def list_all(self) -> list[Project]:
        return list(self._projects.values())

    def list_by_consultant(self, consultant_id: uuid.UUID) -> list[Project]:
        return [p for p in self._projects.values() if p.consultant_id == consultant_id]

    def list_for_client(self, user_id: uuid.UUID) -> list[Project]:
        ids = {pid for (pid, uid) in self._clients if uid == user_id}
        return [p for p in self._projects.values() if p.id in ids]

    def delete(self, project: Project) -> None:
        self._projects.pop(project.id, None)
        self._clients = {(pid, uid) for (pid, uid) in self._clients if pid != project.id}

    def is_client_authorized(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        return (project_id, user_id) in self._clients

    def add_client(self, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
        self._clients.add((project_id, user_id))
