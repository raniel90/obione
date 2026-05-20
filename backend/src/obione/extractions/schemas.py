import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


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
