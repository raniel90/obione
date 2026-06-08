"""Draft use cases (US13).

Generate creates *multiple* draft items in one call (mirrors how a consultor
reviews a project: one batch of items at a time). Each item then goes
through the same draft → published lifecycle as Resumo.

Drafts can be discarded (DELETE) while in draft. Published items are
immutable.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from obione.auth.models import User
from obione.drafts.exceptions import (
    DraftAlreadyPublishedError,
    DraftNotFoundError,
    NoExtractionForDraftError,
)
from obione.drafts.generator.port import AbstractDraftGenerator
from obione.drafts.models import Draft
from obione.drafts.schemas import DraftUpdate
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def _require_consultor_or_admin(user: User) -> None:
    if user.role not in ("consultant", "admin"):
        raise ClientCannotMutateError(
            "Drafts are authored by consultants; clients can only read published ones."
        )


def generate_drafts(
    uow: AbstractUnitOfWork,
    generator: AbstractDraftGenerator,
    user: User,
    project_id: uuid.UUID,
    *,
    comment_signal_limit: int = 10,
) -> list[Draft]:
    _require_consultor_or_admin(user)
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extractions = uow.extractions.list_by_project(project.id)
        if not extractions:
            raise NoExtractionForDraftError("Project has no extraction to base drafts on yet.")
        source = extractions[0]
        comments = uow.comments.list_by_project(project.id)
        recent_bodies = [c.body for c in comments[-comment_signal_limit:]]
        generated = generator.generate(
            source.content, project_name=project.name, recent_comments=recent_bodies
        )
        created: list[Draft] = []
        for item in generated.items:
            d = Draft(
                project_id=project.id,
                source_extraction_id=source.id,
                kind=item.kind,
                title=item.title,
                body=item.body,
                status="draft",
                llm_model=generated.model_id,
                generated_by=None,
            )
            uow.drafts.add(d)
            created.append(d)
        uow.commit()
        return created


def list_drafts_for_user(uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID) -> list[Draft]:
    """Clients only see published drafts; consultor/admin see drafts too."""
    project = get_project_for_user(uow, user, project_id)
    with uow:
        return uow.drafts.list_by_project(project.id, only_published=user.role == "client")


def get_draft_for_user(uow: AbstractUnitOfWork, user: User, draft_id: uuid.UUID) -> Draft:
    with uow:
        draft = uow.drafts.get(draft_id)
        if draft is None:
            raise DraftNotFoundError(f"Draft not found: {draft_id}")
        get_project_for_user(uow, user, draft.project_id)
        if user.role == "client" and draft.status != "published":
            raise DraftNotFoundError(f"Draft not found: {draft_id}")
        return draft


def update_draft(
    uow: AbstractUnitOfWork,
    user: User,
    draft_id: uuid.UUID,
    data: DraftUpdate,
) -> Draft:
    _require_consultor_or_admin(user)
    with uow:
        draft = uow.drafts.get(draft_id)
        if draft is None:
            raise DraftNotFoundError(f"Draft not found: {draft_id}")
        get_project_for_user(uow, user, draft.project_id)
        if draft.status == "published":
            raise DraftAlreadyPublishedError("Published drafts are immutable.")
        # Partial update — only fields set on the DTO are applied.
        if data.title is not None:
            draft.title = data.title
        if data.body is not None:
            draft.body = data.body
        draft.updated_at = datetime.now(tz=UTC)
        uow.commit()
        return draft


def delete_draft(uow: AbstractUnitOfWork, user: User, draft_id: uuid.UUID) -> None:
    """Discard a draft. Forbidden once it's published."""
    _require_consultor_or_admin(user)
    with uow:
        draft = uow.drafts.get(draft_id)
        if draft is None:
            raise DraftNotFoundError(f"Draft not found: {draft_id}")
        get_project_for_user(uow, user, draft.project_id)
        if draft.status == "published":
            raise DraftAlreadyPublishedError("Published drafts cannot be deleted.")
        uow.drafts.delete(draft)
        uow.commit()


def publish_draft(uow: AbstractUnitOfWork, user: User, draft_id: uuid.UUID) -> Draft:
    _require_consultor_or_admin(user)
    with uow:
        draft = uow.drafts.get(draft_id)
        if draft is None:
            raise DraftNotFoundError(f"Draft not found: {draft_id}")
        get_project_for_user(uow, user, draft.project_id)
        if draft.status == "published":
            raise DraftAlreadyPublishedError("Draft is already published — there is nothing to do.")
        now = datetime.now(tz=UTC)
        draft.status = "published"
        draft.reviewed_by = user.id
        draft.reviewed_at = now
        draft.updated_at = now
        uow.commit()
        return draft
