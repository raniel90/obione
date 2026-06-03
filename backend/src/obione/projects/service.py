"""Project use cases."""

import uuid
from dataclasses import dataclass

from obione.auth.models import User
from obione.comments.models import Comment
from obione.extractions.coverage import CoverageReport, compute_coverage
from obione.extractions.evaluation import EvaluationReport, compare_extractions
from obione.extractions.models import Extraction
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
    extraction_count: int
    coverage_percentage: float
    has_gabarito: bool


@dataclass(frozen=True)
class ProjectDetail:
    """Consolidated read view for the project detail screen (US08)."""

    project: Project
    latest_llm: Extraction | None
    latest_gabarito: Extraction | None
    coverage: CoverageReport
    evaluation: EvaluationReport | None
    recent_comments: list[Comment]
    total_extractions: int
    total_comments: int


def _require_mutator(user: User) -> None:
    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot mutate projects.")


def list_projects_for_user(uow: AbstractUnitOfWork, user: User) -> list[Project]:
    with uow:
        return list_visible_projects(uow, user)


def get_project_for_user(uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID) -> Project:
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        return project


def create_project(uow: AbstractUnitOfWork, user: User, data: ProjectCreate) -> Project:
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


def delete_project(uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID) -> None:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        uow.projects.delete(project)
        uow.commit()


def _is_gabarito(extraction) -> bool:
    """True if `_meta.origem == 'gabarito_manual'` — same definition the
    extractions service uses. The DB `source` column doesn't disambiguate
    because the manual endpoint persists both gabarito and other operator
    inputs as source='manual'.
    """
    origem = (extraction.content or {}).get("_meta", {}).get("origem")
    return origem == "gabarito_manual"


def _derive_status(*, extraction_count: int, has_gabarito: bool) -> str:
    """Derived portfolio status: 'registered' (no extraction yet),
    'extracted' (has LLM extraction), 'reviewed' (has gabarito_manual)."""
    if has_gabarito:
        return "reviewed"
    if extraction_count > 0:
        return "extracted"
    return "registered"


def get_project_detail(
    uow: AbstractUnitOfWork,
    user: User,
    project_id: uuid.UUID,
    *,
    comments_limit: int = 20,
) -> ProjectDetail:
    """Return the consolidated detail view (US08).

    Keeps only the latest extraction of each kind and a configurable slice of
    recent comments. Coverage is computed from whichever extraction (any source)
    is most recent. The evaluation block is filled only when both an llm and a
    gabarito_manual exist.
    """
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project.id)
        comments = uow.comments.list_by_project(project.id)

    latest_llm = next((e for e in extractions if not _is_gabarito(e)), None)
    latest_gabarito = next((e for e in extractions if _is_gabarito(e)), None)

    most_recent = extractions[0] if extractions else None
    coverage = compute_coverage(
        most_recent.content if most_recent else {},
        extraction_id=str(most_recent.id) if most_recent else None,
    )

    evaluation: EvaluationReport | None = None
    if latest_llm is not None and latest_gabarito is not None:
        evaluation = compare_extractions(latest_llm.content, latest_gabarito.content)

    # Comments come back ascending; slice the tail and reverse → newest-first.
    # `comments_limit == 0` means "skip the comments slice" (still report total).
    tail = comments[-comments_limit:] if comments_limit > 0 else []
    recent_comments = list(reversed(tail))

    return ProjectDetail(
        project=project,
        latest_llm=latest_llm,
        latest_gabarito=latest_gabarito,
        coverage=coverage,
        evaluation=evaluation,
        recent_comments=recent_comments,
        total_extractions=len(extractions),
        total_comments=len(comments),
    )


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
            extractions = uow.extractions.list_by_project(project.id)
            has_gabarito = any(_is_gabarito(e) for e in extractions)
            if extractions:
                latest = extractions[0]
                coverage = compute_coverage(latest.content)
                coverage_pct = coverage.percentage
            else:
                coverage_pct = 0.0
            entries.append(
                PortfolioEntry(
                    project=project,
                    status=_derive_status(
                        extraction_count=len(extractions),
                        has_gabarito=has_gabarito,
                    ),
                    extraction_count=len(extractions),
                    coverage_percentage=coverage_pct,
                    has_gabarito=has_gabarito,
                )
            )
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
