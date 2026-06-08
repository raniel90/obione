"""FastAPI dependency for the theme classifier (mock vs Instructor)."""

from obione.settings import settings
from obione.themes.generator.instructor import InstructorThemeClassifier
from obione.themes.generator.mock import MockThemeClassifier
from obione.themes.generator.port import AbstractThemeClassifier


def get_theme_classifier() -> AbstractThemeClassifier:
    if settings.LLM_PROVIDER == "mock":
        return MockThemeClassifier()
    return InstructorThemeClassifier(settings.LLM_PROVIDER)
