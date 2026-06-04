import pytest

from obione.synthesis.generator.mock import MockSynthesisGenerator

_DIGESTS = [
    {"pontos_fortes": "boa comunicação", "riscos_identificados": "prazo"},
    {"pontos_fracos": "pouca documentação", "providencias_tomadas": "criou checklist"},
]


@pytest.mark.unit
def test_mock_is_deterministic():
    gen = MockSynthesisGenerator()
    a = gen.synthesize(_DIGESTS, domain="legal")
    b = gen.synthesize(_DIGESTS, domain="legal")
    assert a.body == b.body
    assert a.model_id == "mock-synthesis-v1"


@pytest.mark.unit
def test_mock_groups_into_three_blocks():
    out = MockSynthesisGenerator().synthesize(_DIGESTS, domain="legal")
    assert "Padrões recorrentes" in out.body
    assert "Riscos comuns" in out.body
    assert "Boas práticas" in out.body


@pytest.mark.unit
def test_mock_flags_small_sample_for_single_project():
    out = MockSynthesisGenerator().synthesize([{"pontos_fortes": "x"}], domain="health")
    assert "Amostra pequena" in out.body


@pytest.mark.unit
def test_mock_anonymous_indices_only():
    # Even with rich content, only anonymous "Projeto N" labels appear.
    out = MockSynthesisGenerator().synthesize(_DIGESTS, domain="legal")
    assert "Projeto 1" in out.body
    assert "Projeto 2" in out.body
