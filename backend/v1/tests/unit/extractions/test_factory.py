import pytest

from obione.extractions.llm.factory import build_extractor
from obione.extractions.llm.mock import MockExtractor


@pytest.mark.unit
def test_factory_returns_mock_for_mock_provider():
    ex = build_extractor(provider="mock", project_name="p")
    assert isinstance(ex, MockExtractor)


@pytest.mark.unit
def test_factory_returns_instructor_for_ollama_provider():
    """OpenAI-compat client is initialized cheaply without network calls."""
    from obione.extractions.llm.instructor_adapter import InstructorExtractor

    ex = build_extractor(provider="ollama/llama3.1:8b", project_name="p")
    assert isinstance(ex, InstructorExtractor)


@pytest.mark.unit
def test_factory_passes_project_name_to_instructor():
    ex = build_extractor(
        provider="ollama/llama3.1:8b",
        project_name="Valença Odontologia",
    )
    assert ex._project_name == "Valença Odontologia"
    assert ex._provider == "ollama/llama3.1:8b"


@pytest.mark.unit
def test_factory_rejects_unsupported_provider():
    """Anthropic (non-OpenAI-compatible) is intentionally out of scope here."""
    with pytest.raises(ValueError, match="Unsupported provider"):
        build_extractor(
            provider="anthropic/claude-sonnet-4-6",
            project_name="p",
        )
