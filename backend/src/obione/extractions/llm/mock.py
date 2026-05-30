"""Mock extractor: loads the example JSON. Used in dev and tests."""

import json
from pathlib import Path

from obione.extractions.llm.port import ExtractionResult

_FALLBACK = {
    "_meta": {
        "projeto_nome": "mock-project",
        "documento_fonte": "mock.docx",
        "data_extracao": "2026-01-01T00:00:00Z",
        "origem": "llm",
        "modelo_llm": "mock",
    },
    "nome_projeto": "Mock Project",
}


def _example_candidates() -> list[Path]:
    """Look for atividades/schema_extracao_exemplo.json in:
    1. The container mount (`/app/atividades/...`)
    2. Every ancestor of this file (works on bare-metal CI runners +
       whatever local checkout depth a contributor uses).
    """
    candidates = [Path("/app/atividades/schema_extracao_exemplo.json")]
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidates.append(parent / "atividades" / "schema_extracao_exemplo.json")
    return candidates


class MockExtractor:
    def __init__(self, example_path: str | None = None):
        self._example_path = example_path  # explicit override wins

    def _resolve_path(self) -> Path | None:
        if self._example_path:
            p = Path(self._example_path)
            return p if p.exists() else None
        for candidate in _example_candidates():
            if candidate.exists():
                return candidate
        return None

    def extract(self, text: str) -> ExtractionResult:
        path = self._resolve_path()
        content = json.loads(path.read_text()) if path else dict(_FALLBACK)
        return ExtractionResult(content=content, model_id="mock")
