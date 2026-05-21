import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CategoryCoverageResponse(BaseModel):
    category: str
    filled: int
    total_in_scope: int
    percentage: float


class CoverageResponse(BaseModel):
    """MPO coverage report for a project (US09)."""

    extraction_id: uuid.UUID | None = Field(
        default=None,
        description="ID of the extraction this report is computed against; null when the project has no extraction yet.",
    )
    filled: int
    total_in_scope: int
    out_of_scope_count: int = Field(
        description="Attributes excluded from coverage (e.g. imagens_fotos)."
    )
    percentage: float = Field(description="Aggregate coverage in percent (0-100).")
    by_category: list[CategoryCoverageResponse]


class ExtractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    document_id: uuid.UUID | None
    source: Literal["llm", "manual"]
    llm_model: str | None
    content: dict
    created_at: datetime


class ManualExtractionCreate(BaseModel):
    document_id: uuid.UUID | None = None
    content: dict
