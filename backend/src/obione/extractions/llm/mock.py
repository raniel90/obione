"""Mock extractor: loads the example JSON. Used in dev and tests."""
import json
from pathlib import Path

from obione.extractions.llm.port import ExtractionResult

_FALLBACK = {
    "_meta": {
        "project_name": "mock-project",
        "source_document": "mock.docx",
        "extracted_at": "2026-01-01T00:00:00Z",
        "source": "llm",
    },
    "project_name": "Mock Project",
}


class MockExtractor:
    def __init__(self, example_path: str | None = None):
        self._example_path = example_path

    def extract(self, document_bytes: bytes) -> ExtractionResult:
        if self._example_path and Path(self._example_path).exists():
            content = json.loads(Path(self._example_path).read_text())
        else:
            content = dict(_FALLBACK)
        return ExtractionResult(content=content, model_id="mock")
