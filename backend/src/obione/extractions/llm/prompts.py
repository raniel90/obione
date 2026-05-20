"""Prompt construction for the MPO extraction call.

Messages are PT-BR. The exact field list is embedded so JSON-mode models
(which don't see the Pydantic schema) produce keys matching ProjetoExtraido.
"""

# Order mirrors atividades/schema_extracao.json (44 attributes, grouped by category).
_FIELD_LIST = """\
[conteudo_geral]
- nome_projeto (string|null): identificação curta do projeto
- descricao (string|null): narrativa livre
- local_execucao (string|null): cidade/estado/país
- tipo (string|null): categoria/classe (ex: "consultoria de marketing", "jurídico")
- porte (enum|null): "pequeno" | "medio" | "grande"
- objetivos (string|null): bullets ou parágrafos
- descricao_produtos_servicos (string|null)
- licitacao (string|null): número/ref de licitação (consultoria privada → null)
- contratos (string|null): número/ref de contrato
- termo_encerramento (string|null)
- justificativas_projeto (string|null): por que o projeto existe
- impactos_projeto (string|null): curto/longo prazo
- indicadores_projeto (string|null): KPIs
- artefatos_produzidos (string|null): entregáveis
- imagens_fotos (null): fora de escopo — sempre null

[stakeholders]
- nome_stakeholders (array<string>|null): nomes próprios
- funcao_projeto (array<string>|null): cargos/papéis
- publico_alvo (string|null)
- detalhes_equipe (string|null)
- treinamentos_equipes (string|null)

[escopo]
- tarefas_projeto (string|null)
- requisitos (string|null)
- escopo_planejado (string|null)
- escopo_executado (string|null)

[cronograma]
- data_inicio (string|null): ISO 8601 YYYY-MM-DD
- data_fim_planejada (string|null): ISO 8601
- data_fim_executada (string|null): ISO 8601 ou null se não terminou
- entregas_realizadas (string|null)
- status_cronograma (enum|null): "no_prazo" | "atrasado" | "adiantado" | "concluido" | "cancelado"

[custos]
- custo_estimado (number|null): BRL (ex: 18000.00)
- custo_realizado (number|null): BRL
- justificativas_gastos (string|null)

[riscos]
- riscos_identificados (string|null)
- analise_qualitativa_riscos (string|null)
- analise_quantitativa_riscos (string|null)
- planejamento_respostas_riscos (string|null)
- monitoramento_riscos (string|null)

[mudancas]
- custo_implementacao_mudanca (number|null): BRL
- analise_custo_beneficio (string|null)
- impactos_mudanca (string|null)

[licoes_aprendidas]
- pontos_fortes (string|null)
- pontos_fracos (string|null)
- dificuldades_encontradas (string|null)
- providencias_tomadas (string|null)\
"""


def build_extraction_messages(
    *, doc_text: str, project_name: str, document_name: str
) -> list[dict]:
    system = (
        "Você é um analista do MPO (Modelo de Observatório de Projetos, "
        "Vieira 2022). Sua única tarefa é EXTRAIR os 44 atributos do Quadro 37 "
        "do documento abaixo e emitir UM ÚNICO objeto JSON usando EXATAMENTE "
        "os 44 nomes de campos listados (snake_case, sem aspas customizadas, "
        "sem estruturas aninhadas além do que o tipo indicar). Não inclua "
        "comentários, markdown nem prosa antes ou depois do JSON.\n\n"
        "Princípios:\n"
        "1. EXTRAIA tudo que o documento mencionar.\n"
        "2. Use null APENAS para atributos genuinamente ausentes.\n"
        "3. NUNCA invente valores que não estejam no texto.\n"
        "4. PT-BR. Datas em ISO 8601 (YYYY-MM-DD); 'jan/2026' → '2026-01-01'.\n"
        "5. enums em minúsculas (ver lista abaixo).\n"
        "6. Custos: number puro em BRL (ex: 800.00 — NÃO 'R$ 800,00').\n"
        "7. NÃO emita o campo _meta — o servidor cuida disso.\n\n"
        f"Campos do schema (use EXATAMENTE estes nomes):\n{_FIELD_LIST}"
    )
    user = (
        f"Projeto: {project_name}\n"
        f"Documento: {document_name}\n\n"
        f"===CONTEUDO===\n{doc_text}\n===FIM==="
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
