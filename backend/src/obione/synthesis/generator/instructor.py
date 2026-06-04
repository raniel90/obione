"""LLM-backed synthesis generator — the "Conectora".

Same OpenAI-compatible pattern as the drafts adapter. The system prompt
enforces the LGPD mitigation: anonymise (never name clients/projects), only
aggregate patterns, never invent. JSON mode via
`response_format={"type": "json_object"}`.
"""

from __future__ import annotations

import json

from openai import OpenAI

from obione.settings import settings
from obione.synthesis.generator.port import AbstractSynthesisGenerator, GeneratedSynthesis

_SYSTEM_PROMPT = (
    "Você é a 'Conectora' de um observatório de projetos: a partir das lições "
    "aprendidas e riscos de VÁRIOS projetos de uma mesma temática, você produz "
    "uma SÍNTESE para o consultor revisar e publicar. Regras invioláveis: "
    "(1) ANONIMIZE — NUNCA cite nomes de cliente, projeto, pessoa ou empresa; "
    "refira-se apenas a 'os projetos da temática' e a padrões agregados. "
    "(2) Não invente fatos — derive tudo dos digests fornecidos; se forem "
    "pobres, escreva menos. (3) Escreva em PT-BR, em três blocos: 'Padrões "
    "recorrentes', 'Riscos comuns' e 'Boas práticas'."
)

_OUTPUT_INSTRUCTIONS = (
    "Retorne um objeto JSON: {\"title\": \"<curto>\", \"body\": \"<markdown com os "
    "três blocos>\"}. Não inclua texto fora do JSON."
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


def _build_user_prompt(theme_digests: list[dict], *, domain: str) -> str:
    return (
        f"Temática: {domain}\n"
        f"Número de projetos: {len(theme_digests)}\n\n"
        "Digests anônimos (lições aprendidas + riscos por projeto):\n"
        f"```json\n{json.dumps(theme_digests, ensure_ascii=False, indent=2)}\n```\n\n"
        + _OUTPUT_INSTRUCTIONS
    )


class InstructorSynthesisGenerator(AbstractSynthesisGenerator):
    def __init__(self, provider: str):
        self._provider = provider
        self._client, self._model_name = _client_for(provider)

    def synthesize(self, theme_digests: list[dict], *, domain: str) -> GeneratedSynthesis:
        completion = self._client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(theme_digests, domain=domain)},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw_json = completion.choices[0].message.content or "{}"
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            payload = {}
        body = payload.get("body")
        if not body or not isinstance(body, str):
            body = (
                "O modelo não conseguiu produzir uma síntese a partir dos digests. "
                "Revise as lições aprendidas dos projetos da temática manualmente."
            )
        title = payload.get("title")
        if title is not None and not isinstance(title, str):
            title = None
        return GeneratedSynthesis(title=title, body=body.strip(), model_id=self._provider)
