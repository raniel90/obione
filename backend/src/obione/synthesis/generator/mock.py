"""Mock synthesis generator: deterministic, anonymised thematic digest.

Aggregates the lessons/risks attributes across the projects of a temática
into three blocks (recurring patterns / common risks / best practices).
References projects only by an anonymous index ("Projeto 1", ...) — never by
name — so the published synthesis carries no client-identifying data.
Deterministic: same digests + domain always yield the same body.
"""

from __future__ import annotations

from obione.synthesis.generator.port import AbstractSynthesisGenerator, GeneratedSynthesis

DOMAIN_LABELS = {
    "legal": "Jurídico",
    "health": "Saúde",
    "sports": "Esportes",
    "branding": "Branding",
    "gastronomy": "Gastronomia",
    "other": "Outro",
}


def _collect(digests: list[dict], key: str) -> list[str]:
    """Non-empty values for `key` across projects, prefixed by anonymous index."""
    out: list[str] = []
    for i, d in enumerate(digests, start=1):
        value = d.get(key)
        if value not in (None, "", [], {}):
            out.append(f"Projeto {i}: {value}")
    return out


def _block(title: str, items: list[str]) -> list[str]:
    if not items:
        return []
    return [f"## {title}", *[f"- {it}" for it in items], ""]


class MockSynthesisGenerator(AbstractSynthesisGenerator):
    model_id = "mock-synthesis-v1"

    def synthesize(self, theme_digests: list[dict], *, domain: str) -> GeneratedSynthesis:
        label = DOMAIN_LABELS.get(domain, domain)
        n = len(theme_digests)

        lines: list[str] = [
            f"Síntese da temática {label}, a partir de {n} projeto(s) do portfólio. "
            "Padrões agregados, sem identificar clientes.",
            "",
        ]
        if n <= 1:
            lines.append(
                "_Amostra pequena (1 projeto): a síntese reflete um único caso e não "
                "deve ser lida como padrão da temática._"
            )
            lines.append("")

        # Recurring patterns — strengths + weaknesses (lições aprendidas).
        patterns = _collect(theme_digests, "pontos_fortes") + _collect(
            theme_digests, "pontos_fracos"
        )
        lines += _block("Padrões recorrentes", patterns)

        # Common risks.
        risks = _collect(theme_digests, "riscos_identificados") + _collect(
            theme_digests, "dificuldades_encontradas"
        )
        lines += _block("Riscos comuns", risks)

        # Best practices — responses taken.
        practices = _collect(theme_digests, "providencias_tomadas")
        lines += _block("Boas práticas", practices)

        if not (patterns or risks or practices):
            lines.append(
                "Os projetos desta temática ainda não trouxeram lições aprendidas ou "
                "riscos suficientes para uma síntese significativa. Revisar as extrações "
                "com a equipe antes de publicar."
            )

        body = "\n".join(lines).strip()
        title = f"Síntese — {label}"
        return GeneratedSynthesis(title=title, body=body, model_id=self.model_id)
