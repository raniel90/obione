"""Portfolio-specific exceptions."""

from obione.shared.exceptions import NotFoundError


class ThemeNotInPortfolioError(NotFoundError):
    code = "theme_not_in_portfolio"
