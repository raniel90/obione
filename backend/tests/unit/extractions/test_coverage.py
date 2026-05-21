import pytest

from obione.extractions.coverage import (
    AttributeSpec,
    attribute_specs,
    compute_coverage,
)


@pytest.mark.unit
def test_schema_loads_44_attributes_with_one_out_of_scope():
    specs = attribute_specs()
    assert len(specs) == 44
    out_of_scope = [s for s in specs if s.out_of_scope]
    assert len(out_of_scope) == 1
    assert out_of_scope[0].name == "imagens_fotos"


@pytest.mark.unit
def test_each_attribute_has_a_category():
    for s in attribute_specs():
        assert s.category and s.category != "uncategorized", s.name


@pytest.mark.unit
def test_eight_mpo_categories_present():
    cats = {s.category for s in attribute_specs()}
    assert cats == {
        "conteudo_geral",
        "stakeholders",
        "escopo",
        "cronograma",
        "custos",
        "riscos",
        "mudancas",
        "licoes_aprendidas",
    }


@pytest.mark.unit
def test_empty_extraction_has_zero_coverage():
    report = compute_coverage({"_meta": {}})
    assert report.filled == 0
    assert report.total_in_scope == 43
    assert report.out_of_scope_count == 1
    assert report.percentage == 0.0


@pytest.mark.unit
def test_full_extraction_has_100_coverage():
    # Build a content dict with every in-scope attribute non-null.
    content = {"_meta": {}}
    for s in attribute_specs():
        if s.out_of_scope:
            continue
        content[s.name] = "x"  # any truthy value
    report = compute_coverage(content)
    assert report.filled == 43
    assert report.percentage == 100.0


@pytest.mark.unit
def test_partial_coverage_with_per_category_breakdown():
    content = {
        "_meta": {},
        "nome_projeto": "P",          # conteudo_geral
        "descricao": "desc",          # conteudo_geral
        "nome_stakeholders": ["A"],   # stakeholders
        "data_inicio": "2026-01-01",  # cronograma
    }
    report = compute_coverage(content, extraction_id="abc-123")
    assert report.extraction_id == "abc-123"
    assert report.filled == 4
    assert report.total_in_scope == 43
    assert report.percentage == round(4 / 43 * 100, 2)

    by_cat = {c.category: c for c in report.by_category}
    assert by_cat["conteudo_geral"].filled == 2
    assert by_cat["stakeholders"].filled == 1
    assert by_cat["cronograma"].filled == 1
    assert by_cat["custos"].filled == 0


@pytest.mark.unit
def test_imagens_fotos_excluded_from_scope_even_when_present():
    # Even if the LLM erroneously fills imagens_fotos, it shouldn't count.
    content = {"_meta": {}, "imagens_fotos": "should be ignored"}
    report = compute_coverage(content)
    assert report.filled == 0
    assert report.total_in_scope == 43


@pytest.mark.unit
def test_empty_string_and_empty_collections_dont_count():
    content = {
        "_meta": {},
        "nome_projeto": "",                # empty string
        "nome_stakeholders": [],           # empty list
        "descricao": None,                  # explicit null
        "tipo": "consultoria",              # filled
    }
    report = compute_coverage(content)
    assert report.filled == 1


@pytest.mark.unit
def test_valenca_example_file_round_trips():
    """Sanity check: the in-repo example should produce a non-trivial coverage."""
    import json
    from pathlib import Path

    p = Path("/app/atividades/schema_extracao_exemplo.json")
    if not p.exists():
        pytest.skip("example file mount not available")
    content = json.loads(p.read_text())
    report = compute_coverage(content)
    # Valença example fills 12 attributes by manual inspection.
    assert report.filled >= 8
    assert 0 < report.percentage < 100


@pytest.mark.unit
def test_attribute_spec_is_a_dataclass():
    spec = AttributeSpec(
        name="x", category="y", out_of_scope=False,
        extraction_type="estruturado", value_type="string",
    )
    assert spec.name == "x"
    assert spec.category == "y"
    assert spec.out_of_scope is False
    assert spec.extraction_type == "estruturado"
    assert spec.value_type == "string"
