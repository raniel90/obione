"""HTTP routes for the Resumo do Cliente (US12)."""

import uuid

from fastapi import APIRouter, Depends

from obione.auth.dependencies import CurrentUser, get_uow
from obione.resumos import service
from obione.resumos.dependencies import get_resumo_generator
from obione.resumos.generator.port import AbstractResumoGenerator
from obione.resumos.schemas import ResumoResponse, ResumoUpdate

# Project-scoped collection ops.
project_router = APIRouter(prefix="/projects/{project_id}/resumos", tags=["resumos"])


@project_router.get("", response_model=list[ResumoResponse])
def list_resumos(project_id: uuid.UUID, user: CurrentUser) -> list[ResumoResponse]:
    items = service.list_resumos_for_user(get_uow(), user, project_id)
    return [ResumoResponse.model_validate(r) for r in items]


@project_router.post("/generate", response_model=ResumoResponse, status_code=201)
def generate_resumo(
    project_id: uuid.UUID,
    user: CurrentUser,
    generator: AbstractResumoGenerator = Depends(get_resumo_generator),
) -> ResumoResponse:
    resumo = service.generate_resumo(get_uow(), generator, user, project_id)
    return ResumoResponse.model_validate(resumo)


# Resource-level ops.
resumo_router = APIRouter(prefix="/resumos", tags=["resumos"])


@resumo_router.get("/{resumo_id}", response_model=ResumoResponse)
def get_resumo(resumo_id: uuid.UUID, user: CurrentUser) -> ResumoResponse:
    return ResumoResponse.model_validate(service.get_resumo_for_user(get_uow(), user, resumo_id))


@resumo_router.patch("/{resumo_id}", response_model=ResumoResponse)
def update_resumo(resumo_id: uuid.UUID, payload: ResumoUpdate, user: CurrentUser) -> ResumoResponse:
    return ResumoResponse.model_validate(service.update_resumo(get_uow(), user, resumo_id, payload))


@resumo_router.post("/{resumo_id}/publish", response_model=ResumoResponse)
def publish_resumo(resumo_id: uuid.UUID, user: CurrentUser) -> ResumoResponse:
    return ResumoResponse.model_validate(service.publish_resumo(get_uow(), user, resumo_id))
