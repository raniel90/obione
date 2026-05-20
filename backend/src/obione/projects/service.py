"""Project use cases."""
import uuid

from obione.auth.models import User
from obione.projects.access_control import can_user_see, list_visible_projects
from obione.projects.exceptions import ClientCannotMutateError, ProjectNotFoundError
from obione.projects.models import Project
from obione.projects.schemas import ProjectCreate, ProjectUpdate
from obione.unit_of_work import AbstractUnitOfWork


def _require_mutator(user: User) -> None:
    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot mutate projects.")


def list_projects_for_user(uow: AbstractUnitOfWork, user: User) -> list[Project]:
    with uow:
        return list_visible_projects(uow, user)


def get_project_for_user(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> Project:
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        return project


def create_project(
    uow: AbstractUnitOfWork, user: User, data: ProjectCreate
) -> Project:
    _require_mutator(user)
    with uow:
        project = Project(
            name=data.name,
            domain=data.domain,
            description=data.description,
            consultant_id=user.id,
        )
        uow.projects.add(project)
        uow.commit()
        return project


def update_project(
    uow: AbstractUnitOfWork,
    user: User,
    project_id: uuid.UUID,
    data: ProjectUpdate,
) -> Project:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        uow.commit()
        return project


def delete_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> None:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        uow.projects.delete(project)
        uow.commit()


def add_client_to_project(
    uow: AbstractUnitOfWork,
    user: User,
    project_id: uuid.UUID,
    client_user_id: uuid.UUID,
) -> None:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        uow.projects.add_client(project_id, client_user_id)
        uow.commit()
