"""Theme-specific exceptions."""

from obione.shared.exceptions import NotFoundError


class SuggestionNotFoundError(NotFoundError):
    code = "theme_suggestion_not_found"
