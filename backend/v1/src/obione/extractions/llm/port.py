"""LLM extractor port (hexagonal). Real adapter ships in Sprint 2 T2.1."""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ExtractionResult:
    content: dict
    model_id: str


class AbstractExtractor(Protocol):
    def extract(self, text: str) -> ExtractionResult: ...
