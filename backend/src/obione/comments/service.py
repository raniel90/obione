"""Comment use cases (US10).

Visibility: a user can see/post comments on a project iff they can see the
project (consultant of the project, client assigned to it, or admin).
Mutation: author can edit/delete their own comments; the consultant of the
project can delete any comment as moderation. Clients edit only their own.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from obione.auth.models import User
from obione.comments.exceptions import (
    CannotReplyToReplyError,
    CommentNotFoundError,
    NotCommentAuthorError,
)
from obione.comments.models import Comment
from obione.comments.schemas import CommentCreate, CommentUpdate
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def list_comments_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Comment]:
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.comments.list_by_project(project_id)


def create_comment(
    uow: AbstractUnitOfWork,
    user: User,
    project_id: uuid.UUID,
    data: CommentCreate,
) -> Comment:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        if data.parent_id is not None:
            parent = uow.comments.get(data.parent_id)
            if parent is None or parent.project_id != project.id:
                raise CommentNotFoundError(
                    f"Parent comment not found in this project: {data.parent_id}"
                )
            if parent.parent_id is not None:
                raise CannotReplyToReplyError(
                    "Replies cannot themselves be replied to (1-level threading)."
                )
        comment = Comment(
            project_id=project.id,
            author_id=user.id,
            parent_id=data.parent_id,
            body=data.body,
        )
        uow.comments.add(comment)
        uow.commit()
        return comment


def update_comment(
    uow: AbstractUnitOfWork,
    user: User,
    comment_id: uuid.UUID,
    data: CommentUpdate,
) -> Comment:
    with uow:
        comment = uow.comments.get(comment_id)
        if comment is None:
            raise CommentNotFoundError(f"Comment not found: {comment_id}")
        # Visibility check via project (raises if user can't see it).
        get_project_for_user(uow, user, comment.project_id)
        if comment.author_id != user.id:
            raise NotCommentAuthorError("Only the author can edit a comment.")
        comment.body = data.body
        comment.updated_at = datetime.now(tz=UTC)
        uow.commit()
        return comment


def delete_comment(uow: AbstractUnitOfWork, user: User, comment_id: uuid.UUID) -> None:
    with uow:
        comment = uow.comments.get(comment_id)
        if comment is None:
            raise CommentNotFoundError(f"Comment not found: {comment_id}")
        project = get_project_for_user(uow, user, comment.project_id)
        is_author = comment.author_id == user.id
        is_moderator = user.role == "admin" or (
            user.role == "consultant" and project.consultant_id == user.id
        )
        if not (is_author or is_moderator):
            raise NotCommentAuthorError(
                "Only the author or the project consultant can delete a comment."
            )
        uow.comments.delete(comment)
        uow.commit()
