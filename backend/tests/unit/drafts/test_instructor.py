"""Unit tests for InstructorDraftGenerator with the OpenAI client stubbed."""

from __future__ import annotations

import json
from unittest.mock import MagicMock

import pytest

from obione.drafts.generator.instructor import (
    InstructorDraftGenerator,
    _build_user_prompt,
    _parse_items,
)


def _fake_completion(text: str):
    msg = MagicMock()
    msg.content = text
    choice = MagicMock()
    choice.message = msg
    completion = MagicMock()
    completion.choices = [choice]
    return completion


@pytest.mark.unit
def test_prompt_includes_comments_block():
    out = _build_user_prompt(
        {"nome_projeto": "X"},
        project_name="X",
        recent_comments=["Quando vamos começar?", "Tudo certo aqui"],
    )
    assert "Quando vamos começar?" in out
    assert "Tudo certo aqui" in out
    assert "(nenhum)" not in out


@pytest.mark.unit
def test_prompt_marks_empty_comments_as_nenhum():
    out = _build_user_prompt({"nome_projeto": "X"}, project_name="X", recent_comments=[])
    assert "(nenhum)" in out


@pytest.mark.unit
def test_parse_items_filters_unknown_kinds_and_empty_body():
    payload = {
        "items": [
            {"kind": "next_step", "title": "OK", "body": "concrete step"},
            {"kind": "ignore_me", "body": "should be dropped"},
            {"kind": "next_step", "body": ""},  # empty body
            {"kind": "attention_point", "body": "  watch out  "},
            "not a dict",
        ]
    }
    items = _parse_items(payload)
    assert len(items) == 2
    assert items[0].kind == "next_step"
    assert items[0].body == "concrete step"
    assert items[1].kind == "attention_point"
    assert items[1].body == "watch out"  # stripped


@pytest.mark.unit
def test_generator_returns_items_from_completion_json():
    gen = InstructorDraftGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion(
        json.dumps(
            {
                "items": [
                    {
                        "kind": "next_step",
                        "title": "Kickoff",
                        "body": "Marcar reunião de início",
                    },
                    {
                        "kind": "attention_point",
                        "title": "Cronograma",
                        "body": "Atraso reportado",
                    },
                ]
            }
        )
    )
    out = gen.generate({"nome_projeto": "X"}, project_name="X", recent_comments=[])
    assert out.model_id == "ollama/llama3.1:8b"
    assert len(out.items) == 2
    assert {i.kind for i in out.items} == {"next_step", "attention_point"}


@pytest.mark.unit
def test_generator_falls_back_when_llm_returns_empty():
    gen = InstructorDraftGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion('{"items": []}')
    out = gen.generate({"nome_projeto": "X"}, project_name="X", recent_comments=[])
    assert len(out.items) == 1
    assert out.items[0].kind == "next_step"
    assert "Reveja a extração" in out.items[0].body


@pytest.mark.unit
def test_generator_handles_malformed_json():
    gen = InstructorDraftGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion("not even close to JSON")
    out = gen.generate({"nome_projeto": "X"}, project_name="X", recent_comments=[])
    # Falls through to the fallback item rather than crashing.
    assert len(out.items) == 1
    assert out.items[0].kind == "next_step"


@pytest.mark.unit
def test_generator_uses_json_object_format():
    gen = InstructorDraftGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion(
        '{"items": [{"kind": "next_step", "body": "x"}]}'
    )
    gen.generate({"nome_projeto": "X"}, project_name="X", recent_comments=[])
    call_args = gen._client.chat.completions.create.call_args
    assert call_args.kwargs["response_format"] == {"type": "json_object"}
    assert call_args.kwargs["temperature"] == 0.3
