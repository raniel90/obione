from obione.shared.exceptions import BadRequestError, ConflictError, NotFoundError


class SynthesisNotFoundError(NotFoundError):
    code = "synthesis_not_found"


class SynthesisNoProjectsError(BadRequestError):
    """Generation requires at least one visible project (with extraction) in the theme."""

    code = "synthesis_no_projects"


class SynthesisAlreadyPublishedError(ConflictError):
    """Published syntheses are immutable per the academic protocol."""

    code = "synthesis_already_published"
