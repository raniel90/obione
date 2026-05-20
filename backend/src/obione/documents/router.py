"""HTTP routes for documents."""
import uuid

from fastapi import APIRouter, Depends, File, UploadFile

from obione.auth.dependencies import CurrentUser, get_uow
from obione.documents import service
from obione.documents.dependencies import get_blob_storage
from obione.documents.schemas import DocumentResponse
from obione.documents.storage.port import AbstractBlobStorage
from obione.settings import settings

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])


@router.get("", response_model=list[DocumentResponse])
def list_documents(project_id: uuid.UUID, user: CurrentUser) -> list[DocumentResponse]:
    docs = service.list_documents_for_project(get_uow(), user, project_id)
    return [DocumentResponse.model_validate(d) for d in docs]


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    project_id: uuid.UUID,
    user: CurrentUser,
    file: UploadFile = File(...),
    storage: AbstractBlobStorage = Depends(get_blob_storage),
) -> DocumentResponse:
    content = await file.read()
    doc = service.upload_document(
        get_uow(), storage, user,
        project_id=project_id,
        filename=file.filename or "document.docx",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
        max_size_mb=settings.MAX_UPLOAD_SIZE_MB,
    )
    return DocumentResponse.model_validate(doc)
