"""Pick the configured Resumo generator.

`LLM_PROVIDER=mock` (CI default) → MockResumoGenerator (offline templated).
Anything else → InstructorResumoGenerator hitting the OpenAI-compatible
endpoint (Ollama, OpenAI).
"""

from obione.resumos.generator.instructor import InstructorResumoGenerator
from obione.resumos.generator.mock import MockResumoGenerator
from obione.resumos.generator.port import AbstractResumoGenerator
from obione.settings import settings


def get_resumo_generator() -> AbstractResumoGenerator:
    if settings.LLM_PROVIDER == "mock":
        return MockResumoGenerator()
    return InstructorResumoGenerator(settings.LLM_PROVIDER)
