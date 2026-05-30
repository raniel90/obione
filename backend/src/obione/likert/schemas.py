"""Pydantic DTOs + canonical dimension lists for Likert feedback.

Aligns with the 29/05/2026 requirements rewrite: o eixo "Resumo do Cliente"
(RF12) some, e entram dimensões do cockpit cross-cliente (RF20) e da
governança CBAC (RF23). O cliente avalia o que viu na ficha de atributos
liberados, não mais o resumo narrativo.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# RF16 — consultancy team feedback (N ~ 4, the whole TAES group).
# valor_cockpit reflete RF20; usabilidade_cbac reflete RF23 (29/05 pivot).
CONSULTORIA_DIMENSIONS: tuple[str, ...] = (
    "utilidade_drafts",
    "reducao_friccao",
    "manutenibilidade_mediador",
    "valor_cockpit",
    "usabilidade_cbac",
)

# RF17 — client feedback (N ~ 5-10, 1-2 stakeholders per project).
# Dimensões reescritas em 29/05: o cliente avalia a ficha de atributos
# liberados (RF08 + RF23), não o resumo (RF12 removido do MVP).
CLIENT_DIMENSIONS: tuple[str, ...] = (
    "clareza_atributos_liberados",
    "sentido_controle",
    "utilidade_liberado",
    "qualidade_dialogo",
    "sentido_inclusao",
)


ConsultoriaDimension = Literal[
    "utilidade_drafts",
    "reducao_friccao",
    "manutenibilidade_mediador",
    "valor_cockpit",
    "usabilidade_cbac",
]
ClientDimension = Literal[
    "clareza_atributos_liberados",
    "sentido_controle",
    "utilidade_liberado",
    "qualidade_dialogo",
    "sentido_inclusao",
]


class ConsultoriaLikertCreate(BaseModel):
    """RF16 — one submission carries scores for all 5 consultancy dimensions."""

    utilidade_drafts: int = Field(..., ge=1, le=5)
    reducao_friccao: int = Field(..., ge=1, le=5)
    manutenibilidade_mediador: int = Field(..., ge=1, le=5)
    valor_cockpit: int = Field(..., ge=1, le=5)
    usabilidade_cbac: int = Field(..., ge=1, le=5)
    comments: str | None = Field(default=None, max_length=4000)


class ClientLikertCreate(BaseModel):
    """RF17 — client feedback for ONE project, all 5 client dimensions."""

    project_id: uuid.UUID
    clareza_atributos_liberados: int = Field(..., ge=1, le=5)
    sentido_controle: int = Field(..., ge=1, le=5)
    utilidade_liberado: int = Field(..., ge=1, le=5)
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
