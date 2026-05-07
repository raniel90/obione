# ObiOne — Backlog de Produto (Revisado)

> Versão revisada do backlog para alinhar o desdobramento de produto à proposta acadêmica do ObiOne (atividade 1) e à metodologia DSR em 12 semanas.

## Visão Geral

O ObiOne é um observatório de projetos baseado no MPO (Farias Jr. *et al.*, 2025; Vieira, 2022), potencializado por IA Generativa. O objetivo do MVP é demonstrar que um pipeline LLM consegue extrair atributos do MPO a partir de documentos não-estruturados, alimentar um dashboard de observação e ser avaliado quantitativa e qualitativamente em um estudo de caso com 5 projetos reais.

**Não é um produto SaaS de gestão de risco ou portfólio.** É um artefato de pesquisa avaliado via DSR (Hevner *et al.*, 2004).

---

## Princípios de Escopo

1. **Fidelidade ao MPO.** O que o pipeline extrai deve ser, sempre que possível, atributo previsto no **Quadro 37 (terceira versão do MPO — Vieira, 2022)** — não uma lista própria. Atributos não-textuais (ex.: imagens/fotos do projeto) ficam **fora do escopo** do pipeline LLM.
2. **Avaliação primeiro.** Toda funcionalidade de produto precisa estar a serviço da avaliação DSR (cobertura do MPO, precisão/recall/F1, Cohen's Kappa, Likert).
3. **Um ciclo, três meses.** O que não couber em 12 semanas vai para o backlog futuro.
4. **Estudo de caso definido.** 5 projetos: Freire Batista ADV, Valença Odontologia, Kaka JJ, Bem Viver Fitoterápicos, Dinoah ADV.

---

## Estratégia de IA

- LLM como **camada interna obrigatória** para extração estruturada de atributos do MPO.
- Chat com IA: fora do escopo do MVP — backlog futuro.

---

# Entregáveis da Fase Preparatória (semanas 1–2)

Não são US de produto, são **decisões metodológicas e baselines de avaliação** que destravam todo o trabalho subsequente. Sem elas, Sprint 1 estoura e Sprint 3 não tem como rodar.

| Entregável | Conteúdo |
|---|---|
| `docs/atributos_alvo_mpo.md` | Lista derivada do Quadro 37 do MPO. Para cada atributo: nome, categoria (geral, stakeholders, escopo, cronograma, custos, riscos, mudanças, lições) e **tipo** (`estruturado` ou `texto_livre`). Atributos não-extraíveis (imagens/fotos) marcados como `fora_de_escopo`. |
| `docs/protocolo_avaliacao.md` | Critério híbrido de match para US09: (i) atributos `estruturado` por comparação normalizada exata (TP/FP/FN binário); (ii) atributos `texto_livre` por rubrica humana 0/0,5/1 aplicada por dois avaliadores independentes; (iii) cálculo de concordância via Cohen's Kappa; (iv) protocolo de resolução de divergências. |
| `docs/schema_extracao.json` | Schema JSON formal derivado da lista de atributos-alvo, usado tanto pela extração automática quanto pela manual. |
| `docs/gabarito/<projeto>.json` (×5) | Extração manual de cada um dos 5 projetos por **dois avaliadores independentes**, seguindo `atributos_alvo_mpo.md` e `schema_extracao.json`. Divergências resolvidas conforme `protocolo_avaliacao.md`; resoluções documentadas. **Valença Odontologia é o projeto piloto** — primeiro a ser anotado para calibrar a rubrica antes dos outros 4. |

**Responsáveis:** a definir na reunião de kickoff da semana 1; sugere-se ao menos um par de revisão por entregável (autor + revisor cruzado entre os 4 integrantes).

---

# MVP

## Sprint 1 — Ingestão e Extração (semanas 3–5)

### US01 — Cadastrar projeto
**Como** pesquisador, **quero** cadastrar um projeto **para** ancorar documentos e extrações.

Critérios:
- Campos: nome, domínio (jurídico, saúde, esporte, branding, outros), descrição livre.
- Identificador único por projeto.
- Listagem dos projetos cadastrados.

---

### US02 — Fazer upload de documentos do projeto
**Como** pesquisador, **quero** anexar arquivos (.docx, .pdf, .txt) **para** servir de fonte para a extração.

Critérios:
- Suporte mínimo obrigatório: `.docx` (formato dos casos reais).
- Múltiplos arquivos por projeto.
- Persistência do arquivo bruto + metadados (nome, data, tamanho, hash).

---

### US03 — Extrair atributos do MPO via LLM
**Como** sistema, **devo** processar os documentos do projeto e extrair os atributos previstos no Quadro 37 (terceira versão) do MPO.

Critérios:
- Prompt estruturado a partir da lista de atributos-alvo definida na fase preparatória.
- Saída JSON conforme `docs/schema_extracao.json`, contendo as 8 categorias do Quadro 37 (geral, stakeholders, escopo, cronograma, custos, riscos, mudanças, lições aprendidas).
- Para cada atributo preenchido: valor extraído + trecho de origem (citação).
- Atributos não encontrados são marcados como `null` — nunca inventados.
- Atributos marcados como `fora_de_escopo` (ex.: imagens/fotos) são ignorados pelo pipeline.

Notas técnicas:
- Versão do prompt e modelo LLM registrados junto com a extração (reprodutibilidade).
- Estratégia de *chunking* documentada se o documento exceder o contexto.

---

### US04 — Persistir extração estruturada
**Como** sistema, **devo** salvar a extração JSON associada ao projeto e aos documentos de origem.

Critérios:
- Schema do JSON deriva diretamente dos atributos do Quadro 37.
- Cada extração registra: projeto, documento(s), versão do prompt, modelo LLM, timestamp, **origem** (`automatico` | `manual`).
- Recuperável posteriormente para comparação com gabarito.

---

## Sprint 2 — Dashboard e Cobertura MPO (semanas 6–8)

### US05 — Visualizar portfólio
**Como** pesquisador, **quero** uma visão consolidada dos projetos **para** observar o portfólio.

Critérios:
- Lista projetos com: nome, domínio, status, % de cobertura do MPO.
- **Status é derivado** do estado dos dados, não editado manualmente. Valores possíveis: `cadastrado` (US01), `ingerido` (US02 com ≥ 1 documento), `extraído` (US03/04 com extração persistida), `avaliado` (US09 com comparação concluída).
- Filtro por domínio.

---

### US06 — Visualizar detalhe do projeto
**Como** pesquisador, **quero** ver os atributos extraídos de um projeto **para** inspecionar a saída do LLM.

Critérios:
- Exibe todos os atributos do Quadro 37 (preenchidos e vazios) agrupados por categoria.
- Para cada atributo preenchido: valor + trecho de origem.
- Acesso aos documentos originais.

---

### US07 — Indicador de cobertura do MPO
**Como** pesquisador, **quero** saber quais atributos do MPO foram preenchidos pela IA **para** avaliar a abrangência do pipeline.

Critérios:
- Por projeto: % de atributos preenchidos vs. total de atributos-alvo (Quadro 37, excluindo `fora_de_escopo`).
- No portfólio: tabela ou heatmap cruzando projetos × atributos.
- **Destaque visual** quando cobertura < 50% (atributos pouco capturados pelo pipeline) — cor diferenciada na tabela/heatmap. Cobertura ≥ 80% sinalizada como saudável.

> Indicador-chave da avaliação quantitativa, não opcional.

---

## Sprint 3 — Avaliação DSR (semanas 9–10)

### US08 — Importar e validar gabarito manual
**Como** pesquisador, **quero** carregar o gabarito manual produzido na fase preparatória **para** servir de baseline na comparação com a extração automática.

Critérios:
- Carga dos arquivos `docs/gabarito/<projeto>.json` (5 arquivos) gerados na fase preparatória.
- Validação de schema: cada gabarito está conforme `docs/schema_extracao.json`.
- Persistência no mesmo schema da extração automática, com `origem: manual`.
- Validação de integridade: todos os 5 projetos têm gabarito completo antes de US09 ser executada.

> A **produção** do gabarito (esforço alto: ~30 dos ~43 atributos do Quadro 37 são texto livre) é **entregável da fase preparatória** (Marco M1, fim da semana 2). Esta US apenas importa e valida o trabalho já feito.

---

### US09 — Comparar extração automática vs. gabarito (critério híbrido)
**Como** pesquisador, **quero** métricas de precisão, recall e F1 calculadas conforme o protocolo híbrido **para** avaliar quantitativamente o pipeline.

Critérios:
- Atributos `estruturado` (datas, valores, status, nomes próprios formais): comparação normalizada exata; cálculo binário de TP/FP/FN.
- Atributos `texto_livre` (escopo, riscos, lições, etc.): rubrica humana 0 / 0,5 / 1 por dois avaliadores independentes.
- Concordância entre avaliadores reportada via Cohen's Kappa por atributo e agregado.
- Métricas reportadas separadamente para o grupo `estruturado` e `texto_livre`, mais agregado total.
- Tempo de extração registrado: manual (reportado) vs. automático (medido).
- Visualização tabular dos resultados por projeto e consolidados.

> Atributos com Kappa < 0,6 indicam que a rubrica precisa ser refinada — registrar e discutir como limitação.

---

### US10 — Coletar feedback qualitativo (Likert)
**Como** pesquisador, **quero** registrar respostas dos stakeholders **para** compor a avaliação qualitativa.

Critérios:
- Formulário com 4 dimensões em escala 1–5: utilidade, clareza, completude, confiabilidade.
- Identificação do projeto e do respondente (anônimo opcional).
- Persistência das respostas e relatório agregado.

> **N esperado:** ~2 stakeholders por projeto = entre 8 e 10 respondentes no total. Recrutamento via contato direto pelo Raniel (responsável pelo acesso aos casos). **Plano B** caso N < 8: aceitar 1 respondente por projeto e declarar limitação na avaliação.

> Implementação mínima viável: Google Forms externo + import dos resultados, desde que os dados cheguem ao sistema para o relatório.

---

### US11 — Exportar resultados consolidados
**Como** pesquisador, **quero** exportar os resultados da avaliação **para** alimentar o relatório final e o artigo.

Critérios:
- Exportação em CSV/JSON: extrações, cobertura, precisão/recall/F1 por grupo, Kappa, respostas Likert.
- Cabeçalhos compatíveis com importação em planilha.

---

# Marcos do Estudo de Caso

Marcos verificáveis para garantir que os 5 projetos são processados de ponta a ponta — sem isso, o time pode terminar o MVP sem nunca ter rodado os casos.

| Marco | Quando | Critério de aprovação |
|---|---|---|
| **M1** — Preparação concluída | Fim da semana 2 | `docs/atributos_alvo_mpo.md`, `docs/protocolo_avaliacao.md` e `docs/schema_extracao.json` versionados; gabarito manual dos 5 projetos produzido. |
| **M2** — Pipeline operacional nos 5 casos | Fim da semana 5 | Extração automática rodada para os 5 projetos sem erro fatal; JSONs persistidos. |
| **M3** — Dashboard com cobertura | Fim da semana 8 | Cobertura do MPO visualizável para os 5 projetos; tabela cruzada projetos × atributos disponível. |
| **M4** — Avaliação concluída | Fim da semana 10 | Precisão/recall/F1 calculados para os 5 projetos (estruturado + texto_livre); Likert coletado e consolidado; exportação dos resultados pronta para o relatório. |

---

# Backlog Futuro (fora do MVP)

Itens previstos no backlog original que ficam **fora do escopo** das 12 semanas. Podem virar trabalhos futuros, evoluções pós-disciplina ou nova proposta.

| Item | Origem no backlog anterior | Motivo de adiar |
|---|---|---|
| Modelo de risco PMBOK com pesos próprios | EPIC 3 (US08-10) | Artefato paralelo não previsto na proposta. Riscos já são atributo extraído do MPO. |
| Atualização incremental + detecção de mudanças + versionamento | US05-07 | Estudo de caso assume um corpo documental por projeto; versionamento não é avaliado. |
| Linha do tempo de eventos | US13 | Não é cobrado pela avaliação DSR. |
| Indicadores de portfólio avançados | US14 | Cobertura do MPO já é o indicador-alvo; demais ficam pós-MVP. |
| Comparação entre projetos / por domínio | US15, RF18 | Fora do ciclo único de DSR. |
| Detecção de problemas de comunicação, padrões, alertas, recomendações, insights, resumo automático | US16-21 | Features de produto SaaS, não de artefato avaliado academicamente. |
| Chat com IA | US22 | Já marcado como avançado. Mantido fora. |
| Extração de imagens/fotos | — | Atributo do Quadro 37 não-textual; fora do escopo de pipeline LLM textual. |

---

# Cronograma (alinhado à metodologia)

| Semana | Atividade | Sprint | Marco |
|---|---|---|---|
| 1–2 | Consciência do problema; entregáveis preparatórios; gabarito manual dos 5 projetos | — | M1 |
| 3–5 | Cadastro, ingestão, extração, persistência | Sprint 1 | M2 |
| 6–8 | Dashboard, detalhe, cobertura MPO | Sprint 2 | M3 |
| 9–10 | Avaliação quantitativa e qualitativa | Sprint 3 | M4 |
| 11–12 | Escrita do relatório final e do artigo | — | — |

---

# Definição de Pronto (DoD)

**Por User Story**
- Critérios de aceitação atendidos.
- Código mergeado em `main` após revisão de pelo menos um integrante.
- Dados de teste persistidos quando aplicável.

**Por Sprint**
- Marco da sprint atingido (M2, M3 ou M4).
- Demo curta para o grupo (15 min) com os 5 projetos sendo processados/visualizados/avaliados conforme a sprint.
- Documentação mínima atualizada (README ou wiki interna).

---

# Riscos do Projeto

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Acesso insuficiente aos stakeholders para Likert | Média | Alto | Iniciar contato na semana 1. Plano B: 1 respondente por projeto + declaração de limitação. |
| R2 | Heterogeneidade alta dos `.docx` reais quebra o pipeline | Média | Médio | Inspeção amostral na semana 1; estratégia de *chunking* + saneamento documentada antes do Sprint 1. |
| R3 | Custo/limite de tokens da API LLM | Baixa | Médio | Estimar volume na semana 1; usar modelo apropriado por etapa (mais barato p/ chunking, mais capaz p/ extração final). |
| R4 | Concordância entre avaliadores baixa (Kappa < 0,6) | Média | Médio | **Valença Odontologia (complexidade Baixa) como projeto piloto** — primeiro a ser anotado para calibrar a rubrica. Se a rubrica mudar significativamente após o piloto, refazer Valença com a rubrica final antes de US09. |
| R5 | Esforço do gabarito manual estoura semana 1–2 | Alta | Alto | 5 projetos × 2 avaliadores = 10 extrações distribuídas entre os 4 integrantes (~2-3 cada) com revisão cruzada. Iniciar imediatamente após `docs/atributos_alvo_mpo.md` (provavelmente fim da semana 1). |
| R6 | Mudança no schema do MPO mid-sprint | Baixa | Alto | Schema versionado; mudanças exigem retrabalho do gabarito — congelar schema ao fim da semana 2. |

---

# Definição do MVP

> Upload (.docx) → Extração LLM dos atributos do Quadro 37 do MPO → JSON estruturado → Dashboard com cobertura → Avaliação contra gabarito + Likert.

O MVP **não é um produto comercial**. É um artefato de pesquisa funcional o suficiente para que um pesquisador consiga: (i) processar 5 projetos reais, (ii) inspecionar a saída por projeto, (iii) medir cobertura do MPO, precisão, recall e F1 contra a extração manual, (iv) coletar e consolidar feedback Likert dos stakeholders, (v) exportar todos os resultados para o relatório.

---

# Definição do Produto

O ObiOne é um observatório de projetos baseado no MPO que utiliza IA Generativa para automatizar a etapa mais crítica reportada na literatura — a coleta e estruturação de dados de projetos a partir de documentos heterogêneos não-estruturados — reduzindo a dependência de equipes dedicadas e estendendo a aplicabilidade do MPO para contextos privados e multissetoriais.
