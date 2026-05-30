"""Mock theme classifier: keyword heuristic over the description.

Deterministic and dependency-free. Used in all tests (via the autouse
`_pin_llm_provider` fixture) and as the dev default when no real LLM is
configured.
"""

from __future__ import annotations

from obione.themes.generator.port import ClassifiedTheme

_KEYWORDS = {
    "legal": (
        "jurídic",
        "advoga",
        "advogad",
        "processo",
        "tribunal",
        "judicial",
        "contrat",
    ),
    "health": (
        "saúde",
        "clínic",
        "consultór",
        "paciente",
        "odontolog",
        "médic",
    ),
    "sports": (
        "esporte",
        "treino",
        "atleta",
        "academia",
        "jiu",
        "luta",
        "ginás",
    ),
    "branding": (
        "marca",
        "branding",
        "identidade",
        "rebrand",
        "design visual",
    ),
    "gastronomy": (
        "doceria",
        "restaurante",
        "cardápio",
        "gastronom",
        "confeitar",
        "padar",
    ),
}


class MockThemeClassifier:
    """Heuristic by keyword count. Returns "other" when nothing matches."""

    def classify(self, description: str, extraction_content: dict | None = None) -> ClassifiedTheme:
        text = (description or "").lower()
        scores = {label: sum(1 for kw in kws if kw in text) for label, kws in _KEYWORDS.items()}
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            return ClassifiedTheme(
                domain="other",
                confidence=0.0,
                model_id="mock",
                reasoning="Nenhuma keyword reconhecida na descrição.",
            )
        confidence = min(1.0, scores[best] / 3.0)
        return ClassifiedTheme(
            domain=best,
            confidence=confidence,
            model_id="mock",
            reasoning=(
                f"Keywords associadas a '{best}' encontradas: {scores[best]} ocorrência(s)."
            ),
        )
