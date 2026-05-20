"""HTTP routes for the projects bounded context."""
import uuid

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.projects import service
from obione.projects.schemas import (
    AddClientRequest,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(user: CurrentUser) -> list[ProjectResponse]:
    return [
        ProjectResponse.model_validate(p)
        for p in service.list_projects_for_user(get_uow(), user)
    ]


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(payload: ProjectCreate, user: CurrentUser) -> ProjectResponse:
    project = service.create_project(get_uow(), user, payload)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: uuid.UUID, user: CurrentUser) -> ProjectResponse:
    project = service.get_project_for_user(get_uow(), user, project_id)
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID, payload: ProjectUpdate, user: CurrentUser
) -> ProjectResponse:
    project = service.update_project(get_uow(), user, project_id, payload)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: uuid.UUID, user: CurrentUser) -> None:
    service.delete_project(get_uow(), user, project_id)


@router.post("/{project_id}/clients", status_code=201)
def add_client(
    project_id: uuid.UUID, payload: AddClientRequest, user: CurrentUser
) -> dict:
    service.add_client_to_project(get_uow(), user, project_id, payload.user_id)
    return {"status": "added"}
