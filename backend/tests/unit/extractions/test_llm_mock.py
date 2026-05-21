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
def test_mock_extractor_loads_example_when_available():
    """When the example JSON can be found (container mount or repo-relative
    ancestor walk), the mock returns the full Valença example rather than
    the fallback stub. Skipped when neither is available — exercised in CI
    and in the dev container.
    """
    from obione.extractions.llm.mock import _example_candidates

    if not any(c.exists() for c in _example_candidates()):
        pytest.skip("schema_extracao_exemplo.json not found in any ancestor")

    extractor = MockExtractor()
    result = extractor.extract(b"x")
    assert result.content["_meta"]["projeto_nome"] == "valenca-odontologia"
    assert result.content["porte"] == "pequeno"


@pytest.mark.unit
def test_mock_extractor_falls_back_when_example_missing(tmp_path):
    extractor = MockExtractor(example_path=str(tmp_path / "missing.json"))
    result = extractor.extract(b"x")
    assert "_meta" in result.content
    assert result.content["_meta"]["projeto_nome"] == "mock-project"
