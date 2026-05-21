import pytest

from obione.resumos.generator.mock import MockResumoGenerator


@pytest.mark.unit
def test_mock_generator_uses_extraction_content():
    gen = MockResumoGenerator()
    out = gen.generate(
        {
            "nome_projeto": "Projeto X",
            "tipo": "consultoria jurídica",
            "descricao": "Texto descritivo do projeto.",
            "objetivos": "blindar contratos",
            "porte": "pequeno",
        },
        project_name="fallback-name",
    )
    assert out.model_id.startswith("mock")
    assert "Projeto X" in out.body
    assert "consultoria jurídica" in out.body
    assert "Texto descritivo" in out.body
    assert "blindar contratos" in out.body


@pytest.mark.unit
def test_mock_generator_falls_back_to_project_name_when_attribute_missing():
    gen = MockResumoGenerator()
    out = gen.generate({"descricao": "y"}, project_name="Projeto Sem Nome no Schema")
    assert "Projeto Sem Nome no Schema" in out.body


@pytest.mark.unit
def test_mock_generator_handles_empty_extraction():
    gen = MockResumoGenerator()
    out = gen.generate({}, project_name="P")
    # Falls back to a placeholder line so the resumo body isn't empty.
    assert "informações suficientes" in out.body


@pytest.mark.unit
def test_mock_generator_joins_stakeholder_array():
    gen = MockResumoGenerator()
    out = gen.generate(
        {"nome_projeto": "P", "nome_stakeholders": ["Alice", "Bruno"]},
        project_name="P",
    )
    assert "Alice, Bruno" in out.body


@pytest.mark.unit
def test_mock_generator_skips_null_attributes():
    gen = MockResumoGenerator()
    out = gen.generate(
        {"nome_projeto": "P", "objetivos": None, "riscos_identificados": None},
        project_name="P",
    )
    assert "Objetivos" not in out.body
    assert "Riscos identificados" not in out.body
