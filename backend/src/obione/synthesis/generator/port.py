"""Synthesis generator port (hexagonal architecture) — the "Conectora".

Given the anonymised lessons/risks digests of the projects in a temática,
distils recurring patterns, common risks and best practices into a single
synthesis the consultor reviews and publishes. `theme_digests` carries NO
client/project names — anonymisation is a hard requirement (LGPD): the input
is already stripped, and the LLM adapter's prompt reinforces it.
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class GeneratedSynthesis:
    title: str | None
    body: str
    model_id: str


class AbstractSynthesisGenerator(Protocol):
    def synthesize(self, theme_digests: list[dict], *, domain: str) -> GeneratedSynthesis: ...
