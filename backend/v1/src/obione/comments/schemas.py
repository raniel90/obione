import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=4000)
    parent_id: uuid.UUID | None = Field(
        default=None, description="ID of the top-level comment being replied to."
    )


class CommentUpdate(BaseModel):
    body: str = Field(..., min_length=1, max_length=4000)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    author_id: uuid.UUID | None
    parent_id: uuid.UUID | None
    body: str
    created_at: datetime
    updated_at: datetime
