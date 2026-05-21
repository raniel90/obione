"""Pydantic DTOs for the activity feed (US11)."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

FeedKind = Literal["new_comment", "new_extraction", "new_document"]


class FeedEvent(BaseModel):
    kind: FeedKind = Field(description="Event type.")
    project_id: uuid.UUID
    project_name: str
    actor_id: uuid.UUID | None = Field(
        default=None,
        description="User that produced the event; null for LLM-generated extractions.",
    )
    target_id: uuid.UUID = Field(
        description="ID of the entity the event describes (comment/extraction/document)."
    )
    created_at: datetime
    summary: str = Field(description="Short human-readable line (~140 chars) safe for clients.")


class FeedResponse(BaseModel):
    events: list[FeedEvent]
