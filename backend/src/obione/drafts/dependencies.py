"""Pick the configured Draft generator.

`LLM_PROVIDER=mock` (CI default) → MockDraftGenerator (heuristic rules).
Anything else → InstructorDraftGenerator hitting the OpenAI-compatible
endpoint (Ollama, OpenAI).
"""

from obione.drafts.generator.instructor import InstructorDraftGenerator
from obione.drafts.generator.mock import MockDraftGenerator
from obione.drafts.generator.port import AbstractDraftGenerator
from obione.settings import settings


def get_draft_generator() -> AbstractDraftGenerator:
    if settings.LLM_PROVIDER == "mock":
        return MockDraftGenerator()
    return InstructorDraftGenerator(settings.LLM_PROVIDER)
