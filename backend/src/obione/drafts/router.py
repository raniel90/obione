"""HTTP routes for Drafts (US13 — Próximos Passos / Pontos de Atenção)."""

import uuid

from fastapi import APIRouter, Depends

from obione.auth.dependencies import CurrentUser, get_uow
from obione.drafts import service
from obione.drafts.dependencies import get_draft_generator
from obione.drafts.generator.port import AbstractDraftGenerator
from obione.drafts.schemas import DraftResponse, DraftUpdate

project_router = APIRouter(prefix="/projects/{project_id}/drafts", tags=["drafts"])


@project_router.get("", response_model=list[DraftResponse])
def list_drafts(project_id: uuid.UUID, user: CurrentUser) -> list[DraftResponse]:
    items = service.list_drafts_for_user(get_uow(), user, project_id)
    return [DraftResponse.model_validate(d) for d in items]


@project_router.post("/generate", response_model=list[DraftResponse], status_code=201)
def generate_drafts(
    project_id: uuid.UUID,
    user: CurrentUser,
    generator: AbstractDraftGenerator = Depends(get_draft_generator),
) -> list[DraftResponse]:
    items = service.generate_drafts(get_uow(), generator, user, project_id)
    return [DraftResponse.model_validate(d) for d in items]


draft_router = APIRouter(prefix="/drafts", tags=["drafts"])


@draft_router.get("/{draft_id}", response_model=DraftResponse)
def get_draft(draft_id: uuid.UUID, user: CurrentUser) -> DraftResponse:
    return DraftResponse.model_validate(service.get_draft_for_user(get_uow(), user, draft_id))


@draft_router.patch("/{draft_id}", response_model=DraftResponse)
def update_draft(draft_id: uuid.UUID, payload: DraftUpdate, user: CurrentUser) -> DraftResponse:
    return DraftResponse.model_validate(service.update_draft(get_uow(), user, draft_id, payload))


@draft_router.delete("/{draft_id}", status_code=204)
def delete_draft(draft_id: uuid.UUID, user: CurrentUser) -> None:
    service.delete_draft(get_uow(), user, draft_id)


@draft_router.post("/{draft_id}/publish", response_model=DraftResponse)
def publish_draft(draft_id: uuid.UUID, user: CurrentUser) -> DraftResponse:
    return DraftResponse.model_validate(service.publish_draft(get_uow(), user, draft_id))
