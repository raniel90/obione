import pytest

from obione.extractions.llm.factory import build_extractor
from obione.extractions.llm.mock import MockExtractor


@pytest.mark.unit
def test_factory_returns_mock_for_mock_provider():
    ex = build_extractor(provider="mock", project_name="p", document_name="d")
    assert isinstance(ex, MockExtractor)


@pytest.mark.unit
def test_factory_returns_instructor_for_real_provider(monkeypatch):
    """Don't actually init Ollama — patch from_provider so the test is offline."""
    import instructor as _i

    class _FakeClient:
        pass

    monkeypatch.setattr(_i, "from_provider", lambda *a, **kw: _FakeClient())

    from obione.extractions.llm.instructor_adapter import InstructorExtractor

    ex = build_extractor(
        provider="ollama/llama3.1:8b", project_name="p", document_name="d"
    )
    assert isinstance(ex, InstructorExtractor)


@pytest.mark.unit
def test_factory_passes_names_to_instructor(monkeypatch):
    import instructor as _i

    class _FakeClient:
        pass

    monkeypatch.setattr(_i, "from_provider", lambda *a, **kw: _FakeClient())

    ex = build_extractor(
        provider="anthropic/claude-sonnet-4-6",
        project_name="Valença Odontologia",
        document_name="Plano de Marketing.docx",
    )
    assert ex._project_name == "Valença Odontologia"
    assert ex._document_name == "Plano de Marketing.docx"
    assert ex._provider == "anthropic/claude-sonnet-4-6"
