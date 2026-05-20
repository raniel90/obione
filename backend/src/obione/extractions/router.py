"""HTTP routes for extractions."""
import uuid

from fastapi import APIRouter, Depends

from obione.auth.dependencies import CurrentUser, get_uow
from obione.documents.dependencies import get_blob_storage
from obione.documents.storage.port import AbstractBlobStorage
from obione.extractions import service
from obione.extractions.dependencies import get_extractor_for
from obione.extractions.exceptions import ExtractionNotFoundError
from obione.extractions.schemas import ExtractionResponse, ManualExtractionCreate
from obione.unit_of_work import SqlAlchemyUnitOfWork

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
    extractor = get_extractor_for(project_name, document_name)
    e = service.create_extraction_from_document(
        get_uow(), storage, extractor, user,
        project_id=project_id, document_id=document_id,
    )
    return ExtractionResponse.model_validate(e)
