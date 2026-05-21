"""Resumo do Cliente use cases (US12).

Lifecycle: generate (draft) → edit (consultor only, while draft) → publish
(consultor only, locks the body forever). Client visibility kicks in at
publish — drafts never leak.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from obione.auth.models import User
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.resumos.exceptions import (
    NoExtractionForResumoError,
    ResumoAlreadyPublishedError,
    ResumoNotFoundError,
)
from obione.resumos.generator.port import AbstractResumoGenerator
from obione.resumos.models import Resumo
from obione.resumos.schemas import ResumoUpdate
from obione.unit_of_work import AbstractUnitOfWork


def _require_consultor_or_admin(user: User) -> None:
    if user.role not in ("consultant", "admin"):
        raise ClientCannotMutateError(
            "Resumos are authored by consultants; clients can only read published ones."
        )


def generate_resumo(
    uow: AbstractUnitOfWork,
    generator: AbstractResumoGenerator,
    user: User,
    project_id: uuid.UUID,
) -> Resumo:
    """Create a draft resumo from the project's latest extraction."""
    _require_consultor_or_admin(user)
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project.id)
        if not extractions:
            raise NoExtractionForResumoError("Project has no extraction to summarize yet.")
        # list_by_project orders by created_at desc.
        source = extractions[0]
        generated = generator.generate(source.content, project_name=project.name)
        resumo = Resumo(
            project_id=project.id,
            source_extraction_id=source.id,
            body=generated.body,
            status="draft",
            llm_model=generated.model_id,
            generated_by=None,
        )
        uow.resumos.add(resumo)
        uow.commit()
        return resumo


def list_resumos_for_user(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Resumo]:
    """Clients only see published resumos; consultor/admin see drafts too."""
    project = get_project_for_user(uow, user, project_id)
    with uow:
        return uow.resumos.list_by_project(project.id, only_published=user.role == "client")


def get_resumo_for_user(uow: AbstractUnitOfWork, user: User, resumo_id: uuid.UUID) -> Resumo:
    with uow:
        resumo = uow.resumos.get(resumo_id)
        if resumo is None:
            raise ResumoNotFoundError(f"Resumo not found: {resumo_id}")
        # Visibility check via the project.
        get_project_for_user(uow, user, resumo.project_id)
        # Clients cannot see drafts.
        if user.role == "client" and resumo.status != "published":
            raise ResumoNotFoundError(f"Resumo not found: {resumo_id}")
        return resumo


def update_resumo(
    uow: AbstractUnitOfWork,
    user: User,
    resumo_id: uuid.UUID,
    data: ResumoUpdate,
) -> Resumo:
    _require_consultor_or_admin(user)
    with uow:
        resumo = uow.resumos.get(resumo_id)
        if resumo is None:
            raise ResumoNotFoundError(f"Resumo not found: {resumo_id}")
        get_project_for_user(uow, user, resumo.project_id)
        if resumo.status == "published":
            raise ResumoAlreadyPublishedError(
                "Published resumos are immutable. Generate a new one to replace it."
            )
        resumo.body = data.body
        resumo.updated_at = datetime.now(tz=UTC)
        uow.commit()
        return resumo


def publish_resumo(uow: AbstractUnitOfWork, user: User, resumo_id: uuid.UUID) -> Resumo:
    _require_consultor_or_admin(user)
    with uow:
        resumo = uow.resumos.get(resumo_id)
        if resumo is None:
            raise ResumoNotFoundError(f"Resumo not found: {resumo_id}")
        get_project_for_user(uow, user, resumo.project_id)
        if resumo.status == "published":
            raise ResumoAlreadyPublishedError(
                "Resumo is already published — there is nothing to do."
            )
        now = datetime.now(tz=UTC)
        resumo.status = "published"
        resumo.reviewed_by = user.id
        resumo.reviewed_at = now
        resumo.updated_at = now
        uow.commit()
        return resumo
