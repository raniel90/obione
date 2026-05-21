"""Pydantic mirror of atividades/schema_extracao.json (v1.0.0).

`MPOAttributes` is the runtime container for one project's 44 attributes
from the MPO Quadro 37 (Vieira 2022). Used both as Instructor `response_model`
(LLM populates structured output) and as the gabarito-manual loader DTO in
Sprint 5. All 44 attributes are nullable — when the .docx doesn't mention an
attribute the extractor returns null, never inventing values.

The Pydantic field names use snake_case Python identifiers; the `_meta`
attribute is exposed via alias so the wire format (`{"_meta": {...}, ...}`)
matches the JSON schema contract exactly. The 44 attribute keys keep their
PT-BR names — they are the canonical academic identifiers and the protocol
of evaluation references them by these names.
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MPOMetadata(BaseModel):
    """Provenance metadata for an MPO extraction. NOT a per-attribute trace."""

    model_config = ConfigDict(extra="ignore")

    projeto_nome: str = Field(description="Nome do projeto (slug ou nome legível).")
    documento_fonte: str = Field(description="Caminho/nome do arquivo .docx fonte.")
    hash_documento: str | None = Field(
        default=None, description="SHA-256 do conteúdo do .docx (opcional)."
    )
    modelo_llm: str | None = Field(
        default=None,
        description="Identificador do modelo LLM usado (null para gabarito manual).",
    )
    data_extracao: str = Field(description="Data/hora da extração em ISO 8601.")
    origem: Literal["llm", "gabarito_manual"] = Field(
        description="llm = automática; gabarito_manual = anotação humana."
    )


Porte = Literal["pequeno", "medio", "grande"]
StatusCronograma = Literal[
    "no_prazo", "atrasado", "adiantado", "concluido", "cancelado"
]


class MPOAttributes(BaseModel):
    """The 44 attributes of the MPO Quadro 37 (Vieira 2022). All nullable.

    Convention: when the source document does not mention an attribute, the
    extractor must return ``None`` — never fabricate. The LLM is instructed
    via the field ``description`` strings below (Instructor forwards them as
    hints). The wire format keeps PT-BR attribute names because they are the
    canonical academic identifiers in ``atividades/schema_extracao.json``.
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    meta: MPOMetadata = Field(alias="_meta")

    @field_validator("porte", "status_cronograma", mode="before")
    @classmethod
    def _lowercase_enums(cls, v: Any) -> Any:
        """LLMs sometimes capitalize enum values ('Pequeno' vs 'pequeno').
        Normalize to lowercase before Literal validation kicks in.
        """
        if isinstance(v, str):
            return v.strip().lower()
        return v

    # --- Conteúdo geral (15 atributos: 1-15) ---
    nome_projeto: str | None = Field(
        default=None, description="String curta que identifica o projeto univocamente."
    )
    descricao: str | None = Field(
        default=None, description="Texto narrativo livre do projeto."
    )
    local_execucao: str | None = Field(
        default=None, description="Cidade/estado/país ou referência de local."
    )
    tipo: str | None = Field(
        default=None,
        description="Categoria/classe do projeto (ex: consultoria de marketing, jurídico, gastronomia).",
    )
    porte: Porte | None = Field(default=None, description="Porte do projeto.")
    objetivos: str | None = Field(
        default=None,
        description="Lista narrativa dos objetivos do projeto (bullets ou parágrafos).",
    )
    descricao_produtos_servicos: str | None = Field(
        default=None,
        description="Narrativa dos produtos e serviços gerados pelo projeto.",
    )
    licitacao: str | None = Field(
        default=None,
        description="Número/referência da licitação. Tipicamente null para consultoria privada.",
    )
    contratos: str | None = Field(
        default=None, description="Número/referência de contrato."
    )
    termo_encerramento: str | None = Field(
        default=None,
        description="Texto do termo de encerramento, se o projeto já foi finalizado.",
    )
    justificativas_projeto: str | None = Field(
        default=None, description="Narrativa da razão do projeto existir."
    )
    impactos_projeto: str | None = Field(
        default=None,
        description="Narrativa dos impactos esperados/observados a curto e longo prazo.",
    )
    indicadores_projeto: str | None = Field(
        default=None, description="Lista narrativa de KPIs do projeto."
    )
    artefatos_produzidos: str | None = Field(
        default=None, description="Lista descritiva de entregáveis produzidos."
    )
    imagens_fotos: None = Field(
        default=None,
        description="Conteúdo visual — fora de escopo do LLM textual. Sempre null.",
    )

    # --- Stakeholders (5 atributos: 16-20) ---
    nome_stakeholders: list[str] | None = Field(
        default=None, description="Lista de nomes próprios dos stakeholders."
    )
    funcao_projeto: list[str] | None = Field(
        default=None, description="Lista de cargos/papéis de cada stakeholder."
    )
    publico_alvo: str | None = Field(
        default=None, description="Descrição da audiência/cliente final."
    )
    detalhes_equipe: str | None = Field(
        default=None,
        description="Composição, organização e responsabilidades da equipe.",
    )
    treinamentos_equipes: str | None = Field(
        default=None,
        description="Narrativa de capacitações e formações realizadas pelas equipes.",
    )

    # --- Escopo (4 atributos: 21-24) ---
    tarefas_projeto: str | None = Field(
        default=None, description="Lista descritiva de tarefas do projeto."
    )
    requisitos: str | None = Field(
        default=None,
        description="Lista descritiva de requisitos funcionais/não-funcionais.",
    )
    escopo_planejado: str | None = Field(
        default=None, description="Definição original do escopo do projeto."
    )
    escopo_executado: str | None = Field(
        default=None, description="O que efetivamente foi feito."
    )

    # --- Cronograma (5 atributos: 25-29) ---
    data_inicio: str | None = Field(
        default=None, description="Data de início em ISO 8601 (YYYY-MM-DD)."
    )
    data_fim_planejada: str | None = Field(
        default=None, description="Data de fim planejada em ISO 8601 (YYYY-MM-DD)."
    )
    data_fim_executada: str | None = Field(
        default=None,
        description="Data de fim real em ISO 8601. null se ainda não terminou.",
    )
    entregas_realizadas: str | None = Field(
        default=None, description="Lista descritiva de marcos/entregas."
    )
    status_cronograma: StatusCronograma | None = Field(
        default=None, description="Status atual do cronograma."
    )

    # --- Custos (3 atributos: 30-32) ---
    custo_estimado: float | None = Field(
        default=None,
        description="Valor monetário estimado em reais (BRL). Exemplo: 12500.50",
    )
    custo_realizado: float | None = Field(
        default=None, description="Valor monetário realizado em reais (BRL)."
    )
    justificativas_gastos: str | None = Field(
        default=None, description="Narrativa explicando os gastos."
    )

    # --- Riscos (5 atributos: 33-37) ---
    riscos_identificados: str | None = Field(
        default=None, description="Lista descritiva de riscos identificados."
    )
    analise_qualitativa_riscos: str | None = Field(
        default=None,
        description="Texto narrativo da análise qualitativa dos riscos.",
    )
    analise_quantitativa_riscos: str | None = Field(
        default=None,
        description="Texto narrativo da análise quantitativa (pode conter números embutidos).",
    )
    planejamento_respostas_riscos: str | None = Field(
        default=None, description="Estratégias de mitigação descritas."
    )
    monitoramento_riscos: str | None = Field(
        default=None, description="Como os riscos estão sendo acompanhados."
    )

    # --- Mudanças (3 atributos: 38-40) ---
    custo_implementacao_mudanca: float | None = Field(
        default=None,
        description="Valor monetário de implementação da mudança em reais (BRL).",
    )
    analise_custo_beneficio: str | None = Field(
        default=None, description="Análise narrativa custo-benefício da mudança."
    )
    impactos_mudanca: str | None = Field(
        default=None,
        description="Descrição dos impactos da mudança no escopo e cronograma.",
    )

    # --- Lições aprendidas (4 atributos: 41-44) ---
    pontos_fortes: str | None = Field(
        default=None, description="Aspectos positivos identificados."
    )
    pontos_fracos: str | None = Field(
        default=None, description="Aspectos negativos identificados."
    )
    dificuldades_encontradas: str | None = Field(
        default=None, description="Obstáculos enfrentados durante o projeto."
    )
    providencias_tomadas: str | None = Field(
        default=None, description="Ações de resposta às dificuldades."
    )
