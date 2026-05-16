---
name: apresentacao-poli
description: Cria e edita apresentações no padrão UPE/POLI (Universidade de Pernambuco · Escola Politécnica). Use para status reports da cadeira TAES, reuniões de orientação curtas (~12 min) e apresentações de aula. Workflow guiado em 7 fases (briefing → outline em Markdown → spec → gerar .pptx → QC contra anti-patterns acadêmicos). Inclui templates UPE/POLI, helpers Python (python-pptx) e validador automático para garantir identidade visual (cor UPE_RED #E0261E, Arial, footer padrão) e remover anti-patterns típicos de geração assistida por IA (IDs internos como gao_2024, paths de arquivo, jargão como pipeline 3-skill, em-dashes, fontes Courier).
allowed-tools: Read Write Edit Bash Glob Grep
---

# Apresentação UPE/POLI

Skill para criar/editar apresentações no padrão visual e narrativo da Universidade de Pernambuco (Escola Politécnica), com foco em **status report da cadeira TAES**, **reunião de orientação** e **apresentação de aula**.

## Quando usar

Invoque quando o usuário:
- Pedir para "criar/montar/preparar apresentação" para professor, orientador, banca, ou aula
- Pedir para "atualizar/revisar status report" de qualquer disciplina UPE/POLI
- Mencionar `.pptx`, `slides`, `deck` no contexto acadêmico
- Mencionar "PPGEC", "POLI", "Engenharia Computação UPE"

Não use quando:
- O usuário quer pôster/banner (formato diferente)
- O usuário quer artigo de conferência (use `scientific-writing`)
- O usuário só quer revisar um .pptx pronto sem editar (use só `scripts/qc_check.py`)

## Workflow guiado

Quando ativada, execute as 7 fases em ordem. Não pule fases sem confirmação explícita.

### Fase 1 — Briefing (3 perguntas iniciais)

Pergunte ao usuário, usando `AskUserQuestion` se possível:

1. **Audiência**: orientador (reunião 1:1) · professor da cadeira (status report) · colegas/turma (aula) · banca (qualificação/defesa)
2. **Duração esperada**: 10-15 min · 30 min · 45-60 min
3. **Tipo**: status report · proposta · resultados parciais · seminário/apresentação técnica

### Fase 1b — Wizard de metadados (campos do frontmatter)

Antes de pedir o outline (Fase 3), colete os metadados que vão preencher o frontmatter do `.md` e os placeholders globais do template. **Pergunte apenas o que faltar** — se o usuário já mencionou na conversa, use o valor mencionado como default e confirme.

Use `AskUserQuestion` em **um único batch** quando possível, com defaults declarados. Campos:

| Campo | Obrigatório | Default sugerido | Observação |
|---|---|---|---|
| `autor` | sim | nome do usuário se conhecido | quem assina a apresentação |
| `titulo` | sim | — | nome curto que aparece no metadado |
| `titulo_principal` | recomendado | `titulo` | texto grande exibido na capa |
| `subtitulo` | opcional | "" | linha curta abaixo do título (capa) |
| `programa` | sim | "Doutorado PPGEC" | curto, para footer |
| `programa_longo` | opcional | `programa` | expandido, para capa |
| `instituicao` | opcional | "UPE/POLI" | para footer |
| `instituicao_longa` | opcional | "Universidade de Pernambuco · Escola Politécnica de Pernambuco" | para capa |
| `data` | sim | data da apresentação (`YYYY-MM-DD`) | convertida para "Mês YYYY" no footer |
| `local_data` | **opcional** | `"Recife, {Mês YYYY}"` | linha de local na capa. **Pode ser omitido** — se vazio, oculta a linha |
| `rotulo_orientador` | opcional | "Orientador" | rótulo do campo. **Pode ser "Professor"** se for SR de disciplina, "Coorientador", etc. |
| `orientador` | opcional | "" | nome do orientador/professor. Se vazio, oculta a linha inteira |
| `rotulo_agenda` | opcional | "PLANO DA REUNIÃO" | rótulo no topo do slide 2 |
| `duracao` | opcional | "~15 minutos + discussão" | informação visível no slide 2 |
| `mensagem_final` | opcional | "Discussão e perguntas" | texto do slide final |

**Princípio do wizard:**
- Defaults declarados explicitamente — o usuário pode aceitar com 1 clique.
- Campos opcionais com default vazio (`local_data` sem `local`, `orientador` sem nome) podem ser omitidos da apresentação — não force o usuário a inventar.
- Ao final, confirme o frontmatter consolidado antes de prosseguir.

### Fase 2 — Escolha do template

| Briefing | Template |
|---|---|
| Orientador + 10-15 min | `templates/orientacao-12min.pptx` (18 slides: 12 core + 6 apêndice) |
| Professor TAES + 15-30 min + status | `templates/status-report.pptx` (7 slides) |
| Aula + 30-45 min | `templates/status-report.pptx` (use como base, expanda manualmente) |

Para outros casos, comece de `status-report.pptx` e adapte.

### Fase 3 — Brainstorming + Outline em Markdown

**Princípio:** o conteúdo da apresentação deve ser **brainstormeado com o usuário** — não inventado pelo modelo a partir do contexto disponível. Apresentações geradas sem essa etapa costumam ter bullets genéricos, fora de prioridade ou desalinhados do que o autor quer comunicar.

#### Quando o usuário fornece outline pronto

Use o outline como-está (após validação de formato). Pular o brainstorm.

#### Quando o usuário NÃO fornece outline pronto

**Entre em modo plan (`EnterPlanMode` se disponível) e conduza o brainstorm em sub-fases:**

1. **Estrutura geral**: confirmar quantos slides de conteúdo (3-6 tipicamente para status report) e os títulos de cada um. Use `AskUserQuestion` com opções de estrutura padrão (Padrão A, B, ou C de `references/padroes-narrativos.md`).

2. **Itens da agenda**: gerar 3-4 itens curtos com sub-rótulos (~5 palavras cada). Confirmar antes de seguir.

3. **Slide a slide**: para cada slide de conteúdo, perguntar:
   - **Mensagem-chave**: o que o autor quer que o ouvinte leve embora deste slide?
   - **Bullets (3-5)**: brainstorm dos pontos. Pode usar conhecimento do contexto do projeto (arquivos do repo, conversa) para sugerir; mas SEMPRE pedir confirmação/edição antes de cristalizar.
   - **Evitar inventar dados/números** sem fonte explícita.

4. **Slide final**: confirmar mensagem do slide "Obrigado" (default "Discussão e perguntas").

5. **Consolidar outline** em markdown e mostrar ao usuário para aprovação final via `ExitPlanMode`.

#### Formato do outline

Detalhado em [`references/outline-format.md`](references/outline-format.md). Resumo:

```markdown
---
titulo: <título>
autor: <nome>
programa: <ex: Doutorado PPGEC>
data: YYYY-MM-DD
template: status-report | orientacao-12min
---

# slide:capa
subtitulo: ...

# slide:agenda
1: ...
2: ...

# slide:conteudo id=1
titulo: ...
bullets:
  - ...
  - ...
```

Se o usuário não souber o formato, mostre [`templates/outline-exemplo.md`](templates/outline-exemplo.md).

### Fase 4 — Validação narrativa

Antes de gerar, confira contra [`references/padroes-narrativos.md`](references/padroes-narrativos.md):
- Reunião curta com orientador → **asks aparecem no terço final**? Plano B destacado?
- Status report → tem **decisões + riscos + próximos passos**? Sem enrolação de contexto?
- Aula → sem "asks-first" (que faz menos sentido em sala)

Se algo essencial faltou no outline, pergunte ao usuário (não invente).

### Fase 5 — Gerar .pptx

```bash
python3 .claude/skills/apresentacao-poli/scripts/apply_outline.py \
  <outline.md> \
  .claude/skills/apresentacao-poli/templates/<template>.pptx \
  <saida.pptx>
```

O script:
1. Parseia o outline (frontmatter + seções)
2. Substitui placeholders globais (`{{TITULO}}`, `{{AUTOR}}`, `{{FOOTER}}`, ...)
3. Para cada slide do outline, substitui o slide correspondente do template
4. Remove slides excedentes
5. Atualiza footers `X / N` automaticamente

### Fase 6 — QC automático

```bash
python3 .claude/skills/apresentacao-poli/scripts/qc_check.py <saida.pptx>
```

Detecta os 6 grupos de anti-patterns listados em [`references/anti-patterns.md`](references/anti-patterns.md):
1. IDs internos (`autor_AAAA`)
2. Paths de arquivo (`.md`, `.yaml`)
3. Em-dashes (`—`)
4. Jargão IA não documentado (`3-skill`, `screening automático`, `Cohen κ`)
5. Placeholders não preenchidos (`{{X}}`)
6. Fontes fora do padrão (não-Arial)

Saída esperada: `✅ PASS — zero anti-patterns detectados.`

Se houver issues, mostre o relatório ao usuário e ajude a corrigir (editando o outline ou o `.pptx` diretamente).

### Fase 7 — Review visual

```bash
open <saida.pptx>
```

Mostre ao usuário e itere sobre o feedback. Edições típicas:
- Texto que extrapola card → encurtar ou ajustar `shape.height` via `python-pptx`
- Slide mal posicionado → reordenar via `pptx_helpers.reorder_slides`
- Destacar texto-chave → `pptx_helpers.highlight_runs` com `UPE_RED` + bold

## Ferramentas disponíveis

### Helpers Python — `scripts/pptx_helpers.py`

Funções reutilizáveis para qualquer edição manual no `.pptx`:

| Função | Uso |
|---|---|
| `delete_slide_by_index(prs, idx)` | Remove slide na posição zero-based |
| `reorder_slides(prs, new_order)` | Reordena via lista de índices |
| `replace_run_text(slide, old, new)` | Substitui texto de run exato |
| `delete_shape_by_run_text(slide, text)` | Deleta shape inteiro contendo o texto |
| `update_footers(prs, total=None)` | Recalcula `X / N` em todos os slides |
| `highlight_runs(slide, predicate, bold, color)` | Aplica bold + cor em runs filtrados |
| `replace_placeholders(prs, mapping)` | Substitui `{{X}}` em todos os slides |

### Validador — `scripts/qc_check.py`

CLI para validar `.pptx` contra anti-patterns. Use em CI ou pré-apresentação.

### Templates — `templates/`

- `status-report.pptx` (7 slides) — para apresentações regulares de cadeira
- `orientacao-12min.pptx` (18 slides: 12 core + 6 apêndice) — para reunião curta com orientador
- `outline-exemplo.md` — exemplo de outline preenchido

## References

- [`references/identidade-visual.md`](references/identidade-visual.md) — cores, fontes, footer, anatomia dos slides
- [`references/padroes-narrativos.md`](references/padroes-narrativos.md) — estruturas (status report, orientação curta, aula) e princípios
- [`references/anti-patterns.md`](references/anti-patterns.md) — checklist do que evitar (com regex de detecção)
- [`references/outline-format.md`](references/outline-format.md) — spec completa do formato de entrada

## Princípios

1. **Não invente conteúdo**. Se o outline não tem, pergunte ou deixe placeholder.
2. **Sempre rode QC** antes de declarar pronto.
3. **Mostre o .pptx** ao usuário e itere — não assuma que "ficou bom" só porque o QC passou.
4. **Preserve identidade visual** — Arial, UPE_RED, footer no formato canônico.
5. **Em reunião curta, asks-first** — o orientador interrompe; defenda o que importa antes do meio.

## Dependências

- Python 3.10+
- `python-pptx` (instalar com `pip install python-pptx` se ainda não estiver)

## Limitações

- Não gera PDF (só `.pptx`). Para PDF, exporte manualmente via Keynote/PowerPoint/LibreOffice.
- Templates são fixos (2 atualmente). Para novos formatos (qualificação, defesa), criar template separado.
- Não suporta gráficos/charts via outline — edite o template diretamente.
- Idioma fixo PT-BR.
