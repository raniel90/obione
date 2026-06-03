import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Domain = Literal["legal", "health", "sports", "branding", "gastronomy", "other"]


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    domain: Domain
    description: str = Field(
        ...,
        min_length=200,
        description="Conteúdo bruto do projeto (substitui o upload de .docx).",
    )


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    domain: Domain | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: str
    description: str
    consultant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AddClientRequest(BaseModel):
    user_id: uuid.UUID


PortfolioStatus = Literal["registered", "extracted", "reviewed"]


class ExtractionBrief(BaseModel):
    """Slimmer than full ExtractionResponse — the detail screen doesn't need
    the entire 44-attr content blob inline (it lives in a dedicated tab)."""

    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    source: str  # "llm" | "manual"
    llm_model: str | None
    created_at: datetime


class CommentBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    author_id: uuid.UUID | None
    parent_id: uuid.UUID | None
    body: str
    created_at: datetime


class CoverageSummary(BaseModel):
    extraction_id: uuid.UUID | None
    filled: int
    total_in_scope: int
    out_of_scope_count: int
    percentage: float


class EvaluationSummary(BaseModel):
    """Aggregate-only — full per-attribute table lives at /extractions/evaluation."""

    tp: int
    fp: int
    fn: int
    tn: int
    precision: float
    recall: float
    f1: float
    needs_human_review_count: int


class ProjectDetailResponse(BaseModel):
    """Consolidated read-only view for the project detail screen (US08).

    Keeps only the latest of each extraction kind and a configurable slice of
    recent comments. Designed to fit in one UI render without a heavy network
    payload.
    """

    project: "ProjectResponse"
    latest_llm_extraction: ExtractionBrief | None
    latest_gabarito: ExtractionBrief | None
    coverage: CoverageSummary
    evaluation: EvaluationSummary | None = Field(
        default=None,
        description="Present only when the project has both an llm extraction and a gabarito_manual.",
    )
    recent_comments: list[CommentBrief]
    counts: dict[str, int] = Field(
        description="Totals across the project: extractions, comments, documents."
    )


class PortfolioProjectResponse(BaseModel):
    """Enriched project row for the consultant portfolio view (US07)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: str
    description: str
    consultant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    status: PortfolioStatus = Field(
        description=(
            "Derived from data: 'registered' (no extraction yet), "
            "'extracted' (has llm extraction), 'reviewed' "
            "(has a gabarito_manual extraction)."
        )
    )
    extraction_count: int
    coverage_percentage: float = Field(
        description="MPO coverage of the latest extraction (0-100), 0 if none."
    )
    has_gabarito: bool = Field(
        description="True if at least one extraction has source='manual' or "
        "_meta.origem='gabarito_manual'."
    )
