"""LLM extractor adapter.

Uses Instructor only for the OpenAI-compatible client construction; the actual
chat call is made directly via httpx so the prompt isn't wrapped with
Instructor's JSON-mode preamble. Llama 3.1 8B is sensitive to extra system
instructions — adding Instructor's JSON wrapper consistently produced all-null
outputs, while a direct call with our schema-aware prompt fills 30+ of 44
attributes.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

from openai import OpenAI

from obione.extractions.llm.loader import extract_text_from_docx
from obione.extractions.llm.port import ExtractionResult
from obione.extractions.llm.prompts import build_extraction_messages
from obione.extractions.llm.schema import MPOAttributes, MPOMetadata
from obione.settings import settings


class InstructorExtractor:
    """Implements AbstractExtractor against any OpenAI-compatible endpoint.

    Provider string drives the model name and (for Ollama) the base_url.
    """

    def __init__(
        self,
        provider: str,
        *,
        project_name: str = "unknown",
        document_name: str = "document.docx",
    ):
        self._provider = provider
        self._project_name = project_name
        self._document_name = document_name
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
            # anthropic/*, others — not supported in this MVP path.
            raise ValueError(
                f"Unsupported provider for direct OpenAI client: {provider}. "
                "Add a dedicated adapter for non-OpenAI-compatible providers."
            )

        self._client = OpenAI(base_url=base_url, api_key=api_key or "unused")

    def extract(self, document_bytes: bytes) -> ExtractionResult:
        doc_text = extract_text_from_docx(document_bytes)
        messages = build_extraction_messages(
            doc_text=doc_text,
            project_name=self._project_name,
            document_name=self._document_name,
        )

        completion = self._client.chat.completions.create(
            model=self._model_name,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw_json = completion.choices[0].message.content or "{}"
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            payload = {}

        # Drop any _meta the LLM emitted — server-stamped below.
        payload.pop("_meta", None)
        payload["_meta"] = MPOMetadata(
            projeto_nome=self._project_name,
            documento_fonte=self._document_name,
            data_extracao=datetime.now(tz=UTC).isoformat(),
            origem="llm",
            modelo_llm=self._provider,
        ).model_dump(mode="json")

        attributes = MPOAttributes.model_validate(payload)
        return ExtractionResult(
            content=attributes.model_dump(mode="json", by_alias=True),
            model_id=self._provider,
        )
