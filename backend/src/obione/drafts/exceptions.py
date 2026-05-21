from obione.shared.exceptions import BadRequestError, ConflictError, NotFoundError


class DraftNotFoundError(NotFoundError):
    code = "draft_not_found"


class NoExtractionForDraftError(BadRequestError):
    """Generation requires at least one extraction to base the draft items on."""

    code = "no_extraction_for_draft"


class DraftAlreadyPublishedError(ConflictError):
    """Published drafts are immutable per the academic protocol."""

    code = "draft_already_published"
