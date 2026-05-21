"""Likert use cases (US16 consultoria + US17 clientes).

Role guard: consultancy feedback is filled by consultor/admin; client
feedback is filled by client (the academic protocol — Bruno coordinates
client outreach so the form is always submitted as the assigned client
for the project). Admin can submit either flavor.
"""

from __future__ import annotations

import uuid

from obione.auth.models import User
from obione.likert.exceptions import WrongLikertRoleError
from obione.likert.models import LikertResponse
from obione.likert.schemas import (
    CLIENT_DIMENSIONS,
    CONSULTORIA_DIMENSIONS,
    ClientLikertCreate,
    ConsultoriaLikertCreate,
    DimensionSummary,
    LikertSummary,
)
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def submit_consultoria_feedback(
    uow: AbstractUnitOfWork, user: User, data: ConsultoriaLikertCreate
) -> list[LikertResponse]:
    if user.role not in ("consultant", "admin"):
        raise WrongLikertRoleError(
            "Only consultants and admins can submit consultancy Likert feedback."
        )
    with uow:
        created: list[LikertResponse] = []
        for dim in CONSULTORIA_DIMENSIONS:
            r = LikertResponse(
                kind="consultoria",
                dimension=dim,
                score=getattr(data, dim),
                respondent_id=user.id,
                project_id=None,
                comments=data.comments,
            )
            uow.likert.add(r)
            created.append(r)
        uow.commit()
        return created


def submit_client_feedback(
    uow: AbstractUnitOfWork, user: User, data: ClientLikertCreate
) -> list[LikertResponse]:
    if user.role not in ("client", "admin"):
        raise WrongLikertRoleError("Only clients and admins can submit client Likert feedback.")
    # Project visibility check piggy-backs on existing access control.
    project = get_project_for_user(uow, user, data.project_id)
    with uow:
        created: list[LikertResponse] = []
        for dim in CLIENT_DIMENSIONS:
            r = LikertResponse(
                kind="client",
                dimension=dim,
                score=getattr(data, dim),
                respondent_id=user.id,
                project_id=project.id,
                comments=data.comments,
            )
            uow.likert.add(r)
            created.append(r)
        uow.commit()
        return created


def list_responses(uow: AbstractUnitOfWork, user: User, *, kind: str) -> list[LikertResponse]:
    """List individual rows. Restricted to consultor/admin — the raw
    granular data is for the researcher / consultancy team, not clients.
    """
    if user.role not in ("consultant", "admin"):
        raise WrongLikertRoleError(
            "Listing Likert responses is restricted to consultants and admins."
        )
    with uow:
        return uow.likert.list_by_kind(kind)


def _dimensions_for(kind: str) -> tuple[str, ...]:
    return CONSULTORIA_DIMENSIONS if kind == "consultoria" else CLIENT_DIMENSIONS


def summarize_responses(uow: AbstractUnitOfWork, user: User, *, kind: str) -> LikertSummary:
    """Aggregate per-dimension stats — what the relato/dashboard reports."""
    if user.role not in ("consultant", "admin"):
        raise WrongLikertRoleError("Likert summaries are restricted to consultants and admins.")
    with uow:
        rows = uow.likert.list_by_kind(kind)
    by_dim: dict[str, list[int]] = {dim: [] for dim in _dimensions_for(kind)}
    respondents: set[uuid.UUID] = set()
    for r in rows:
        if r.dimension in by_dim:
            by_dim[r.dimension].append(r.score)
        if r.respondent_id is not None:
            respondents.add(r.respondent_id)
    return LikertSummary(
        kind=kind,  # type: ignore[arg-type]
        respondent_count=len(respondents),
        by_dimension=[
            DimensionSummary(
                dimension=dim,
                count=len(scores),
                mean=round(sum(scores) / len(scores), 2) if scores else 0.0,
                min=min(scores) if scores else 0,
                max=max(scores) if scores else 0,
            )
            for dim, scores in by_dim.items()
        ],
    )
