import pytest

from obione.extractions.evaluation import compare_extractions

_META = {
    "_meta": {
        "projeto_nome": "p",
        "documento_fonte": "d.docx",
        "data_extracao": "2026-05-21T00:00:00Z",
        "origem": "llm",
    }
}
_META_GAB = {
    "_meta": {
        "projeto_nome": "p",
        "documento_fonte": "d.docx",
        "data_extracao": "2026-05-21T00:00:00Z",
        "origem": "gabarito_manual",
    }
}


def _verdict(report, attr: str) -> str:
    return next(v.verdict for v in report.per_attribute if v.name == attr)


@pytest.mark.unit
def test_perfect_match_string_estruturado():
    llm = {**_META, "nome_projeto": "Projeto X", "porte": "pequeno"}
    gab = {**_META_GAB, "nome_projeto": "Projeto X", "porte": "pequeno"}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_projeto") == "tp"
    assert _verdict(r, "porte") == "tp"


@pytest.mark.unit
def test_string_normalization_ignores_case_and_whitespace():
    llm = {**_META, "nome_projeto": "  PROJETO   X  "}
    gab = {**_META_GAB, "nome_projeto": "projeto x"}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_projeto") == "tp"


@pytest.mark.unit
def test_llm_fabricated_is_fp():
    llm = {**_META, "nome_projeto": "inventei"}
    gab = {**_META_GAB, "nome_projeto": None}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_projeto") == "fp"
    assert r.estruturado_metrics.fp >= 1


@pytest.mark.unit
def test_llm_missed_is_fn():
    llm = {**_META, "nome_projeto": None}
    gab = {**_META_GAB, "nome_projeto": "tinha valor"}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_projeto") == "fn"


@pytest.mark.unit
def test_llm_wrong_value_is_fn_not_fp():
    """Per the protocol: a wrong-on-something-that-existed = miss, not fabrication."""
    llm = {**_META, "nome_projeto": "errado"}
    gab = {**_META_GAB, "nome_projeto": "certo"}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_projeto") == "fn"


@pytest.mark.unit
def test_both_null_is_tn():
    llm = {**_META, "nome_projeto": None}
    gab = {**_META_GAB, "nome_projeto": None}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_projeto") == "tn"


@pytest.mark.unit
def test_array_set_equality_ignores_order_and_case():
    llm = {**_META, "nome_stakeholders": ["BRUNO", "Cynthia"]}
    gab = {**_META_GAB, "nome_stakeholders": ["cynthia", "bruno"]}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_stakeholders") == "tp"


@pytest.mark.unit
def test_array_partial_overlap_is_fn():
    llm = {**_META, "nome_stakeholders": ["Bruno"]}
    gab = {**_META_GAB, "nome_stakeholders": ["Bruno", "Cynthia"]}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "nome_stakeholders") == "fn"


@pytest.mark.unit
def test_number_exact_equality():
    llm = {**_META, "custo_estimado": 800.0}
    gab = {**_META_GAB, "custo_estimado": 800.0}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "custo_estimado") == "tp"


@pytest.mark.unit
def test_number_mismatch_is_fn():
    llm = {**_META, "custo_estimado": 800.0}
    gab = {**_META_GAB, "custo_estimado": 1000.0}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "custo_estimado") == "fn"


@pytest.mark.unit
def test_texto_livre_marked_needs_human_review():
    llm = {**_META, "objetivos": "qualquer coisa"}
    gab = {**_META_GAB, "objetivos": "outra coisa"}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "objetivos") == "needs_human_review"
    # And it doesn't pollute the structured metrics:
    assert r.estruturado_metrics.tp == 0
    assert r.estruturado_metrics.fp == 0
    assert r.estruturado_metrics.fn == 0


@pytest.mark.unit
def test_imagens_fotos_marked_out_of_scope():
    llm = {**_META, "imagens_fotos": None}
    gab = {**_META_GAB, "imagens_fotos": None}
    r = compare_extractions(llm, gab)
    assert _verdict(r, "imagens_fotos") == "out_of_scope"
    assert r.out_of_scope_count == 1


@pytest.mark.unit
def test_aggregate_metrics_precision_recall_f1():
    """Build a known confusion matrix and check the formulas hold."""
    # 3 TP, 1 FP, 2 FN
    llm = {
        **_META,
        "nome_projeto": "x",
        "local_execucao": "y",
        "tipo": "z",  # 3 TP
        "porte": "pequeno",  # 1 FP
        "data_inicio": None,
        "data_fim_planejada": None,  # 2 FN
    }
    gab = {
        **_META_GAB,
        "nome_projeto": "x",
        "local_execucao": "y",
        "tipo": "z",  # TP base
        "porte": None,  # was null, llm filled = FP
        "data_inicio": "2026-01-01",
        "data_fim_planejada": "2026-04-01",  # llm null = FN
    }
    r = compare_extractions(llm, gab)
    m = r.estruturado_metrics
    assert m.tp == 3
    assert m.fp == 1
    assert m.fn == 2
    # Precision = 3 / (3+1) = 0.75
    assert m.precision == 0.75
    # Recall = 3 / (3+2) = 0.6
    assert m.recall == 0.6
    # F1 = 2 * 0.75 * 0.6 / (0.75+0.6) = 0.6667
    assert m.f1 == pytest.approx(0.6667, abs=0.001)


@pytest.mark.unit
def test_groupmetrics_zero_division_safe():
    """No tp/fp/fn at all (everything texto-livre or out-of-scope) → all zero."""
    r = compare_extractions({**_META}, {**_META_GAB})
    m = r.estruturado_metrics
    # All structured attrs are tn (both null)
    assert m.tp == 0
    assert m.fp == 0
    assert m.fn == 0
    assert m.precision == 0.0
    assert m.recall == 0.0
    assert m.f1 == 0.0
