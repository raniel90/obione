# Protocolo de Avaliação — ObiOne

Documento metodológico para a avaliação do ObiOne. Cobre três frentes complementares: **(i)** a avaliação quantitativa do pipeline LLM de extração (Quadro 37 do MPO), **(ii)** a avaliação da categorização de temática por IA (RF19), e **(iii)** a avaliação qualitativa da governança CBAC (RF23) e do cockpit cross-cliente (RF20) via Likert.

**Insumos:** `atributos_alvo_mpo.md` (44 atributos categorizados como `estruturado` / `texto_livre` / `fora_de_escopo`); log `theme_suggestions` (gerado pela RF19); respostas Likert das audiências (consultoria via RF16; clientes via RF17).

**Aplicação:** o critério híbrido de extração (§§ 1-4) é aplicado em 3 projetos do estudo de caso — **Valença Odontologia** (piloto), **Freire Batista ADV** e **Kaka JJ** — por **Cynthia** e **Moisés** como dois avaliadores independentes. A acurácia da categorização (§ 5) e o Likert (§ 6) são aplicados nos 5 projetos do estudo.

> **Atualização 29/05/2026.** O escopo do protocolo foi revisto após o pivot CBAC + no-upload (apêndice §12 de `refinamento_observatorio_consultorias.md`). Saem do escopo de avaliação a **Conectora** (RF21, síntese cross-projeto, removida) e o **Resumo do Cliente** (RF12, removido). Entram a **acurácia da categorização de temática** (§ 5) e a **avaliação da governança CBAC + cockpit** via Likert reescrito (§ 6). As métricas de extração das §§ 1-4 mudam apenas em um detalhe: a "fonte" passa a ser `project.description` em vez de `.docx`, mas o critério de match e a rubrica continuam idênticos.

---

## 1. Critério Híbrido de Match

A natureza dos atributos do Quadro 37 do MPO mistura campos objetivos (datas, nomes próprios, valores monetários) e campos narrativos (escopo, riscos, lições aprendidas). Comparação determinística não funciona para texto livre; rubrica humana é custosa demais para campos objetivos. Por isso, dois subprotocolos:

### 1.1 Atributos `estruturado` (15 atributos)

Comparação **normalizada exata**, conforme normalizações definidas em `atributos_alvo_mpo.md`:

- **Datas:** comparar após conversão para ISO 8601 (`YYYY-MM-DD`).
- **Valores monetários:** comparar após conversão para `decimal(15,2)` em BRL.
- **Enums** (Tipo, Porte, Status do cronograma): lowercase + remoção de acentos + matching contra vocabulário controlado.
- **Nomes próprios** (nome do projeto, local, números de contrato): trim de espaços; comparação case-sensitive.
- **Listas** (nomes de stakeholders, funções): comparação como conjunto — TP = elementos coincidentes; FP = na extração mas não no gabarito; FN = no gabarito mas não na extração.

**Cálculo binário por atributo:**
- **TP (Verdadeiro Positivo):** atributo preenchido em ambos (gabarito e extração) e com valor equivalente após normalização.
- **FP (Falso Positivo):** atributo preenchido na extração mas ausente ou diferente no gabarito.
- **FN (Falso Negativo):** atributo preenchido no gabarito mas ausente na extração (`null` na extração).
- **TN (Verdadeiro Negativo):** atributo ausente em ambos. **Não conta para precisão/recall** (essencial para evitar inflar métricas com `null`s).

Para **listas**, TP/FP/FN são contados por elemento, não pelo atributo como um todo.

### 1.2 Atributos `texto_livre` (28 atributos)

**Rubrica humana** de 3 níveis (`0`, `0,5`, `1`) aplicada por **dois avaliadores independentes** (Cynthia e Moisés). A independência é fundamental — os avaliadores não discutem o atributo antes de pontuar.

Detalhes da rubrica na seção 2.

---

## 2. Rubrica Humana para Texto Livre

Cada atributo `texto_livre` recebe **uma nota por avaliador**, na escala:

| Nota | Critério |
|---|---|
| **1** | A extração reflete fielmente o conteúdo do gabarito. Paráfrase semântica aceita — palavras diferentes são OK desde que o significado seja equivalente. Cobertura completa dos pontos principais. |
| **0,5** | A extração captura **parte** do conteúdo do gabarito mas omite aspectos importantes, OU contém informação correta mas ambígua/genérica demais, OU mistura informação correta com pequenas imprecisões que não invalidam o sentido. |
| **0** | A extração **contradiz** o gabarito; OU **inventou** conteúdo não presente no documento; OU está **ausente** (`null`) enquanto o gabarito tem conteúdo; OU está **presente** (extração ≠ null) enquanto o gabarito está vazio. |

### 2.1 Exemplos calibradores por categoria

**Escopo** (atributo 23 — Escopo planejado):

| Cenário | Gabarito | Extração automática | Nota |
|---|---|---|---|
| Equivalência | "Reposicionamento da marca para o público B2B do setor jurídico" | "Reposicionar a marca focando em clientes B2B jurídicos" | **1** |
| Parcial | "Reposicionamento da marca para o público B2B do setor jurídico" | "Estratégia de marketing B2B" | **0,5** |
| Errado | "Reposicionamento da marca para o público B2B do setor jurídico" | "Plano de marketing geral" | **0** |
| Ausente | "Reposicionamento da marca para o público B2B do setor jurídico" | `null` | **0** |

**Riscos** (atributo 33 — Riscos identificados):

| Cenário | Gabarito | Extração automática | Nota |
|---|---|---|---|
| Equivalência | "Dependência regulatória do CFM" | "Risco de mudanças regulatórias no CFM" | **1** |
| Parcial | "Dependência regulatória do CFM" | "Risco regulatório" | **0,5** |
| Errado | "Dependência regulatória do CFM" | "Não há riscos identificados" | **0** |

**Lições aprendidas** (atributo 41 — Pontos fortes):

| Cenário | Gabarito | Extração automática | Nota |
|---|---|---|---|
| Equivalência | "Aprendemos a importância de envolver o cliente desde o briefing" | "Envolver o cliente desde o início do projeto foi um aprendizado central" | **1** |
| Parcial | "Aprendemos a importância de envolver o cliente desde o briefing" | "Lição: envolvimento do cliente" | **0,5** |
| Inventado | `null` (gabarito não menciona pontos fortes) | "Forte engajamento da equipe técnica" | **0** |

**Objetivos** (atributo 6 — Objetivos):

| Cenário | Gabarito | Extração automática | Nota |
|---|---|---|---|
| Cobertura completa | "Aumentar awareness da marca; gerar leads qualificados; melhorar NPS" | "Os objetivos são aumentar reconhecimento, capturar leads qualificados e elevar o NPS" | **1** |
| Cobertura parcial | "Aumentar awareness da marca; gerar leads qualificados; melhorar NPS" | "Aumentar awareness da marca" | **0,5** (perdeu 2 de 3 objetivos) |
| Confusão | "Aumentar awareness da marca; gerar leads qualificados; melhorar NPS" | "Aumentar receita e ROI" | **0** (não confere) |

### 2.2 Score consolidado por atributo

Após os dois avaliadores pontuarem independentemente:

```
score_consolidado = (nota_cynthia + nota_moises) / 2
```

Valores possíveis: `0`, `0,25`, `0,5`, `0,75`, `1`.

### 2.3 Detecção de divergência

| Diferença entre avaliadores | Classificação | Ação |
|---|---|---|
| 0 (ambos deram a mesma nota) | Concordância plena | Manter score. |
| 0,5 (ex: 0 vs 0,5 ou 0,5 vs 1) | Divergência aceitável | Manter média; registrar para análise. |
| 1 (0 vs 1) | **Divergência forte** | **Sessão de discussão obrigatória**; reanotar conjuntamente após reler o trecho do documento; registrar resolução. |

---

## 3. Protocolo de Produção do Gabarito

### 3.1 Ordem dos projetos

| Ordem | Projeto | Complexidade | Função |
|---|---|---|---|
| 1º | **Valença Odontologia** | Baixa | Piloto — calibra a rubrica. |
| 2º | **Freire Batista ADV** | Média | Produção. |
| 3º | **Kaka JJ** | Média | Produção. |

### 3.2 Procedimento por projeto

Para cada projeto:

1. **Leitura prévia silenciosa** — Cynthia e Moisés leem o(s) `.docx` do projeto independentemente, sem discutir.
2. **Anotação independente** — cada avaliador preenche um JSON conforme `docs/schema_extracao.json`. Atributos não presentes no documento devem ficar `null` (não inventar).
3. **Persistência** — gabaritos salvos como `atividades/gabaritos/<projeto>_cynthia.json` e `<projeto>_moises.json`.
4. **Sessão de reconciliação** — comparar os dois gabaritos:
   - Atributos `estruturado`: divergências resolvidas por consulta direta ao documento.
   - Atributos `texto_livre`: aplicar a rubrica da seção 2 sobre cada anotação; gerar `<projeto>_consolidado.json` com:
     - Para cada atributo: valor consensual + score consolidado + flag de divergência (se houver).
5. **Documentar resoluções** — registrar em `atividades/gabaritos/<projeto>_resolucoes.md` as divergências fortes e como foram resolvidas.

### 3.3 Critério piloto de Valença

Após o passo 4 do Valença:

| Condição | Ação |
|---|---|
| Divergências fortes em < 20% dos atributos `texto_livre` | Rubrica está calibrada. Seguir para Freire Batista. |
| Divergências fortes em 20-40% | Refinar rubrica (adicionar exemplos novos, esclarecer limites entre níveis); refazer **apenas os atributos divergentes** com a rubrica refinada. |
| Divergências fortes em > 40% | Rubrica precisa de revisão estrutural. Discussão entre os 4 integrantes; após acordo, **refazer Valença inteiro** com a rubrica final antes de iniciar Freire Batista. |

**Documentar a versão da rubrica usada em cada projeto** (`v1` no piloto pré-refinamento, `v2` após refinamento etc.) em `<projeto>_resolucoes.md`.

---

## 4. Cálculo das Métricas

### 4.1 Precisão, Recall, F1 — Atributos `estruturado`

Cálculo clássico binário sobre TP/FP/FN agregados:

```
Precisão_estruturado = TP / (TP + FP)
Recall_estruturado   = TP / (TP + FN)
F1_estruturado       = 2 × (Precisão × Recall) / (Precisão + Recall)
```

### 4.2 Precisão, Recall, F1 — Atributos `texto_livre`

Cálculo usando o **score consolidado** (média dos dois avaliadores) como peso parcial. O score substitui o "1" binário do TP clássico:

Seja:
- `S_extracao` = soma dos `score_consolidado` para atributos onde a extração tem valor (≠ null).
- `S_gabarito` = soma dos `score_consolidado` para atributos onde o gabarito tem valor (≠ null).
- `N_extracao` = quantidade de atributos onde a extração tem valor.
- `N_gabarito` = quantidade de atributos onde o gabarito tem valor.

```
Precisão_texto_livre = S_extracao / N_extracao
Recall_texto_livre   = S_gabarito / N_gabarito
F1_texto_livre       = 2 × (Precisão × Recall) / (Precisão + Recall)
```

**Interpretação:** uma extração que sempre coincide perfeitamente com o gabarito teria score médio = 1, resultando em precisão e recall = 1.

### 4.3 Métricas agregadas (estruturado + texto livre)

Calculadas como **média ponderada** pelo número de atributos em cada grupo:

```
Precisão_total = (15 × Precisão_estruturado + 28 × Precisão_texto_livre) / 43
Recall_total   = (15 × Recall_estruturado   + 28 × Recall_texto_livre)   / 43
F1_total       = 2 × (Precisão_total × Recall_total) / (Precisão_total + Recall_total)
```

(43 = 44 atributos − 1 `fora_de_escopo`.)

### 4.4 Cohen's Kappa — concordância entre avaliadores (texto livre)

Aplicado **apenas ao grupo `texto_livre`** (28 atributos) sobre as notas independentes de Cynthia e Moisés.

Como a escala é ordinal (0, 0,5, 1), usar **Weighted Kappa quadrático** (`cohen_kappa_score(..., weights='quadratic')` na `sklearn.metrics`).

Kappa calculado:
- **Por atributo** (28 valores de Kappa) — útil para identificar quais atributos têm rubrica fraca.
- **Agregado** sobre todos os atributos de todos os projetos com gabarito (3 projetos × 28 atributos = 84 pontos por avaliador).

**Interpretação dos valores** (escala clássica de Landis & Koch, 1977):

| Kappa | Concordância |
|---|---|
| < 0,00 | Pior que aleatória |
| 0,00 – 0,20 | Insignificante |
| 0,21 – 0,40 | Pobre |
| 0,41 – 0,60 | Razoável |
| 0,61 – 0,80 | Substancial |
| 0,81 – 1,00 | Quase perfeita |

**Threshold de aceitação do projeto:** Kappa agregado ≥ **0,60** (substancial). Abaixo desse limite, registrar como limitação metodológica no relato (RF15 já prevê isso).

Atributos individuais com Kappa < 0,60 devem ser sinalizados no resultado da avaliação.

### 4.5 Tempo de extração

Métrica complementar para evidenciar o ganho de eficiência da IA:

- **Manual:** tempo total reportado por cada avaliador para produzir seu gabarito (em minutos).
- **Automático:** tempo medido pelo sistema entre `POST /projects/{id}/extractions` e persistência da extração (em segundos/minutos).

Reportado como média por projeto e total.

---

## 5. Acurácia da Categorização de Temática (RF19)

A sugestão automática de temática (`domain` do projeto) por IA — implementada como contexto `themes/` no backend — é avaliada por **comparação direta** entre o que o classificador propõe e a decisão final do consultor humano. O log `theme_suggestions` (criado pela migration 0014) registra cada sugestão com seu `suggested_domain`, `confidence`, `model_id` e o estado `accepted` + `accepted_at` + `accepted_by`. Quando aceita, a temática propaga para `projects.domain`; quando ignorada, o registro permanece como evidência de que a IA propôs uma classificação alternativa.

### 5.1 Conjunto de avaliação

Os **5 projetos** do estudo de caso (não apenas os 3 com gabarito de extração). O consultor produz a sugestão da IA via `POST /projects/{id}/themes/suggest` e, depois, decide aceitá-la ou sobrescrever manualmente `projects.domain`. Para garantir um trial controlado:

1. Antes de qualquer sugestão da IA, **Cynthia** e **Moisés** anotam independentemente a categoria esperada de cada projeto (`legal`, `health`, `sports`, `branding`, `gastronomy`, `other`) a partir do `description` cadastrado. A categoria de cada projeto é o **consenso humano** desses dois rótulos.
2. A IA é então invocada e seu `suggested_domain` é registrado.

### 5.2 Métricas

- **Acurácia top-1.** Proporção de sugestões cujo `suggested_domain` coincide com o consenso humano.
- **Calibração.** Para cada faixa de `confidence` (0,0-0,33; 0,34-0,67; 0,68-1,0), comparar a acurácia observada com a confiança média. Idealmente os valores são próximos (calibração honesta).
- **Acurácia por temática.** Matriz de confusão 6×6 (6 enums) com contagens absolutas. Permite identificar temáticas onde o classificador erra sistematicamente.
- **Taxa de aceitação.** Proporção de sugestões que o consultor aceitou via `POST /themes/suggestions/{id}/accept`. Complementar à acurácia top-1 — captura a percepção do consultor sobre a utilidade da sugestão.

### 5.3 Threshold de aceitação do projeto

A meta é **acurácia top-1 ≥ 80 %**. Abaixo desse limite, registrar a categorização como contribuição parcial (a IA ajuda mas não substitui a curadoria) e discutir como limitação. Como o conjunto é pequeno (N = 5), não há base estatística para um threshold mais rigoroso — a matriz de confusão completa é o artefato principal a apresentar no relato.

---

## 6. Avaliação Qualitativa da Governança CBAC e do Cockpit (Likert)

A camada de governança (CBAC, RF23) e o cockpit cross-cliente (RF20) — substitutos do Resumo do Cliente e da Conectora no refino de 29/05 — são avaliados pela percepção das duas audiências. As dimensões do Likert foram reescritas no requisitos.md de 29/05 e implementadas no backend (`obione.likert.schemas`).

### 6.1 Dimensões do consultor (RF16, N ≈ 4)

| Dimensão | O que mede |
|---|---|
| `utilidade_drafts` | Utilidade dos drafts internos (US13) na curadoria do observatório |
| `reducao_friccao` | Quanto a IA reduziu o trabalho de manter o observatório informativo |
| `manutenibilidade_mediador` | Sustentabilidade do papel de mediador entre IA, atributos e cliente |
| `valor_cockpit` | Valor do cockpit cross-cliente (RF20) para a decisão da consultoria |
| `usabilidade_cbac` | Usabilidade e confiança na governança CBAC (RF23) ao decidir o que liberar |

### 6.2 Dimensões do cliente (RF17, N ≈ 5-10)

| Dimensão | O que mede |
|---|---|
| `clareza_atributos_liberados` | Clareza do que o cliente vê na ficha de atributos liberados |
| `sentido_controle` | Sentido de controle / transparência sobre o que foi liberado para ele |
| `utilidade_liberado` | Utilidade prática do que foi liberado para o cliente acompanhar o projeto |
| `qualidade_dialogo` | Qualidade dos comentários e do diálogo no espaço do observatório |
| `sentido_inclusao` | Sentido de inclusão do cliente como parte do observatório |

### 6.3 Aplicação

- A consultoria responde **uma vez** após ≥ 2 semanas usando o sistema com os 5 projetos do estudo.
- Cada cliente responde **uma vez** após ≥ 2 semanas tendo acesso ao seu projeto, com o CBAC configurado e ao menos uma extração visível.
- Cada submissão gera uma linha por dimensão (5 linhas por respondente), persistidas em `likert_responses`.

### 6.4 Métricas

- **Estatísticas descritivas por dimensão**: mediana, média, mínimo, máximo, contagem.
- **Histograma 1-5** por dimensão.
- **Triangulação** entre dimensões do consultor e do cliente quando aplicável — por exemplo, `usabilidade_cbac` (consultor) cruzada com `clareza_atributos_liberados` + `sentido_controle` (cliente) para discutir se a governança que o consultor sentiu confortável produziu, do lado do cliente, percepção de clareza e controle.
- **Plano B em N baixo.** Se o N total ficar abaixo de 8, reportar como limitação metodológica (LANDIS & KOCH, 1977, é insuficiente para inferência); apresentar os dados como **casos** e não como amostra.

### 6.5 Saída no bundle de exportação

A `RF18 (Exportar resultados consolidados)` inclui um snapshot do CBAC de cada projeto — a configuração de visibilidade que estava ativa no momento da submissão dos clientes. Isso permite cruzar, no relato, a percepção do cliente com **quanto** foi liberado (proxy: número de atributos visíveis / 43).

---

## 7. Métricas e Artefatos Removidos pelo Refino 29/05

Itens que constavam na proposta de 28/05 e saíram do escopo de avaliação:

- **Rubrica humana sobre a Conectora.** Avaliaria fidelidade, utilidade, ausência de alucinação e **ausência de vazamento cross-cliente** das sínteses cross-projeto. Como a Conectora (RF21) saiu do MVP, esta rubrica não é aplicada. Mencionar no relato como trabalho futuro.
- **Likert sobre o Resumo do Cliente.** Substituído pelas dimensões `clareza_atributos_liberados` e `utilidade_liberado` (§ 6.2). O artefato avaliado deixa de ser uma narrativa gerada por IA e passa a ser a ficha de atributos liberados pelo CBAC.
- **Likert sobre o conhecimento comum cross-cliente.** Removido junto com RF22.

---

## 8. Cobertura do MPO (complementar)

Separado das métricas de precisão/recall/F1 (que medem **acurácia**), a cobertura do MPO mede **abrangência** da extração frente ao Quadro 37:

```
Cobertura_projeto = atributos_extraídos_com_valor / 43
```

Calculada para **todos os 5 projetos** (não só os 3 com gabarito) — ver RF09. Não exige rubrica humana, apenas presença/ausência de valor na extração automática.

---

## 9. Saída Esperada da Avaliação

Após executar este protocolo nas três frentes (extração nos 3 projetos com gabarito, categorização e Likert nos 5 projetos):

| Frente | Métrica | Apresentação |
|---|---|---|
| Extração (3 projetos) | Precisão / Recall / F1 — estruturado | Tabela por projeto + agregado |
| Extração (3 projetos) | Precisão / Recall / F1 — texto livre | Tabela por projeto + agregado |
| Extração (3 projetos) | Precisão / Recall / F1 — total ponderado | Tabela por projeto + agregado |
| Extração (3 projetos) | Cohen's Kappa | Por atributo (28 valores) + agregado |
| Extração (3 projetos) | Tempo manual vs. automático | Minutos por projeto + ganho percentual |
| Extração (3 projetos) | Lista de atributos com Kappa < 0,60 | Discussão como limitação no relato |
| Extração (3 projetos) | Lista de divergências fortes resolvidas | Por projeto |
| Extração (5 projetos) | Cobertura do MPO | Por projeto + heatmap projetos × atributos |
| Categorização (5 projetos) | Acurácia top-1 | Valor agregado |
| Categorização (5 projetos) | Calibração por faixa de confidence | Tabela 3 faixas × (confidence média, acurácia observada) |
| Categorização (5 projetos) | Matriz de confusão 6×6 | Tabela completa |
| Categorização (5 projetos) | Taxa de aceitação pelo consultor | Valor agregado |
| Likert consultoria | Estatísticas descritivas por dimensão (5) | Tabela |
| Likert clientes | Estatísticas descritivas por dimensão (5) | Tabela |
| Likert clientes | Histograma 1-5 por dimensão | Gráfico ou tabela |
| CBAC | Snapshot da configuração de visibilidade no momento da coleta | Por projeto |

Tudo exportável via RF18.

---

## 10. Riscos e Mitigações Específicas do Protocolo

| Risco | Mitigação |
|---|---|
| Avaliadores convergirem por contaminação (discutirem antes de anotar) | Anotação rigorosamente independente; sessão de reconciliação só após ambos terem persistido o JSON. |
| Cansaço/viés ao final do projeto | Pausar entre projetos; alternar a ordem de avaliação dos atributos. |
| Rubrica subentendida diferente entre os dois avaliadores | Sessão de calibração antes de iniciar Valença (~30 min lendo este doc juntos e discutindo os exemplos). |
| Schema do MPO mudar entre Valença e Freire Batista | Schema versionado; congelar ao fim da semana 9. Mudança implica refazer projetos já anotados. |

---

## 11. Próximos Passos

A infraestrutura técnica (schema, extração, log de sugestões, formulários Likert, exportação) já está implementada em `main`. Os próximos passos são todos de **coleta**:

1. **Sessão de calibração da rubrica** — Cynthia + Moisés (~30 min) revisando este documento e os exemplos da § 2.1 juntos antes de iniciar Valença.
2. **Produção dos gabaritos de extração** — Cynthia e Moisés conforme procedimento da § 3, nos 3 projetos.
3. **Rotulagem humana da temática** — Cynthia e Moisés rotulam independentemente, antes da invocação da IA, a categoria esperada de cada um dos 5 projetos (§ 5.1).
4. **Invocação da IA de categorização** — para cada projeto, `POST /projects/{id}/themes/suggest`; conferir o `suggested_domain` com o consenso humano para alimentar a matriz de confusão da § 5.
5. **Configuração do CBAC pelo consultor** — para cada cliente do estudo, decidir e aplicar via `PUT /projects/{id}/visibility/...` antes da janela de uso do cliente (≥ 2 semanas).
6. **Coleta Likert** — disparar os formulários para a consultoria (5 dimensões da § 6.1) e para os clientes (5 dimensões da § 6.2) após a janela de uso.
7. **Exportação consolidada** — `GET /exports/...` (RF18) para produzir o bundle final que alimenta o relato e o artigo.

---

## Referência

- VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese de Doutorado — CIn/UFPE, 2022.
- LANDIS, J. R.; KOCH, G. G. **The measurement of observer agreement for categorical data.** Biometrics, 33, p. 159-174, 1977.
