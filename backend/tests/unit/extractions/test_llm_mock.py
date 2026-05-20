import pytest

from obione.extractions.llm.mock import MockExtractor


@pytest.mark.unit
def test_mock_extractor_returns_valid_dict():
    extractor = MockExtractor()
    result = extractor.extract(b"any content")
    assert isinstance(result.content, dict)
    assert "_meta" in result.content
    assert result.model_id == "mock"
