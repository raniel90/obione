"""HTTP routes for the comments bounded context (US10)."""

import uuid

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.comments import service
from obione.comments.schemas import CommentCreate, CommentResponse, CommentUpdate

# Project-scoped router for collection ops (list/create).
project_router = APIRouter(prefix="/projects/{project_id}/comments", tags=["comments"])


@project_router.get("", response_model=list[CommentResponse])
def list_comments(project_id: uuid.UUID, user: CurrentUser) -> list[CommentResponse]:
    return [
        CommentResponse.model_validate(c)
        for c in service.list_comments_for_project(get_uow(), user, project_id)
    ]


@project_router.post("", response_model=CommentResponse, status_code=201)
def create_comment(
    project_id: uuid.UUID, payload: CommentCreate, user: CurrentUser
) -> CommentResponse:
    comment = service.create_comment(get_uow(), user, project_id, payload)
    return CommentResponse.model_validate(comment)


# Resource-level router for item ops (update/delete).
comment_router = APIRouter(prefix="/comments", tags=["comments"])


@comment_router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: uuid.UUID, payload: CommentUpdate, user: CurrentUser
) -> CommentResponse:
    comment = service.update_comment(get_uow(), user, comment_id, payload)
    return CommentResponse.model_validate(comment)


@comment_router.delete("/{comment_id}", status_code=204)
def delete_comment(comment_id: uuid.UUID, user: CurrentUser) -> None:
    service.delete_comment(get_uow(), user, comment_id)
