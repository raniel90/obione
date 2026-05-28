#!/usr/bin/env python3
"""Gera um PDF com identidade visual UPE/POLI a partir de um Markdown.

Fluxo: pandoc (Markdown -> fragmento HTML) -> monta capa + CSS + corpo ->
Chrome headless (--print-to-pdf) -> PDF final.

Uso:
    python build_doc_pdf.py ENTRADA.md --meta meta.json --output SAIDA.pdf \
        [--logo logo.png] [--css style.css] [--chrome CAMINHO] [--keep-title]

Por padrão o primeiro `# título` do Markdown é removido do corpo (a capa já
mostra o título). Use --keep-title para mantê-lo.

Formato de meta.json (apenas `titulo` é obrigatório):
    {
      "eyebrow": "Doutorado PPGEC · Tópicos Avançados em Engenharia de Software",
      "titulo": "Requisitos Essenciais — ObiOne",
      "subtitulo": "Rastreabilidade com o Modelo de Observatório de Projetos (MPO)",
      "equipe": ["Bruno Rocha", "Cynthia Oliveira", "Moisés Júnior", "Raniel Silva"],
      "orientador": "Prof. Ivaldir Honório de Farias Júnior",
      "instituicao": "Universidade de Pernambuco · Escola Politécnica de Pernambuco",
      "local_data": "Recife, 28 de maio de 2026",
      "rodape": "ObiOne · Requisitos Essenciais",
      "rodape_data": "Maio 2026"
    }
"""
from __future__ import annotations

import argparse
import base64
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def run_pandoc(md_path: Path) -> str:
    """Converte o Markdown (GFM) num fragmento HTML."""
    if not shutil.which("pandoc"):
        sys.exit("pandoc não encontrado. Instale com: brew install pandoc")
    result = subprocess.run(
        ["pandoc", str(md_path), "-f", "gfm", "-t", "html5"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def strip_first_h1(body: str) -> str:
    """Remove o primeiro <h1> (o título já aparece na capa)."""
    return re.sub(r"<h1\b[^>]*>.*?</h1>", "", body, count=1, flags=re.DOTALL)


def logo_data_uri(logo_path: Path) -> str:
    data = base64.b64encode(logo_path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{data}"


def esc(value: object) -> str:
    return html.escape(str(value))


def build_cover(meta: dict, logo_uri: str) -> str:
    equipe = meta.get("equipe", [])
    equipe_html = "<br>".join(esc(n) for n in equipe) if equipe else "—"
    logo_html = (
        f'<img class="logo" src="{logo_uri}" alt="UPE/POLI">' if logo_uri else ""
    )

    blocks = [
        f'<div class="meta-block"><div class="label">Equipe</div>'
        f'<div class="value">{equipe_html}</div></div>'
    ]
    for key, label in (
        ("orientador", "Orientador"),
        ("instituicao", "Instituição"),
        ("local_data", "Local e data"),
    ):
        if meta.get(key):
            blocks.append(
                f'<div class="meta-block"><div class="label">{label}</div>'
                f'<div class="value">{esc(meta[key])}</div></div>'
            )

    rodape_left = esc(meta.get("rodape", meta.get("titulo", "")))
    rodape_right = " · ".join(
        filter(None, ["PPGEC", "UPE/POLI", meta.get("rodape_data", "")])
    )
    return f"""
<section class="cover">
  <div class="cover-head">
    {logo_html}
    <div class="eyebrow">{esc(meta.get("eyebrow", ""))}</div>
  </div>
  <div class="title-block">
    <h1 class="doc-title">{esc(meta.get("titulo", "Documento"))}</h1>
    <div class="subtitle">{esc(meta.get("subtitulo", ""))}</div>
    <div class="red-rule"></div>
    <div class="meta-grid">
      {"".join(blocks)}
    </div>
  </div>
  <div class="cover-footer"><span>{rodape_left}</span><span>{esc(rodape_right)}</span></div>
</section>
"""


def build_html(meta: dict, css: str, body: str, logo_uri: str) -> str:
    cover = build_cover(meta, logo_uri)
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>{esc(meta.get("titulo", ""))}</title>
<style>{css}</style></head>
<body>
{cover}
<main class="content">
{body}
</main>
</body>
</html>"""


def stamp_page_numbers(pdf_path: Path, skip_first: bool = True) -> None:
    """Carimba número de página discreto (centro inferior), pulando a capa.

    Usa PyMuPDF (fitz). Se ausente, apenas avisa e segue sem numerar.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("aviso: PyMuPDF (fitz) ausente; PDF gerado sem número de página.")
        return
    doc = fitz.open(str(pdf_path))
    start = 1 if skip_first else 0
    for i in range(start, doc.page_count):
        page = doc[i]
        rect = fitz.Rect(0, page.rect.height - 34, page.rect.width, page.rect.height - 20)
        page.insert_textbox(
            rect,
            str(i + 1),
            fontsize=8,
            fontname="helv",
            color=(0.5, 0.5, 0.5),
            align=fitz.TEXT_ALIGN_CENTER,
        )
    tmp = pdf_path.with_suffix(".tmp.pdf")
    doc.save(str(tmp), garbage=4, deflate=True)
    doc.close()
    tmp.replace(pdf_path)


def render_pdf(html_path: Path, out_path: Path, chrome: str) -> None:
    if not Path(chrome).exists() and not shutil.which(chrome):
        sys.exit(f"Chrome não encontrado em: {chrome} (use --chrome para informar).")
    for headless in ("--headless=new", "--headless"):
        cmd = [
            chrome,
            headless,
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={out_path}",
            f"file://{html_path}",
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            continue
        if out_path.exists() and out_path.stat().st_size > 1000:
            return
    sys.exit("Falha ao gerar PDF via Chrome headless.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera PDF UPE/POLI a partir de Markdown.")
    parser.add_argument("input", help="arquivo Markdown de entrada")
    parser.add_argument("--meta", required=True, help="JSON com metadados da capa")
    parser.add_argument("--output", required=True, help="caminho do PDF de saída")
    parser.add_argument("--logo", default=None, help="PNG do logo (default: assets/upe-logo.png)")
    parser.add_argument("--css", default=None, help="CSS (default: assets/style.css)")
    parser.add_argument("--chrome", default=DEFAULT_CHROME, help="caminho do Google Chrome")
    parser.add_argument("--keep-title", action="store_true", help="mantém o primeiro # título no corpo")
    parser.add_argument("--no-page-numbers", action="store_true", help="não carimba números de página")
    args = parser.parse_args()

    skill_root = Path(__file__).resolve().parent.parent
    css_path = Path(args.css) if args.css else skill_root / "assets" / "style.css"
    logo_path = Path(args.logo) if args.logo else skill_root / "assets" / "upe-logo.png"

    css = css_path.read_text(encoding="utf-8")
    meta = json.loads(Path(args.meta).read_text(encoding="utf-8"))

    body = run_pandoc(Path(args.input))
    if not args.keep_title:
        body = strip_first_h1(body)

    logo_uri = logo_data_uri(logo_path) if logo_path.exists() else ""
    full_html = build_html(meta, css, body, logo_uri)

    out_path = Path(args.output).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", suffix=".html", delete=False, encoding="utf-8"
    ) as handle:
        handle.write(full_html)
        html_path = Path(handle.name)

    render_pdf(html_path, out_path, args.chrome)
    if not args.no_page_numbers:
        stamp_page_numbers(out_path, skip_first=True)
    print(f"OK: {out_path} ({out_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
