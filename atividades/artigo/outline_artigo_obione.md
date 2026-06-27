# Outline — Artigo ObiOne (formato SBC)

> Produzido pelo `structure_architect_agent` (modo `outline-only` do ARS) a partir do Chapter Plan do `/ars-plan`. Padrão estrutural: **híbrido IMRaD + Estudo de Caso (DSR)**. Alvo: ~5.000 palavras (relatório em formato de artigo SBC).

## Tese central (INSIGHT)

A IA Generativa reduz a fricção de iniciar o ciclo **observação → conversa → aprendizado** (custo cognitivo de criar do zero), mas o que diferencia um observatório de uma simples ferramenta de gestão é a **dimensão comunitária** (consultoria + clientes produzindo conhecimento). O ObiOne demonstra que esses dois elementos são complementares e viáveis em consultorias de pequeno-médio porte.

## Contribuição (INSIGHT)

A demonstração empírica de que o **MPO (Vieira, 2022) é implementável com IA generativa em consultoria real** (não em laboratório).

## Pergunta de pesquisa

*Como a IA Generativa pode viabilizar um observatório-comunidade de projetos, reduzindo a fricção de manutenção e promovendo o engajamento entre a organização executora e seus clientes?*

---

## Visão geral do fluxo

O artigo parte do problema de perda de conhecimento em consultorias (Introdução), fundamenta-o em quatro pilares teóricos (Referencial), estabelece a rastreabilidade entre requisitos e o MPO (Rastreabilidade), justifica a abordagem construtiva (Método DSR), descreve o artefato (Artefato), reporta a avaliação de uso e percepção (Avaliação), interpreta os achados frente à literatura (Discussão) e fecha com síntese, lições aprendidas e trabalhos futuros (Conclusão).

---

## Outline detalhado

### Resumo / Abstract (~250 palavras, bilíngue)
**Propósito:** problema, lacuna, artefato, método, principais achados (percepção 4,48/5; clareza 3,8/5 como gargalo; governança e aprendizados 5/5) e contribuição.
**Palavras-chave:** observatório de projetos; IA generativa; gestão do conhecimento; Design Science Research; MPO.

### 1. Introdução (~700 palavras)
**Propósito:** estabelecer urgência, lacuna e a RQ.
**Conteúdo:**
- 1.1 Problema — consultorias perdem conhecimento entre projetos; não há sistema leve o suficiente para manter (lições aprendidas ficam tácitas).
- 1.2 Lacuna dupla — (a) nenhuma implementação do MPO com IA generativa; (b) nenhum modelo de observatório semi-aberto com participação de clientes.
- 1.3 Oportunidade e objetivos — a IA generativa reduziu o custo de extração/síntese; enunciar RQ + objetivos + estrutura do artigo.
**Fontes:** Vieira (2022); literatura de KM em projetos; relatórios de uso de LLM.
**Transição:** o problema exige fundamentar quatro corpos de conhecimento.

### 2. Referencial Teórico (~850 palavras)
**Propósito:** fundamentar os quatro pilares e firmar a posição crítica.
**Conteúdo:**
- 2.1 MPO — Modelo de Observatório de Projetos (Vieira, 2022): 44 atributos, 8 dimensões, Quadro 37.
- 2.2 Gestão do Conhecimento em projetos: lições aprendidas, perda de conhecimento entre projetos.
- 2.3 IA Generativa como assistente de processos: extração, sugestão, síntese; human-in-the-loop.
- 2.4 Design Science Research: por que construir um artefato responde a uma pergunta de viabilidade.
- 2.5 Posição crítica — ferramentas de PM (Jira, Trello, dashboards) capturam *o quê*, não *o porquê*.
**Fontes:** Vieira (2022); Hevner et al. (2004) / Peffers et al. (2007) / Wieringa (2014); literatura de KM; literatura de GenAI assistiva.
**Transição:** estabelecidos os pilares, alinha-se requisitos do ObiOne ao MPO.

### 3. Rastreabilidade dos Requisitos ao MPO (~450 palavras)
**Propósito:** mapear os requisitos do ObiOne às dimensões/atributos do MPO (seção solicitada pela equipe).
**Conteúdo:**
- 3.1 Critério de mapeamento — RF → dimensão/atributo MPO → implementação (endpoint/tela).
- 3.2 Tabela de rastreabilidade (amostra dos RFs principais).
- 3.3 Cobertura resultante — 44 atributos, 8 dimensões; nota de que é cobertura **arquitetural** (a avaliação empírica da extração é trabalho declarado, não executado).
**Fontes:** `requisitos.md`, `backlog_obione.md`, `atributos_alvo_mpo.md`, `aderencia_observatorio_v2.md`.
**Transição:** a rastreabilidade justifica a abordagem construtiva; segue o método.

### 4. Método (DSR) (~500 palavras)
**Propósito:** justificar o DSR e descrever as frentes avaliativas.
**Conteúdo:**
- 4.1 Justificativa do DSR — viabilidade exige artefato + uso real + percepção (Likert sozinho mede só percepção).
- 4.2 Frentes avaliativas — (i) pipeline LLM de extração MPO; (ii) categorização de domínio (RF13); (iii) validação qualitativa (piloto MVP, N=4).
- 4.3 Limitações declaradas — N=4 piloto (casos, sem inferência estatística); extração MPO não avaliada empiricamente.
**Fontes:** `protocolo_avaliacao.md`; Hevner et al. (2004); Peffers et al. (2007).
**Transição:** descrito o método, apresenta-se o artefato.

### 5. Artefato e Implementação (~850 palavras)
**Propósito:** descrever o ObiOne de modo replicável.
**Conteúdo:**
- 5.1 Arquitetura — Spring Boot 3.5 / Java 21 (backend) + React 19 / TanStack (frontend); H2; mock-token.
- 5.2 Pipeline de IA em 4 papéis — Observadora (sugere observações), Sintetizadora (consolida aprendizados), Configuradora (categoriza domínio/setup), Consultora.
- 5.3 Governança por papel — acesso semi-aberto (consultoria vê tudo; cliente vê só o seu); mutação restrita a consultor/admin.
- 5.4 Decisão de design não óbvia — **IA sempre assistiva (human-in-the-loop)**: sugere, nunca publica sozinha (provê rastreabilidade e protege contra dependência).
- 5.5 Ciclo end-to-end — wizard IA-first → observação → conversa → aprendizado → feed; cobertura via `/coverage`.
**Fontes:** `arquitetura_backend.md`, `arquitetura_pipeline.md`, `aderencia_observatorio_v2.md`; código.
**Transição:** descrito o artefato, reporta-se a avaliação.

### 6. Avaliação (~750 palavras)
**Propósito:** reportar os resultados de uso e percepção.
**Conteúdo:**
- 6.1 Viabilidade técnica — ciclo exercitado fim a fim com IA real (OpenAI) e dados de simulação (16/06/2026).
- 6.2 Percepção (piloto N=4) — média geral 4,48/5; 44/48 respostas 4-5; resultados por dimensão.
- 6.3 Achado principal — governança (5/5) e aprendizados (5/5): a dimensão comunitária é o diferencial percebido.
- 6.4 Achado contrário (honestidade) — clareza inicial 3,8/5: gap de comunicação, não de produto; ação corretiva (onboarding) já implementada.
- 6.5 Evidências qualitativas — citações das perguntas abertas (força, diferencial, alerta, melhoria).
**Fontes:** deck de validação do MVP; `pesquisa_validacao_mvp.md`.
**Transição:** os achados pedem interpretação frente à literatura.

### 7. Discussão (~500 palavras)
**Propósito:** dialogar com a literatura e extrair implicações.
**Conteúdo:**
- 7.1 Diálogo com o MPO — confirma o MPO como base válida e implementável com IA a custo viável (contribuição empírica).
- 7.2 IA × comunidade — a IA viabiliza (reduz fricção de iniciar); a comunidade é o valor percebido. Resposta à inversão "IA cria dependência": human-in-the-loop + dados (comunidade valorizada acima da IA).
- 7.3 Implicação prática — começar pelo ciclo mínimo (1-2 projetos) antes de escalar.
**Fontes:** Vieira (2022); literatura de KM e GenAI.
**Transição:** consolida-se a síntese e as lições.

### 8. Conclusão e Lições Aprendidas (~650 palavras)
**Propósito:** sintetizar, registrar lições e abrir agenda futura.
**Conteúdo:**
- 8.1 Síntese — *"O custo de manter um observatório caiu com IA generativa, mas o diferencial de valor é a comunidade — isso não é substituível por tecnologia."*
- 8.2 Lições aprendidas (seção solicitada pela equipe):
  - **Operacionais / braçais / tempo** — escopo amplo para o prazo da disciplina; seed de dados e ciclo de PRs; gestão de cronograma (deslizes de data).
  - **Técnicos** — integração da IA (Spring AI / OpenAi), single-origin para acesso remoto, build Java 21, frontend TanStack.
  - **Conceituais** — entender o MPO em profundidade; traduzir 44 atributos em UI sem jargão; equilibrar IA assistiva × autonomia.
  - **De equipe** — coordenação de 4 integrantes, divisão de papéis (extração, frontend, avaliação, escrita), integração do trabalho.
- 8.3 Trabalhos futuros — (i) ampliar validação (N e domínios além de marketing); (ii) avaliar impacto da IA na *qualidade* dos aprendizados (não só na fricção); (iii) explorar síntese cross-projeto (Conectora).
**Fontes:** experiência do projeto; resultados da avaliação.

---

## Mapa de evidências

| Seção | Fontes atribuídas | Tipo de evidência |
|---|---|---|
| 1. Introdução | Vieira (2022); KM; GenAI | Contexto, enquadramento do problema |
| 2. Referencial | Vieira (2022); Hevner/Peffers/Wieringa; KM; GenAI | Fundamentação teórica |
| 3. Rastreabilidade | requisitos.md, backlog_obione.md, atributos_alvo_mpo.md, aderencia_observatorio_v2.md | Mapeamento requisito↔modelo |
| 4. Método | protocolo_avaliacao.md; Hevner/Peffers | Justificativa metodológica |
| 5. Artefato | arquitetura_*.md, aderencia_observatorio_v2.md, código | Descrição do artefato |
| 6. Avaliação | deck validação MVP; pesquisa_validacao_mvp.md | Dados empíricos (uso + percepção) |
| 7. Discussão | Vieira (2022); KM; GenAI | Comparação com trabalhos anteriores |
| 8. Conclusão | experiência do projeto; resultados | Síntese, lições, agenda |

> **Lacuna de evidência sinalizada:** os atributos de comparação teórica (KM, GenAI, DSR) ainda não têm referências bibliográficas concretas selecionadas. Antes do `full` mode, rodar uma busca de literatura (ex.: `/ars-lit-review` ou `deep-research`) para fixar ≥ 8-10 referências verificáveis (com DOI).

## Resumo de alocação de palavras

| Seção | % | Palavras-alvo |
|---|---|---|
| Resumo/Abstract | — | 250 (não conta) |
| 1. Introdução | 14% | 700 |
| 2. Referencial | 17% | 850 |
| 3. Rastreabilidade | 9% | 450 |
| 4. Método | 10% | 500 |
| 5. Artefato | 17% | 850 |
| 6. Avaliação | 15% | 750 |
| 7. Discussão | 10% | 500 |
| 8. Conclusão + Lições | 13% | 650 |
| **Total** | **~100%** | **~5.250** |

## Próximos passos

1. **Fixar referências** — `/ars-lit-review` (ou `deep-research`) para ≥ 8-10 fontes verificáveis com DOI (preenche a lacuna do mapa de evidências).
2. **`full` mode** — produzir o draft completo a partir deste outline.
3. **Gerar PDF** — `documento-poli` a partir do `.md` do draft → salvar em `atividades/artigo/` e subir no GitHub (via PR).
