# Plano de Execução — ObiOne

Plano de trabalho para executar o ObiOne dentro do calendário da disciplina TAES, alinhado à proposta acadêmica, ao backlog revisado e aos entregáveis formais cobrados pelo professor.

Período: semana 7 (08/05) a semana 16 (10/07) — 10 semanas de trabalho.

---

## 1. Equipe e Responsabilidades

| Integrante | Papel principal | Frentes |
|---|---|---|
| **Bruno** | Frontend | Prototipação das telas, implementação React + Vite + componentes Lovable |
| **Raniel** | Backend | Arquitetura, FastAPI, banco, pipeline LLM, integração, requisitos |
| **Cynthia** | Pesquisa + escrita | Atributos-alvo, gabaritos manuais, matriz de rastreabilidade, relato de experiência (artigo) |
| **Moisés** | Pesquisa + apresentação | Protocolo de avaliação, gabaritos manuais, Likert, apresentação final |

**Avaliação** = trabalho conjunto de Cynthia + Moisés (par de avaliadores independentes para o gabarito e para a aplicação da rubrica).

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + componentes Lovable |
| Backend | Python 3 + FastAPI |
| Banco de dados | PostgreSQL |
| Comunicação | REST (JSON) |
| LLM | A definir pelo Raniel (decisão técnica do backend) |
| Ambiente | Docker Compose local — sem deploy em produção |
| Autenticação | Não há (fora do escopo do MVP) |

Repositório: **`raniel90/obione`** (já existe; código vai em `backend/` e `frontend/` na raiz).

---

## 3. Entregáveis Formais da Disciplina

Sete artefatos compõem a entrega final no dia 10/07. Todos **herdam do MPO** (Quadro 37, terceira versão — Vieira, 2022).

| # | Entregável | Responsável | Prazo final |
|---|---|---|---|
| 1 | Requisitos (RF + RNF) | Raniel | semana 8 (15/05) |
| 2 | Prototipação das telas | Bruno | semana 8 (15/05) |
| 3 | Matriz de rastreabilidade | Cynthia | semana 15 (03/07) |
| 4 | Código rodando local + 5 projetos processados | Bruno + Raniel | semana 14 (26/06) |
| 5 | Avaliação executada (precisão, recall, F1, Kappa, Likert) | Cynthia + Moisés | semana 14 (26/06) |
| 6 | Relato de experiência (formato artigo) | Cynthia | semana 16 (09/07) |
| 7 | Apresentação final | Moisés | semana 16 (10/07) |

---

## 4. Cronograma Geral

Mapeamento ao calendário da disciplina, com marcos do projeto e Status Reports formais.

| Sem | Data | Bloco do plano | Marco |
|---|---|---|---|
| 7 | 08/05 | Bloco 0 (fundação) + Bloco 1 (preparação avaliação) início | — |
| 8 | 15/05 | Bloco 0 conclusão + Bloco 1 continuação | — |
| 9 | 22/05 | Bloco 1 conclusão + **Status Report 1** | **M1** |
| 10 | 29/05 | Bloco 2 (pipeline) | — |
| 11 | 05/06 | Bloco 2 conclusão + Bloco 3 (dashboard) início | **M2** |
| 12 | 12/06 | Bloco 3 continuação | — |
| 13 | 19/06 | Bloco 3 conclusão + **Status Report 2** + Bloco 4 início | **M3** |
| 14 | 26/06 | Bloco 4 (avaliação) conclusão | **M4** |
| 15 | 03/07 | Bloco 5 (documentação) | — |
| 16 | 10/07 | **Apresentação final + entrega do artigo** | — |

**Marcos do projeto:**
- **M1** (sem 9): preparação da avaliação concluída.
- **M2** (sem 11): pipeline LLM operacional nos 5 projetos.
- **M3** (sem 13): dashboard com cobertura do MPO funcional.
- **M4** (sem 14): avaliação completa executada.

---

## 5. Tarefas por Bloco

Cada tarefa segue o formato:
- **Responsável** | **Prazo** | **O que fazer** | **Entregável** | **Aceitação**

### Bloco 0 — Fundação Documental e Técnica (semanas 7-8)

#### T0.1 — Requisitos (RF + RNF)
- **Responsável:** Raniel (com input do grupo)
- **Prazo:** sem 8 (15/05)
- **O que fazer:** Documentar requisitos funcionais (derivados das US01–US11 do backlog) e não-funcionais (performance básica, usabilidade, manutenibilidade).
- **Entregável:** `atividades/requisitos.md` com RF01–RF11 + 5–7 RNFs.
- **Aceitação:** cada RF mapeia 1:1 para uma US do backlog; RNFs cobrem performance, usabilidade e manutenibilidade.

#### T0.2 — Prototipação das telas
- **Responsável:** Bruno
- **Prazo:** sem 7-8 (até 15/05)
- **O que fazer:** Criar wireframes/mockups das 4 telas principais (lista de projetos, detalhe do projeto, upload de documentos, cobertura do MPO) usando Lovable. Apresentar e revisar com o grupo na reunião semanal.
- **Entregável:** Protótipos exportados (PNG/PDF) + link para o projeto no Lovable; documento `atividades/prototipos.md` com screenshot de cada tela e descrição.
- **Aceitação:** protótipos cobrem todas as US01–US07; aprovados pelo grupo antes do início da implementação frontend.

#### T0.3 — Setup do código no repo
- **Responsável:** Raniel (com Bruno acompanhando setup do frontend)
- **Prazo:** sem 7 (até 15/05)
- **O que fazer:** Criar `backend/` (FastAPI + SQLAlchemy + Alembic) e `frontend/` (Vite + React) na raiz do `raniel90/obione`. Configurar `docker-compose.yml` com Postgres. Endpoint backend `/health` retornando JSON; tela inicial frontend exibindo a resposta do backend.
- **Entregável:** PR mergeado com README de setup atualizado; ambiente local funcional.
- **Aceitação:** qualquer integrante clona o repo e roda em < 30 min seguindo o README.

#### T0.4 — Matriz de rastreabilidade (versão semente)
- **Responsável:** Cynthia
- **Prazo:** sem 8 (15/05)
- **O que fazer:** Esboçar a matriz com colunas: Requisito | US | Atributo do MPO | Categoria | Métrica de avaliação. Preencher com base nos requisitos da T0.1.
- **Entregável:** `atividades/matriz_rastreabilidade.md` versão inicial.
- **Aceitação:** matriz cobre todos os RF; será atualizada ao longo do projeto.

---

### Bloco 1 — Preparação da Avaliação (semanas 7-9, M1)

#### T1.1 — Lista de atributos-alvo do MPO
- **Responsável:** Cynthia (autor) + Moisés (revisor)
- **Prazo:** sem 7 (15/05)
- **O que fazer:** Derivar do Quadro 37 a lista de ~43 atributos. Para cada um: nome, categoria (geral, stakeholders, escopo, cronograma, custos, riscos, mudanças, lições aprendidas) e tipo (`estruturado` ou `texto_livre`). Marcar imagens/fotos como `fora_de_escopo`.
- **Entregável:** `atividades/atributos_alvo_mpo.md` com a lista categorizada.
- **Aceitação:** lista revisada por Moisés; alinhada ao Quadro 37 sem omissões.

#### T1.2 — Protocolo de avaliação
- **Responsável:** Moisés (autor) + Cynthia (revisor)
- **Prazo:** sem 7 (15/05)
- **O que fazer:** Documentar o critério híbrido de match: (i) atributos `estruturado` por comparação normalizada exata (TP/FP/FN binário); (ii) atributos `texto_livre` por rubrica humana 0 / 0,5 / 1 aplicada por dois avaliadores; (iii) Cohen's Kappa para concordância; (iv) protocolo de resolução de divergências.
- **Entregável:** `atividades/protocolo_avaliacao.md`.
- **Aceitação:** cada tipo de atributo tem critério explícito; rubrica documentada com 2-3 exemplos por categoria.

#### T1.3 — Schema de extração
- **Responsável:** Raniel
- **Prazo:** sem 8 (22/05)
- **O que fazer:** Definir schema JSON formal derivado da T1.1, usado pela extração automática e manual. Versionar no repositório.
- **Entregável:** schema versionado em `backend/app/schemas/extracao.py` (Pydantic) ou JSON Schema equivalente.
- **Aceitação:** schema valida tanto outputs do LLM quanto gabaritos manuais.

#### T1.4 — Gabaritos manuais dos 5 projetos
- **Responsável:** Cynthia + Moisés (par de avaliadores independentes)
- **Prazo:** sem 8-9 (até 22/05)
- **O que fazer:** Cada um anota independentemente os 5 projetos seguindo T1.1, T1.2 e T1.3. **Valença Odontologia primeiro como piloto** para calibrar a rubrica; se a rubrica mudar significativamente após o piloto, refazer Valença com a versão final. Resolver divergências em sessão estruturada conforme T1.2.
- **Entregável:** `atividades/gabaritos/<projeto>_cynthia.json` + `_moises.json` para cada um dos 5 projetos + `atividades/gabaritos/<projeto>_consolidado.json` (após resolução).
- **Aceitação:** 5 gabaritos consolidados disponíveis antes do Status Report 1; Cohen's Kappa por atributo registrado para uso na T4.2.

---

### Bloco 2 — Pipeline Funcional (semanas 9-11, M2)

#### T2.1 — US01 (cadastro) + US02 (upload)
- **Responsável:** Bruno (frontend) + Raniel (backend)
- **Prazo:** sem 9-10 (até 29/05)
- **O que fazer:** Implementar cadastro de projetos com nome, domínio (jurídico, saúde, esporte, branding, outros), descrição. Upload de arquivos `.docx` (múltiplos por projeto), persistência em Postgres com metadados (nome, data, tamanho, hash).
- **Entregável:** endpoints REST (`POST /projects`, `POST /projects/{id}/documents`) + telas correspondentes consumindo a API.
- **Aceitação:** cadastrar Valença, fazer upload do `.docx` real, ver na lista de projetos.

#### T2.2 — US03 (extração via LLM)
- **Responsável:** Raniel
- **Prazo:** sem 10-11 (até 05/06)
- **O que fazer:** Implementar pipeline LLM que, dado um documento do projeto, extrai os atributos conforme schema T1.3. Para cada atributo preenchido: valor + trecho de origem. Atributos não encontrados marcados como `null`. Versão do prompt e modelo registrados na extração.
- **Entregável:** endpoint `POST /projects/{id}/extract`; resultado JSON persistido.
- **Aceitação:** extração rodando para Valença com saída estruturada coerente; ≥ 70% dos atributos preenchidos no piloto.

#### T2.3 — US04 (persistência) + extração nos 5 projetos
- **Responsável:** Raniel
- **Prazo:** sem 11 (até 05/06)
- **O que fazer:** Persistir extrações com todos os metadados (versão prompt, modelo LLM, timestamp, `origem: automatico`). Rodar extração para os 5 projetos.
- **Entregável:** 5 extrações JSON persistidas no banco; consultáveis via API.
- **Aceitação:** **M2 atingido** — pipeline operacional nos 5 casos sem erro fatal.

---

### Bloco 3 — Dashboard + Cobertura (semanas 11-13, M3)

#### T3.1 — US05 (portfólio) + US06 (detalhe do projeto)
- **Responsável:** Bruno (frontend) + Raniel (suporte API)
- **Prazo:** sem 11-12 (até 12/06)
- **O que fazer:** Tela de portfólio: lista projetos com nome, domínio, status derivado (`cadastrado` → `ingerido` → `extraído` → `avaliado`), % de cobertura. Tela de detalhe: atributos extraídos agrupados por categoria do Quadro 37, com trecho de origem por atributo; acesso aos documentos originais.
- **Entregável:** 2 telas funcionais consumindo a API; endpoints `GET /projects` e `GET /projects/{id}`.
- **Aceitação:** navegar pelos 5 projetos; ver atributos extraídos com trechos de origem.

#### T3.2 — US07 (indicador de cobertura do MPO)
- **Responsável:** Bruno (frontend) + Raniel (cálculo backend)
- **Prazo:** sem 12-13 (até 19/06)
- **O que fazer:** Calcular cobertura por projeto (% atributos preenchidos vs. total de atributos-alvo, excluindo `fora_de_escopo`). Exibir tabela ou heatmap cruzando projetos × atributos. Destaque visual quando cobertura < 50%; sinalização saudável quando ≥ 80%.
- **Entregável:** componente de cobertura no frontend; endpoint `GET /coverage`.
- **Aceitação:** **M3 atingido** — dashboard com cobertura visualizável; pronto para o Status Report 2.

---

### Bloco 4 — Avaliação (semanas 13-14, M4)

#### T4.1 — US08 (importar gabaritos)
- **Responsável:** Raniel
- **Prazo:** sem 13 (até 19/06)
- **O que fazer:** Endpoint para carregar os JSONs consolidados produzidos na T1.4, com `origem: manual`. Validar conformidade com schema T1.3.
- **Entregável:** endpoint `POST /projects/{id}/baseline`; gabaritos persistidos.
- **Aceitação:** os 5 gabaritos consolidados no banco, todos validados.

#### T4.2 — US09 (comparação automático vs. gabarito)
- **Responsável:** Raniel (algoritmo) + Cynthia + Moisés (aplicação da rubrica)
- **Prazo:** sem 14 (até 26/06)
- **O que fazer:** Implementar comparação híbrida conforme T1.2. Estruturado: comparação normalizada exata (TP/FP/FN). Texto livre: Cynthia e Moisés aplicam a rubrica 0/0,5/1 (UI dedicada ou planilha intermediária); calcular precisão, recall, F1 e Cohen's Kappa por grupo (estruturado vs. texto_livre) e agregado.
- **Entregável:** relatório de métricas por projeto e consolidado.
- **Aceitação:** tabela completa com precisão, recall, F1, Kappa para os 5 projetos; atributos com Kappa < 0,6 sinalizados.

#### T4.3 — US10 (Likert)
- **Responsável:** Moisés (formulário + análise) + Bruno (acesso aos stakeholders)
- **Prazo:** sem 13-14 (até 26/06)
- **O que fazer:** Setup Google Forms com 4 dimensões (utilidade, clareza, completude, confiabilidade) escala 1–5. Bruno media o contato com os stakeholders dos 5 projetos. Importar respostas para o sistema; relatório agregado.
- **Entregável:** formulário publicado + respostas consolidadas + relatório de médias por dimensão.
- **Aceitação:** **N ≥ 8** ideal (~2 stakeholders por projeto); **plano B**: N ≥ 5 (1 por projeto) com declaração de limitação no relato.

#### T4.4 — US11 (exportação consolidada)
- **Responsável:** Raniel
- **Prazo:** sem 14 (até 26/06)
- **O que fazer:** Endpoint que gera arquivo único (CSV ou JSON) com extrações, cobertura, métricas (precisão/recall/F1/Kappa) e respostas Likert.
- **Entregável:** arquivo de exportação; comando ou botão para gerar.
- **Aceitação:** **M4 atingido** — todos os dados de avaliação exportáveis para alimentar o relato.

---

### Bloco 5 — Documentação Acadêmica (semanas 14-16)

#### T5.1 — Matriz de rastreabilidade (finalização)
- **Responsável:** Cynthia
- **Prazo:** sem 15 (até 03/07)
- **O que fazer:** Atualizar a matriz iniciada em T0.4 com base nos resultados da avaliação. Cada RF deve ter rastreabilidade até o resultado obtido (precisão, cobertura, Likert).
- **Entregável:** `atividades/matriz_rastreabilidade.md` finalizada.
- **Aceitação:** cada RF tem coluna de resultado preenchida.

#### T5.2 — Relato de experiência (artigo)
- **Responsável:** Cynthia
- **Prazo:** sem 15-16 (até 09/07)
- **O que fazer:** Escrever ~10–15 páginas em formato acadêmico com seções: introdução (problema, lacuna, objetivo), referencial teórico (MPO, LLM em GP, DSR), método (DSR aplicado), desenvolvimento do artefato (descrição do ObiOne, decisões técnicas), avaliação (resultados quantitativos e qualitativos), discussão e limitações (Kappa baixo, N do Likert, etc.), conclusão e trabalhos futuros.
- **Entregável:** PDF do artigo no padrão da disciplina.
- **Aceitação:** revisado por Bruno + Raniel + Moisés; coerente com a proposta apresentada na semana 4.

#### T5.3 — Apresentação final
- **Responsável:** Moisés
- **Prazo:** sem 16 (até 10/07)
- **O que fazer:** Slides cobrindo: problema, solução proposta (com prints do dashboard), demo (ao vivo ou screencast), resultados de avaliação, limitações, próximos passos. Ensaiar com o grupo.
- **Entregável:** PDF/PPTX dos slides; ensaio cronometrado.
- **Aceitação:** apresentação cabe em 15–20 min; demo testada e funcionando.

#### T5.4 — Screencast de backup
- **Responsável:** Bruno + Raniel
- **Prazo:** sem 15 (até 03/07)
- **O que fazer:** Gravar screencast curto (~3 min) mostrando o golden path: cadastro de projeto → upload de `.docx` → extração LLM → exibição da cobertura.
- **Entregável:** arquivo `.mp4` no repositório (ou link no relatório).
- **Aceitação:** cobre golden path em < 3 min; usado caso a demo ao vivo dê problema.

---

## 6. Cadência de Sincronização

- **Daily curto** (Slack/WhatsApp/grupo do projeto): cada um posta o que vai fazer no dia + bloqueios. ~5 min, sem reunião.
- **Reunião semanal antes da aula** (~1h): revisar progresso da semana, alinhar próxima semana, discutir bloqueios.
- **Revisão de marco** (após cada M1–M4): meeting dedicado de 1h para confirmar marco atingido + ajustar próximos passos.
- **Status Report da disciplina** (22/05 e 19/06): usar o tempo formal da disciplina como apresentação consolidada de progresso.

---

## 7. Riscos Vivos

Os 6 riscos mapeados no backlog continuam ativos, com 2 adições específicas deste plano:

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Acesso insuficiente aos stakeholders para Likert | Média | Alto | Iniciar contato na semana 7. Plano B em T4.3: 1 respondente por projeto + declaração de limitação. |
| R2 | Heterogeneidade alta dos `.docx` reais quebra o pipeline | Média | Médio | Inspeção amostral na semana 7; estratégia de chunking + saneamento documentada antes do Sprint 1 (T2.2). |
| R3 | Custo/limite de tokens da API LLM | Baixa | Médio | Estimar volume na semana 7; usar modelo apropriado por etapa (mais barato para pré-processamento, mais capaz para extração final). |
| R4 | Concordância entre avaliadores baixa (Kappa < 0,6) | Média | Médio | Valença como projeto piloto em T1.4; se a rubrica mudar significativamente, refazer Valença antes de fechar os demais gabaritos. |
| R5 | Esforço do gabarito manual estoura semanas 7-8 | Alta | Alto | 5 projetos × 2 avaliadores = 10 extrações distribuídas entre Cynthia e Moisés (~5 cada) com revisão cruzada. Iniciar imediatamente após T1.1. |
| R6 | Mudança no schema mid-sprint | Baixa | Alto | Schema versionado; congelar ao fim da semana 8 (antes do Sprint 1). |
| **R7** | **Stack nova para Bruno (Vite + Lovable)** | Média | Médio | Iniciar T0.2 (protótipos) na semana 7 para ganhar familiaridade com Lovable antes da implementação. |
| **R8** | **Cronograma comprimido (10 semanas, não 12)** | Alta | Alto | Paralelismo das trilhas (Bloco 0 + Bloco 1 simultâneos); cortar features de polish da UI se atrasar. |

---

## 8. Apêndice — Esqueleto da Matriz de Rastreabilidade

A matriz da T0.4 e T5.1 segue este formato (exemplos):

| Requisito | US | Atributo do MPO (Quadro 37) | Categoria | Tipo | Métrica de avaliação | Resultado |
|---|---|---|---|---|---|---|
| RF01 | US01 | — | — | — | (não avaliado, infraestrutura) | — |
| RF02 | US02 | — | — | — | (não avaliado, infraestrutura) | — |
| RF03 | US03 | nome do projeto | geral | estruturado | comparação exata | (preencher após T4.2) |
| RF03 | US03 | descrição | geral | texto_livre | rubrica 0/0,5/1 + Kappa | (preencher após T4.2) |
| RF03 | US03 | escopo planejado | escopo | texto_livre | rubrica 0/0,5/1 + Kappa | (preencher após T4.2) |
| RF03 | US03 | data início | cronograma | estruturado | comparação exata | (preencher após T4.2) |
| RF03 | US03 | riscos identificados | riscos | texto_livre | rubrica 0/0,5/1 + Kappa | (preencher após T4.2) |
| ... | ... | ... | ... | ... | ... | ... |
| RF07 | US07 | — | — | — | cobertura agregada (%) | (preencher após T3.2) |
| RF09 | US09 | (todos do MPO) | (todos) | (ambos) | precisão/recall/F1/Kappa | (preencher após T4.2) |
| RF10 | US10 | — | — | — | médias Likert (4 dimensões) | (preencher após T4.3) |

A matriz é **viva**: a versão semente sai na T0.4, é atualizada à medida que requisitos mudam, e é finalizada na T5.1 com os resultados reais da avaliação.
