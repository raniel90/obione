"""Instructor-backed theme classifier (real LLM).

Mirrors `drafts/generator/instructor.py`: uses the OpenAI-compatible chat
endpoint configured by `settings.LLM_PROVIDER`, with a small Pydantic
schema as the JSON contract.
"""

from __future__ import annotations

import json
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel, Field

from obione.settings import settings
from obione.themes.generator.port import ClassifiedTheme

_DOMAIN_LITERAL = Literal["legal", "health", "sports", "branding", "gastronomy", "other"]


class _ThemeClassification(BaseModel):
    domain: _DOMAIN_LITERAL
    confidence: float = Field(ge=0, le=1)
    reasoning: str


_SYSTEM = (
    "Você categoriza projetos de uma consultoria em um observatório "
    "(ObiOne). Dado o texto descritivo do projeto, escolha o domínio que "
    "melhor o representa, entre: legal, health, sports, branding, "
    "gastronomy, other. Devolva sua confiança em [0, 1] e um raciocínio "
    "curto (até 280 caracteres) em PT-BR. NÃO invente dados que não "
    "estejam no texto; quando em dúvida, escolha 'other' com confiança baixa."
)


class InstructorThemeClassifier:
    """Implements AbstractThemeClassifier against an OpenAI-compatible LLM."""

    def __init__(self, provider: str):
        self._provider = provider
        self._model_name = provider.split("/", 1)[1] if "/" in provider else provider
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
        self._client = OpenAI(base_url=base_url, api_key=api_key or "unused")

    def classify(self, description: str, extraction_content: dict | None = None) -> ClassifiedTheme:
        user = f"Descrição:\n{description}"
        if extraction_content:
            user += "\n\nAtributos extraídos:\n" + json.dumps(
                extraction_content, ensure_ascii=False
            )
        completion = self._client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw = completion.choices[0].message.content or "{}"
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {}
        # Validate via Pydantic; on bad output, fall back to "other".
        try:
            result = _ThemeClassification.model_validate(payload)
        except Exception:
            return ClassifiedTheme(
                domain="other",
                confidence=0.0,
                model_id=self._provider,
                reasoning="Resposta do modelo não respeitou o schema.",
            )
        return ClassifiedTheme(
            domain=result.domain,
            confidence=result.confidence,
            model_id=self._provider,
            reasoning=result.reasoning,
        )
