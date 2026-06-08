import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SynthesisStatus = Literal["draft", "published"]


class SynthesisUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    body: str | None = Field(default=None, min_length=1, max_length=8000)


class SynthesisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    domain: str
    title: str | None
    body: str
    status: SynthesisStatus
    source_project_ids: list[str]
    llm_model: str | None
    generated_by: uuid.UUID | None
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
