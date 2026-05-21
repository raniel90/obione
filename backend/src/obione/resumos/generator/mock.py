"""Mock resume generator: deterministic narrative from extraction content."""

from __future__ import annotations

from obione.resumos.generator.port import GeneratedResumo


def _join(items: list[str] | None) -> str | None:
    if not items:
        return None
    return ", ".join(items)


def _section(label: str, value) -> str | None:
    if not value:
        return None
    rendered = _join(value) if isinstance(value, list) else str(value).strip()
    if not rendered:
        return None
    return f"**{label}.** {rendered}"


class MockResumoGenerator:
    """Builds a Markdown summary from the 44 MPO attributes.

    The output mirrors what an LLM-generated narrative might look like: a
    short intro identifying the project, then 4-5 short sections covering
    objectives, scope, status, costs and risks where the data is present.
    Attributes not in the extraction are skipped.
    """

    model_id = "mock-resumo-v1"

    def generate(self, extraction_content: dict, project_name: str) -> GeneratedResumo:
        c = extraction_content or {}
        parts: list[str] = []

        intro_bits = []
        if c.get("nome_projeto"):
            intro_bits.append(f"**{c['nome_projeto']}**")
        else:
            intro_bits.append(f"**{project_name}**")
        if c.get("tipo"):
            intro_bits.append(f"— {c['tipo']}")
        if c.get("local_execucao"):
            intro_bits.append(f"({c['local_execucao']})")
        parts.append(" ".join(intro_bits))

        if c.get("descricao"):
            parts.append(str(c["descricao"]).strip())

        for label, key in [
            ("Objetivos", "objetivos"),
            ("Escopo", "escopo_planejado"),
            ("Cronograma", "status_cronograma"),
            ("Custo estimado", "custo_estimado"),
            ("Riscos identificados", "riscos_identificados"),
            ("Pontos fortes", "pontos_fortes"),
            ("Pontos de atenção", "pontos_fracos"),
        ]:
            section = _section(label, c.get(key))
            if section:
                parts.append(section)

        stakeholders = _join(c.get("nome_stakeholders"))
        if stakeholders:
            parts.append(f"**Equipe e stakeholders.** {stakeholders}")

        if len(parts) == 1:  # only intro
            parts.append(
                "_(A extração ainda não tem informações suficientes para um resumo detalhado.)_"
            )

        return GeneratedResumo(body="\n\n".join(parts), model_id=self.model_id)
