"""Pick the configured draft generator. Mock-only today."""

from obione.drafts.generator.mock import MockDraftGenerator
from obione.drafts.generator.port import AbstractDraftGenerator


def get_draft_generator() -> AbstractDraftGenerator:
    return MockDraftGenerator()
