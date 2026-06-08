"""Typed exception hierarchy. Mapped to HTTP responses by FastAPI handler."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ObioneException(Exception):
    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BadRequestError(ObioneException):
    status_code = 400
    code = "bad_request"


class UnauthorizedError(ObioneException):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(ObioneException):
    status_code = 403
    code = "forbidden"


class NotFoundError(ObioneException):
    status_code = 404
    code = "not_found"


class ConflictError(ObioneException):
    status_code = 409
    code = "conflict"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ObioneException)
    async def _obione_handler(request: Request, exc: ObioneException):
        body: dict = {"code": exc.code, "message": exc.message}
        # Subclasses can attach extra context (e.g. SchemaValidationError.errors).
        details = getattr(exc, "errors", None)
        if details:
            body["details"] = details
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": body},
        )
