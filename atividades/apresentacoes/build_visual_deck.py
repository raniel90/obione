#!/usr/bin/env python3
"""Reconstrói o miolo da apresentação final com layouts visuais (diagramas,
prints reais, cards de número), reaproveitando capa/agenda/obrigado e a
identidade UPE/POLI do template status-report."""
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / ".claude/skills/apresentacao-poli"
sys.path.insert(0, str(BASE / "scripts"))

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx_helpers import update_footers

HERE = Path(__file__).resolve().parent
PRINTS = HERE / "prints"

NAVY = RGBColor(0x1F, 0x2A, 0x44)
RED = RGBColor(0xE0, 0x26, 0x1E)
GRAY = RGBColor(0x5B, 0x63, 0x72)
MUTED = RGBColor(0x8A, 0x90, 0x9C)
LIGHT = RGBColor(0xF2, 0xF3, 0xF5)
CARD = RGBColor(0xF6, 0xF7, 0xF9)
GREEN = RGBColor(0x2E, 0x7D, 0x5B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BORDER = RGBColor(0xDD, 0xE1, 0xE7)
FONT = "Arial"


def txt(slide, l, t, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    """runs: list of paragraphs; each paragraph is list of (text,size,color,bold,italic)."""
    tb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for i, para in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(4)
        for (text, size, color, bold, italic) in para:
            r = p.add_run()
            r.text = text
            f = r.font
            f.name = FONT
            f.size = Pt(size)
            f.bold = bold
            f.italic = italic
            f.color.rgb = color
    return tb


def eyebrow(slide, text):
    txt(slide, 0.55, 0.5, 12.2, 0.3, [[(text.upper(), 12, RED, True, False)]])


def title(slide, text, size=30):
    txt(slide, 0.55, 0.88, 11.2, 1.0, [[(text, size, NAVY, True, False)]])


def rect(slide, l, t, w, h, fill, line=None, rounded=True):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE,
        Inches(l), Inches(t), Inches(w), Inches(h))
    shp.shadow.inherit = False
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(1)
    return shp


def set_text(shp, paras, anchor=MSO_ANCHOR.MIDDLE):
    tf = shp.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = Inches(0.12)
    tf.margin_right = Inches(0.12)
    tf.margin_top = Inches(0.06)
    tf.margin_bottom = Inches(0.06)
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(2)
        for (text, size, color, bold) in para:
            r = p.add_run()
            r.text = text
            f = r.font
            f.name = FONT
            f.size = Pt(size)
            f.bold = bold
            f.color.rgb = color


def arrow(slide, l, t, w, h, color=RED):
    shp = slide.shapes.add_shape(MSO_SHAPE.CHEVRON, Inches(l), Inches(t), Inches(w), Inches(h))
    shp.shadow.inherit = False
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    shp.line.fill.background()
    return shp


def picture(slide, path, l, t, h=None, w=None):
    kw = {}
    if h is not None:
        kw["height"] = Inches(h)
    if w is not None:
        kw["width"] = Inches(w)
    pic = slide.shapes.add_picture(str(path), Inches(l), Inches(t), **kw)
    pic.line.color.rgb = BORDER
    pic.line.width = Pt(1.25)
    return pic


def clean_content_slide(slide):
    """Mantém logo (picture) e rodapé (top>6.8in); remove eyebrow/título/bullets."""
    for sh in list(slide.shapes):
        is_pic = sh.shape_type == 13
        top_in = sh.top / 914400 if sh.top is not None else 0
        # mantém só o logo (imagem no topo) e o rodapé (rodapé/paginação embaixo)
        if (is_pic and top_in < 0.6) or top_in > 6.8:
            continue
        sh._element.getparent().remove(sh._element)


# ─────────────────────────────────────────────────────────────────────────────
def slide_problema(s):
    eyebrow(s, "O problema")
    title(s, "O conhecimento dos projetos se perde")
    txt(s, 0.55, 1.95, 12.0, 0.4,
        [[("Consultorias vivem de conhecimento, e ele evapora entre um projeto e o outro.", 16, GRAY, False, False)]])
    cards = [
        ("Fica na cabeça das pessoas", "O próximo projeto recomeça do zero"),
        ("O sênior vira gargalo", "Só ele conecta os pontos entre projetos"),
        ("O cliente fica fora do laço", "E não dá para abrir tudo entre clientes"),
    ]
    w, gap, t, h = 3.85, 0.28, 3.0, 2.5
    x = 0.55
    for head, sub in cards:
        c = rect(s, x, t, w, h, CARD, line=BORDER)
        set_text(c, [[(head, 16, NAVY, True)], [(sub, 12.5, GRAY, False)]], anchor=MSO_ANCHOR.MIDDLE)
        x += w + gap


def slide_solucao(s):
    eyebrow(s, "A solução")
    title(s, "Um observatório que vira memória viva")
    txt(s, 0.55, 1.95, 12.0, 0.4,
        [[("O ciclo do valor, ancorado no MPO (Vieira, 2022), com comunidade e IA assistiva.", 16, GRAY, False, False)]])
    steps = ["Observação", "Discussão", "Conhecimento"]
    w, t, h = 3.3, 3.1, 1.25
    xs = [0.9, 5.0, 9.1]
    for i, (x, st) in enumerate(zip(xs, steps)):
        b = rect(s, x, t, w, h, NAVY)
        set_text(b, [[(st, 18, WHITE, True)]])
        if i < 2:
            arrow(s, x + w + 0.02, t + 0.42, 0.62, 0.42)
    band = rect(s, 0.9, 5.05, 11.5, 0.95, LIGHT, line=BORDER)
    set_text(band, [[("Vira base de conhecimento reaproveitável por projetos futuros", 15, NAVY, True)]])


def slide_jornada(s):
    eyebrow(s, "A jornada")
    title(s, "Do cadastro ao aprendizado, com a IA acelerando")
    steps = [("Cadastro", True), ("Observação", False), ("Conversa", False),
             ("Consolidação", True), ("Reuso", False)]
    w, t, h = 2.15, 3.2, 1.15
    xs = [0.55, 3.02, 5.49, 7.96, 10.43]
    for i, (x, (st, ia)) in enumerate(zip(xs, steps)):
        b = rect(s, x, t, w, h, NAVY if not ia else RED)
        label = [[(st, 15, WHITE, True)]]
        if ia:
            label.append([("com IA", 11, WHITE, False)])
        set_text(b, label)
        if i < 4:
            arrow(s, x + w + 0.02, t + 0.4, 0.4, 0.35, color=MUTED)
    txt(s, 0.55, 5.0, 12.0, 0.5,
        [[("A IA acelera as pontas trabalhosas; o consultor decide.", 16, GRAY, False, False)]])


def slide_shot(s, eb, ttl, img, caption_lines):
    eyebrow(s, eb)
    title(s, ttl)
    picture(s, img, 5.35, 2.15, 4.75)
    # caption à esquerda
    paras = []
    for line in caption_lines:
        paras.append([("›  ", 15, RED, True, False), (line, 15, NAVY, False, False)])
    txt(s, 0.55, 2.7, 4.5, 4.0, paras, anchor=MSO_ANCHOR.TOP)


def slide_shot_wide(s, eb, ttl, img, caption):
    eyebrow(s, eb)
    title(s, ttl)
    txt(s, 0.55, 1.95, 12.2, 0.4, [[(caption, 15.5, GRAY, False, False)]])
    w = 10.4
    picture(s, img, (13.33 - w) / 2, 2.6, w=w)


def slide_ia(s):
    eyebrow(s, "IA com revisão humana")
    title(s, "A IA sugere, o humano decide")
    steps = [("IA propõe\no rascunho", RED), ("O consultor\nrevisa", NAVY), ("Publicado\ne auditável", NAVY)]
    w, t, h = 3.1, 3.15, 1.35
    xs = [1.0, 5.1, 9.2]
    for i, (x, (st, col)) in enumerate(zip(xs, steps)):
        b = rect(s, x, t, w, h, col)
        set_text(b, [[(seg, 16, WHITE, True)] for seg in st.split("\n")])
        if i < 2:
            arrow(s, x + w + 0.02, t + 0.48, 0.55, 0.4, color=MUTED)
    txt(s, 0.55, 5.05, 12.0, 0.6,
        [[("A IA nunca escreve direto: propõe, o consultor publica. Cada sugestão fica registrada com provedor, modelo e momento.", 15, GRAY, False, False)]])


def slide_validacao(s):
    eyebrow(s, "Validação")
    title(s, "Valor percebido, com um alerta honesto")
    txt(s, 0.55, 1.95, 12.0, 0.4,
        [[("Design Science Research, reportado como casos (sem inferência estatística).", 15, GRAY, False, False)]])
    cards = [
        ("N = 8", "participantes · duas rodadas", NAVY),
        ("5,0", "governança e comunidade · nota máxima", GREEN),
        ("3,8", "clareza · o ponto a evoluir", RED),
    ]
    w, gap, t, h = 3.85, 0.28, 2.95, 2.5
    x = 0.55
    for big, label, accent in cards:
        c = rect(s, x, t, w, h, CARD, line=BORDER)
        bar = rect(s, x, t, w, 0.12, accent, rounded=False)
        set_text(c, [[(big, 46, NAVY, True)], [(label, 13.5, GRAY, False)]])
        x += w + gap


def slide_demo(s):
    eyebrow(s, "Demonstração")
    title(s, "Agora, o fluxo real")
    steps = ["Cadastro\ncom IA", "Observação", "Conversa", "Consolidação\ncom IA", "Reaprovei-\ntamento", "Cliente\nisolado"]
    w, t, h = 1.92, 3.3, 1.5
    xs = [0.5, 2.56, 4.62, 6.68, 8.74, 10.8]
    for i, (x, st) in enumerate(zip(xs, steps)):
        circ = slide_circle(s, x + w / 2 - 0.28, t - 0.7, 0.56, str(i + 1))
        b = rect(s, x, t, w, h, LIGHT, line=BORDER)
        set_text(b, [[(seg, 13.5, NAVY, True)] for seg in st.split("\n")])
    txt(s, 0.55, 5.15, 12.0, 0.5,
        [[("O golden path completo, ao vivo: da entrada do projeto à participação segura do cliente.", 16, GRAY, False, False)]])


def slide_circle(s, l, t, d, num):
    c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(l), Inches(t), Inches(d), Inches(d))
    c.shadow.inherit = False
    c.fill.solid()
    c.fill.fore_color.rgb = RED
    c.line.fill.background()
    set_text(c, [[(num, 18, WHITE, True)]])
    return c


def slide_valor(s):
    eyebrow(s, "Valor entregue")
    title(s, "A jornada roda de ponta a ponta")
    items = ["Isolamento do cliente", "Reaproveitamento", "Engajamento", "IA copiloto"]
    w, gap, t, h = 2.85, 0.22, 3.05, 1.5
    x = 0.55
    for it in items:
        c = rect(s, x, t, w, h, CARD, line=BORDER)
        set_text(c, [[("✓", 20, GREEN, True)], [(it, 14, NAVY, True)]])
        x += w + gap
    txt(s, 0.55, 5.2, 12.0, 0.9,
        [[("Replicável e demoável. ", 16, NAVY, True, False),
          ("A seguir: navegação guiada e avaliação da fidelidade da extração do MPO.", 16, GRAY, False, False)]])


BUILDERS = [
    slide_problema, slide_solucao, slide_jornada,
    lambda s: slide_shot(s, "O diferencial · cliente com muralha", "O cliente dentro, sem ver os outros",
                         PRINTS / "cliente_novidades.png",
                         ["Vê e acessa só o seu projeto", "Participa da conversa", "As novidades o trazem de volta"]),
    lambda s: slide_shot_wide(s, "Reaproveitamento", "O conhecimento atravessa projetos",
                              PRINTS / "aprendizados_dominio_bloco.png",
                              "Aprendizados de outros projetos afloram no domínio; a Conectora sintetiza padrões sob demanda."),
    slide_ia, slide_validacao, slide_demo, slide_valor,
]


def sub_runs(prs, replacements):
    """Substituição de substring em todos os runs (capa, rodapé, encerramento)."""
    for slide in prs.slides:
        for sh in slide.shapes:
            if not sh.has_text_frame:
                continue
            for para in sh.text_frame.paragraphs:
                for run in para.runs:
                    for old, new in replacements:
                        if old in run.text:
                            run.text = run.text.replace(old, new)


def main():
    src = HERE / "ObiOne_Apresentacao_Final.pptx"
    prs = Presentation(str(src))
    content_idx = list(range(2, 2 + len(BUILDERS)))  # slides 2..10
    for idx, build in zip(content_idx, BUILDERS):
        s = prs.slides[idx]
        clean_content_slide(s)
        build(s)
    sub_runs(prs, [
        ("Doutorado PPGEC · Tópicos Avançados em Engenharia de Software",
         "Tópicos Avançados em Engenharia de Software"),
        ("Doutorado PPGEC", "TAES"),
        ("Discussão e perguntas", "Veremos ao vivo"),
    ])
    update_footers(prs)
    out = HERE / "ObiOne_Apresentacao_Final.pptx"
    prs.save(str(out))
    print(f"✓ {out}")


if __name__ == "__main__":
    main()
