import json
from pathlib import Path

import pytest

from obione.extractions.llm.schema import MPOMetadata, MPOAttributes


def _make_meta(**overrides) -> dict:
    base = {
        "projeto_nome": "x",
        "documento_fonte": "x.docx",
        "data_extracao": "2026-05-20T00:00:00Z",
        "origem": "llm",
    }
    base.update(overrides)
    return base


@pytest.mark.unit
def test_schema_all_attributes_default_to_none():
    p = MPOAttributes.model_validate({"_meta": _make_meta()})
    # Spot-check one field per category (8 categories total)
    assert p.nome_projeto is None  # conteudo_geral
    assert p.porte is None  # conteudo_geral / enum
    assert p.nome_stakeholders is None  # stakeholders
    assert p.tarefas_projeto is None  # escopo
    assert p.data_inicio is None  # cronograma
    assert p.custo_estimado is None  # custos
    assert p.riscos_identificados is None  # riscos
    assert p.custo_implementacao_mudanca is None  # mudancas
    assert p.pontos_fortes is None  # licoes_aprendidas


@pytest.mark.unit
def test_meta_required():
    with pytest.raises(Exception):
        MPOAttributes.model_validate({})


@pytest.mark.unit
def test_meta_origem_enforced():
    with pytest.raises(Exception):
        MPOAttributes.model_validate(
            {"_meta": _make_meta(origem="invalid")}
        )


@pytest.mark.unit
def test_porte_enum_enforced():
    with pytest.raises(Exception):
        MPOAttributes.model_validate(
            {"_meta": _make_meta(), "porte": "gigante"}
        )


@pytest.mark.unit
def test_status_cronograma_enum_enforced():
    with pytest.raises(Exception):
        MPOAttributes.model_validate(
            {"_meta": _make_meta(), "status_cronograma": "em_andamento"}
        )


@pytest.mark.unit
def test_schema_roundtrips_example_file():
    """Round-trips atividades/schema_extracao_exemplo.json end-to-end."""
    data = json.loads(Path("/app/atividades/schema_extracao_exemplo.json").read_text())
    p = MPOAttributes.model_validate(data)
    assert p.meta.projeto_nome == "valenca-odontologia"
    assert p.meta.origem == "gabarito_manual"
    assert p.nome_projeto == "Valença Odontologia — Plano de Marketing 2024"
    assert p.porte == "pequeno"
    assert p.nome_stakeholders == [
        "Dra. Maria Valença",
        "Equipe de marketing — consultoria",
    ]
    assert p.data_inicio == "2024-03-01"
    assert p.custo_estimado == 18000.00
    assert p.imagens_fotos is None


@pytest.mark.unit
def test_dump_uses_underscore_alias():
    """When dumping for the wire, the _meta key must be preserved."""
    p = MPOAttributes.model_validate({"_meta": _make_meta()})
    dumped = p.model_dump(by_alias=True)
    assert "_meta" in dumped
    assert "meta" not in dumped


@pytest.mark.unit
def test_meta_model_basic():
    m = MPOMetadata(
        projeto_nome="p", documento_fonte="d.docx",
        data_extracao="2026-05-20T00:00:00Z", origem="llm",
    )
    assert m.modelo_llm is None
    assert m.hash_documento is None
