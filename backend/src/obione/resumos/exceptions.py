from obione.shared.exceptions import BadRequestError, ConflictError, NotFoundError


class ResumoNotFoundError(NotFoundError):
    code = "resumo_not_found"


class NoExtractionForResumoError(BadRequestError):
    """Raised when generation is triggered on a project with no extraction yet."""

    code = "no_extraction_for_resumo"


class ResumoAlreadyPublishedError(ConflictError):
    """Raised when a publish/edit is attempted on a resumo that's already published.

    Publishing is irreversible per the academic protocol — the published copy
    is what the client saw at a point in time, and shouldn't be silently
    rewritten. If the consultor needs to change something, they generate a
    new resumo and publish it on top.
    """

    code = "resumo_already_published"
