#!/usr/bin/env python3
"""Reconstrói o miolo da apresentação final com layouts visuais (diagramas,
prints reais, cards de número, camada de IA e experimento detalhado),
reaproveitando capa/agenda/obrigado e a identidade UPE/POLI."""
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / ".claude/skills/apresentacao-poli"
sys.path.insert(0, str(BASE / "scripts"))

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx_helpers import update_footers, delete_slide_by_index

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
    txt(slide, 0.55, 0.88, 12.2, 1.0, [[(text, size, NAVY, True, False)]])


def subtitle(slide, text):
    txt(slide, 0.55, 1.9, 12.2, 0.4, [[(text, 15.5, GRAY, False, False)]])


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


def set_text(shp, paras, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER):
    tf = shp.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for m in ("margin_left", "margin_right"):
        setattr(tf, m, Inches(0.14))
    tf.margin_top = Inches(0.06)
    tf.margin_bottom = Inches(0.06)
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(3)
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


def stat_card(slide, l, t, w, h, big, label, accent):
    rect(slide, l, t, w, h, CARD, line=BORDER)
    rect(slide, l, t, w, 0.12, accent, rounded=False)
    inner = txt(slide, l, t + 0.28, w, h - 0.4,
                [[(big, 42, NAVY, True, False)], [(label, 13, GRAY, False, False)]],
                align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    return inner


def panel(slide, l, t, w, h, header, rows):
    rect(slide, l, t, w, h, CARD, line=BORDER)
    tb = slide.shapes.add_textbox(Inches(l + 0.25), Inches(t + 0.22), Inches(w - 0.5), Inches(h - 0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run(); r.text = header.upper()
    r.font.name = FONT; r.font.size = Pt(12); r.font.bold = True; r.font.color.rgb = RED
    p.space_after = Pt(10)
    for head, desc in rows:
        ph = tf.add_paragraph(); ph.space_before = Pt(6); ph.space_after = Pt(1)
        rh = ph.add_run(); rh.text = head
        rh.font.name = FONT; rh.font.size = Pt(14.5); rh.font.bold = True; rh.font.color.rgb = NAVY
        pd = tf.add_paragraph(); pd.space_after = Pt(4)
        rd = pd.add_run(); rd.text = desc
        rd.font.name = FONT; rd.font.size = Pt(12.5); rd.font.color.rgb = GRAY


def clean_content_slide(slide):
    for sh in list(slide.shapes):
        is_pic = sh.shape_type == 13
        top_in = sh.top / 914400 if sh.top is not None else 0
        if (is_pic and top_in < 0.6) or top_in > 6.8:
            continue
        sh._element.getparent().remove(sh._element)


# ─────────────────────────────────────────────────────────────────────────────
def slide_problema(s):
    eyebrow(s, "O problema")
    title(s, "O conhecimento dos projetos se perde")
    subtitle(s, "Consultorias vivem de conhecimento, e ele evapora entre um projeto e o outro.")
    cards = [
        ("Fica na cabeça das pessoas", "O próximo projeto recomeça do zero"),
        ("Depende sempre dos mesmos", "Só quem tem estrada liga os pontos entre projetos"),
        ("O cliente fica fora do laço", "E não dá para abrir tudo entre clientes"),
    ]
    w, gap, t, h = 3.85, 0.28, 3.0, 2.5
    x = 0.55
    for head, sub in cards:
        c = rect(s, x, t, w, h, CARD, line=BORDER)
        set_text(c, [[(head, 16, NAVY, True)], [(sub, 12.5, GRAY, False)]])
        x += w + gap


def slide_solucao(s):
    eyebrow(s, "A solução")
    title(s, "Um observatório que vira memória viva")
    subtitle(s, "O ciclo do valor, ancorado no MPO (Vieira, 2022), com comunidade e IA assistiva.")
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


def slide_ia_layer(s):
    eyebrow(s, "A camada de IA")
    title(s, "Assistiva, ancorada e auditável")
    subtitle(s, "A IA acelera cada ponta do ciclo, sempre com o consultor no comando.")
    panel(s, 0.55, 2.5, 5.9, 4.05, "Papéis da IA no ciclo", [
        ("Configuradora", "No cadastro: propõe o domínio e o que acompanhar"),
        ("Observadora", "Sugere observações à luz do MPO"),
        ("Sintetizadora", "Consolida o aprendizado da conversa"),
        ("Conectora", "Sintetiza padrões entre projetos do domínio"),
    ])
    panel(s, 6.9, 2.5, 5.9, 4.05, "Como confiamos", [
        ("A IA propõe, o humano decide", "Nunca escreve direto: o consultor revisa e publica"),
        ("Grounding no MPO + saída estruturada", "Responde no formato de dados e não inventa atributos"),
        ("Proveniência registrada", "Cada sugestão guarda provedor, modelo e momento"),
    ])


def slide_shot(s, eb, ttl, img, caption_lines):
    eyebrow(s, eb)
    title(s, ttl)
    picture(s, img, 5.35, 2.15, h=4.75)
    paras = [[("›  ", 15, RED, True, False), (line, 15, NAVY, False, False)] for line in caption_lines]
    txt(s, 0.55, 2.7, 4.5, 4.0, paras, anchor=MSO_ANCHOR.TOP)


def slide_shot_wide(s, eb, ttl, img, caption):
    eyebrow(s, eb)
    title(s, ttl)
    subtitle(s, caption)
    w = 10.4
    picture(s, img, (13.33 - w) / 2, 2.6, w=w)


def slide_experimento(s):
    eyebrow(s, "O experimento")
    title(s, "Design Science Research, avaliado em uso real")
    steps = ["Construir\no artefato", "Demonstrar\nem uso real", "Avaliar\na percepção"]
    w, t, h = 3.2, 2.35, 1.15
    xs = [0.9, 5.06, 9.22]
    for i, (x, st) in enumerate(zip(xs, steps)):
        b = rect(s, x, t, w, h, NAVY)
        set_text(b, [[(seg, 15, WHITE, True)] for seg in st.split("\n")])
        if i < 2:
            arrow(s, x + w + 0.02, t + 0.4, 0.55, 0.36, color=MUTED)
    c1 = rect(s, 0.9, 4.0, 5.55, 1.55, CARD, line=BORDER)
    set_text(c1, [[("Instrumento", 14.5, RED, True)],
                  [("12 afirmações Likert (1 a 5) e 3 perguntas abertas, após um walkthrough", 13, NAVY, False)]],
             anchor=MSO_ANCHOR.MIDDLE)
    c2 = rect(s, 6.85, 4.0, 5.55, 1.55, CARD, line=BORDER)
    set_text(c2, [[("Amostra", 14.5, RED, True)],
                  [("2 rodadas de 4 consultores (N=8), uma consultoria real; 2ª rodada após onboarding", 13, NAVY, False)]],
             anchor=MSO_ANCHOR.MIDDLE)
    txt(s, 0.9, 5.75, 11.5, 0.5,
        [[("Perspectiva do consultor. Reportado como casos, sem inferência estatística.", 13, MUTED, False, True)]])


def slide_resultados(s):
    eyebrow(s, "Resultados")
    title(s, "Valor percebido, com um ponto de atenção")
    cards = [
        ("4,3 / 5", "média acumulada (8 consultores)", GREEN),
        ("N = 8", "2 rodadas de 4 · uma consultoria", NAVY),
        ("83%", "das respostas foram nota 4 ou 5", NAVY),
    ]
    w, gap, t, h = 3.85, 0.28, 2.35, 2.15
    x = 0.55
    for big, label, accent in cards:
        stat_card(s, x, t, w, h, big, label, accent)
        x += w + gap
    txt(s, 0.55, 4.75, 12.3, 0.7,
        [[("1ª rodada 4,48; a 2ª foi mais crítica (4,1). Aprendizados e governança no topo "
           "(5,0 na 1ª rodada); clareza estável em 3,8, a fronteira de adoção.", 15, NAVY, False, False)]])
    txt(s, 0.55, 5.85, 12.3, 0.6,
        [[("Nas respostas abertas o valor apareceu no aprendizado consolidado com IA; "
           "as críticas convergem para clareza e navegação.", 13.5, GRAY, False, True)]])


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
    txt(s, 0.55, 5.2, 12.2, 0.9,
        [[("Replicável e demoável. ", 16, NAVY, True, False),
          ("A seguir: navegação guiada e avaliação da fidelidade da extração do MPO.", 16, GRAY, False, False)]])


BUILDERS = [
    slide_problema,
    slide_solucao,
    slide_ia_layer,
    lambda s: slide_shot(s, "O diferencial · cliente com muralha", "O cliente dentro, sem ver os outros",
                         PRINTS / "cliente_novidades.png",
                         ["Vê e acessa só o seu projeto", "Participa da conversa", "As novidades o trazem de volta"]),
    lambda s: slide_shot_wide(s, "Reaproveitamento", "O conhecimento atravessa projetos",
                              PRINTS / "aprendizados_dominio_bloco.png",
                              "Aprendizados de outros projetos afloram no domínio; a Conectora sintetiza padrões sob demanda."),
    slide_experimento,
    slide_resultados,
    slide_valor,
]


def sub_runs(prs, replacements):
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
    n = len(BUILDERS)
    obrigado_idx = len(prs.slides._sldIdLst) - 1  # último slide é o "Obrigado"
    for i, build in enumerate(BUILDERS):
        s = prs.slides[2 + i]
        clean_content_slide(s)
        build(s)
    # remove slides de conteúdo em excesso (entre o último construído e o Obrigado)
    for idx in range(obrigado_idx - 1, 2 + n - 1, -1):
        delete_slide_by_index(prs, idx)
    sub_runs(prs, [
        ("Doutorado PPGEC · Tópicos Avançados em Engenharia de Software",
         "Tópicos Avançados em Engenharia de Software"),
        ("Doutorado PPGEC", "TAES"),
        ("Discussão e perguntas", "Veremos ao vivo"),
        # agenda alinhada à nova estrutura
        ("A jornada de valor", "A camada de IA"),
        ("O ciclo funcionando", "IA assistiva, com revisão humana"),
        ("Diferencial e IA", "Diferencial e reaproveitamento"),
        ("Cliente dentro, IA copiloto", "Cliente com muralha e reuso"),
        ("Validação e valor", "Experimento e valor"),
        ("Evidência e entrega", "Método, resultados e entrega"),
    ])
    update_footers(prs)
    prs.save(str(src))
    print(f"✓ {src} · {len(prs.slides._sldIdLst)} slides")


if __name__ == "__main__":
    main()
