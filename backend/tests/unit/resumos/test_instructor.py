"""Unit tests for InstructorResumoGenerator.

The tests stub the underlying OpenAI client so the suite never touches the
network — same pattern the extractor's adapter tests use.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from obione.resumos.generator.instructor import (
    InstructorResumoGenerator,
    _build_user_prompt,
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
def test_prompt_omits_meta_block_from_payload():
    """`_meta` is provenance, not content the client should see."""
    out = _build_user_prompt({"_meta": {"origem": "llm"}, "nome_projeto": "X"}, project_name="X")
    assert "nome_projeto" in out
    assert "origem" not in out
    assert "_meta" not in out


@pytest.mark.unit
def test_generator_returns_completion_body():
    gen = InstructorResumoGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion(
        "**Objetivos.** Lançar campanha\n\n**Status.** Em andamento."
    )

    out = gen.generate({"nome_projeto": "Smoke"}, project_name="Smoke")
    assert out.model_id == "ollama/llama3.1:8b"
    assert "**Objetivos.**" in out.body
    assert "Em andamento" in out.body


@pytest.mark.unit
def test_generator_falls_back_when_completion_is_blank():
    gen = InstructorResumoGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion("")

    out = gen.generate({}, project_name="X")
    assert "não produziu texto" in out.body or "regenerar" in out.body


@pytest.mark.unit
def test_generator_rejects_anthropic_provider_for_now():
    """Anthropic adapter is not implemented in this MVP slot."""
    with pytest.raises(ValueError, match="Unsupported provider"):
        InstructorResumoGenerator("anthropic/claude-sonnet-4-6")


@pytest.mark.unit
def test_generator_uses_temperature_and_messages():
    gen = InstructorResumoGenerator("ollama/llama3.1:8b")
    gen._client = MagicMock()
    gen._client.chat.completions.create.return_value = _fake_completion("body")

    gen.generate({"nome_projeto": "X"}, project_name="X")
    call_args = gen._client.chat.completions.create.call_args
    assert call_args.kwargs["model"] == "llama3.1:8b"
    assert call_args.kwargs["temperature"] == 0.3
    messages = call_args.kwargs["messages"]
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert "linguagem é cidadã" in messages[0]["content"]
