# Identidade Visual UPE/POLI

Padrão visual extraído das apresentações reais do programa de pós-graduação da UPE/Escola Politécnica de Pernambuco. Aplica-se a status reports da cadeira, reuniões de orientação e apresentações de aula.

## Cores

| Nome | Hex | Uso |
|---|---|---|
| `UPE_RED` | `#E0261E` | Cor primária — acentos, números grandes, headers de cards, destaques. Constant em `pptx_helpers.UPE_RED`. |
| `UPE_NAVY` | `#1F2A44` | Títulos grandes (`Plano de execução em três fases`), texto de alto nível. |
| `UPE_GREEN` | `#2E7D5B` | Status positivo (ex.: "Alta" em viabilidade), cards de escrita/conclusão. |
| Branco | `#FFFFFF` | Fundo dos cards, textos sobre headers vermelhos/navy. |
| Cinza claro | `#F5F5F5` | Fundo alternado de linhas em tabelas. |

## Fontes

- **Fonte única**: **Arial**. Nada de Times, Calibri ou Courier.
- **Courier New nunca** — mesmo para "código" ou file paths (ver [anti-patterns.md](anti-patterns.md))
- Tamanhos típicos:
  - Título do slide: 28–32pt bold (UPE_NAVY)
  - Subtítulo / categoria do slide: 11pt UPE_RED uppercase
  - Texto de corpo: 12pt
  - Subtexto/contexto: 10pt
  - Fonte/citação no rodapé do card: 8pt italic
  - Footer geral do slide: 9–10pt

## Footer padrão

Cada slide (exceto Capa e Obrigado) tem o footer no canto inferior:

```
Raniel Silva · Doutorado PPGEC · UPE/POLI · Maio 2026                          5 / 18
```

Formato: `{Nome} · {Programa} · {Instituição} · {Mês Ano}` à esquerda e `{posição} / {total}` à direita.

A função `update_footers(prs)` em `pptx_helpers.py` atualiza automaticamente o `X / N` após qualquer mudança no número de slides.

## Logo institucional

- Logo UPE no canto superior direito de slides de conteúdo (não dos divisores)
- Arquivo de imagem padrão: `assets/upe-logo.png` no projeto (não shipa com a skill — cada projeto fornece o seu)

## Anatomia de um slide de conteúdo

```
┌──────────────────────────────────────────────────────────────────┐
│  CATEGORIA  (uppercase, 11pt, UPE_RED)            [LOGO UPE]    │
│  Título do slide  (28pt bold, UPE_NAVY)                          │
│  ─── (underline UPE_RED 2-3pt)                                   │
│                                                                  │
│  [conteúdo principal: cards, tabelas, gráficos]                 │
│                                                                  │
│  ─────────────────────────────────────────────────── (UPE_RED)  │
│  Raniel Silva · Doutorado PPGEC · UPE/POLI · Maio 2026   5 / 18 │
└──────────────────────────────────────────────────────────────────┘
```

## Anatomia da capa

```
┌──────────────────────────────────────────────────────────────────┐
│  PROGRAMA · CONTEXTO                              [LOGO UPE]    │
│                                                                  │
│  Título da Apresentação                                          │
│  (28-36pt bold UPE_NAVY)                                         │
│                                                                  │
│  Subtítulo / contexto secundário                                 │
│                                                                  │
│  Autor:                Orientador:                               │
│  Raniel Silva          Prof. Dr. Alexandre Maciel                │
│                                                                  │
│  Programa de Pós-Graduação em Engenharia da Computação (PPGEC)  │
│  Universidade de Pernambuco · Escola Politécnica de Pernambuco  │
│                                                                  │
│  Recife, maio de 2026                                            │
└──────────────────────────────────────────────────────────────────┘
```
