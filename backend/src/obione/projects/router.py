"""HTTP routes for the projects bounded context."""

import uuid

from fastapi import APIRouter, Query

from obione.auth.dependencies import CurrentUser, get_uow
from obione.projects import service
from obione.projects.schemas import (
    AddClientRequest,
    CommentBrief,
    CoverageSummary,
    DocumentBrief,
    EvaluationSummary,
    ExtractionBrief,
    PortfolioProjectResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)
from obione.shared.exceptions import ForbiddenError

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/portfolio", response_model=list[PortfolioProjectResponse])
def get_portfolio(
    user: CurrentUser,
    domain: str | None = Query(default=None),
) -> list[PortfolioProjectResponse]:
    """Consultant/admin portfolio view with status + coverage (US07).

    Clients can't access this view — they use GET /projects for the
    plain list of their own assigned projects.
    """
    if user.role == "client":
        raise ForbiddenError("Portfolio view is restricted to consultants and admins.")
    entries = service.list_portfolio_for_user(get_uow(), user, domain=domain)
    return [
        PortfolioProjectResponse(
            id=e.project.id,
            name=e.project.name,
            domain=e.project.domain,
            description=e.project.description,
            consultant_id=e.project.consultant_id,
            created_at=e.project.created_at,
            updated_at=e.project.updated_at,
            status=e.status,  # type: ignore[arg-type]
            document_count=e.document_count,
            extraction_count=e.extraction_count,
            coverage_percentage=e.coverage_percentage,
            has_gabarito=e.has_gabarito,
        )
        for e in entries
    ]


@router.get("", response_model=list[ProjectResponse])
def list_projects(user: CurrentUser) -> list[ProjectResponse]:
    return [
        ProjectResponse.model_validate(p) for p in service.list_projects_for_user(get_uow(), user)
    ]


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(payload: ProjectCreate, user: CurrentUser) -> ProjectResponse:
    project = service.create_project(get_uow(), user, payload)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: uuid.UUID, user: CurrentUser) -> ProjectResponse:
    project = service.get_project_for_user(get_uow(), user, project_id)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}/detail", response_model=ProjectDetailResponse)
def get_project_detail(
    project_id: uuid.UUID,
    user: CurrentUser,
    comments_limit: int = Query(default=20, ge=0, le=100),
) -> ProjectDetailResponse:
    """Consolidated read view for the project detail screen (US08)."""
    detail = service.get_project_detail(get_uow(), user, project_id, comments_limit=comments_limit)
    evaluation_dto: EvaluationSummary | None = None
    if detail.evaluation is not None:
        m = detail.evaluation.estruturado_metrics
        evaluation_dto = EvaluationSummary(
            tp=m.tp,
            fp=m.fp,
            fn=m.fn,
            tn=m.tn,
            precision=m.precision,
            recall=m.recall,
            f1=m.f1,
            needs_human_review_count=detail.evaluation.needs_human_review_count,
        )
    return ProjectDetailResponse(
        project=ProjectResponse.model_validate(detail.project),
        documents=[DocumentBrief.model_validate(d) for d in detail.documents],
        latest_llm_extraction=(
            ExtractionBrief.model_validate(detail.latest_llm) if detail.latest_llm else None
        ),
        latest_gabarito=(
            ExtractionBrief.model_validate(detail.latest_gabarito)
            if detail.latest_gabarito
            else None
        ),
        coverage=CoverageSummary(
            extraction_id=(
                uuid.UUID(detail.coverage.extraction_id) if detail.coverage.extraction_id else None
            ),
            filled=detail.coverage.filled,
            total_in_scope=detail.coverage.total_in_scope,
            out_of_scope_count=detail.coverage.out_of_scope_count,
            percentage=detail.coverage.percentage,
        ),
        evaluation=evaluation_dto,
        recent_comments=[CommentBrief.model_validate(c) for c in detail.recent_comments],
        counts={
            "documents": len(detail.documents),
            "extractions": detail.total_extractions,
            "comments": detail.total_comments,
        },
    )


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
def add_client(project_id: uuid.UUID, payload: AddClientRequest, user: CurrentUser) -> dict:
    service.add_client_to_project(get_uow(), user, project_id, payload.user_id)
    return {"status": "added"}
