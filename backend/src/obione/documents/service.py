"""Document use cases."""
import uuid

from obione.auth.models import User
from obione.documents.exceptions import (
    DuplicateDocumentError,
    FileTooLargeError,
    UnsupportedMimeTypeError,
)
from obione.documents.models import Document
from obione.documents.storage.port import AbstractBlobStorage
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def upload_document(
    uow: AbstractUnitOfWork,
    storage: AbstractBlobStorage,
    user: User,
    *,
    project_id: uuid.UUID,
    filename: str,
    content: bytes,
    mime_type: str,
    max_size_mb: int,
) -> Document:
    """Persist a .docx for a project. Only consultants/admins can upload."""
    project = get_project_for_user(uow, user, project_id)

    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot upload documents.")

    if mime_type != DOCX_MIME and not filename.lower().endswith(".docx"):
        raise UnsupportedMimeTypeError(
            f"Only .docx is supported. Got: {filename} ({mime_type})"
        )

    if len(content) > max_size_mb * 1024 * 1024:
        raise FileTooLargeError(
            f"File exceeds {max_size_mb}MB (got {len(content) / 1024 / 1024:.1f}MB)"
        )

    with uow:
        sha, rel_path = storage.write(project.id, content)
        if uow.documents.get_by_sha(sha) is not None:
            raise DuplicateDocumentError(
                f"Document with this content already exists (sha={sha[:12]}...)"
            )
        document = Document(
            project_id=project.id,
            original_name=filename,
            relative_path=rel_path,
            sha256=sha,
            size_bytes=len(content),
            mime_type=DOCX_MIME,
            uploaded_by=user.id,
        )
        uow.documents.add(document)
        uow.commit()
        return document


def list_documents_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Document]:
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.documents.list_by_project(project_id)
