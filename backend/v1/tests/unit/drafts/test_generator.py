import pytest

from obione.drafts.generator.mock import MockDraftGenerator


@pytest.mark.unit
def test_generator_yields_next_step_when_escopo_only_planned():
    gen = MockDraftGenerator()
    out = gen.generate(
        {"escopo_planejado": "ok", "escopo_executado": None},
        project_name="P",
        recent_comments=[],
    )
    kinds = {i.kind for i in out.items}
    assert "next_step" in kinds


@pytest.mark.unit
def test_generator_flags_atrasado_as_attention():
    gen = MockDraftGenerator()
    out = gen.generate(
        {"status_cronograma": "atrasado"},
        project_name="P",
        recent_comments=[],
    )
    titles = [i.title for i in out.items if i.kind == "attention_point"]
    assert any("atrasado" in (t or "").lower() for t in titles)


@pytest.mark.unit
def test_generator_flags_cost_overrun():
    gen = MockDraftGenerator()
    out = gen.generate(
        {"custo_estimado": 1000.0, "custo_realizado": 1500.0},
        project_name="P",
        recent_comments=[],
    )
    attention = [i for i in out.items if i.kind == "attention_point"]
    assert any("custo" in (i.title or "").lower() for i in attention)


@pytest.mark.unit
def test_generator_does_not_flag_when_realized_within_budget():
    gen = MockDraftGenerator()
    out = gen.generate(
        {"custo_estimado": 1000.0, "custo_realizado": 800.0},
        project_name="P",
        recent_comments=[],
    )
    titles = [i.title or "" for i in out.items]
    assert not any("acima do estimado" in t for t in titles)


@pytest.mark.unit
def test_generator_picks_up_open_questions_from_comments():
    gen = MockDraftGenerator()
    out = gen.generate(
        {},
        project_name="P",
        recent_comments=["Tudo certo aqui.", "Quando vamos ter o draft final?"],
    )
    open_qs = [i for i in out.items if (i.body or "").endswith("?")]
    assert any("draft final" in i.body for i in open_qs)


@pytest.mark.unit
def test_generator_falls_back_when_no_signal():
    gen = MockDraftGenerator()
    out = gen.generate({}, project_name="P", recent_comments=[])
    assert len(out.items) == 1
    assert out.items[0].kind == "next_step"
    assert "Revisar extração" in (out.items[0].title or "")


@pytest.mark.unit
def test_generator_handles_non_numeric_cost_gracefully():
    """Mocks of real LLM outputs may put strings in cost fields. Don't crash."""
    gen = MockDraftGenerator()
    out = gen.generate(
        {"custo_estimado": "R$ 1.000", "custo_realizado": "R$ 1.500"},
        project_name="P",
        recent_comments=[],
    )
    # No raise; cost-overrun rule simply doesn't fire when parsing fails.
    assert isinstance(out.items, list)
