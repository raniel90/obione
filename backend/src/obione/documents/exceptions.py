from obione.shared.exceptions import BadRequestError, ConflictError


class UnsupportedMimeTypeError(BadRequestError):
    code = "unsupported_mime_type"


class FileTooLargeError(BadRequestError):
    code = "file_too_large"


class DuplicateDocumentError(ConflictError):
    code = "duplicate_document"
