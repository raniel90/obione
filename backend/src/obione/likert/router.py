"""HTTP routes for the Likert feedback (US16 + US17)."""

from typing import Literal

from fastapi import APIRouter, Query

from obione.auth.dependencies import CurrentUser, get_uow
from obione.likert import service
from obione.likert.schemas import (
    ClientLikertCreate,
    ConsultoriaLikertCreate,
    LikertResponseEntry,
    LikertSummary,
)

router = APIRouter(prefix="/likert", tags=["likert"])


@router.post("/consultoria", response_model=list[LikertResponseEntry], status_code=201)
def submit_consultoria(
    payload: ConsultoriaLikertCreate, user: CurrentUser
) -> list[LikertResponseEntry]:
    rows = service.submit_consultoria_feedback(get_uow(), user, payload)
    return [LikertResponseEntry.model_validate(r) for r in rows]


@router.post("/client", response_model=list[LikertResponseEntry], status_code=201)
def submit_client(payload: ClientLikertCreate, user: CurrentUser) -> list[LikertResponseEntry]:
    rows = service.submit_client_feedback(get_uow(), user, payload)
    return [LikertResponseEntry.model_validate(r) for r in rows]


@router.get("/responses", response_model=list[LikertResponseEntry])
def list_responses(
    user: CurrentUser,
    kind: Literal["consultoria", "client"] = Query(...),
) -> list[LikertResponseEntry]:
    rows = service.list_responses(get_uow(), user, kind=kind)
    return [LikertResponseEntry.model_validate(r) for r in rows]


@router.get("/summary", response_model=LikertSummary)
def get_summary(
    user: CurrentUser,
    kind: Literal["consultoria", "client"] = Query(...),
) -> LikertSummary:
    return service.summarize_responses(get_uow(), user, kind=kind)
