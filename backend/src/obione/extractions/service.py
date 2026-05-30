"""Extraction use cases."""

import hashlib
import uuid

from obione.auth.models import User
from obione.documents.storage.port import AbstractBlobStorage
from obione.extractions.coverage import CoverageReport, compute_coverage
from obione.extractions.evaluation import EvaluationReport, compare_extractions
from obione.extractions.exceptions import (
    EvaluationNotAvailableError,
    ExtractionNotFoundError,
    SchemaValidationError,
)
from obione.extractions.llm.loader import extract_text_from_docx
from obione.extractions.llm.port import AbstractExtractor
from obione.extractions.models import Extraction
from obione.extractions.validation import validate_manual_extraction
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def list_extractions_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Extraction]:
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.extractions.list_by_project(project_id)


def extract_for_project(
    uow: AbstractUnitOfWork,
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
) -> Extraction:
    """Run the LLM pipeline on the project's `description` field and persist.

    The project's `description` (substituting the previous .docx upload) is
    the sole source of truth. The hash of the description is stored on the
    extraction so the UI can detect drift after the consultant edits the
    description.

    Only consultants/admins can trigger an extraction. Clients are read-only.
    """
    project = get_project_for_user(uow, user, project_id)
    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot trigger extractions.")
    text = project.description
    description_hash = _sha256(text)
    result = extractor.extract(text)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=None,
            source="llm",
            llm_model=result.model_id,
            source_description_hash=description_hash,
            content=result.content,
            created_by=None,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction


def create_extraction_from_pipeline(
    uow: AbstractUnitOfWork,
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    text: str,
) -> Extraction:
    """Legacy helper used by the from-document path until documents/ is removed.

    Accepts pre-extracted text (the LLM port no longer parses .docx) and
    stores the extraction with optional `document_id` for traceability.
    """
    project = get_project_for_user(uow, user, project_id)
    description_hash = _sha256(text)
    result = extractor.extract(text)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="llm",
            llm_model=result.model_id,
            source_description_hash=description_hash,
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

    This path is deprecated and goes away with the `documents/` context;
    kept here as a transitional shim that decodes the .docx bytes into text
    before invoking the LLM port (which now takes text).

    Only consultants/admins can trigger an extraction. Clients are read-only.
    """
    project = get_project_for_user(uow, user, project_id)
    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot trigger extractions.")
    with uow:
        document = uow.documents.get(document_id)
        if document is None or document.project_id != project.id:
            raise ExtractionNotFoundError(f"Document not found in this project: {document_id}")
        content_bytes = storage.read(document.relative_path)
        text = extract_text_from_docx(content_bytes)
        result = extractor.extract(text)
        extraction = Extraction(
            project_id=project.id,
            document_id=document.id,
            source="llm",
            llm_model=result.model_id,
            source_description_hash=_sha256(text),
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


def _is_gabarito_extraction(extraction) -> bool:
    """True if `_meta.origem == 'gabarito_manual'`.

    The DB `source` column is intentionally NOT consulted: the manual endpoint
    accepts both gabarito anotations and other operator-typed extractions, so
    `source='manual'` doesn't disambiguate. `_meta.origem` is the authoritative
    flag defined in the academic schema.
    """
    origem = (extraction.content or {}).get("_meta", {}).get("origem")
    return origem == "gabarito_manual"


def get_project_evaluation(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> EvaluationReport:
    """Compare the project's latest llm extraction vs latest gabarito (US15).

    Raises EvaluationNotAvailableError if either side is missing.
    """
    get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project_id)
        # list_by_project orders by created_at desc, so first match wins.
        llm = next(
            (e for e in extractions if not _is_gabarito_extraction(e)),
            None,
        )
        gabarito = next(
            (e for e in extractions if _is_gabarito_extraction(e)),
            None,
        )
        if llm is None or gabarito is None:
            missing = []
            if llm is None:
                missing.append("llm")
            if gabarito is None:
                missing.append("gabarito_manual")
            raise EvaluationNotAvailableError(
                f"Project lacks extractions to evaluate (missing: {', '.join(missing)})."
            )
        return compare_extractions(llm.content, gabarito.content)


def create_extraction_from_manual(
    uow: AbstractUnitOfWork,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    content: dict,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    errors = validate_manual_extraction(content)
    if errors:
        raise SchemaValidationError(
            f"Manual extraction does not match schema_extracao.json ({len(errors)} errors).",
            errors=errors,
        )
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
