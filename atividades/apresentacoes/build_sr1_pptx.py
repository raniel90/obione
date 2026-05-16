#!/usr/bin/env python3
"""Gera o Status Report 1 (sr1_2026-05-22.pptx) reusando os layouts ricos do
template `qualificacao-fmd-exemplo.pptx` (cards G1-G5, 4 fases, dois cards
lado-a-lado, caixa PLANO B).

Este é um script *custom* para esta apresentação específica — não é parte da
skill `apresentacao-poli` (que tem template genérico simples). A razão de ser
custom: queremos a riqueza visual do template antigo aplicada ao conteúdo do
SR1, sem inventar layouts via python-pptx.

Uso:
    python3 atividades/apresentacoes/build_sr1_pptx.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Importar helpers da skill apresentacao-poli
ROOT = Path(__file__).parent.parent.parent
SKILL_SCRIPTS = ROOT / ".claude/skills/apresentacao-poli/scripts"
sys.path.insert(0, str(SKILL_SCRIPTS))

from pptx import Presentation
from pptx_helpers import (  # noqa: E402
    delete_shape_by_run_text,
    replace_run_text,
    update_footers,
)

TEMPLATE = ROOT / ".claude/skills/apresentacao-poli/templates/qualificacao-fmd-exemplo.pptx"
OUTPUT = ROOT / "atividades/apresentacoes/sr1_2026-05-22.pptx"


# -------------------------------------------------------------------- helpers


def find_shape_by_text(slide, text: str):
    """Retorna o primeiro shape cujo run contém `text`."""
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if text in run.text:
                    return shape
    return None


def replace_substring_in_slide(slide, old: str, new: str) -> int:
    """Substring match (não exato) em qualquer run do slide."""
    n = 0
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if old in run.text:
                    n += run.text.count(old)
                    run.text = run.text.replace(old, new)
    return n


def replace_run_texts_in_order(slide, old: str, new_values: list[str]) -> int:
    """Substitui cada ocorrência de run com texto == `old` pelo próximo valor
    da lista, na ordem em que aparece nos shapes do slide.
    """
    idx = 0
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if run.text == old and idx < len(new_values):
                    run.text = new_values[idx]
                    idx += 1
    return idx


# ------------------------------------------------------------------- por slide


def fix_slide_1_capa(slide) -> None:
    """Capa: substitui título, equipe, professor e demais campos."""
    # Linha vermelha topo (era "{{CONTEXTO}}")
    replace_run_text(slide, "{{CONTEXTO}}", "OBIONE · STATUS REPORT 1")
    # Título principal (multi-line no original)
    title_shape = find_shape_by_text(slide, "Agentes Conversacionais")
    if title_shape:
        # Limpar e setar via API simples
        tf = title_shape.text_frame
        # Captura formatação do primeiro run
        first_run = tf.paragraphs[0].runs[0]
        font_name = first_run.font.name
        font_size = first_run.font.size
        font_bold = first_run.font.bold
        try:
            font_color = first_run.font.color.rgb
        except (AttributeError, TypeError):
            font_color = None
        # Limpa tudo e seta novo
        tf.text = "ObiOne · Observatório-Comunidade de Projetos"
        new_run = tf.paragraphs[0].runs[0]
        if font_name:
            new_run.font.name = font_name
        if font_size:
            new_run.font.size = font_size
        if font_bold is not None:
            new_run.font.bold = font_bold
        if font_color:
            new_run.font.color.rgb = font_color
    # Demais
    replace_run_text(slide, "{{SUBTITULO}}", "Apresentação à cadeira TAES")
    replace_run_text(slide, "{{ROTULO_AUTOR}}", "Equipe")
    replace_run_text(
        slide,
        "Raniel Silva",
        "Bruno Rocha · Cynthia Oliveira · Moisés Júnior · Raniel Silva (apresentador)",
    )
    replace_run_text(slide, "Orientador", "Professor")
    replace_run_text(
        slide, "Prof. Dr. Alexandre Maciel", "Prof. Ivaldir Honório de Farias Júnior"
    )
    replace_run_text(
        slide,
        "{{PROGRAMA_LONGO}}",
        "Doutorado PPGEC · Tópicos Avançados em Engenharia de Software",
    )
    replace_run_text(
        slide,
        "{{INSTITUICAO_LONGA}}",
        "Universidade de Pernambuco · Escola Politécnica de Pernambuco",
    )
    replace_substring_in_slide(slide, "Recife, {{DATA}}", "Recife, Maio 2026")


def fix_slide_2_agenda(slide) -> None:
    """Agenda: 4 itens novos + remove duração estimada."""
    replace_run_text(slide, "{{ROTULO_AGENDA}}", "STATUS REPORT 1")
    replace_run_text(slide, "{{AGENDA_1}}", "O escopo")
    replace_run_text(slide, "{{AGENDA_1_SUB}}", "O que vamos construir")
    replace_run_text(slide, "{{AGENDA_2}}", "Onde estamos")
    replace_run_text(slide, "{{AGENDA_2_SUB}}", "Sprint 0 em curso")
    replace_run_text(slide, "{{AGENDA_3}}", "Onde chegaremos")
    replace_run_text(slide, "{{AGENDA_3_SUB}}", "Cronograma e marcos")
    replace_run_text(slide, "{{AGENDA_4}}", "Próximos passos")
    replace_run_text(slide, "{{AGENDA_4_SUB}}", "Sprint 1 e riscos")
    # Remover "Duração estimada: {{DURACAO}}"
    shape = find_shape_by_text(slide, "Duração estimada")
    if shape:
        shape._element.getparent().remove(shape._element)


def fix_slide_3_cards_lado_a_lado(slide) -> None:
    """Dois cards: O QUE VAMOS CONSTRUIR + FUNDAMENTAÇÃO."""
    replace_run_text(slide, "MOTIVAÇÃO", "O QUE PROPOMOS")
    replace_run_text(
        slide, "Por que essa pesquisa?", "Observatório-comunidade baseado no MPO"
    )
    # Card esquerda
    replace_run_text(slide, "O CONTEXTO", "O QUE VAMOS CONSTRUIR")
    replace_run_text(
        slide,
        "Dados industriais subutilizados",
        "Três camadas integradas",
    )
    replace_run_text(
        slide,
        "O FMD (Framework de Mineração de Dados; Maciel et al.) define 7 camadas: coleta, governança, AutoML, visualização, deploy, arquitetura e validação.",
        "Pipeline LLM extrai os atributos do Quadro 37 do MPO de documentos .docx não-estruturados.",
    )
    replace_run_text(
        slide,
        "Hoje, cada camada exige especialista técnico. Engenheiros de chão de fábrica não acessam dados de produção sem ajuda da TI.",
        "Comunidade semi-aberta: consultoria curatoriza e cada cliente acessa apenas o seu projeto, com comentários e feed in-app.",
    )
    replace_run_text(
        slide,
        "Resultado: dados existem, mas decisões não são informadas por eles.",
        "IA-Assistente reduz fricção operacional: gera resumo para o cliente e drafts para o consultor revisar.",
    )
    # Card direita
    replace_run_text(slide, "A LACUNA NA LITERATURA", "FUNDAMENTAÇÃO MPO")
    replace_run_text(
        slide, "Evidência da nossa RSL", "Endereçando lacunas do Vieira (2022)"
    )
    # 3 stats
    replace_run_text(slide, "30 / 38", "44 / 44")
    replace_run_text(
        slide,
        "papers cobrem apenas a camada Coleta",
        "atributos do Quadro 37 cobertos",
    )
    replace_run_text(
        slide,
        "as 6 outras camadas estão sub-representadas",
        "8 categorias do MPO (geral, escopo, riscos, lições, etc.)",
    )
    replace_run_text(slide, "1 / 38", "5 reais")
    replace_run_text(
        slide, "paper testou em contexto automotivo", "projetos do estudo de caso"
    )
    replace_run_text(
        slide,
        "manuais do Ford Fiesta (não dados de produção)",
        "jurídico · saúde · esporte · branding",
    )
    replace_run_text(slide, "−53%", "3 TF")
    replace_run_text(
        slide,
        "queda relativa de precisão NL2SQL",
        "Trabalhos Futuros endereçados",
    )
    replace_run_text(
        slide,
        "86,6% no Spider → 41% no banco real Petrobras",
        "#4 Interatividade · #7 Comparativos · #8 Soluções computacionais",
    )
    # Linha do final
    replace_run_text(
        slide,
        "Objetivo da tese: framework multi-agente para o FMD, validado em planta automotiva real (Stellantis).",
        "Diferencial: tecido social que materializa as características Interatividade e Rede de Colaboração do MPO.",
    )
    # Fontes
    replace_run_text(
        slide,
        "Fonte: Síntese cruzada dos 38 papers da RSL",
        "Fonte: Vieira (2022) · Quadro 37 (p. 264)",
    )
    replace_run_text(
        slide,
        "Fonte: Medeiros et al. (2023) · LLM chatbot Ford Fiesta · MDPI Vehicles",
        "Fonte: 5 projetos reais em contexto/projetos/",
    )
    replace_run_text(
        slide,
        "Fonte: Gao et al. (2024) · Nascimento et al. (2025)",
        "Fonte: Vieira (2022) · Seção 6.4 (pp. 215-217)",
    )


def fix_slide_4_cinco_grupos(slide) -> None:
    """5 cards G1-G5 com os 5 grupos do escopo."""
    replace_run_text(slide, "RESULTADOS", "ESCOPO")
    replace_run_text(
        slide,
        "Cinco lacunas identificadas na literatura",
        "5 grupos · 18 requisitos funcionais",
    )
    # G1
    replace_run_text(slide, "Governança e Deploy", "Pipeline LLM")
    replace_run_text(
        slide,
        "Nenhum paper dedicado a conformidade LGPD/GDPR ou monitoramento de modelos em produção com interface conversacional",
        "Extração via LLM dos atributos do Quadro 37 (8 categorias) a partir de documentos .docx não-estruturados.",
    )
    # G2
    replace_run_text(slide, "Integração entre camadas", "Observação")
    replace_run_text(
        slide,
        "Nenhum framework cobre as 7 camadas de forma unificada. O máximo encontrado foi 5/7 camadas em um único trabalho (Keskin et al., 2025)",
        "Dashboard de portfólio com indicador de cobertura do MPO. Visão restrita por perfil: consultoria vê todos, cliente vê apenas o seu.",
    )
    # G3
    replace_run_text(slide, "Benchmark vs. realidade", "Comunidade")
    replace_run_text(
        slide,
        "Performance cai drasticamente em bancos reais: 86,6% no Spider → 41% no banco industrial da Petrobras (46 pontos · Gao et al., 2024 · Nascimento et al., 2025)",
        "Autenticação simples + perfis semi-abertos + comentários por projeto + feed in-app de novidades. Materializa Interatividade do MPO.",
    )
    # G4
    replace_run_text(slide, "Pipeline vs. agentes", "IA-Assistente")
    replace_run_text(
        slide,
        "55% dos papers usam pipelines fixos sem capacidade de planejamento, memória ou uso de ferramentas externas",
        "Resumo do projeto para o cliente (IA-tradutora) + drafts de Próximos Passos para o consultor revisar (IA-redutora de fricção).",
    )
    # G5
    replace_run_text(slide, "Validação automotiva", "Avaliação")
    replace_run_text(
        slide,
        "Apenas 1 de 38 papers testou em contexto automotivo (manuais do Ford Fiesta · Medeiros et al., 2023), escopo muito limitado",
        "Quantitativa: precisão, recall, F1 e Kappa em 3 projetos com gabarito manual. Qualitativa: Likert separado para consultoria e clientes.",
    )


def fix_slide_5_marcos(slide) -> None:
    """4 fases → 4 marcos M1-M4 + caixa PLANO B."""
    replace_run_text(slide, "PROPOSTA DE PESQUISA", "CRONOGRAMA")
    replace_run_text(
        slide,
        "Plano de execução em três fases",
        "9 semanas restantes · 4 marcos · entrega 10/07/2026",
    )

    # FASE 1 → M1 PREPARAÇÃO
    replace_run_text(slide, "FASE 1", "M1")
    replace_run_text(slide, "MVP", "PREPARAÇÃO")
    # "6–8 meses" aparece 2x (FASE 1 e FASE 2) — usar ordem
    replace_run_texts_in_order(
        slide, "6–8 meses", ["Semana 9", "Semanas 10-11"]
    )
    replace_run_text(slide, "Orquestrador", "Atributos-alvo")
    replace_run_text(slide, "+ Coletor (NL2SQL)", "+ Protocolo de avaliação")
    replace_run_text(slide, "+ Visualizador (NL2VIS)", "+ Início dos gabaritos (3 projetos)")
    replace_run_text(
        slide,
        "Técnicas mais maduras na literatura (30 papers).",
        "Destrava todo o Sprint 1 e SR2.",
    )
    replace_run_text(slide, "Artigo em conferência", "Status Report 1")

    # FASE 2 → M2 PIPELINE
    replace_run_text(slide, "FASE 2", "M2")
    replace_run_text(slide, "Contribuição original", "PIPELINE")
    replace_run_text(slide, "Governança (LGPD)", "Cadastro · upload · auth")
    replace_run_text(slide, "+ AutoML", "+ Pipeline LLM nos 5 projetos")
    replace_run_text(
        slide,
        "Ataca os gaps onde não há publicações dedicadas.",
        "Núcleo técnico da extração de atributos do MPO.",
    )
    replace_run_text(slide, "Artigo em journal", "5 JSONs persistidos")

    # FASE 3 → M3 DASHBOARD + IA
    replace_run_text(slide, "FASE 3", "M3")
    replace_run_text(slide, "Validação", "DASHBOARD + IA")
    replace_run_text(slide, "8–10 meses", "Semanas 12-13")
    replace_run_text(slide, "Deploy + Validador", "Cobertura · perfis · comentários")
    replace_run_text(slide, "+ Estudo de caso", "+ Resumo Cliente (IA)")
    replace_run_text(
        slide,
        "Stellantis (planta automotiva)",
        "+ Drafts assistidos (IA)",
    )
    replace_run_text(
        slide,
        "Aproveita parceria institucional do grupo.",
        "Onde a comunidade do observatório vive.",
    )
    replace_run_text(slide, "Capítulos da tese", "Status Report 2 (19/06)")

    # ESCRITA → M4 AVALIAÇÃO
    replace_run_text(slide, "ESCRITA", "M4")
    replace_run_text(slide, "Tese e defesa", "AVALIAÇÃO")
    replace_run_text(slide, "4–6 meses", "Semana 14")
    replace_run_text(slide, "Redação Cap. 3-7", "Precisão · Recall · F1 · Kappa")
    replace_run_text(slide, "Revisão por orientador", "+ Likert × 2 audiências")
    replace_run_text(slide, "Defesa pública", "+ Exportação consolidada")
    replace_run_text(
        slide,
        "Buffer para correções e ajustes pós-banca.",
        "Fecha o ciclo DSR (Hevner et al., 2004).",
    )
    replace_run_text(slide, "Tese defendida", "Relato + Apresentação final")

    # Total
    replace_run_text(
        slide,
        "Total: 24–32 meses (deadline: dezembro 2028 = 32 meses)",
        "Escrita do relato: semanas 15-16 (Cynthia) · Apresentação final: 10/07 (Moisés)",
    )

    # Caixa PLANO B
    replace_run_text(slide, "PLANO B (FASE 3)", "PLANO B (LIKERT)")
    replace_run_text(
        slide,
        "Caso a parceria Stellantis não formalize:",
        "Se Likert dos clientes não atingir N ≥ 8:",
    )
    replace_run_text(
        slide,
        "Migrar para outra montadora regional ou planta de fornecedor (Tier 1) automotivo via grupo de pesquisa.",
        "Aceitar 1 respondente por projeto e declarar como limitação metodológica no relato.",
    )


def fix_slide_6_estamos_vs_proximos(slide) -> None:
    """2 cards: ESTÁ FEITO + PRÓXIMAS SEMANAS."""
    replace_run_text(slide, "PRÓXIMOS PASSOS", "ONDE ESTAMOS · O QUE VEM")
    replace_run_text(
        slide,
        "Decisões e posicionamentos",
        "Sprint 0 concluído e próximas semanas",
    )

    # Card esquerda: JÁ ESTOU FAZENDO → ESTÁ FEITO
    replace_run_text(slide, "JÁ ESTOU FAZENDO", "ESTÁ FEITO")
    replace_run_text(slide, "Independente de aprovação", "Sprint 0 · esta semana")
    replace_run_text(slide, "Capítulo 2 da tese (RSL)", "Requisitos")
    replace_run_text(
        slide,
        "Todos os dados estão consolidados em formato estruturado.",
        "18 funcionais + 9 não funcionais em formato ficha simplificada.",
    )
    replace_run_text(slide, "Submissão do artigo da RSL", "Atributos-alvo do MPO")
    replace_run_text(
        slide,
        "Target: IEEE Access (preferência por Qualis maior se viável).",
        "44 atributos do Quadro 37 categorizados como estruturado, texto livre ou fora de escopo.",
    )
    replace_run_text(slide, "Implementação do MVP (Fase 1)", "Protocolo de avaliação")
    replace_run_text(
        slide,
        "Orquestrador + Coletor + Visualizador.",
        "Rubrica híbrida 0/0,5/1 + Kappa para concordância entre avaliadores.",
    )

    # Card direita: POSIÇÕES QUE DEFENDO → PRÓXIMAS SEMANAS
    replace_run_text(slide, "POSIÇÕES QUE DEFENDO", "PRÓXIMAS SEMANAS")
    replace_run_text(slide, "Quero confirmação", "O que vem agora")
    replace_run_text(slide, "Manter as 5 RQs", "Sprint 1 (sem 9-10)")
    replace_run_text(
        slide,
        "O FMD é integrado por design. RQ1 é estrutural; RQ2/RQ3/RQ5 são técnicas; RQ4 é validação unificadora.",
        "Cadastro · upload · autenticação · pipeline LLM rodando nos 5 projetos.",
    )
    replace_run_text(slide, "RQ4 com a Stellantis", "Gabaritos manuais")
    replace_run_text(
        slide,
        "Aproveitar a relação institucional do grupo de pesquisa para a Fase 3.",
        "Valença Odontologia como piloto da rubrica · depois Freire Batista e Kaka JJ.",
    )
    replace_run_text(slide, "RSL fechada com 38 papers", "Status Report 2 (19/06)")
    replace_run_text(
        slide,
        "Saturação temática atingida. Fechar Capítulo 2.",
        "Dashboard + IA-Assistente operacionais nos 5 projetos.",
    )


def fix_slide_7_obrigado(slide) -> None:
    """Obrigado: substitui referências da apresentação antiga."""
    replace_run_text(
        slide,
        "Resultados da RSL  ·  Framework FMD-Agent  ·  Worklog",
        "github.com/raniel90/obione",
    )
    # Substituir os {{AUTOR}}, {{PROGRAMA}}, {{INSTITUICAO}} no footer
    replace_run_text(
        slide,
        "{{AUTOR}}  ·  {{PROGRAMA}}  ·  {{INSTITUICAO}}",
        "Bruno · Cynthia · Moisés · Raniel  ·  Doutorado PPGEC  ·  UPE/POLI",
    )
    replace_run_text(
        slide,
        "Orientador: {{ORIENTADOR}}  ·  Recife, {{DATA}}",
        "Professor: Prof. Ivaldir Honório de Farias Júnior  ·  Recife, Maio 2026",
    )


# ----------------------------------------------------------------------- main


def main() -> int:
    if not TEMPLATE.exists():
        print(f"❌ Template não encontrado: {TEMPLATE}", file=sys.stderr)
        return 2

    print(f"Carregando template: {TEMPLATE.name}")
    prs = Presentation(TEMPLATE)

    print("Slide 1: capa...")
    fix_slide_1_capa(prs.slides[0])

    print("Slide 2: agenda...")
    fix_slide_2_agenda(prs.slides[1])

    print("Slide 3: dois cards (O que vamos construir + Fundamentação)...")
    fix_slide_3_cards_lado_a_lado(prs.slides[2])

    print("Slide 4: cinco grupos do escopo...")
    fix_slide_4_cinco_grupos(prs.slides[3])

    print("Slide 5: cronograma (M1-M4 + PLANO B)...")
    fix_slide_5_marcos(prs.slides[4])

    print("Slide 6: onde estamos vs próximas semanas...")
    fix_slide_6_estamos_vs_proximos(prs.slides[5])

    print("Slide 7: obrigado...")
    fix_slide_7_obrigado(prs.slides[6])

    # Substituir o placeholder de footer textual ({{FOOTER}}) em todos os slides
    print("\nSubstituindo {{FOOTER}} global...")
    footer_text = "Equipe ObiOne · Doutorado PPGEC · UPE/POLI · Maio 2026"
    footer_count = 0
    for slide in prs.slides:
        footer_count += replace_run_text(slide, "{{FOOTER}}", footer_text)
    print(f"  {footer_count} footers textuais atualizados")

    print("\nAtualizando numeração de página (total=7)...")
    n = update_footers(prs, total=7)
    print(f"  {n} números de página atualizados")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(OUTPUT)
    print(f"\n✓ Salvo: {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
