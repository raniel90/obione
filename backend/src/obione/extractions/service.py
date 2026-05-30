"""Extraction use cases."""

import hashlib
import uuid

from obione.auth.models import User
from obione.extractions.coverage import CoverageReport, compute_coverage
from obione.extractions.evaluation import EvaluationReport, compare_extractions
from obione.extractions.exceptions import (
    EvaluationNotAvailableError,
    SchemaValidationError,
)
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


def filter_extraction_for_user(
    uow: AbstractUnitOfWork, user: User, extraction: Extraction
) -> Extraction:
    """Strip attributes the CBAC of the project hides from the user.

    Consultants and admins always see the full payload. Clients receive only
    the attribute keys explicitly liberados via RF23 — hidden keys are
    removed from `content` so the client cannot even infer their existence.

    `_meta` always survives (provenance, not an attribute). Mutates and
    returns the same `Extraction` object — caller decides whether to keep
    the model alive (e.g. for `model_validate`) or stop here.
    """
    if user.role in ("consultant", "admin"):
        return extraction
    # Import locally to keep visibility a leaf dep of extractions, not a cycle.
    from obione.visibility.service import resolve_visibility

    resolved = resolve_visibility(uow, extraction.project_id)
    raw = extraction.content or {}
    meta = raw.get("_meta")
    filtered = {k: v for k, v in raw.items() if k == "_meta" or resolved.get(k, False)}
    if meta is not None and "_meta" not in filtered:
        filtered["_meta"] = meta
    extraction.content = filtered
    return extraction


def filter_extractions_for_user(
    uow: AbstractUnitOfWork, user: User, extractions: list[Extraction]
) -> list[Extraction]:
    """Apply `filter_extraction_for_user` over a list (e.g. list endpoint)."""
    return [filter_extraction_for_user(uow, user, e) for e in extractions]


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
            source="llm",
            llm_model=result.model_id,
            source_description_hash=description_hash,
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
    can render the empty-state without a 404. For clients, the denominator
    is restricted to the attributes liberated via CBAC so the percentage
    reflects what they actually see.
    """
    get_project_for_user(uow, user, project_id)
    visible_attributes: set[str] | None = None
    if user.role == "client":
        from obione.visibility.service import resolve_visibility

        resolved = resolve_visibility(uow, project_id)
        visible_attributes = {k for k, v in resolved.items() if v}
    with uow:
        extractions = uow.extractions.list_by_project(project_id)
        if not extractions:
            return compute_coverage({}, visible_attributes=visible_attributes)
        # list_by_project orders by created_at desc, so [0] is the latest.
        latest = extractions[0]
        return compute_coverage(
            latest.content,
            extraction_id=str(latest.id),
            visible_attributes=visible_attributes,
        )


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
            source="manual",
            llm_model=None,
            content=content,
            created_by=user.id,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction
