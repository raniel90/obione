from obione.shared.exceptions import BadRequestError, NotFoundError


class ExtractionNotFoundError(NotFoundError):
    code = "extraction_not_found"


class InvalidExtractionSourceError(BadRequestError):
    code = "invalid_extraction_source"
