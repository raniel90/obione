"""Mock draft generator: deterministic items from extraction + comments."""

from __future__ import annotations

from obione.drafts.generator.port import (
    AbstractDraftGenerator,
    GeneratedDraftItem,
    GeneratedDrafts,
)


class MockDraftGenerator(AbstractDraftGenerator):
    """Walks the 44 MPO attributes + the most recent comments and proposes
    bullet-shaped items for the consultor to review. Deterministic — same
    extraction + comments always yields the same output."""

    model_id = "mock-drafts-v1"

    def generate(
        self,
        extraction_content: dict,
        *,
        project_name: str,
        recent_comments: list[str],
    ) -> GeneratedDrafts:
        c = extraction_content or {}
        items: list[GeneratedDraftItem] = []

        # --- Next steps -------------------------------------------------
        if c.get("escopo_planejado") and not c.get("escopo_executado"):
            items.append(
                GeneratedDraftItem(
                    kind="next_step",
                    title="Iniciar execução do escopo planejado",
                    body=(
                        "O escopo planejado está documentado "
                        "mas ainda não há entregas reportadas. "
                        "Combinar com o cliente a kickoff de execução."
                    ),
                )
            )
        if c.get("data_fim_planejada") and not c.get("data_fim_executada"):
            items.append(
                GeneratedDraftItem(
                    kind="next_step",
                    title="Confirmar entrega final na data planejada",
                    body=(
                        f"Data fim planejada: {c['data_fim_planejada']}. "
                        "Validar com a equipe se a entrega permanece neste prazo."
                    ),
                )
            )
        if c.get("nome_projeto") and not c.get("indicadores_projeto"):
            items.append(
                GeneratedDraftItem(
                    kind="next_step",
                    title="Definir indicadores de acompanhamento",
                    body=(
                        f"O projeto {project_name} ainda não tem KPIs documentados. "
                        "Propor 2-3 indicadores com o cliente."
                    ),
                )
            )

        # --- Attention points -------------------------------------------
        if c.get("riscos_identificados"):
            items.append(
                GeneratedDraftItem(
                    kind="attention_point",
                    title="Riscos identificados precisam de mitigação",
                    body=str(c["riscos_identificados"]),
                )
            )
        if c.get("status_cronograma") == "atrasado":
            items.append(
                GeneratedDraftItem(
                    kind="attention_point",
                    title="Cronograma atrasado",
                    body=(
                        "Status do cronograma reportado como 'atrasado'. "
                        "Revisar com o cliente o impacto e plano de recuperação."
                    ),
                )
            )
        if c.get("custo_realizado") and c.get("custo_estimado"):
            try:
                if float(c["custo_realizado"]) > float(c["custo_estimado"]):
                    items.append(
                        GeneratedDraftItem(
                            kind="attention_point",
                            title="Custo realizado acima do estimado",
                            body=(
                                f"Realizado R$ {c['custo_realizado']} contra "
                                f"estimado R$ {c['custo_estimado']}. "
                                "Discutir realocação ou complemento de orçamento."
                            ),
                        )
                    )
            except (TypeError, ValueError):
                pass

        # Comment signal: any recent message ending with '?' is an open question.
        for q in recent_comments:
            q = q.strip()
            if q.endswith("?"):
                items.append(
                    GeneratedDraftItem(
                        kind="attention_point",
                        title="Pergunta aberta no canal de comentários",
                        body=q,
                    )
                )

        # Fallback so the consultor never gets a completely empty batch.
        if not items:
            items.append(
                GeneratedDraftItem(
                    kind="next_step",
                    title="Revisar extração com o cliente",
                    body=(
                        f"A extração de {project_name} não trouxe sinais fortes para "
                        "drafts automáticos. Sugerir uma conversa com o cliente para "
                        "alinhar próximos passos."
                    ),
                )
            )

        return GeneratedDrafts(items=items, model_id=self.model_id)
