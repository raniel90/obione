"""Extraction use cases."""
import uuid

from obione.auth.models import User
from obione.documents.storage.port import AbstractBlobStorage
from obione.extractions.coverage import CoverageReport, compute_coverage
from obione.extractions.exceptions import ExtractionNotFoundError
from obione.extractions.llm.port import AbstractExtractor
from obione.extractions.models import Extraction
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def list_extractions_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Extraction]:
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.extractions.list_by_project(project_id)


def create_extraction_from_pipeline(
    uow: AbstractUnitOfWork,
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    document_bytes: bytes,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    result = extractor.extract(document_bytes)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="llm",
            llm_model=result.model_id,
            content=result.content,
            created_by=None,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction


def create_extraction_from_document(
    uow: AbstractUnitOfWork,
    storage: AbstractBlobStorage,
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID,
) -> Extraction:
    """Run the LLM pipeline on an already-uploaded document and persist.

    Only consultants/admins can trigger an extraction. Clients are read-only.
    """
    project = get_project_for_user(uow, user, project_id)
    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot trigger extractions.")
    with uow:
        document = uow.documents.get(document_id)
        if document is None or document.project_id != project.id:
            raise ExtractionNotFoundError(
                f"Document not found in this project: {document_id}"
            )
        # storage.read is safe outside the transaction — the blob is
        # content-addressable so no race with concurrent writes.
        content_bytes = storage.read(document.relative_path)
        result = extractor.extract(content_bytes)
        extraction = Extraction(
            project_id=project.id,
            document_id=document.id,
            source="llm",
            llm_model=result.model_id,
            content=result.content,
            created_by=None,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction


def get_project_coverage(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> CoverageReport:
    """Coverage report based on the project's latest extraction.

    Uses any source (llm or manual) — whichever was created last. When the
    project has no extraction yet, returns a zero-coverage report so the UI
    can render the empty-state without a 404.
    """
    get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project_id)
        if not extractions:
            return compute_coverage({})
        # list_by_project orders by created_at desc, so [0] is the latest.
        latest = extractions[0]
        return compute_coverage(latest.content, extraction_id=str(latest.id))


def create_extraction_from_manual(
    uow: AbstractUnitOfWork,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    content: dict,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="manual",
            llm_model=None,
            content=content,
            created_by=user.id,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction
