# Atributos-Alvo do MPO

Lista de atributos extraídos pelo pipeline LLM do ObiOne, derivada do **Quadro 37 — Terceira versão do MPO: atributos relacionados aos projetos** (Vieira, 2022, p. 264).

**Total:** 44 atributos em 8 categorias do MPO.

Cada atributo é categorizado quanto ao **tipo de extração**:

- `estruturado`: campo objetivo (nome próprio, data, valor monetário, enum, referência) — admite comparação normalizada exata na avaliação (TP/FP/FN binário).
- `texto_livre`: campo narrativo (descrição, análise, lista descritiva) — exige rubrica humana 0 / 0,5 / 1 aplicada por dois avaliadores na avaliação (Cohen's Kappa).
- `fora_de_escopo`: atributo não-textual ou não-extraível pelo pipeline LLM (ex.: imagens) — excluído da extração e do cálculo de cobertura.

Atributos `estruturado` que **não se aplicam** ao caso de estudo (consultoria de marketing privada — ex.: licitação) ficam preenchidos como `null` na extração, sem penalizar a cobertura desde que o documento não mencione o conceito.

---

## 1. Conteúdo de caráter geral (15 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 1 | Nome do projeto | `estruturado` | String curta; identifica o projeto univocamente. |
| 2 | Descrição | `texto_livre` | Texto narrativo livre. |
| 3 | Local de execução | `estruturado` | Cidade/estado/país ou referência de local. |
| 4 | Tipo | `estruturado` | Categoria/classe do projeto (enum quando possível). |
| 5 | Porte | `estruturado` | Pequeno / médio / grande (enum). |
| 6 | Objetivos | `texto_livre` | Lista narrativa dos objetivos do projeto. |
| 7 | Descrição dos produtos e serviços gerados | `texto_livre` | Narrativa do que é entregue. |
| 8 | Licitação (para projetos públicos) | `estruturado` | Número/referência da licitação. **N/A para os 5 projetos do estudo (consultoria privada)** — extrair `null`. |
| 9 | Contratos | `estruturado` | Número/referência de contrato. |
| 10 | Termo de encerramento | `texto_livre` | Texto do termo, se o projeto já foi finalizado. |
| 11 | Justificativas do projeto | `texto_livre` | Narrativa da razão do projeto existir. |
| 12 | Impactos do projeto a curto e longo prazo | `texto_livre` | Narrativa dos impactos esperados/observados. |
| 13 | Indicadores do projeto | `texto_livre` | Lista narrativa de KPIs (raramente vem em formato puramente numérico em `.docx` livre). |
| 14 | Artefatos produzidos no projeto | `texto_livre` | Lista descritiva de entregáveis. |
| 15 | Imagens/fotos do projeto | `fora_de_escopo` | Conteúdo visual; não extraível por LLM textual. |

---

## 2. Stakeholders dos projetos (5 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 16 | Nome dos stakeholders | `estruturado` | Lista de nomes próprios. |
| 17 | Função no projeto | `estruturado` | Cargo/papel de cada stakeholder (enum/string curta). |
| 18 | Público-alvo do projeto | `texto_livre` | Descrição da audiência/cliente final. |
| 19 | Detalhes da equipe do projeto | `texto_livre` | Composição, organização, responsabilidades. |
| 20 | Treinamentos realizados pelas equipes | `texto_livre` | Narrativa de capacitações e formações. |

---

## 3. Escopo dos projetos (4 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 21 | Tarefas do projeto | `texto_livre` | Lista descritiva de tarefas. |
| 22 | Requisitos | `texto_livre` | Lista descritiva de requisitos funcionais/não-funcionais. |
| 23 | Escopo planejado | `texto_livre` | Definição original do escopo. |
| 24 | Escopo executado | `texto_livre` | O que efetivamente foi feito. |

---

## 4. Cronograma dos projetos (5 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 25 | Data de início | `estruturado` | Formato ISO 8601 (YYYY-MM-DD) na extração. |
| 26 | Data de fim planejada | `estruturado` | ISO 8601. |
| 27 | Data de fim executada | `estruturado` | ISO 8601. `null` se o projeto ainda não terminou. |
| 28 | Entregas a serem realizadas | `texto_livre` | Lista descritiva de marcos/entregas. |
| 29 | Status do cronograma | `estruturado` | Enum: `no_prazo` / `atrasado` / `adiantado` / `concluido` / `cancelado`. |

---

## 5. Custos dos projetos (3 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 30 | Custo estimado | `estruturado` | Valor monetário (BRL); `null` se ausente. |
| 31 | Custo realizado | `estruturado` | Valor monetário (BRL); `null` se ausente. |
| 32 | Justificativas dos gastos | `texto_livre` | Narrativa explicando os gastos. |

---

## 6. Riscos dos projetos (5 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 33 | Riscos identificados | `texto_livre` | Lista descritiva de riscos. |
| 34 | Análise qualitativa de riscos | `texto_livre` | Texto narrativo da análise qualitativa. |
| 35 | Análise quantitativa de riscos | `texto_livre` | Texto narrativo (pode conter números embutidos, mas é predominantemente texto). |
| 36 | Planejamento de respostas aos riscos | `texto_livre` | Estratégias de mitigação descritas. |
| 37 | Monitoramento dos riscos | `texto_livre` | Como os riscos estão sendo acompanhados. |

---

## 7. Mudanças dos projetos (3 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 38 | Custo de implementação da mudança | `estruturado` | Valor monetário (BRL). |
| 39 | Análise de custo-benefício | `texto_livre` | Análise narrativa. |
| 40 | Impactos da mudança no escopo e cronograma | `texto_livre` | Descrição dos impactos. |

---

## 8. Lições aprendidas dos projetos (4 atributos)

| # | Atributo | Tipo | Notas |
|---|---|---|---|
| 41 | Pontos fortes | `texto_livre` | Aspectos positivos identificados. |
| 42 | Pontos fracos | `texto_livre` | Aspectos negativos identificados. |
| 43 | Dificuldades encontradas | `texto_livre` | Obstáculos enfrentados. |
| 44 | Providências tomadas | `texto_livre` | Ações de resposta às dificuldades. |

---

## Resumo por tipo

| Tipo | Quantidade | % do total |
|---|---|---|
| `estruturado` | 15 | 34% |
| `texto_livre` | 28 | 64% |
| `fora_de_escopo` | 1 | 2% |
| **Total** | **44** | **100%** |

**Implicação para a avaliação (RF09):**

- **Grupo `estruturado` (15 atributos):** comparação normalizada exata; cálculo de TP/FP/FN binário; precisão/recall/F1 calculados diretamente.
- **Grupo `texto_livre` (28 atributos):** rubrica humana 0 / 0,5 / 1 aplicada por Cynthia e Moisés como dois avaliadores independentes; Cohen's Kappa por atributo e agregado; precisão/recall/F1 calculados a partir da rubrica consolidada.
- **`fora_de_escopo` (1 atributo):** excluído do cálculo de cobertura (RF07).

**Total efetivo de atributos avaliáveis:** 43 (excluindo `fora_de_escopo`).

---

## Critério de normalização (para `estruturado`)

A comparação exata aplicada na avaliação considera as seguintes normalizações:

| Atributo | Normalização |
|---|---|
| Datas | Conversão para ISO 8601 (YYYY-MM-DD) antes de comparar. |
| Valores monetários | Conversão para `decimal(15,2)` em BRL; remoção de separadores. |
| Enums (Tipo, Porte, Status) | Lowercase + remoção de acentos + matching contra vocabulário controlado. |
| Nomes próprios | Trim de espaços; comparação case-sensitive. |
| Listas (nomes de stakeholders, funções) | Comparação de conjunto: TP = elementos coincidentes; FP = na extração e não no gabarito; FN = no gabarito e não na extração. |

---

## Próximos passos

1. **Revisão pelo Moisés** desta lista — confirmar categorizações borderline (especialmente "Indicadores do projeto", "Análise quantitativa de riscos", "Licitação", "Contratos").
2. **T1.3 — Schema de extração** (Raniel) — derivar JSON Schema formal desta lista para uso na extração automática (RF03) e validação dos gabaritos (RF08).
3. **T1.4 — Produção dos gabaritos manuais** — Cynthia e Moisés anotam Valença (piloto), depois Freire Batista e Kaka JJ, usando esta lista como referência.

---

## Referência

VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese de Doutorado — CIn/UFPE, 2022. Quadro 37 (p. 264).
