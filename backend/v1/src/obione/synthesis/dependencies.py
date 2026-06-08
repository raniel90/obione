"""Pick the configured Synthesis generator.

`LLM_PROVIDER=mock` (CI default) → MockSynthesisGenerator (deterministic).
Anything else → InstructorSynthesisGenerator (OpenAI-compatible).
"""

from obione.settings import settings
from obione.synthesis.generator.instructor import InstructorSynthesisGenerator
from obione.synthesis.generator.mock import MockSynthesisGenerator
from obione.synthesis.generator.port import AbstractSynthesisGenerator


def get_synthesis_generator() -> AbstractSynthesisGenerator:
    if settings.LLM_PROVIDER == "mock":
        return MockSynthesisGenerator()
    return InstructorSynthesisGenerator(settings.LLM_PROVIDER)
