"""Draft generator port (hexagonal architecture).

Generates a set of "next step" + "attention point" items from the project's
extraction content and recent comment threads. The real LLM-backed adapter
ships in Sprint 4; until then `MockDraftGenerator` provides deterministic
templated output so the rest of the flow can be exercised end-to-end.
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class GeneratedDraftItem:
    kind: str  # "next_step" | "attention_point"
    title: str | None
    body: str


@dataclass(frozen=True)
class GeneratedDrafts:
    items: list[GeneratedDraftItem]
    model_id: str


class AbstractDraftGenerator(Protocol):
    def generate(
        self,
        extraction_content: dict,
        *,
        project_name: str,
        recent_comments: list[str],
    ) -> GeneratedDrafts: ...
