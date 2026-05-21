import pytest

from obione.extractions.validation import validate_manual_extraction

_VALID_META = {
    "projeto_nome": "p",
    "documento_fonte": "d.docx",
    "data_extracao": "2026-05-21T00:00:00Z",
    "origem": "gabarito_manual",
}


@pytest.mark.unit
def test_empty_meta_only_passes():
    """A bare _meta with all required keys is enough — every attribute is nullable."""
    errors = validate_manual_extraction({"_meta": _VALID_META})
    assert errors == []


@pytest.mark.unit
def test_missing_meta_fails():
    errors = validate_manual_extraction({})
    assert any("_meta" in e for e in errors)


@pytest.mark.unit
def test_meta_missing_required_field():
    incomplete = dict(_VALID_META)
    incomplete.pop("origem")
    errors = validate_manual_extraction({"_meta": incomplete})
    assert any("origem" in e for e in errors)


@pytest.mark.unit
def test_meta_origem_must_be_valid_enum():
    bad = dict(_VALID_META)
    bad["origem"] = "alguma_origem"
    errors = validate_manual_extraction({"_meta": bad})
    assert any("origem" in e for e in errors)


@pytest.mark.unit
def test_porte_must_be_pequeno_medio_or_grande():
    errors = validate_manual_extraction(
        {"_meta": _VALID_META, "porte": "gigante"}
    )
    assert any("porte" in e for e in errors)


@pytest.mark.unit
def test_status_cronograma_enum_enforced():
    errors = validate_manual_extraction(
        {"_meta": _VALID_META, "status_cronograma": "em_andamento"}
    )
    assert any("status_cronograma" in e for e in errors)


@pytest.mark.unit
def test_custo_must_be_number():
    errors = validate_manual_extraction(
        {"_meta": _VALID_META, "custo_estimado": "R$ 800,00"}
    )
    assert any("custo_estimado" in e for e in errors)


@pytest.mark.unit
def test_unknown_top_level_attribute_rejected():
    """The schema has additionalProperties=false; bogus keys fail."""
    errors = validate_manual_extraction(
        {"_meta": _VALID_META, "atributo_inventado": "x"}
    )
    assert any("atributo_inventado" in e or "additional" in e.lower() for e in errors)


@pytest.mark.unit
def test_valenca_example_validates():
    import json
    from pathlib import Path

    p = Path("/app/atividades/schema_extracao_exemplo.json")
    if not p.exists():
        pytest.skip("example file mount not available")
    content = json.loads(p.read_text())
    errors = validate_manual_extraction(content)
    assert errors == []


@pytest.mark.unit
def test_returns_human_readable_paths():
    bad = dict(_VALID_META)
    bad["origem"] = "x"
    errors = validate_manual_extraction({"_meta": bad, "porte": "xpto"})
    # Each error string starts with a slash-joined JSON path.
    assert all(":" in e for e in errors)
