"""Pydantic DTOs + canonical dimension lists for Likert feedback."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# US16 — consultancy team feedback (N ~ 4, the whole TAES group)
CONSULTORIA_DIMENSIONS: tuple[str, ...] = (
    "utilidade_drafts",
    "reducao_friccao",
    "qualidade_resumo",
    "manutenibilidade_mediador",
)

# US17 — client feedback (N ~ 5-10, 1-2 stakeholders per project)
CLIENT_DIMENSIONS: tuple[str, ...] = (
    "clareza_resumo",
    "utilidade_espaco",
    "qualidade_dialogo",
    "sentido_inclusao",
)


ConsultoriaDimension = Literal[
    "utilidade_drafts",
    "reducao_friccao",
    "qualidade_resumo",
    "manutenibilidade_mediador",
]
ClientDimension = Literal[
    "clareza_resumo",
    "utilidade_espaco",
    "qualidade_dialogo",
    "sentido_inclusao",
]


class ConsultoriaLikertCreate(BaseModel):
    """US16 — one submission carries scores for all 4 consultancy dimensions."""

    utilidade_drafts: int = Field(..., ge=1, le=5)
    reducao_friccao: int = Field(..., ge=1, le=5)
    qualidade_resumo: int = Field(..., ge=1, le=5)
    manutenibilidade_mediador: int = Field(..., ge=1, le=5)
    comments: str | None = Field(default=None, max_length=4000)


class ClientLikertCreate(BaseModel):
    """US17 — client feedback for ONE project, all 4 client dimensions."""

    project_id: uuid.UUID
    clareza_resumo: int = Field(..., ge=1, le=5)
    utilidade_espaco: int = Field(..., ge=1, le=5)
    qualidade_dialogo: int = Field(..., ge=1, le=5)
    sentido_inclusao: int = Field(..., ge=1, le=5)
    comments: str | None = Field(default=None, max_length=4000)


class LikertResponseEntry(BaseModel):
    """One persisted row — the granular unit when listing/aggregating."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: Literal["consultoria", "client"]
    dimension: str
    score: int
    respondent_id: uuid.UUID | None
    project_id: uuid.UUID | None
    comments: str | None
    created_at: datetime


class DimensionSummary(BaseModel):
    dimension: str
    count: int
    mean: float
    min: int
    max: int


class LikertSummary(BaseModel):
    """Aggregate per-dimension stats. The frontend renders this on dashboards."""

    kind: Literal["consultoria", "client"]
    respondent_count: int = Field(
        description="Distinct respondents — N reported in the academic relato."
    )
    by_dimension: list[DimensionSummary]
