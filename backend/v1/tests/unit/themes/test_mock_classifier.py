import pytest

from obione.themes.generator.mock import MockThemeClassifier


@pytest.mark.unit
def test_mock_classifies_legal_by_keywords():
    c = MockThemeClassifier()
    r = c.classify(
        "Atendimento jurídico contínuo para um escritório de advocacia em "
        "Pernambuco, com gestão de processos e contratos. " * 3
    )
    assert r.domain == "legal"
    assert 0 < r.confidence <= 1
    assert r.model_id == "mock"
    assert r.reasoning is not None


@pytest.mark.unit
def test_mock_classifies_health_by_keywords():
    c = MockThemeClassifier()
    r = c.classify("Consultoria de marketing para uma clínica odontológica de saúde. " * 3)
    assert r.domain == "health"


@pytest.mark.unit
def test_mock_falls_back_to_other_when_no_keyword_hits():
    c = MockThemeClassifier()
    r = c.classify("Lorem ipsum dolor sit amet, consectetur adipiscing elit. " * 5)
    assert r.domain == "other"
    assert r.confidence == 0.0
