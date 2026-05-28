---
name: documento-poli
description: Use ao gerar um documento PDF com identidade visual UPE/POLI (requisitos, relatórios, specs, entregas de disciplina) a partir de um arquivo Markdown — aplica capa institucional, cores UPE (vermelho/navy), fonte Arial, logo e rodapé, renderizando via pandoc + Chrome headless. NÃO usar para apresentações (.pptx); para slides use a skill apresentacao-poli.
---

# Documento PDF — Identidade Visual UPE/POLI

Gera um PDF acadêmico padronizado a partir de um Markdown, separando **conteúdo** (o `.md`) de **apresentação** (capa + estilo). Pensado para entregas da pós-graduação UPE/POLI: documentos de requisitos, relatórios técnicos, protocolos, specs.

## Quando usar

- Entregas de disciplina em PDF que pedem "layout da UPE/POLI".
- Transformar um `.md` existente (ex.: `requisitos.md`) num PDF apresentável sem poluir o Markdown-fonte com metadados de capa.

Para **slides**, use `apresentacao-poli` (esta skill é só para documentos).

## Pré-requisitos

- `pandoc` (`brew install pandoc`) — converte Markdown → HTML.
- Google Chrome — renderiza HTML → PDF via `--headless --print-to-pdf`. Caminho padrão no macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (ajuste com `--chrome`).
- PyMuPDF (`pip install pymupdf`) — *opcional*; carimba o número de página discreto nas páginas de conteúdo (pula a capa). Sem ele, o PDF sai sem numeração. Desligue com `--no-page-numbers`.

## Como gerar

1. Escreva/aponte o conteúdo num `.md` (sem front-matter; capa vem do meta JSON).
2. Crie um `meta.json` com os dados da capa (veja formato abaixo).
3. Rode o builder:

```bash
python .claude/skills/documento-poli/scripts/build_doc_pdf.py \
    atividades/requisitos.md \
    --meta atividades/requisitos.meta.json \
    --output atividades/Requisitos_Essenciais_ObiOne.pdf
```

Flags: `--logo` (PNG; default `assets/upe-logo.png`), `--css` (default `assets/style.css`), `--chrome` (caminho), `--keep-title` (mantém o primeiro `# título` no corpo — por padrão ele é removido porque a capa já o exibe), `--no-page-numbers` (não carimba números de página).

## Formato do meta JSON

Apenas `titulo` é obrigatório.

```json
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
```

## Mapeamento Markdown → estilo

- `#` (h1) — removido por padrão (a capa exibe o título). Use `--keep-title` para manter.
- `##` (h2) — seção; navy com barra vermelha à esquerda.
- `###` (h3) — subseção/bloco; navy.
- `####` (h4) — item/requisito; **vermelho** (destaque).
- Tabelas GFM — cabeçalho navy, linhas pares em cinza claro.
- `` `code` `` — fundo cinza, fonte Arial (sem Courier, conforme identidade UPE/POLI).

## Identidade visual

Cores: `UPE_RED #E0261E`, `UPE_NAVY #1F2A44`, `UPE_GREEN #2E7D5B`. Fonte única: **Arial**. Detalhes em `apresentacao-poli/references/identidade-visual.md`.

## QC (recomendado)

Após gerar, verifique a capa e a 1ª página renderizando para imagem (precisa de `poppler`):

```bash
pdfinfo atividades/Requisitos_Essenciais_ObiOne.pdf | grep Pages
pdftoppm -png -f 1 -l 1 -r 110 atividades/Requisitos_Essenciais_ObiOne.pdf /tmp/qc_doc
```

Confira: logo no topo, título navy, regra vermelha, nomes da equipe na capa; nas páginas de conteúdo, requisitos em vermelho, tabelas legíveis, rodapé com a linha vermelha.
