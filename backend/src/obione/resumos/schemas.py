import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ResumoStatus = Literal["draft", "published"]


class ResumoUpdate(BaseModel):
    body: str = Field(..., min_length=1, max_length=10000)


class ResumoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    source_extraction_id: uuid.UUID | None
    body: str
    status: ResumoStatus
    llm_model: str | None
    generated_by: uuid.UUID | None
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
