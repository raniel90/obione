# Protocolo de Avaliação — ObiOne

Documento metodológico para a avaliação quantitativa do pipeline LLM do ObiOne. Define o critério de comparação entre extração automática e gabarito manual, a rubrica de pontuação humana, o protocolo de resolução de divergências e as fórmulas das métricas.

**Insumos:** `atributos_alvo_mpo.md` (44 atributos categorizados como `estruturado` / `texto_livre` / `fora_de_escopo`).

**Aplicação:** este protocolo é aplicado em 3 projetos do estudo de caso — **Valença Odontologia** (piloto), **Freire Batista ADV** e **Kaka JJ** — por **Cynthia** e **Moisés** como dois avaliadores independentes.

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
- **Automático:** tempo medido pelo sistema entre `POST /projects/{id}/extract` e persistência da extração (em segundos/minutos).

Reportado como média por projeto e total.

---

## 5. Cobertura do MPO (complementar)

Separado das métricas de precisão/recall/F1 (que medem **acurácia**), a cobertura do MPO mede **abrangência** da extração frente ao Quadro 37:

```
Cobertura_projeto = atributos_extraídos_com_valor / 43
```

Calculada para **todos os 5 projetos** (não só os 3 com gabarito) — ver RF09. Não exige rubrica humana, apenas presença/ausência de valor na extração automática.

---

## 6. Saída Esperada da Avaliação

Após executar este protocolo nos 3 projetos:

| Métrica | Apresentação |
|---|---|
| Precisão / Recall / F1 — estruturado | Tabela por projeto + agregado |
| Precisão / Recall / F1 — texto livre | Tabela por projeto + agregado |
| Precisão / Recall / F1 — total ponderado | Tabela por projeto + agregado |
| Cohen's Kappa | Por atributo (28 valores) + agregado |
| Tempo manual vs. automático | Minutos por projeto + ganho percentual |
| Cobertura do MPO | Por projeto (5) + heatmap projetos × atributos |
| Lista de atributos com Kappa < 0,60 | Discussão como limitação no relato |
| Lista de divergências fortes resolvidas | Por projeto |

Tudo exportável via RF18.

---

## 7. Riscos e Mitigações Específicas do Protocolo

| Risco | Mitigação |
|---|---|
| Avaliadores convergirem por contaminação (discutirem antes de anotar) | Anotação rigorosamente independente; sessão de reconciliação só após ambos terem persistido o JSON. |
| Cansaço/viés ao final do projeto | Pausar entre projetos; alternar a ordem de avaliação dos atributos. |
| Rubrica subentendida diferente entre os dois avaliadores | Sessão de calibração antes de iniciar Valença (~30 min lendo este doc juntos e discutindo os exemplos). |
| Schema do MPO mudar entre Valença e Freire Batista | Schema versionado; congelar ao fim da semana 9. Mudança implica refazer projetos já anotados. |

---

## 8. Próximos Passos

1. **Revisão pela Cynthia** desta proposta de protocolo — confirmar exemplos da rubrica e ajustar limites se necessário.
2. **Sessão de calibração** Cynthia + Moisés (~30 min) antes de iniciar Valença.
3. **T1.3 — Schema de extração** (Raniel) — derivar JSON Schema formal de `atributos_alvo_mpo.md` para uso na extração automática e validação dos gabaritos.
4. **T1.4 — Produção dos gabaritos** — seguindo o procedimento da seção 3.

---

## Referência

- VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese de Doutorado — CIn/UFPE, 2022.
- LANDIS, J. R.; KOCH, G. G. **The measurement of observer agreement for categorical data.** Biometrics, 33, p. 159-174, 1977.
