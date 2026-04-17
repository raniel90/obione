#!/usr/bin/env python3
"""Gera PDF da proposta do Observatório Orion com identidade visual UPE-POLI."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# --- Cores UPE ---
AZUL_UPE = HexColor('#1B3A6B')
VERMELHO_UPE = HexColor('#E3232C')
CINZA_ESCURO = HexColor('#333333')
CINZA_CLARO = HexColor('#666666')
BRANCO = HexColor('#FFFFFF')

# --- Paths ---
BASE = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(BASE, 'upe_logo.png')
OUTPUT_PATH = os.path.join(BASE, 'proposta_observatorio_orion.pdf')

# --- Fontes ---
# Tentar usar Helvetica (similar a Swis721 BT da identidade UPE)
FONT_REGULAR = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'
FONT_ITALIC = 'Helvetica-Oblique'
FONT_BOLD_ITALIC = 'Helvetica-BoldOblique'

# --- Estilos ---
style_header_inst = ParagraphStyle(
    'HeaderInst', fontName=FONT_BOLD, fontSize=9, textColor=AZUL_UPE,
    alignment=TA_CENTER, leading=12, spaceAfter=0
)
style_header_sub = ParagraphStyle(
    'HeaderSub', fontName=FONT_REGULAR, fontSize=8, textColor=CINZA_CLARO,
    alignment=TA_CENTER, leading=10, spaceAfter=0
)
style_title = ParagraphStyle(
    'Title', fontName=FONT_BOLD, fontSize=14, textColor=AZUL_UPE,
    alignment=TA_CENTER, leading=18, spaceBefore=6, spaceAfter=4
)
style_authors = ParagraphStyle(
    'Authors', fontName=FONT_REGULAR, fontSize=10, textColor=CINZA_ESCURO,
    alignment=TA_CENTER, leading=13, spaceAfter=2
)
style_discipline = ParagraphStyle(
    'Discipline', fontName=FONT_ITALIC, fontSize=8.5, textColor=CINZA_CLARO,
    alignment=TA_CENTER, leading=11, spaceAfter=4
)
style_section = ParagraphStyle(
    'Section', fontName=FONT_BOLD, fontSize=11, textColor=AZUL_UPE,
    alignment=TA_LEFT, leading=14, spaceBefore=8, spaceAfter=4
)
style_body = ParagraphStyle(
    'Body', fontName=FONT_REGULAR, fontSize=9.5, textColor=CINZA_ESCURO,
    alignment=TA_JUSTIFY, leading=13, spaceAfter=4,
    firstLineIndent=1.0*cm
)
style_body_first = ParagraphStyle(
    'BodyFirst', parent=style_body, firstLineIndent=0
)
style_ref = ParagraphStyle(
    'Ref', fontName=FONT_REGULAR, fontSize=8, textColor=CINZA_ESCURO,
    alignment=TA_JUSTIFY, leading=10, spaceAfter=2,
    leftIndent=0.6*cm, firstLineIndent=-0.6*cm
)

def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=A4,
        topMargin=1.2*cm, bottomMargin=1.5*cm,
        leftMargin=2.0*cm, rightMargin=2.0*cm
    )

    elements = []

    # --- Cabeçalho com logo ---
    logo = Image(LOGO_PATH, width=3.8*cm, height=2.85*cm)

    header_text = [
        Paragraph("UNIVERSIDADE DE PERNAMBUCO", style_header_inst),
        Paragraph("Escola Politécnica de Pernambuco — POLI", style_header_sub),
        Paragraph("Programa de Pós-Graduação em Engenharia da Computação — PPGEC", style_header_sub),
        Paragraph("Tópicos Avançados em Engenharia de Software — TAES", style_header_sub),
    ]

    header_table = Table(
        [[logo, header_text]],
        colWidths=[4.2*cm, None]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 8),
        ('RIGHTPADDING', (-1, -1), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)

    # Linha vermelha + azul (identidade UPE)
    elements.append(Spacer(1, 4*mm))
    elements.append(HRFlowable(
        width="100%", thickness=2, color=VERMELHO_UPE,
        spaceAfter=1*mm, spaceBefore=0
    ))
    elements.append(HRFlowable(
        width="100%", thickness=0.5, color=AZUL_UPE,
        spaceAfter=4*mm, spaceBefore=0
    ))

    # --- Título ---
    elements.append(Paragraph(
        "Orion: Um Observatório de Projetos Potencializado<br/>"
        "por Inteligência Artificial Generativa",
        style_title
    ))

    elements.append(Spacer(1, 2*mm))

    # --- Autores ---
    elements.append(Paragraph(
        "Bruno Rocha, Cynthia Oliveira, Moisés Junior, Raniel Silva",
        style_authors
    ))
    elements.append(Paragraph(
        "Disciplina: Tópicos Avançados em Engenharia de Software (TAES) — PPGEC/UPE",
        style_discipline
    ))

    elements.append(Spacer(1, 2*mm))

    # --- Resumo ---
    elements.append(Paragraph("Resumo", style_section))

    p1 = (
        'A promoção da transparência na gestão de projetos tem se mostrado um desafio '
        'persistente para as organizações (Nunes <i>et al.</i>, 2017). Nesse contexto, os '
        'observatórios de projetos emergem como sistemas de informação capazes de apoiar a '
        'coleta, o armazenamento, a análise e a disseminação de dados sobre projetos, '
        'promovendo transparência e suportando a tomada de decisão (Vieira, 2022). O <i>Model '
        'for Projects Observatories</i> (MPO), proposto por Farias Jr. <i>et al.</i> (2025), '
        'oferece um modelo conceitual com 50 conceitos organizados em três dimensões — '
        'Estruturas, Processos e Agentes — validado por meio de grupos focais, <i>survey</i> '
        'com especialistas e estudos de caso. Contudo, a literatura aponta lacunas relevantes: '
        '(i) a coleta de dados heterogêneos e não-estruturados permanece como fator crítico que '
        'limita a construção de observatórios (Vieira <i>et al.</i>, 2021); (ii) os processos de '
        'produção de conhecimento e inteligência dependem fortemente de intervenção humana '
        '(Vieira <i>et al.</i>, 2026); e (iii) todos os estudos empíricos foram conduzidos '
        'exclusivamente em contextos acadêmicos e públicos, não havendo validação em organizações '
        'privadas com projetos de domínios diversos.'
    )

    p2 = (
        'Paralelamente, avanços recentes em <i>Large Language Models</i> (LLMs) demonstram sua '
        'capacidade de extrair informações estruturadas de documentos não-estruturados com elevada '
        'acurácia (Unstract, 2026), bem como sua relevância direta para competências de gestão de '
        'projetos (Karnouskos, 2024). Revisões sistemáticas apontam que a IA Generativa pode '
        'potencializar a gestão do conhecimento em organizações, automatizando processos de coleta, '
        'categorização e disseminação (Nguyen <i>et al.</i>, 2025), além de viabilizar sistemas de '
        'informação mais transparentes e confiáveis (Kirchner, 2025). Ferramentas de IA para gestão '
        'de projetos já são investigadas sob uma perspectiva baseada em conhecimento, abrangendo '
        'áreas como escopo, risco, comunicação e <i>stakeholders</i> (Alenezi <i>et al.</i>, 2025).'
    )

    p3 = (
        'Este trabalho propõe o <b>Orion</b>, um observatório de projetos que integra IA Generativa '
        'ao MPO para endereçar as lacunas identificadas. Adotando o <i>Design Science Research</i> '
        '(DSR) como método de pesquisa (Hevner <i>et al.</i>, 2004), o estudo contempla os ciclos '
        'de: (1) <b>consciência do problema</b>, a partir dos <i>gaps</i> mapeados nos trabalhos de '
        'Vieira (2022; 2025; 2026); (2) <b>sugestão e desenvolvimento</b> do artefato — um protótipo '
        'de observatório que utiliza LLMs para extração automática de entidades de documentos de '
        'projetos, normalização e padronização de dados heterogêneos, classificação temática por '
        'similaridade semântica, geração de análises <i>cross-project</i> e relatórios automatizados, '
        'e interface conversacional para consulta em linguagem natural; e (3) <b>avaliação</b> do '
        'artefato mediante estudo de caso com um portfólio real de cinco projetos privados de domínios '
        'distintos (jurídico, saúde, esporte e branding), avaliando a cobertura dos conceitos do MPO '
        'e a contribuição da IA Generativa para os processos do observatório. Os projetos do estudo '
        'de caso envolvem dados sensíveis, dados parciais e requisitos de LGPD, permitindo também '
        'avaliar aspectos de governança e segurança previstos no modelo.'
    )

    p4 = (
        'Espera-se que o Orion demonstre como a IA Generativa pode: (a) viabilizar a coleta '
        'automatizada de dados de projetos a partir de fontes não-estruturadas; (b) reduzir a '
        'dependência de equipes dedicadas nos processos de análise e disseminação; (c) ampliar a '
        'interatividade e usabilidade do observatório; e (d) estender a aplicabilidade do MPO para '
        'contextos organizacionais privados e multissetoriais, contribuindo para a evolução do '
        'modelo e da pesquisa em observatórios de projetos.'
    )

    elements.append(Paragraph(p1, style_body_first))
    elements.append(Paragraph(p2, style_body))
    elements.append(Paragraph(p3, style_body))
    elements.append(Paragraph(p4, style_body))

    # --- Referências ---
    elements.append(Spacer(1, 2*mm))
    elements.append(Paragraph("Referências", style_section))

    refs = [
        'Alenezi, M. <i>et al.</i> Artificial intelligence tools for project management: A knowledge-based perspective. <b>Procedia Computer Science</b>, 2025.',
        'Farias Jr., I. H. <i>et al.</i> A Conceptual Model for Project Observatories. <b>IEEE Access</b>, v. 13, p. 129143–129160, 2025.',
        'Hevner, A. R. <i>et al.</i> Design Science in Information Systems Research. <b>MIS Quarterly</b>, v. 28, n. 1, p. 75–105, 2004.',
        'Karnouskos, S. The Relevance of Large Language Models for Project Management. <b>IEEE Open J. of the Industrial Electronics Society</b>, v. 5, 2024.',
        'Kirchner, K. Generative AI Meets Knowledge Management. <b>Knowledge and Process Management</b>, Wiley, 2025.',
        'Nguyen, T. <i>et al.</i> A Systematic Review of Improving Knowledge Management with Generative AI and LLMs. <b>J. of Advances in Information Technology</b>, v. 16, n. 4, 2025.',
        'Nunes, V.; Cappelli, C.; Ralha, C. G. Transparency in Information Systems. <b>SBC</b>, 2017.',
        'Vieira, J. K. M. <i>Observatórios de Projetos: Um Modelo Conceitual</i>. Tese (Doutorado) — CIn/UFPE, 2022.',
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
