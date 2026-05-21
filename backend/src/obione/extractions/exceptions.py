from obione.shared.exceptions import BadRequestError, NotFoundError


class ExtractionNotFoundError(NotFoundError):
    code = "extraction_not_found"


class InvalidExtractionSourceError(BadRequestError):
    code = "invalid_extraction_source"


class SchemaValidationError(BadRequestError):
    """Raised when a manual extraction body doesn't match schema_extracao.json."""

    code = "schema_validation_error"

    def __init__(self, message: str, errors: list[str] | None = None):
        super().__init__(message)
        self.errors = errors or []
