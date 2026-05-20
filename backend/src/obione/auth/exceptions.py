"""Auth-specific typed exceptions."""
from obione.shared.exceptions import ConflictError, ForbiddenError, UnauthorizedError


class InvalidCredentialsError(UnauthorizedError):
    code = "invalid_credentials"


class InvalidTokenError(UnauthorizedError):
    code = "invalid_token"


class EmailAlreadyExistsError(ConflictError):
    code = "email_already_exists"


class RoleNotAllowedError(ForbiddenError):
    code = "role_not_allowed"
