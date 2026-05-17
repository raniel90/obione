#!/usr/bin/env python3
"""Gera o Status Report 1 (sr1_2026-05-22.pptx) reusando os layouts ricos do
template `qualificacao-fmd-exemplo.pptx` (cards G1-G5, 4 fases, dois cards
lado-a-lado, caixa PLANO B).

Aplica o framework narrativo **SCQA** (Situation · Complication · Question ·
Answer) ao longo dos 8 slides:

1. Capa
2. Agenda
3. S + C — Contextualização (problema + gap)         [NOVO slide, duplicado]
4. Q + A — Escopo + Fundamentação (solução + stats)  [layout cards do antigo s3]
5. A detalhada — 5 grupos G1-G5
6. Como temporal — Cronograma 4 marcos M1-M4
7. Then-Now-Next — Status (feito + próximas)
8. Obrigado

Este é um script *custom* para esta apresentação específica.

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
    duplicate_slide,
    replace_run_text,
    update_footers,
)

TEMPLATE = ROOT / ".claude/skills/apresentacao-poli/templates/qualificacao-fmd-exemplo.pptx"
OUTPUT = ROOT / "atividades/apresentacoes/sr1_2026-05-22.pptx"


# -------------------------------------------------------------------- helpers


def find_shape_by_text(slide, text: str):
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if text in run.text:
                    return shape
    return None


def replace_substring_in_slide(slide, old: str, new: str) -> int:
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
    """Capa: equipe sem '(apresentador)', professor, título."""
    replace_run_text(slide, "{{CONTEXTO}}", "OBIONE · STATUS REPORT 1")
    # Título principal (multi-line no original)
    title_shape = find_shape_by_text(slide, "Agentes Conversacionais")
    if title_shape:
        tf = title_shape.text_frame
        first_run = tf.paragraphs[0].runs[0]
        font_name = first_run.font.name
        font_size = first_run.font.size
        font_bold = first_run.font.bold
        try:
            font_color = first_run.font.color.rgb
        except (AttributeError, TypeError):
            font_color = None
        tf.text = "ObiOne · Observatório de Projetos"
        new_run = tf.paragraphs[0].runs[0]
        if font_name:
            new_run.font.name = font_name
        if font_size:
            new_run.font.size = font_size
        if font_bold is not None:
            new_run.font.bold = font_bold
        if font_color:
            new_run.font.color.rgb = font_color
    replace_run_text(
        slide,
        "{{SUBTITULO}}",
        "Apresentação à cadeira Tópicos Avançados em Engenharia de Software",
    )
    replace_run_text(slide, "{{ROTULO_AUTOR}}", "Equipe")
    # Listar os 4 integrantes do grupo
    replace_run_text(
        slide,
        "Raniel Silva",
        "Bruno Rocha · Cynthia Oliveira · Moisés Júnior · Raniel Silva",
    )
    replace_run_text(slide, "Orientador", "Professor")
    replace_run_text(
        slide, "Prof. Dr. Alexandre Maciel", "Prof. Ivaldir Honório de Farias Júnior"
    )
    # Remover linha de programa (já está no subtítulo agora — evita redundância)
    shape = find_shape_by_text(slide, "{{PROGRAMA_LONGO}}")
    if shape:
        shape._element.getparent().remove(shape._element)
    replace_run_text(
        slide,
        "{{INSTITUICAO_LONGA}}",
        "Universidade de Pernambuco · Escola Politécnica de Pernambuco",
    )
    replace_substring_in_slide(slide, "Recife, {{DATA}}", "Recife, Maio 2026")


def fix_slide_2_agenda(slide) -> None:
    """Agenda com 4 itens refletindo o fluxo SCQA + Then-Now-Next."""
    replace_run_text(slide, "{{ROTULO_AGENDA}}", "STATUS REPORT 1")
    replace_run_text(slide, "{{AGENDA_1}}", "Contexto")
    replace_run_text(slide, "{{AGENDA_1_SUB}}", "Por que um observatório vivo")
    replace_run_text(slide, "{{AGENDA_2}}", "O escopo")
    replace_run_text(slide, "{{AGENDA_2_SUB}}", "O que vamos construir")
    replace_run_text(slide, "{{AGENDA_3}}", "Cronograma")
    replace_run_text(slide, "{{AGENDA_3_SUB}}", "9 semanas · 4 marcos")
    replace_run_text(slide, "{{AGENDA_4}}", "Status atual")
    replace_run_text(slide, "{{AGENDA_4_SUB}}", "Onde estamos e o que vem")
    # Remover textbox "Duração estimada"
    shape = find_shape_by_text(slide, "Duração estimada")
    if shape:
        shape._element.getparent().remove(shape._element)


def fix_slide_3_contextualizacao(slide) -> None:
    """[NOVO — slide duplicado] S + C do framework SCQA.

    Card esquerdo: O CONTEXTO (situação atual)
    Card direito: O GAP (complicação — por que mantê-los vivos é difícil)
    """
    replace_run_text(slide, "MOTIVAÇÃO", "CONTEXTO")
    replace_run_text(
        slide, "Por que essa pesquisa?", "Observatório é mais que dashboard"
    )

    # Card esquerda — O CONTEXTO
    replace_run_text(slide, "O CONTEXTO", "OBSERVATÓRIOS VS. FERRAMENTAS")
    replace_run_text(
        slide,
        "Dados industriais subutilizados",
        "Comunidade ativa de múltiplos atores",
    )
    replace_run_text(
        slide,
        "O FMD (Framework de Mineração de Dados; Maciel et al.) define 7 camadas: coleta, governança, AutoML, visualização, deploy, arquitetura e validação.",
        "Um observatório é espaço de conhecimento entre consultoria, clientes e pesquisa, mediado por interação contínua.",
    )
    replace_run_text(
        slide,
        "Hoje, cada camada exige especialista técnico. Engenheiros de chão de fábrica não acessam dados de produção sem ajuda da TI.",
        "Ferramentas de gestão oferecem visualização do status. Faltam o tecido social e a curadoria do conhecimento.",
    )
    replace_run_text(
        slide,
        "Resultado: dados existem, mas decisões não são informadas por eles.",
        "Resultado: observatórios reais são raros porque mantê-los vivos custa caro.",
    )

    # Card direita — O GAP
    replace_run_text(slide, "A LACUNA NA LITERATURA", "POR QUE É CARO?")
    replace_run_text(slide, "Evidência da nossa RSL", "Três fontes de fricção")

    # Stat 1 — Manual
    replace_run_text(slide, "30 / 38", "Manual")
    replace_run_text(
        slide,
        "papers cobrem apenas a camada Coleta",
        "curadoria de atributos do projeto",
    )
    replace_run_text(
        slide,
        "as 6 outras camadas estão sub-representadas",
        "ler documentos, estruturar, atualizar",
    )

    # Stat 2 — Repetitivo
    replace_run_text(slide, "1 / 38", "Repetitivo")
    replace_run_text(
        slide,
        "paper testou em contexto automotivo",
        "comunicar progresso aos clientes",
    )
    replace_run_text(
        slide,
        "manuais do Ford Fiesta (não dados de produção)",
        "traduzir técnico em narrativa acessível",
    )

    # Stat 3 — Custoso
    replace_run_text(slide, "−53%", "Custoso")
    replace_run_text(
        slide,
        "queda relativa de precisão NL2SQL",
        "manter engajamento da comunidade",
    )
    replace_run_text(
        slide,
        "86,6% no Spider → 41% no banco real Petrobras",
        "responder, contextualizar, sugerir próximos passos",
    )

    # Conclusão rodapé
    replace_run_text(
        slide,
        "Objetivo da tese: framework multi-agente para o FMD, validado em planta automotiva real (Stellantis).",
        "Sem reduzir essa fricção, o observatório fica restrito à teoria. É aí que entra a IA Generativa.",
    )

    # Fontes
    replace_run_text(
        slide,
        "Fonte: Síntese cruzada dos 38 papers da RSL",
        "Fonte: Vieira (2022) · Cap. 5 (MPO)",
    )
    replace_run_text(
        slide,
        "Fonte: Medeiros et al. (2023) · LLM chatbot Ford Fiesta · MDPI Vehicles",
        "Fonte: OPTI-PE como caso prático",
    )
    replace_run_text(
        slide,
        "Fonte: Gao et al. (2024) · Nascimento et al. (2025)",
        "Fonte: Vieira (2022) · Seção 6.4 · Trabalhos Futuros",
    )


def fix_slide_4_escopo_fundamentacao(slide) -> None:
    """Q + A do framework SCQA.

    Card esquerdo: O QUE PROPOMOS (resposta = ObiOne)
    Card direito: ENDEREÇANDO O MPO (validação com stats fundamentais)
    """
    replace_run_text(slide, "MOTIVAÇÃO", "O QUE É O OBIONE")
    replace_run_text(
        slide, "Por que essa pesquisa?", "Observatório-de-portfólio para consultoria de projetos"
    )

    # Card esquerda — manifesto por persona
    replace_run_text(slide, "O CONTEXTO", "PARA QUEM E PARA QUÊ")
    replace_run_text(slide, "Dados industriais subutilizados", "Consultoria · Clientes · Comunidade")
    replace_run_text(
        slide,
        "O FMD (Framework de Mineração de Dados; Maciel et al.) define 7 camadas: coleta, governança, AutoML, visualização, deploy, arquitetura e validação.",
        "Consultoria: observa o portfólio como conhecimento estruturado, não como pasta de Drive.",
    )
    replace_run_text(
        slide,
        "Hoje, cada camada exige especialista técnico. Engenheiros de chão de fábrica não acessam dados de produção sem ajuda da TI.",
        "Cliente: acompanha o próprio projeto em linguagem acessível, sem depender de reunião.",
    )
    replace_run_text(
        slide,
        "Resultado: dados existem, mas decisões não são informadas por eles.",
        "Comunidade vira ativo: comentários, comparativos cross-projeto, IA mantém o tecido vivo.",
    )

    # Card direita — 3 diferenciais (vs.)
    replace_run_text(slide, "A LACUNA NA LITERATURA", "DIFERENCIAL")
    replace_run_text(slide, "Evidência da nossa RSL", "Combinação inédita em 3 vetores")

    replace_run_text(slide, "30 / 38", "vs. PM")
    replace_run_text(
        slide,
        "papers cobrem apenas a camada Coleta",
        "Jira, Trello: gerenciam tarefas e prazos",
    )
    replace_run_text(
        slide,
        "as 6 outras camadas estão sub-representadas",
        "ObiOne observa o projeto como objeto (MPO · 44 atributos)",
    )

    replace_run_text(slide, "1 / 38", "vs. BI")
    replace_run_text(
        slide, "paper testou em contexto automotivo", "Power BI, Looker: dashboards estáticos"
    )
    replace_run_text(
        slide,
        "manuais do Ford Fiesta (não dados de produção)",
        "ObiOne extrai significado de .docx com LLM",
    )

    replace_run_text(slide, "−53%", "vs. acad")
    replace_run_text(
        slide,
        "queda relativa de precisão NL2SQL",
        "OPTI-PE e similares: instrumentos de pesquisa",
    )
    replace_run_text(
        slide,
        "86,6% no Spider → 41% no banco real Petrobras",
        "ObiOne é operacional: consultoria + clientes no dia-a-dia",
    )

    # Conclusão
    replace_run_text(
        slide,
        "Objetivo da tese: framework multi-agente para o FMD, validado em planta automotiva real (Stellantis).",
        "Único a combinar observação MPO + extração com IA + comunidade ativa em uma só plataforma.",
    )

    # Fontes
    replace_run_text(
        slide,
        "Fonte: Síntese cruzada dos 38 papers da RSL",
        "Base: Quadro 37 (Vieira, 2022 · p. 264)",
    )
    replace_run_text(
        slide,
        "Fonte: Medeiros et al. (2023) · LLM chatbot Ford Fiesta · MDPI Vehicles",
        "Referência: OPTI-PE (Vieira, 2022 · Cap. 5)",
    )
    replace_run_text(
        slide,
        "Fonte: Gao et al. (2024) · Nascimento et al. (2025)",
        "Análise: levantamento de ferramentas de mercado",
    )


def fix_slide_5_cinco_grupos(slide) -> None:
    """A detalhada — 5 grupos G1-G5 com textos curtos (≤90 chars)."""
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
        "Extração via LLM dos atributos do Quadro 37 a partir de documentos .docx.",
    )
    # G2
    replace_run_text(slide, "Integração entre camadas", "Observação")
    replace_run_text(
        slide,
        "Nenhum framework cobre as 7 camadas de forma unificada. O máximo encontrado foi 5/7 camadas em um único trabalho (Keskin et al., 2025)",
        "Dashboard com cobertura do MPO. Cliente vê apenas o seu projeto.",
    )
    # G3
    replace_run_text(slide, "Benchmark vs. realidade", "Comunidade")
    replace_run_text(
        slide,
        "Performance cai drasticamente em bancos reais: 86,6% no Spider → 41% no banco industrial da Petrobras (46 pontos · Gao et al., 2024 · Nascimento et al., 2025)",
        "Auth, perfis semi-abertos, comentários e feed in-app.",
    )
    # G4
    replace_run_text(slide, "Pipeline vs. agentes", "IA-Assistente")
    replace_run_text(
        slide,
        "55% dos papers usam pipelines fixos sem capacidade de planejamento, memória ou uso de ferramentas externas",
        "Resumo do projeto (tradutora) + drafts assistidos (redutora de fricção).",
    )
    # G5
    replace_run_text(slide, "Validação automotiva", "Avaliação")
    replace_run_text(
        slide,
        "Apenas 1 de 38 papers testou em contexto automotivo (manuais do Ford Fiesta · Medeiros et al., 2023), escopo muito limitado",
        "Precisão · recall · F1 · Kappa em 3 projetos + Likert × 2 audiências.",
    )


def fix_slide_6_marcos(slide) -> None:
    """Cronograma 4 marcos sem menções pessoais."""
    replace_run_text(slide, "PROPOSTA DE PESQUISA", "CRONOGRAMA")
    replace_run_text(
        slide,
        "Plano de execução em três fases",
        "9 semanas restantes · 4 marcos · entrega 10/07/2026",
    )

    # M1 PREPARAÇÃO
    replace_run_text(slide, "FASE 1", "M1")
    replace_run_text(slide, "MVP", "PREPARAÇÃO")
    replace_run_texts_in_order(slide, "6–8 meses", ["22-28 mai", "29 mai - 11 jun"])
    replace_run_text(slide, "Orquestrador", "Atributos-alvo")
    replace_run_text(slide, "+ Coletor (NL2SQL)", "+ Protocolo de avaliação")
    replace_run_text(slide, "+ Visualizador (NL2VIS)", "+ Início dos gabaritos (3 projetos)")
    replace_run_text(
        slide,
        "Técnicas mais maduras na literatura (30 papers).",
        "Destrava todo o Sprint 1.",
    )
    replace_run_text(slide, "Artigo em conferência", "Status Report 1")

    # M2 PIPELINE
    replace_run_text(slide, "FASE 2", "M2")
    replace_run_text(slide, "Contribuição original", "PIPELINE")
    replace_run_text(slide, "Governança (LGPD)", "Cadastro · upload · auth")
    replace_run_text(slide, "+ AutoML", "+ Pipeline LLM nos 5 projetos")
    replace_run_text(
        slide,
        "Ataca os gaps onde não há publicações dedicadas.",
        "Núcleo técnico da extração de atributos.",
    )
    replace_run_text(slide, "Artigo em journal", "5 JSONs persistidos")

    # M3 DASHBOARD + IA
    replace_run_text(slide, "FASE 3", "M3")
    replace_run_text(slide, "Validação", "DASHBOARD + IA")
    replace_run_text(slide, "8–10 meses", "12-25 jun")
    replace_run_text(slide, "Deploy + Validador", "Cobertura · perfis · comentários")
    replace_run_text(slide, "+ Estudo de caso", "+ Resumo Cliente (IA)")
    replace_run_text(slide, "Stellantis (planta automotiva)", "+ Drafts assistidos (IA)")
    replace_run_text(
        slide,
        "Aproveita parceria institucional do grupo.",
        "Onde a comunidade vive.",
    )
    replace_run_text(slide, "Capítulos da tese", "Status Report 2 (19/06)")

    # M4 AVALIAÇÃO
    replace_run_text(slide, "ESCRITA", "M4")
    replace_run_text(slide, "Tese e defesa", "AVALIAÇÃO")
    replace_run_text(slide, "4–6 meses", "26 jun - 2 jul")
    replace_run_text(slide, "Redação Cap. 3-7", "Precisão · Recall · F1 · Kappa")
    replace_run_text(slide, "Revisão por orientador", "+ Likert × 2 audiências")
    replace_run_text(slide, "Defesa pública", "+ Exportação consolidada")
    replace_run_text(
        slide,
        "Buffer para correções e ajustes pós-banca.",
        "Fecha o ciclo DSR.",
    )
    replace_run_text(slide, "Tese defendida", "Relato + Apresentação")

    # Total (sem menção individual)
    replace_run_text(
        slide,
        "Total: 24–32 meses (deadline: dezembro 2028 = 32 meses)",
        "Escrita do relato: 3-9 jul · Apresentação final: 10/07",
    )

    # Remover caixa Plano B inteiramente (3 textboxes + 2 rectangles na região L>7.5 T>6)
    from pptx.util import Emu
    texts_to_delete = [
        "PLANO B (FASE 3)",
        "Caso a parceria Stellantis não formalize:",
        "Migrar para outra montadora regional ou planta de fornecedor (Tier 1) automotivo via grupo de pesquisa.",
    ]
    for t in texts_to_delete:
        shape = find_shape_by_text(slide, t)
        if shape:
            shape._element.getparent().remove(shape._element)
    # Remover shapes restantes na região da caixa (retângulos decorativos sem texto)
    for shape in list(slide.shapes):
        try:
            left_in = Emu(shape.left).inches if shape.left else 0
            top_in = Emu(shape.top).inches if shape.top else 0
            if left_in > 7.5 and 6.0 < top_in < 7.0:
                shape._element.getparent().remove(shape._element)
        except Exception:
            pass


def fix_slide_7_estamos_vs_proximos(slide) -> None:
    """Then-Now-Next: ESTÁ FEITO (Sprint 0) + PRÓXIMAS SEMANAS."""
    replace_run_text(slide, "PRÓXIMOS PASSOS", "ONDE ESTAMOS · O QUE VEM")
    replace_run_text(
        slide,
        "Decisões e posicionamentos",
        "Sprint 0 concluído e próximas semanas",
    )

    # Card esquerda
    replace_run_text(slide, "JÁ ESTOU FAZENDO", "ESTÁ FEITO")
    replace_run_text(slide, "Independente de aprovação", "Sprint 1 · esta semana")
    replace_run_text(slide, "Capítulo 2 da tese (RSL)", "Requisitos")
    replace_run_text(
        slide,
        "Todos os dados estão consolidados em formato estruturado.",
        "18 funcionais + 9 não funcionais em formato ficha.",
    )
    replace_run_text(slide, "Submissão do artigo da RSL", "Atributos-alvo do MPO")
    replace_run_text(
        slide,
        "Target: IEEE Access (preferência por Qualis maior se viável).",
        "44 atributos do Quadro 37 categorizados.",
    )
    replace_run_text(slide, "Implementação do MVP (Fase 1)", "Protocolo de avaliação")
    replace_run_text(
        slide,
        "Orquestrador + Coletor + Visualizador.",
        "Rubrica híbrida 0/0,5/1 + Kappa.",
    )

    # Card direita
    replace_run_text(slide, "POSIÇÕES QUE DEFENDO", "PRÓXIMAS SEMANAS")
    replace_run_text(slide, "Quero confirmação", "O que vem agora")
    replace_run_text(slide, "Manter as 5 RQs", "Sprint 2 (22 mai - 4 jun)")
    replace_run_text(
        slide,
        "O FMD é integrado por design. RQ1 é estrutural; RQ2/RQ3/RQ5 são técnicas; RQ4 é validação unificadora.",
        "Cadastro · upload · auth · pipeline LLM nos 5 projetos.",
    )
    replace_run_text(slide, "RQ4 com a Stellantis", "Gabaritos manuais")
    replace_run_text(
        slide,
        "Aproveitar a relação institucional do grupo de pesquisa para a Fase 3.",
        "Valença piloto · depois Freire Batista e Kaka JJ.",
    )
    replace_run_text(slide, "RSL fechada com 38 papers", "Status Report 2 (19/06)")
    replace_run_text(
        slide,
        "Saturação temática atingida. Fechar Capítulo 2.",
        "Dashboard + IA-Assistente operacionais.",
    )


def fix_slide_8_obrigado(slide) -> None:
    """Obrigado — sem menções individuais."""
    replace_run_text(
        slide,
        "Resultados da RSL  ·  Framework FMD-Agent  ·  Worklog",
        "github.com/raniel90/obione",
    )
    replace_run_text(
        slide,
        "{{AUTOR}}  ·  {{PROGRAMA}}  ·  {{INSTITUICAO}}",
        "Equipe ObiOne  ·  UPE/POLI",
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

    print(f"Duplicando slide 3 (cards lado-a-lado) para criar S+C (novo slide 3)...")
    duplicate_slide(prs, src_idx=2, dst_idx=3)
    print(f"  Total de slides agora: {len(prs.slides)}")

    print("Slide 1: capa...")
    fix_slide_1_capa(prs.slides[0])

    print("Slide 2: agenda (4 itens novos)...")
    fix_slide_2_agenda(prs.slides[1])

    print("Slide 3: S + C — Contextualização (problema + gap)...")
    fix_slide_3_contextualizacao(prs.slides[2])

    print("Slide 4: Q + A — Escopo + Fundamentação MPO...")
    fix_slide_4_escopo_fundamentacao(prs.slides[3])

    print("Slide 5: A detalhada — 5 grupos G1-G5...")
    fix_slide_5_cinco_grupos(prs.slides[4])

    print("Slide 6: Cronograma (M1-M4 + PLANO B)...")
    fix_slide_6_marcos(prs.slides[5])

    print("Slide 7: Status (Então-Agora-Próximo)...")
    fix_slide_7_estamos_vs_proximos(prs.slides[6])

    print("Slide 8: obrigado...")
    fix_slide_8_obrigado(prs.slides[7])

    # Substituir {{FOOTER}} textual em todos os slides
    print("\nSubstituindo {{FOOTER}} global...")
    footer_text = "Equipe ObiOne · UPE/POLI · Maio 2026"
    footer_count = 0
    for slide in prs.slides:
        footer_count += replace_run_text(slide, "{{FOOTER}}", footer_text)
    print(f"  {footer_count} footers textuais atualizados")

    print("\nAtualizando numeração de página (total=8)...")
    n = update_footers(prs, total=8)
    print(f"  {n} números de página atualizados")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(OUTPUT)
    print(f"\n✓ Salvo: {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
