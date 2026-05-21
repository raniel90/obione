"""Project use cases."""
import uuid
from dataclasses import dataclass

from obione.auth.models import User
from obione.extractions.coverage import compute_coverage
from obione.projects.access_control import can_user_see, list_visible_projects
from obione.projects.exceptions import ClientCannotMutateError, ProjectNotFoundError
from obione.projects.models import Project
from obione.projects.schemas import ProjectCreate, ProjectUpdate
from obione.unit_of_work import AbstractUnitOfWork


@dataclass(frozen=True)
class PortfolioEntry:
    """Project + derived portfolio metrics (US07). Wire-mapping in router."""

    project: Project
    status: str
    document_count: int
    extraction_count: int
    coverage_percentage: float
    has_gabarito: bool


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


def _is_gabarito(extraction) -> bool:
    """True if the extraction represents a manual gabarito anotation."""
    if extraction.source == "manual":
        return True
    origem = (extraction.content or {}).get("_meta", {}).get("origem")
    return origem == "gabarito_manual"


def _derive_status(
    *, document_count: int, extraction_count: int, has_gabarito: bool
) -> str:
    if has_gabarito:
        return "reviewed"
    if extraction_count > 0:
        return "extracted"
    if document_count > 0:
        return "ingested"
    return "registered"


def list_portfolio_for_user(
    uow: AbstractUnitOfWork,
    user: User,
    *,
    domain: str | None = None,
) -> list[PortfolioEntry]:
    """List visible projects enriched with status + coverage metrics (US07).

    Domain filter narrows the list to projects whose `domain` matches; pass
    `None` to return everything visible. Coverage is computed from the
    project's latest extraction (any source); 0% when no extraction exists.
    """
    with uow:
        projects = list_visible_projects(uow, user)
        if domain is not None:
            projects = [p for p in projects if p.domain == domain]
        entries: list[PortfolioEntry] = []
        for project in projects:
            documents = uow.documents.list_by_project(project.id)
            extractions = uow.extractions.list_by_project(project.id)
            has_gabarito = any(_is_gabarito(e) for e in extractions)
            if extractions:
                latest = extractions[0]
                coverage = compute_coverage(latest.content)
                coverage_pct = coverage.percentage
            else:
                coverage_pct = 0.0
            entries.append(PortfolioEntry(
                project=project,
                status=_derive_status(
                    document_count=len(documents),
                    extraction_count=len(extractions),
                    has_gabarito=has_gabarito,
                ),
                document_count=len(documents),
                extraction_count=len(extractions),
                coverage_percentage=coverage_pct,
                has_gabarito=has_gabarito,
            ))
        return entries


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
