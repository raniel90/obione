"""Instructor-based extractor. One adapter, many providers via from_provider.

Provider string is whatever instructor.from_provider accepts:
    "ollama/llama3.1:8b"
    "anthropic/claude-sonnet-4-6"
    "openai/gpt-5-mini"

For Ollama we force JSON mode explicitly; other providers use the library
default (function/tool-call mode where available).
"""
from __future__ import annotations

from datetime import datetime, timezone

import instructor

from obione.extractions.llm.loader import extract_text_from_docx
from obione.extractions.llm.port import ExtractionResult
from obione.extractions.llm.prompts import build_extraction_messages
from obione.extractions.llm.schema import MetaExtracao, ProjetoExtraido


class InstructorExtractor:
    """Implements AbstractExtractor by routing through Instructor."""

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
        kwargs: dict = {}
        if provider.startswith("ollama/"):
            kwargs["mode"] = instructor.Mode.JSON
        self._client = instructor.from_provider(provider, **kwargs)

    def extract(self, document_bytes: bytes) -> ExtractionResult:
        doc_text = extract_text_from_docx(document_bytes)
        messages = build_extraction_messages(
            doc_text=doc_text,
            project_name=self._project_name,
            document_name=self._document_name,
        )
        projeto: ProjetoExtraido = self._client.create(
            response_model=ProjetoExtraido,
            messages=messages,
            max_retries=3,
        )
        # Stamp _meta with runtime info — the LLM may have left placeholders
        # or hallucinated a different value, so we overwrite authoritatively.
        projeto.meta = MetaExtracao(
            projeto_nome=self._project_name,
            documento_fonte=self._document_name,
            data_extracao=datetime.now(tz=timezone.utc).isoformat(),
            origem="llm",
            modelo_llm=self._provider,
        )
        return ExtractionResult(
            content=projeto.model_dump(mode="json", by_alias=True),
            model_id=self._provider,
        )
