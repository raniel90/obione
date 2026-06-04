"""HTTP routes for Synthesis — the "Conectora" (cross-project, per-temática)."""

import uuid

from fastapi import APIRouter, Depends

from obione.auth.dependencies import CurrentUser, get_uow
from obione.synthesis import service
from obione.synthesis.dependencies import get_synthesis_generator
from obione.synthesis.generator.port import AbstractSynthesisGenerator
from obione.synthesis.schemas import SynthesisResponse, SynthesisUpdate

# Staff-facing: manage syntheses of a temática (domain).
theme_router = APIRouter(prefix="/themes/{domain}/syntheses", tags=["synthesis"])


@theme_router.get("", response_model=list[SynthesisResponse])
def list_theme_syntheses(domain: str, user: CurrentUser) -> list[SynthesisResponse]:
    items = service.list_syntheses_by_domain(get_uow(), user, domain)
    return [SynthesisResponse.model_validate(s) for s in items]


@theme_router.post("/generate", response_model=SynthesisResponse, status_code=201)
def generate_synthesis(
    domain: str,
    user: CurrentUser,
    generator: AbstractSynthesisGenerator = Depends(get_synthesis_generator),
) -> SynthesisResponse:
    synthesis = service.generate_synthesis(get_uow(), generator, user, domain)
    return SynthesisResponse.model_validate(synthesis)


# Client-facing read: published syntheses of a project's temática.
project_router = APIRouter(prefix="/projects/{project_id}/syntheses", tags=["synthesis"])


@project_router.get("", response_model=list[SynthesisResponse])
def list_project_syntheses(project_id: uuid.UUID, user: CurrentUser) -> list[SynthesisResponse]:
    items = service.list_published_for_project(get_uow(), user, project_id)
    return [SynthesisResponse.model_validate(s) for s in items]


# Item operations (staff).
synthesis_router = APIRouter(prefix="/syntheses", tags=["synthesis"])


@synthesis_router.get("/{synthesis_id}", response_model=SynthesisResponse)
def get_synthesis(synthesis_id: uuid.UUID, user: CurrentUser) -> SynthesisResponse:
    return SynthesisResponse.model_validate(
        service.get_synthesis_for_user(get_uow(), user, synthesis_id)
    )


@synthesis_router.patch("/{synthesis_id}", response_model=SynthesisResponse)
def update_synthesis(
    synthesis_id: uuid.UUID, payload: SynthesisUpdate, user: CurrentUser
) -> SynthesisResponse:
    return SynthesisResponse.model_validate(
        service.update_synthesis(get_uow(), user, synthesis_id, payload)
    )


@synthesis_router.delete("/{synthesis_id}", status_code=204)
def delete_synthesis(synthesis_id: uuid.UUID, user: CurrentUser) -> None:
    service.delete_synthesis(get_uow(), user, synthesis_id)


@synthesis_router.post("/{synthesis_id}/publish", response_model=SynthesisResponse)
def publish_synthesis(synthesis_id: uuid.UUID, user: CurrentUser) -> SynthesisResponse:
    return SynthesisResponse.model_validate(
        service.publish_synthesis(get_uow(), user, synthesis_id)
    )
