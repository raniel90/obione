"""Theme classifier port (hexagonal)."""

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ClassifiedTheme:
    """Output of a single classification call.

    `confidence` is in [0, 1] — calibration depends on the adapter (the mock
    uses a keyword-hit ratio; the Instructor adapter forwards the model's
    self-reported confidence).
    """

    domain: str
    confidence: float
    model_id: str
    reasoning: str | None = None


class AbstractThemeClassifier(Protocol):
    def classify(
        self, description: str, extraction_content: dict | None = None
    ) -> ClassifiedTheme: ...
