"""Pick the right AbstractExtractor implementation based on settings."""

from obione.extractions.llm.instructor_adapter import InstructorExtractor
from obione.extractions.llm.mock import MockExtractor
from obione.extractions.llm.port import AbstractExtractor


def build_extractor(*, provider: str, project_name: str) -> AbstractExtractor:
    """Return a configured extractor for the given provider.

    "mock" → MockExtractor (offline, returns fixture).
    anything else → InstructorExtractor with provider passed to from_provider.
    """
    if provider == "mock":
        return MockExtractor()
    return InstructorExtractor(
        provider=provider,
        project_name=project_name,
    )
