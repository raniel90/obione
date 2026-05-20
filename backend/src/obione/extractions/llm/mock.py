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


_DEFAULT_EXAMPLE_PATH = "/app/atividades/schema_extracao_exemplo.json"


class MockExtractor:
    def __init__(self, example_path: str | None = None):
        self._example_path = example_path or _DEFAULT_EXAMPLE_PATH

    def extract(self, document_bytes: bytes) -> ExtractionResult:
        if Path(self._example_path).exists():
            content = json.loads(Path(self._example_path).read_text())
        else:
            content = dict(_FALLBACK)
        return ExtractionResult(content=content, model_id="mock")
