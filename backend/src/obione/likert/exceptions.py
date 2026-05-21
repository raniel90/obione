from obione.shared.exceptions import BadRequestError, ForbiddenError


class InvalidLikertKindError(BadRequestError):
    code = "invalid_likert_kind"


class WrongLikertRoleError(ForbiddenError):
    """Raised when a user's role doesn't match the Likert kind they're submitting."""

    code = "wrong_likert_role"
