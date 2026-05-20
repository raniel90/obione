"""HTTP routes for extractions."""
import uuid

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.extractions import service
from obione.extractions.schemas import ExtractionResponse, ManualExtractionCreate

router = APIRouter(prefix="/projects/{project_id}/extractions", tags=["extractions"])


@router.get("", response_model=list[ExtractionResponse])
def list_extractions(project_id: uuid.UUID, user: CurrentUser) -> list[ExtractionResponse]:
    items = service.list_extractions_for_project(get_uow(), user, project_id)
    return [ExtractionResponse.model_validate(x) for x in items]


@router.post("/manual", response_model=ExtractionResponse, status_code=201)
def create_manual_extraction(
    project_id: uuid.UUID, payload: ManualExtractionCreate, user: CurrentUser,
) -> ExtractionResponse:
    e = service.create_extraction_from_manual(
        get_uow(), user,
        project_id=project_id,
        document_id=payload.document_id,
        content=payload.content,
    )
    return ExtractionResponse.model_validate(e)
