"""Pydantic DTOs for theme suggestions."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ThemeSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    suggested_domain: str
    confidence: float
    model_id: str
    reasoning: str | None
    accepted: bool
    accepted_by: uuid.UUID | None
    accepted_at: datetime | None
    created_at: datetime
