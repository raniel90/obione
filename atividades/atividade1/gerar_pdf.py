#!/usr/bin/env python3
"""Gera PDF da proposta do Observatório ObiOne com identidade visual UPE-POLI."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Line, Rect
from reportlab.graphics import renderPDF
import os

# --- Cores UPE ---
AZUL_UPE = HexColor('#1B3A6B')
VERMELHO_UPE = HexColor('#E3232C')
CINZA_ESCURO = HexColor('#333333')
CINZA_CLARO = HexColor('#666666')
CINZA_LEVE = HexColor('#999999')
BRANCO = HexColor('#FFFFFF')

# --- Paths ---
BASE = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(BASE, 'upe_logo.png')
OUTPUT_PATH = os.path.join(BASE, 'proposta_observatorio_obione.pdf')

# --- Fontes ---
FONT_REGULAR = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'
FONT_ITALIC = 'Helvetica-Oblique'

# --- Largura útil ---
PAGE_W = A4[0]
MARGIN_L = 2.2 * cm
MARGIN_R = 2.2 * cm
USABLE_W = PAGE_W - MARGIN_L - MARGIN_R

# --- Estilos ---
style_header_inst = ParagraphStyle(
    'HeaderInst', fontName=FONT_BOLD, fontSize=9.5, textColor=AZUL_UPE,
    alignment=TA_CENTER, leading=13, spaceAfter=1
)
style_header_sub = ParagraphStyle(
    'HeaderSub', fontName=FONT_REGULAR, fontSize=7.5, textColor=CINZA_LEVE,
    alignment=TA_CENTER, leading=10, spaceAfter=0
)
style_title = ParagraphStyle(
    'Title', fontName=FONT_BOLD, fontSize=13.5, textColor=AZUL_UPE,
    alignment=TA_CENTER, leading=17, spaceBefore=0, spaceAfter=3
)
style_authors = ParagraphStyle(
    'Authors', fontName=FONT_REGULAR, fontSize=9.5, textColor=CINZA_ESCURO,
    alignment=TA_CENTER, leading=12, spaceAfter=1
)
style_discipline = ParagraphStyle(
    'Discipline', fontName=FONT_ITALIC, fontSize=8, textColor=CINZA_LEVE,
    alignment=TA_CENTER, leading=10, spaceAfter=0
)
style_section = ParagraphStyle(
    'Section', fontName=FONT_BOLD, fontSize=10, textColor=AZUL_UPE,
    alignment=TA_LEFT, leading=13, spaceBefore=6, spaceAfter=3
)
style_body = ParagraphStyle(
    'Body', fontName=FONT_REGULAR, fontSize=9.5, textColor=CINZA_ESCURO,
    alignment=TA_JUSTIFY, leading=12.5, spaceAfter=3,
    firstLineIndent=0.8 * cm
)
style_body_first = ParagraphStyle(
    'BodyFirst', parent=style_body, firstLineIndent=0
)
style_ref = ParagraphStyle(
    'Ref', fontName=FONT_REGULAR, fontSize=7.5, textColor=CINZA_ESCURO,
    alignment=TA_JUSTIFY, leading=9.5, spaceAfter=1.5,
    leftIndent=0.5 * cm, firstLineIndent=-0.5 * cm
)


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R
    )

    elements = []

    # --- Cabeçalho com logo centralizado ---
    logo = Image(LOGO_PATH, width=2.8 * cm, height=2.1 * cm)

    header_text = [
        Paragraph("UNIVERSIDADE DE PERNAMBUCO", style_header_inst),
        Paragraph("Escola Politécnica de Pernambuco (POLI)", style_header_sub),
        Paragraph("Programa de Pós-Graduação em Engenharia da Computação (PPGEC)", style_header_sub),
    ]

    header_table = Table(
        [[logo, header_text]],
        colWidths=[3.2 * cm, None]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 10),
        ('RIGHTPADDING', (-1, -1), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)

    # --- Linha separadora única (vermelho fino, elegante) ---
    elements.append(Spacer(1, 5 * mm))
    elements.append(HRFlowable(
        width="100%", thickness=1.5, color=VERMELHO_UPE,
        spaceAfter=6 * mm, spaceBefore=0
    ))

    # --- Título ---
    elements.append(Paragraph(
        "ObiOne: Um Observatório de Projetos Baseado "
        "em Inteligência Artificial Generativa",
        style_title
    ))

    elements.append(Spacer(1, 2 * mm))

    # --- Autores ---
    elements.append(Paragraph(
        "Bruno Rocha, Cynthia Oliveira, Moisés Junior, Raniel Silva",
        style_authors
    ))
    elements.append(Paragraph(
        "Tópicos Avançados em Engenharia de Software (TAES) | PPGEC/UPE",
        style_discipline
    ))

    elements.append(Spacer(1, 4 * mm))

    # --- Resumo ---
    elements.append(Paragraph("Resumo", style_section))

    p1 = (
        'A promoção da transparência na gestão de projetos tem se mostrado um desafio '
        'persistente para as organizações (Nunes <i>et al.</i>, 2017). Nesse contexto, os '
        'observatórios de projetos emergem como sistemas de informação capazes de apoiar a '
        'coleta, o armazenamento, a análise e a disseminação de dados sobre projetos, '
        'promovendo transparência e suportando a tomada de decisão (Vieira, 2022). O <i>Model '
        'for Projects Observatories</i> (MPO), proposto por Farias Jr. <i>et al.</i> (2025), '
        'oferece um modelo conceitual com 50 conceitos organizados em três dimensões '
        '(Estruturas, Processos e Agentes), validado por meio de grupos focais, <i>survey</i> '
        'com especialistas e estudos de caso. Contudo, a literatura aponta lacunas relevantes: '
        '(i) a coleta de dados heterogêneos e não estruturados permanece como fator crítico que '
        'limita a construção de observatórios (Vieira <i>et al.</i>, 2021); (ii) os processos de '
        'produção de conhecimento e inteligência dependem fortemente de intervenção humana '
        '(Vieira <i>et al.</i>, 2026); e (iii) todos os estudos empíricos foram conduzidos '
        'exclusivamente em contextos acadêmicos e públicos, não havendo validação em organizações '
        'privadas com projetos de domínios diversos.'
    )

    p2 = (
        'Paralelamente, avanços recentes em <i>Large Language Models</i> (LLMs) demonstram sua '
        'capacidade de extrair informações estruturadas de documentos não estruturados com elevada '
        'acurácia (Unstract, 2026), bem como sua relevância direta para competências de gestão de '
        'projetos (Karnouskos, 2024). Revisões sistemáticas apontam que a IA Generativa pode '
        'fortalecer a gestão do conhecimento em organizações, automatizando processos de coleta, '
        'categorização e disseminação (Nguyen <i>et al.</i>, 2025), além de viabilizar sistemas de '
        'informação mais transparentes e confiáveis (Kirchner, 2025). Ferramentas de IA para gestão '
        'de projetos já são investigadas sob uma perspectiva baseada em conhecimento, abrangendo '
        'áreas como escopo, risco, comunicação e <i>stakeholders</i> (Alenezi <i>et al.</i>, 2025).'
    )

    p3 = (
        'Este trabalho propõe o <b>ObiOne</b>, um observatório de projetos baseado no MPO com suporte '
        'de IA Generativa para endereçar as lacunas identificadas na literatura. Adotando o <i>Design '
        'Science Research</i> (DSR) como método de pesquisa (Hevner <i>et al.</i>, 2004), o estudo '
        'concentra-se em um ciclo composto por três etapas: (1) consciência do problema, a partir '
        'dos <i>gaps</i> mapeados nos trabalhos de Vieira (2022; 2025; 2026); (2) desenvolvimento '
        'do artefato, um observatório que utiliza LLMs para apoiar a coleta, a estruturação e a '
        'análise de dados de projetos a partir de documentos em formato livre, organizando-os segundo '
        'os conceitos do MPO e disponibilizando-os em um <i>dashboard</i> de observação do portfólio; '
        'e (3) avaliação do artefato mediante estudo de caso com cinco projetos reais de domínios '
        'distintos (jurídico, saúde, esporte e branding), adotando duas perspectivas: quantitativa, '
        'mensurando precisão, <i>recall</i> e cobertura dos conceitos do MPO; e qualitativa, por meio '
        'de questionário aplicado a <i>stakeholders</i> dos projetos sobre a utilidade e clareza do '
        'observatório.'
    )

    p4 = (
        'Espera-se que o ObiOne contribua para a evolução dos observatórios de projetos ao demonstrar '
        'como a inteligência artificial generativa pode apoiar processos de coleta, estruturação e '
        'geração de conhecimento sobre projetos, estendendo a aplicabilidade do MPO para contextos '
        'organizacionais privados e multissetoriais.'
    )

    elements.append(Paragraph(p1, style_body_first))
    elements.append(Paragraph(p2, style_body))
    elements.append(Paragraph(p3, style_body))
    elements.append(Paragraph(p4, style_body))

    # --- Referências ---
    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph("Referências", style_section))

    refs = [
        'Alenezi, M. <i>et al.</i> Artificial intelligence tools for project management: A knowledge-based perspective. <b>Procedia Computer Science</b>, 2025.',
        'Farias Jr., I. H. <i>et al.</i> A Conceptual Model for Project Observatories. <b>IEEE Access</b>, v. 13, p. 129143-129160, 2025.',
        'Hevner, A. R. <i>et al.</i> Design Science in Information Systems Research. <b>MIS Quarterly</b>, v. 28, n. 1, p. 75-105, 2004.',
        'Karnouskos, S. The Relevance of Large Language Models for Project Management. <b>IEEE Open J. of the Industrial Electronics Society</b>, v. 5, 2024.',
        'Kirchner, K. Generative AI Meets Knowledge Management. <b>Knowledge and Process Management</b>, Wiley, 2025.',
        'Nguyen, T. <i>et al.</i> A Systematic Review of Improving Knowledge Management with Generative AI and LLMs. <b>J. of Advances in Information Technology</b>, v. 16, n. 4, 2025.',
        'Nunes, V.; Cappelli, C.; Ralha, C. G. Transparency in Information Systems. <b>SBC</b>, 2017.',
        'Vieira, J. K. M. <i>Observatórios de Projetos: Um Modelo Conceitual</i>. Tese (Doutorado), CIn/UFPE, 2022.',
        'Vieira, J. K. M.; Farias Jr., I. H.; Moura, H. P. Observatories as Transparency Instruments for Projects. In: <b>CISTI</b>, IEEE, 2021.',
        'Vieira, J. K. M. <i>et al.</i> Utilization of a Conceptual Model in Projects Observatories Development: A Case Study. In: <b>SBSI</b>, 2026.',
    ]
    for r in refs:
        elements.append(Paragraph(r, style_ref))

    # --- Build ---
    doc.build(elements)
    print(f"PDF gerado: {OUTPUT_PATH}")
    print(f"Tamanho: {os.path.getsize(OUTPUT_PATH)} bytes")


if __name__ == '__main__':
    build_pdf()
