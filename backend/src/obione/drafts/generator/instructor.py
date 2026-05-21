"""LLM-backed Draft generator.

Same OpenAI-compatible pattern as the extractor and the resumo adapter.
Asks the model for a JSON object with an `items` array. Each item has
`kind ∈ {next_step, attention_point}`, optional `title` and required
`body`. Items with unknown kinds or empty body are filtered.

JSON mode is requested via `response_format={"type": "json_object"}` —
this is the same setting the extractor uses; Ollama honours it.
"""

from __future__ import annotations

import json

from openai import OpenAI

from obione.drafts.generator.port import (
    AbstractDraftGenerator,
    GeneratedDraftItem,
    GeneratedDrafts,
)
from obione.settings import settings

_SYSTEM_PROMPT = (
    "Você é um assistente de consultoria que propõe DRAFTS de itens para "
    "o consultor revisar e publicar para o cliente. Cada item tem um "
    "`kind`: `next_step` (próximo passo concreto, acionável) ou "
    "`attention_point` (risco ou ponto que merece discussão). Os itens "
    "são curtos (1-3 frases), em PT-BR, e SEMPRE derivados da extração "
    "ou dos comentários — não invente fatos. Se a extração for pobre, "
    "retorne menos itens em vez de inventar."
)

_OUTPUT_INSTRUCTIONS = (
    "Retorne um objeto JSON com a estrutura:\n"
    "{\n"
    '  "items": [\n'
    '    {"kind": "next_step", "title": "<curto, opcional>", "body": "<texto>"},\n'
    '    {"kind": "attention_point", "title": "<curto, opcional>", "body": "<texto>"}\n'
    "  ]\n"
    "}\n\n"
    "Use `kind` exatamente como `next_step` ou `attention_point` — não "
    "use outros valores. Mínimo 1 item, máximo 8 itens. Não inclua texto "
    "fora do JSON."
)


def _build_user_prompt(
    extraction_content: dict,
    *,
    project_name: str,
    recent_comments: list[str],
) -> str:
    content_for_prompt = {k: v for k, v in (extraction_content or {}).items() if k != "_meta"}
    comments_block = "\n".join(f"- {c}" for c in recent_comments) if recent_comments else "(nenhum)"
    return (
        f"Projeto: {project_name}\n\n"
        "Extração técnica do MPO:\n"
        f"```json\n{json.dumps(content_for_prompt, ensure_ascii=False, indent=2)}\n```\n\n"
        f"Comentários recentes do projeto:\n{comments_block}\n\n" + _OUTPUT_INSTRUCTIONS
    )


def _client_for(provider: str) -> tuple[OpenAI, str]:
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
        raise ValueError(f"Unsupported provider for direct OpenAI client: {provider}.")
    return OpenAI(base_url=base_url, api_key=api_key or "unused"), model_name


def _parse_items(payload: dict) -> list[GeneratedDraftItem]:
    raw_items = payload.get("items") or []
    items: list[GeneratedDraftItem] = []
    for raw in raw_items:
        if not isinstance(raw, dict):
            continue
        kind = raw.get("kind")
        body = raw.get("body")
        if kind not in ("next_step", "attention_point"):
            continue
        if not body or not isinstance(body, str):
            continue
        title = raw.get("title")
        if title is not None and not isinstance(title, str):
            title = None
        items.append(GeneratedDraftItem(kind=kind, title=title, body=body.strip()))
    return items


class InstructorDraftGenerator(AbstractDraftGenerator):
    def __init__(self, provider: str):
        self._provider = provider
        self._client, self._model_name = _client_for(provider)

    @property
    def model_id(self) -> str:
        return self._provider

    def generate(
        self,
        extraction_content: dict,
        *,
        project_name: str,
        recent_comments: list[str],
    ) -> GeneratedDrafts:
        completion = self._client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": _build_user_prompt(
                        extraction_content,
                        project_name=project_name,
                        recent_comments=recent_comments,
                    ),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw_json = completion.choices[0].message.content or "{}"
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            payload = {}
        items = _parse_items(payload)
        if not items:
            # The LLM produced no usable items — single safe fallback.
            items = [
                GeneratedDraftItem(
                    kind="next_step",
                    title="Revisar extração com o cliente",
                    body=(
                        f"O modelo não conseguiu propor itens para "
                        f"{project_name}. Reveja a extração com o cliente "
                        "e proponha próximos passos manualmente."
                    ),
                )
            ]
        return GeneratedDrafts(items=items, model_id=self._provider)
