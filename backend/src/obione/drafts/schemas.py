import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DraftKind = Literal["next_step", "attention_point"]
DraftStatus = Literal["draft", "published"]


class DraftUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    body: str | None = Field(default=None, min_length=1, max_length=4000)


class DraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    source_extraction_id: uuid.UUID | None
    kind: DraftKind
    title: str | None
    body: str
    status: DraftStatus
    llm_model: str | None
    generated_by: uuid.UUID | None
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
