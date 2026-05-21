"""Resume generator port (hexagonal architecture).

A real adapter ships once the LLM provider for narrative-style generation
is decided in Sprint 4. For now `MockResumoGenerator` produces a templated
narrative from the extraction content so the rest of the flow can be wired
and tested end-to-end without depending on the LLM being available.
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class GeneratedResumo:
    body: str
    model_id: str


class AbstractResumoGenerator(Protocol):
    def generate(self, extraction_content: dict, project_name: str) -> GeneratedResumo: ...
