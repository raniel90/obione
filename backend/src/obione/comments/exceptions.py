from obione.shared.exceptions import BadRequestError, ForbiddenError, NotFoundError


class CommentNotFoundError(NotFoundError):
    code = "comment_not_found"


class NotCommentAuthorError(ForbiddenError):
    code = "not_comment_author"


class CannotReplyToReplyError(BadRequestError):
    code = "cannot_reply_to_reply"
