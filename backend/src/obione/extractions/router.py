"""HTTP routes for extractions."""

import uuid

from fastapi import APIRouter, Depends

from obione.auth.dependencies import CurrentUser, get_uow
from obione.documents.dependencies import get_blob_storage
from obione.documents.storage.port import AbstractBlobStorage
from obione.extractions import service
from obione.extractions.dependencies import get_extractor_for
from obione.extractions.exceptions import ExtractionNotFoundError
from obione.extractions.schemas import (
    AttributeVerdictResponse,
    CategoryCoverageResponse,
    CoverageResponse,
    EvaluationResponse,
    ExtractionResponse,
    GroupMetricsResponse,
    ManualExtractionCreate,
)
from obione.unit_of_work import SqlAlchemyUnitOfWork

router = APIRouter(prefix="/projects/{project_id}/extractions", tags=["extractions"])


@router.get("", response_model=list[ExtractionResponse])
def list_extractions(project_id: uuid.UUID, user: CurrentUser) -> list[ExtractionResponse]:
    items = service.list_extractions_for_project(get_uow(), user, project_id)
    return [ExtractionResponse.model_validate(x) for x in items]


@router.post("", response_model=ExtractionResponse, status_code=201)
def create_extraction(project_id: uuid.UUID, user: CurrentUser) -> ExtractionResponse:
    """Run the LLM pipeline on the project's `description` and persist.

    No request body — the source text comes from `project.description`. The
    provider is picked from `settings.LLM_PROVIDER` ("mock" by default).
    """
    with SqlAlchemyUnitOfWork() as uow:
        project = uow.projects.get(project_id)
        project_name = project.name if project else "unknown"
    extractor = get_extractor_for(project_name)
    e = service.extract_for_project(get_uow(), extractor, user, project_id=project_id)
    return ExtractionResponse.model_validate(e)


@router.get("/coverage", response_model=CoverageResponse)
def get_coverage(project_id: uuid.UUID, user: CurrentUser) -> CoverageResponse:
    """MPO coverage report for the project (US09)."""
    report = service.get_project_coverage(get_uow(), user, project_id)
    return CoverageResponse(
        extraction_id=uuid.UUID(report.extraction_id) if report.extraction_id else None,
        filled=report.filled,
        total_in_scope=report.total_in_scope,
        out_of_scope_count=report.out_of_scope_count,
        percentage=report.percentage,
        by_category=[
            CategoryCoverageResponse(
                category=c.category,
                filled=c.filled,
                total_in_scope=c.total_in_scope,
                percentage=c.percentage,
            )
            for c in report.by_category
        ],
    )


@router.get("/evaluation", response_model=EvaluationResponse)
def get_evaluation(project_id: uuid.UUID, user: CurrentUser) -> EvaluationResponse:
    """LLM-vs-gabarito comparison report (US15)."""
    report = service.get_project_evaluation(get_uow(), user, project_id)
    metrics = report.estruturado_metrics
    return EvaluationResponse(
        per_attribute=[
            AttributeVerdictResponse(
                name=v.name,
                category=v.category,
                extraction_type=v.extraction_type,
                verdict=v.verdict,  # type: ignore[arg-type]
                llm_value=v.llm_value,
                gabarito_value=v.gabarito_value,
            )
            for v in report.per_attribute
        ],
        estruturado_metrics=GroupMetricsResponse(
            group=metrics.group,
            tp=metrics.tp,
            fp=metrics.fp,
            fn=metrics.fn,
            tn=metrics.tn,
            precision=metrics.precision,
            recall=metrics.recall,
            f1=metrics.f1,
        ),
        needs_human_review_count=report.needs_human_review_count,
        out_of_scope_count=report.out_of_scope_count,
    )


@router.post("/manual", response_model=ExtractionResponse, status_code=201)
def create_manual_extraction(
    project_id: uuid.UUID,
    payload: ManualExtractionCreate,
    user: CurrentUser,
) -> ExtractionResponse:
    e = service.create_extraction_from_manual(
        get_uow(),
        user,
        project_id=project_id,
        document_id=payload.document_id,
        content=payload.content,
    )
    return ExtractionResponse.model_validate(e)


@router.post(
    "/from-document/{document_id}",
    response_model=ExtractionResponse,
    status_code=201,
)
def create_from_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    user: CurrentUser,
    storage: AbstractBlobStorage = Depends(get_blob_storage),
) -> ExtractionResponse:
    """Run the LLM pipeline on an already-uploaded document.

    Provider is picked from settings.LLM_PROVIDER ("mock" by default).
    """
    # Look up doc + project metadata first so the extractor sees real names.
    with SqlAlchemyUnitOfWork() as uow:
        doc = uow.documents.get(document_id)
        if doc is None:
            raise ExtractionNotFoundError(f"Document not found: {document_id}")
        project = uow.projects.get(doc.project_id)
        project_name = project.name if project else "unknown"
        document_name = doc.original_name
    _ = document_name  # forwarded only for prompt context, no longer used
    extractor = get_extractor_for(project_name)
    e = service.create_extraction_from_document(
        get_uow(),
        storage,
        extractor,
        user,
        project_id=project_id,
        document_id=document_id,
    )
    return ExtractionResponse.model_validate(e)
