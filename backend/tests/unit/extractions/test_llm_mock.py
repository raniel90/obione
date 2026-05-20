import pytest

from obione.extractions.llm.mock import MockExtractor


@pytest.mark.unit
def test_mock_extractor_returns_valid_dict():
    extractor = MockExtractor()
    result = extractor.extract(b"any content")
    assert isinstance(result.content, dict)
    assert "_meta" in result.content
    assert result.model_id == "mock"


@pytest.mark.unit
def test_mock_extractor_loads_example_from_container_mount():
    """When /app/atividades is mounted, the mock returns the full 44-attribute
    Valença example rather than the fallback stub.
    """
    extractor = MockExtractor()
    result = extractor.extract(b"x")
    # Hallmarks of the full example file:
    assert result.content["_meta"]["projeto_nome"] == "valenca-odontologia"
    assert result.content["porte"] == "pequeno"


@pytest.mark.unit
def test_mock_extractor_falls_back_when_example_missing(tmp_path):
    extractor = MockExtractor(example_path=str(tmp_path / "missing.json"))
    result = extractor.extract(b"x")
    assert "_meta" in result.content
    assert result.content["_meta"]["projeto_nome"] == "mock-project"
