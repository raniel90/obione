# Formato do Outline em Markdown

A skill consome um arquivo `.md` com **frontmatter** (entre `---`) + **seções de slide**. Cada seção começa com `# slide:<tipo>`.

## Exemplo completo

```markdown
---
titulo: Status do Observatório Orion · Maio/2026
autor: Raniel Silva
programa: Doutorado PPGEC
instituicao: UPE/POLI
data: 2026-05-15
template: status-report
---

# slide:capa
título: Status do Observatório Orion
subtitulo: Apresentação à cadeira TAES

# slide:agenda
1: Contexto
2: Andamento (sprints 3 e 4)
3: Decisões + riscos
4: Próximos passos

# slide:conteudo id=1
titulo: Contexto do projeto
bullets:
  - Objetivo: observatório de projetos com transparência de risco
  - Stakeholders: 3 squads, 1 PO, gerência
  - Restrição: deve rodar em ambiente já existente (sem novos custos)

# slide:conteudo id=2
titulo: Andamento das sprints
bullets:
  - Sprint 3 (concluída): pipeline de ingestão funcional
  - Sprint 4 (em curso): dashboard inicial — 60% pronto
  - Bloqueio: acesso à API do Jira ainda pendente

# slide:conteudo id=3
titulo: Decisões e riscos
bullets:
  - Decisão: substituir Grafana por Metabase (justificativa: menor curva de aprendizado para PO)
  - Risco alto: parceria com squad C ainda informal
  - Plano B: subir mock data se acesso a API atrasar até semana 22

# slide:conteudo id=4
titulo: Próximos passos
bullets:
  - Fechar sprint 4 até 25/05
  - Reunião com squad C para formalizar parceria (semana 21)
  - Apresentação de progresso à gerência: 03/06

# slide:obrigado
mensagem: Discussão e perguntas
```

## Frontmatter — campos suportados

| Campo | Obrigatório | Descrição |
|---|---|---|
| `titulo` | sim | Título da apresentação (vai na capa) |
| `autor` | sim | Nome do autor (vai no footer + capa) |
| `programa` | sim | Programa de pós (ex.: `Doutorado PPGEC`) |
| `instituicao` | não | Default `UPE/POLI` |
| `data` | sim | Formato `YYYY-MM-DD` — convertido para "Mês YYYY" no footer |
| `template` | sim | Nome do template em `templates/` (sem extensão): `status-report`, `orientacao-12min` |

## Tipos de slide suportados

| `# slide:<tipo>` | Como é renderizado |
|---|---|
| `capa` | Slide 1 do template — preenche `título`, `subtitulo` se presente |
| `agenda` | Slide 2 — substitui itens numerados conforme campos `1:`, `2:`, ... |
| `conteudo` | Slide genérico de conteúdo — usa `titulo` + `bullets` (lista) |
| `divisor` | Slide de transição entre partes (apenas em apresentações longas) |
| `apendice` | Slide marcado para ir após o divisor "Apêndice" |
| `obrigado` | Slide final — usa `mensagem` |

## Como funcionam os placeholders

O template `.pptx` contém marcadores no formato `{{NOME}}`. A skill substitui:

- **Globais** (em todo o .pptx): `{{TITULO}}`, `{{AUTOR}}`, `{{PROGRAMA}}`, `{{INSTITUICAO}}`, `{{DATA}}`, `{{FOOTER}}`
- **Por slide**: `{{SLIDE_TITULO}}`, `{{BULLET_1}}`, `{{BULLET_2}}`, ..., `{{BULLET_N}}`
- **Customizados**: qualquer campo no outline vira `{{<CAMPO_UPPERCASE>}}`. Ex: `subtitulo: X` no outline preenche `{{SUBTITULO}}` no slide.

## Bullets

Listas markdown padrão:
```markdown
bullets:
  - Item 1
  - Item 2
  - Item 3
```

São indexados pelo `apply_outline.py` e preenchem `{{BULLET_1}}`, `{{BULLET_2}}`, etc. Se o template tem 5 placeholders de bullet e o outline só tem 3 itens, os últimos 2 ficam vazios (serão flagados pelo `qc_check.py` — então remova-os manualmente ou aumente o outline).

## Limitações conhecidas

- O parser é simples (não é YAML real). Use formato estritamente conforme exemplo.
- Cada slide do outline mapeia para o slide de mesma posição do template. Se o outline tem 8 slides e o template tem 12, os 4 últimos do template são deletados.
- Não suporta inserir slides novos — só editar/deletar os existentes. Se precisar de mais slides, edite o template primeiro.
- Não suporta gráficos/charts via outline. Edite o template diretamente para gráficos complexos.
