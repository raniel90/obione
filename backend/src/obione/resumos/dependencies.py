"""Pick the configured resume generator. Mock-only today; a real-LLM
adapter will land alongside the Sprint 4 narrative generation work."""

from obione.resumos.generator.mock import MockResumoGenerator
from obione.resumos.generator.port import AbstractResumoGenerator


def get_resumo_generator() -> AbstractResumoGenerator:
    return MockResumoGenerator()
