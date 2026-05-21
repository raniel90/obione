import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Domain = Literal["legal", "health", "sports", "branding", "gastronomy", "other"]


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    domain: Domain
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    domain: Domain | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: str
    description: str | None
    consultant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AddClientRequest(BaseModel):
    user_id: uuid.UUID


PortfolioStatus = Literal["registered", "ingested", "extracted", "reviewed"]


class PortfolioProjectResponse(BaseModel):
    """Enriched project row for the consultant portfolio view (US07)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: str
    description: str | None
    consultant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    status: PortfolioStatus = Field(
        description=(
            "Derived from data: 'registered' (no docs), 'ingested' (has docs, "
            "no extraction), 'extracted' (has llm extraction), 'reviewed' "
            "(has a gabarito_manual extraction)."
        )
    )
    document_count: int
    extraction_count: int
    coverage_percentage: float = Field(
        description="MPO coverage of the latest extraction (0-100), 0 if none."
    )
    has_gabarito: bool = Field(
        description="True if at least one extraction has source='manual' or "
        "_meta.origem='gabarito_manual'."
    )
