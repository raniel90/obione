"""LLM-backed Resumo generator.

Mirrors the pattern of `extractions/llm/instructor_adapter.py`: uses the
OpenAI Python SDK directly against an OpenAI-compatible endpoint (Ollama
when `LLM_PROVIDER` starts with `ollama/`, OpenAI when `openai/`). The
output is free-form Markdown PT-BR, so no JSON-mode wrapping is needed —
the prompt does the structural work.

This adapter is plug-and-play once Ollama is re-installed; the existing
mock generator stays the default in tests (CI autouse fixture pins
`LLM_PROVIDER=mock`).
"""

from __future__ import annotations

import json

from openai import OpenAI

from obione.resumos.generator.port import AbstractResumoGenerator, GeneratedResumo
from obione.settings import settings

_SYSTEM_PROMPT = (
    "Você é um assistente de consultoria que escreve resumos acessíveis de "
    "projetos para clientes leigos. Sua linguagem é cidadã, sem jargão "
    "técnico, mas mantém precisão sobre objetivos, escopo, status, custos "
    "e riscos. Você NUNCA inventa informações que não estejam na extração "
    "fornecida. Quando um campo está vazio, omita do resumo em vez de "
    "preencher com suposições."
)


def _build_user_prompt(extraction_content: dict, project_name: str) -> str:
    """Prompt que recebe os 44 atributos do MPO + nome do projeto e pede
    um resumo Markdown PT-BR.
    """
    # Drop _meta — it's provenance, not content the client should see.
    content_for_prompt = {k: v for k, v in (extraction_content or {}).items() if k != "_meta"}
    return (
        f"Projeto: {project_name}\n\n"
        "Extração técnica dos atributos do MPO (Modelo de Observatório de "
        "Projetos, Quadro 37). Atributos com valor null devem ser omitidos.\n\n"
        f"```json\n{json.dumps(content_for_prompt, ensure_ascii=False, indent=2)}\n```\n\n"
        "Escreva um resumo em **Markdown**, em PT-BR, com até ~250 palavras, "
        "estruturado livremente, cobrindo objetivos, escopo planejado, status "
        "atual, custos e riscos relevantes. Use negrito para identificar "
        "seções importantes (ex: **Objetivos.**, **Status.**). Não invente "
        "informações. Não inclua título do projeto no começo — só o corpo."
    )


def _client_for(provider: str) -> tuple[OpenAI, str]:
    """Return an OpenAI client + model name for the configured provider."""
    model_name = provider.split("/", 1)[1] if "/" in provider else provider
    if provider.startswith("ollama/"):
        base_url = (
            f"{settings.LLM_BASE_URL.rstrip('/')}/v1"
            if settings.LLM_BASE_URL
            else "http://localhost:11434/v1"
        )
        api_key = "ollama"
    elif provider.startswith("openai/"):
        base_url = None
        api_key = settings.LLM_API_KEY.get_secret_value() if settings.LLM_API_KEY else None
    else:
        raise ValueError(
            f"Unsupported provider for direct OpenAI client: {provider}. "
            "Add a dedicated adapter for non-OpenAI-compatible providers."
        )
    return OpenAI(base_url=base_url, api_key=api_key or "unused"), model_name


class InstructorResumoGenerator(AbstractResumoGenerator):
    """Implements AbstractResumoGenerator against an OpenAI-compatible endpoint."""

    def __init__(self, provider: str):
        self._provider = provider
        self._client, self._model_name = _client_for(provider)

    @property
    def model_id(self) -> str:
        return self._provider

    def generate(self, extraction_content: dict, project_name: str) -> GeneratedResumo:
        completion = self._client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": _build_user_prompt(extraction_content, project_name),
                },
            ],
            temperature=0.3,
        )
        body = (completion.choices[0].message.content or "").strip()
        if not body:
            body = "_(O modelo não produziu texto para esta extração. Tente regenerar.)_"
        return GeneratedResumo(body=body, model_id=self._provider)
