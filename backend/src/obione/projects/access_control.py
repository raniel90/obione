"""Visibility rules — pure functions, no I/O beyond repository calls via UoW."""

from obione.auth.models import User
from obione.projects.models import Project
from obione.unit_of_work import AbstractUnitOfWork


def can_user_see(uow: AbstractUnitOfWork, user: User, project: Project) -> bool:
    if user.role == "admin":
        return True
    if user.role == "consultant":
        return project.consultant_id == user.id
    return uow.projects.is_client_authorized(project.id, user.id)


def list_visible_projects(uow: AbstractUnitOfWork, user: User) -> list[Project]:
    if user.role == "admin":
        return uow.projects.list_all()
    if user.role == "consultant":
        return uow.projects.list_by_consultant(user.id)
    return uow.projects.list_for_client(user.id)
