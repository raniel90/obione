# Plano de Execução — ObiOne (Pós-Pivot Comunidade)

Plano de trabalho para executar o ObiOne dentro do calendário da disciplina TAES, alinhado à proposta acadêmica reformulada (pivot comunidade), ao backlog atualizado e aos entregáveis formais cobrados pelo professor.

Período: semana 8 (15-21/05/2026, em curso) a semana 16 (10/07/2026) — **9 semanas restantes**.

**Última atualização:** 16/05/2026 — pivot para observatório-comunidade aplicado.

### Progresso (2/22 tarefas)

| Bloco | Tarefas totais | Concluídas |
|---|---|---|
| 0 — Fundação (preparatória + alinhamento pivot) | 5 | 1 (T0.1) |
| 1 — Pipeline + Cadastro + Auth | 4 | 0 |
| 2 — Dashboard + Perfis | 3 | 0 |
| 3 — Comunidade + IA-Assistente | 4 | 0 |
| 4 — Avaliação | 5 | 1 (pivot decidido) |
| 5 — Documentação acadêmica | 1 | 0 |

---

## 1. Equipe e Responsabilidades

| Integrante | Papel principal | Frentes |
|---|---|---|
| **Bruno** | Frontend + UX + relacionamento | Protótipos, implementação React + Vite + Lovable, contato com stakeholders dos clientes |
| **Raniel** | Backend + IA + arquitetura | FastAPI, banco, pipeline LLM, prompts (extração + resumo + drafts), auth, integração, requisitos |
| **Cynthia** | Pesquisa + escrita | Atributos-alvo, gabaritos manuais, matriz de rastreabilidade, relato de experiência (artigo) |
| **Moisés** | Pesquisa + apresentação | Protocolo de avaliação, gabaritos manuais, rubrica de avaliação, Likert, apresentação final |

**Avaliação** = trabalho conjunto de Cynthia + Moisés (par de avaliadores independentes para o gabarito e para a aplicação da rubrica). **Contato com stakeholders dos clientes para Likert** = Bruno.

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + componentes Lovable |
| Backend | Python 3 + FastAPI |
| Banco de dados | PostgreSQL |
| Comunicação | REST (JSON) |
| Autenticação | Email + senha + JWT (passlib + python-jose); sem OAuth |
| LLM | A definir pelo Raniel |
| Ambiente | Docker Compose local — sem deploy em produção |

Repositório: **`raniel90/obione`** (já existe; código em `backend/` e `frontend/` na raiz).

---

## 3. Entregáveis Formais da Disciplina

Sete artefatos compõem a entrega final no dia 10/07. Todos **herdam do MPO** (Quadro 37, terceira versão — Vieira, 2022).

| # | Entregável | Responsável | Prazo final |
|---|---|---|---|
| 1 | Requisitos (RF + RNF) | Raniel | semana 8 (21/05) ✅ |
| 2 | Prototipação das telas | Bruno | semana 8 (21/05) |
| 3 | Matriz de rastreabilidade | Cynthia | semana 15 (09/07) |
| 4 | Código rodando local + 5 projetos processados | Bruno + Raniel | semana 14 (02/07) |
| 5 | Avaliação executada (precisão, recall, F1, Kappa, Likert × 2) | Cynthia + Moisés | semana 14 (02/07) |
| 6 | Relato de experiência (formato artigo) | Cynthia | semana 16 (09/07) |
| 7 | Apresentação final | Moisés | semana 16 (10/07) |

---

## 4. Cronograma Geral

| Sem | Data | Bloco | Marco |
|---|---|---|---|
| **8** | 15-21/05 (em curso) | Bloco 0: Fase preparatória + alinhamento do pivot | — |
| 9 | 22-28/05 | Bloco 1 início: cadastro + upload + auth + gabarito | **M1 + SR1** |
| 10 | 29/05-04/06 | Bloco 1 conclusão: pipeline LLM + finalizar gabarito | — |
| 11 | 05-11/06 | Bloco 2: dashboard + cobertura + perfis | **M2** |
| 12 | 12-18/06 | Bloco 3: comunidade (comentários, feed) + IA-Assistente (resumo, drafts) | — |
| 13 | 19-25/06 | Bloco 3 conclusão + lançar Likert | **M3 + SR2** |
| 14 | 26/06-02/07 | Bloco 4: avaliação consolidada | **M4** |
| 15 | 03-09/07 | Bloco 5: documentação acadêmica | — |
| 16 | 10/07 | **Apresentação final + entrega** | Entrega |

**Marcos:**
- **M1** (sem 9): preparação conceitual concluída (atributos, protocolo, schema, protótipos).
- **M2** (sem 11): pipeline operacional nos 5 projetos + auth/perfis funcionais.
- **M3** (sem 13): dashboard + comunidade + IA-Assistente operacionais.
- **M4** (sem 14): avaliação completa (métricas + Likert × 2).

---

## 5. Tarefas por Bloco

Cada tarefa: **Responsável** | **Prazo** | **O que fazer** | **Entregável** | **Aceitação**.

### Bloco 0 — Fundação (semana 8: 15-21/05)

#### T0.1 — Requisitos (RF + RNF) — ✅ Concluído
- **Responsável:** Raniel (com input do grupo)
- **Prazo:** sem 8 (21/05)
- **Status:** ✅ Concluído em **16/05/2026** (commits anteriores + pós-pivot consolidando RF01-RF18 e RNF01-RNF09).
- **Entregável:** `atividades/requisitos.md` no formato ficha simplificada, com Backend/Frontend em Observações.

#### T0.2 — Prototipação das telas
- **Responsável:** Bruno
- **Prazo:** sem 8 (21/05)
- **O que fazer:** Wireframes das telas principais — login, portfólio (consultor), detalhe do projeto (consultor e cliente), comentários, Resumo do Cliente (rascunho + publicado), Drafts (rascunho + publicado), feed in-app. Apresentar ao grupo no kickoff da semana 8.
- **Entregável:** Protótipos exportados (PNG/PDF) + link Lovable; `atividades/prototipos.md` com print de cada tela.
- **Aceitação:** Protótipos cobrem RF01-RF18; aprovados pelo grupo antes do início da implementação frontend.

#### T0.3 — Atributos-alvo do MPO
- **Responsável:** Cynthia (autora) + Moisés (revisor)
- **Prazo:** sem 8 (21/05)
- **O que fazer:** Derivar do Quadro 37 a lista de ~43 atributos categorizados (nome, categoria, tipo `estruturado`/`texto_livre`/`fora_de_escopo`).
- **Entregável:** `atividades/atributos_alvo_mpo.md`.
- **Aceitação:** Lista revisada por Moisés; alinhada ao Quadro 37 sem omissões.

#### T0.4 — Protocolo de avaliação
- **Responsável:** Moisés (autor) + Cynthia (revisora)
- **Prazo:** sem 8 (21/05)
- **O que fazer:** Documentar o critério híbrido de match + rubrica humana 0/0,5/1 + Cohen's Kappa + protocolo de resolução de divergências.
- **Entregável:** `atividades/protocolo_avaliacao.md`.
- **Aceitação:** Cada tipo de atributo tem critério explícito; rubrica documentada com 2-3 exemplos por categoria.

#### T0.5 — Setup do código no repo
- **Responsável:** Raniel (com Bruno acompanhando o frontend)
- **Prazo:** sem 8 (21/05)
- **O que fazer:** Criar `backend/` (FastAPI + SQLAlchemy + Alembic) e `frontend/` (Vite + React) na raiz; `docker-compose.yml` com Postgres; endpoint `/health` + tela inicial consumindo via REST; estrutura para auth (placeholder).
- **Entregável:** PR mergeado com README de setup; ambiente local funcional.
- **Aceitação:** Qualquer integrante clona e roda em < 30 min.

---

### Bloco 1 — Pipeline + Cadastro + Auth (semanas 9-10: 22/05-04/06, **M1 + SR1**)

#### T1.1 — RF01 (Cadastro) + RF02 (Upload)
- **Responsável:** Bruno (frontend) + Raniel (backend)
- **Prazo:** sem 9 (28/05)
- **Entregável:** Endpoints + telas funcionais; consultor cadastra Valença e faz upload do `.docx`.
- **Aceitação:** Fluxo de cadastro + upload funcionando end-to-end localmente.

#### T1.2 — RF12 (Autenticação)
- **Responsável:** Raniel (backend) + Bruno (tela de login)
- **Prazo:** sem 9 (28/05)
- **Entregável:** Login com email+senha+JWT; logout funcional; senha com hash bcrypt.
- **Aceitação:** Consultor faz login, recebe JWT, acessa rotas protegidas.

#### T1.3 — RF03 (Extração LLM) + RF04 (Persistência)
- **Responsável:** Raniel
- **Prazo:** sem 10 (04/06)
- **Entregável:** Pipeline rodando para Valença com saída JSON conforme schema; metadados persistidos.
- **Aceitação:** Extração nos 5 projetos sem erro fatal; ≥ 70% dos atributos preenchidos no piloto.

#### T1.4 — Produção do gabarito manual (3 projetos)
- **Responsável:** Cynthia + Moisés (par de avaliadores independentes)
- **Prazo:** sem 10 (04/06)
- **O que fazer:** Anotar Valença (piloto), depois Freire Batista e Kaka JJ. Cada um faz independentemente; divergências resolvidas conforme T0.4. Se a rubrica mudar significativamente após Valença, refazer Valença com a rubrica final.
- **Entregável:** `atividades/gabaritos/<projeto>_cynthia.json` + `_moises.json` + `_consolidado.json` para os 3 projetos.
- **Aceitação:** 3 gabaritos consolidados disponíveis; Cohen's Kappa por atributo registrado.

---

### Bloco 2 — Dashboard + Cobertura + Perfis (semana 11: 05-11/06, **M2**)

#### T2.1 — RF13 (Perfis e acesso semi-aberto)
- **Responsável:** Raniel (backend) + Bruno (roteamento condicional)
- **Prazo:** sem 11 (11/06)
- **Entregável:** Modelo User com role; middleware de autorização; cliente acessa apenas seu projeto.
- **Aceitação:** Cliente de Valença não vê outros projetos; tentativa de acesso indevido retorna 403.

#### T2.2 — RF05 (Portfólio) + RF06 (Detalhe) + RF07 (Cobertura)
- **Responsável:** Bruno (frontend) + Raniel (endpoints)
- **Prazo:** sem 11 (11/06)
- **Entregável:** Tela de portfólio (consultor); tela de detalhe com atributos agrupados + trechos de origem; componente de cobertura (tabela/heatmap) com thresholds visuais.
- **Aceitação:** **M2 atingido** — pipeline operacional nos 5 projetos visualizáveis com cobertura calculada.

#### T2.3 — Matriz de rastreabilidade (semente)
- **Responsável:** Cynthia
- **Prazo:** sem 11 (11/06)
- **O que fazer:** Esboçar matriz com colunas: Requisito | US | Atributo MPO | Categoria | Métrica de avaliação. Preencher com base nos requisitos.
- **Entregável:** `atividades/matriz_rastreabilidade.md` versão inicial.
- **Aceitação:** Matriz cobre todos os RF; será atualizada nas próximas sprints.

---

### Bloco 3 — Comunidade + IA-Assistente (semanas 12-13: 12-25/06, **M3 + SR2**)

#### T3.1 — RF14 (Comentários) + RF15 (Feed in-app)
- **Responsável:** Bruno (frontend) + Raniel (backend)
- **Prazo:** sem 12 (18/06)
- **Entregável:** Comentários funcionais (thread + resposta); feed in-app com contador de não-lidos; eventos registrados em hooks.
- **Aceitação:** Consultor e cliente daquele projeto comentam; feed mostra novidades; isolamento por perfil respeitado.

#### T3.2 — RF16 (Resumo do Cliente)
- **Responsável:** Raniel (prompt + backend) + Bruno (UI)
- **Prazo:** sem 12 (18/06)
- **Entregável:** Endpoint que gera resumo a partir da extração; UI com modos rascunho (consultor edita) e publicado (cliente vê).
- **Aceitação:** Consultor gera rascunho, edita, publica; cliente vê apenas resumo publicado.

#### T3.3 — RF17 (Drafts de Próximos Passos)
- **Responsável:** Raniel (prompt + backend) + Bruno (UI)
- **Prazo:** sem 13 (25/06)
- **Entregável:** Endpoint que gera drafts a partir da extração + comentários; UI para o consultor revisar antes de publicar.
- **Aceitação:** **M3 atingido** — comunidade + IA-Assistente operacionais nos 5 projetos.

#### T3.4 — Iniciar contato com stakeholders dos clientes
- **Responsável:** Bruno
- **Prazo:** sem 8-12 (gradual; foco na sem 12)
- **O que fazer:** Iniciar contato cedo (sem 8); apresentar o observatório como "espaço onde mostramos o que estamos observando do seu projeto"; convidar para responder o Likert na sem 13-14.
- **Entregável:** Lista de stakeholders contactados + status de aceite.
- **Aceitação:** Pelo menos 1 stakeholder por projeto comprometido a responder o Likert. Plano B: declarar limitação no relato.

---

### Bloco 4 — Avaliação (semana 14: 26/06-02/07, **M4**)

#### T4.1 — RF08 (Importar gabarito)
- **Responsável:** Raniel
- **Prazo:** sem 13-14 (transição)
- **Entregável:** Endpoint POST baseline carrega os 3 gabaritos consolidados; validação de schema.

#### T4.2 — RF09 (Comparação automático vs. gabarito — critério híbrido)
- **Responsável:** Raniel (algoritmo) + Cynthia + Moisés (aplicação da rubrica)
- **Prazo:** sem 14 (02/07)
- **Entregável:** Tabela completa com precisão, recall, F1 e Cohen's Kappa para os 3 projetos; atributos com Kappa < 0,6 sinalizados.
- **Aceitação:** Métricas calculadas e visualizáveis na UI.

#### T4.3 — RF10 (Likert Consultoria)
- **Responsável:** Moisés (formulário + análise)
- **Prazo:** sem 13-14 (lançar sem 13, consolidar sem 14)
- **Entregável:** Formulário Google Forms (ou interno) com 4 dimensões; respostas dos 4 integrantes do grupo importadas; relatório agregado.
- **Aceitação:** N = 4; médias por dimensão calculadas.

#### T4.4 — RF18 (Likert Clientes)
- **Responsável:** Moisés (formulário + análise) + Bruno (intermediação dos contatos)
- **Prazo:** sem 13-14 (lançar sem 13, consolidar sem 14)
- **Entregável:** Formulário Google Forms com 4 dimensões dos clientes; respostas importadas; relatório agregado.
- **Aceitação:** N ≥ 5 (1 por projeto) — ideal 8-10. Plano B: declarar limitação.

#### T4.5 — RF11 (Exportação consolidada)
- **Responsável:** Raniel
- **Prazo:** sem 14 (02/07)
- **Entregável:** Arquivo único (CSV ou JSON) com extrações, cobertura, métricas, Likert × 2, engajamento.
- **Aceitação:** **M4 atingido** — dados completos exportáveis para o relato.

---

### Bloco 5 — Documentação Acadêmica (semanas 15-16: 03-10/07)

#### T5.1 — Matriz de rastreabilidade (finalização)
- **Responsável:** Cynthia
- **Prazo:** sem 15 (09/07)
- **O que fazer:** Atualizar matriz iniciada em T2.3 com resultados da avaliação. Cada RF tem rastreabilidade até resultado obtido (precisão, cobertura, Likert).
- **Entregável:** `atividades/matriz_rastreabilidade.md` finalizada.
- **Aceitação:** Cada RF com coluna de resultado preenchida.

#### T5.2 — Relato de experiência (artigo)
- **Responsável:** Cynthia
- **Prazo:** sem 15-16 (09/07)
- **O que fazer:** Escrever ~10-15 páginas em formato acadêmico: introdução, referencial teórico (MPO + LLM em GP + DSR + Trabalhos Futuros do Vieira), método (DSR aplicado), desenvolvimento (descrição do ObiOne pós-pivot), avaliação (resultados quantitativos + qualitativos das duas Likert), discussão e limitações, conclusão.
- **Entregável:** PDF do artigo no padrão da disciplina.
- **Aceitação:** Revisado por Bruno + Raniel + Moisés; coerente com proposta reformulada.

#### T5.3 — Apresentação final
- **Responsável:** Moisés
- **Prazo:** sem 16 (10/07)
- **O que fazer:** Slides cobrindo: crítica do professor → pivot fundamentado na tese → arquitetura comunidade → demo → resultados → limitações → próximos passos. Ensaiar com o grupo.
- **Entregável:** PDF/PPTX + ensaio cronometrado.
- **Aceitação:** Apresentação cabe em 15-20 min; demo testada.

#### T5.4 — Screencast de backup
- **Responsável:** Bruno + Raniel
- **Prazo:** sem 15 (09/07)
- **O que fazer:** Screencast curto (~3 min): golden path — login → portfólio → detalhe → extração → resumo cliente → comentário → draft.
- **Entregável:** `.mp4` no repositório.
- **Aceitação:** Cobre golden path em < 3 min.

---

## 6. Cadência de Sincronização

- **Daily curto** (Slack/WhatsApp do grupo): cada um posta o que vai fazer no dia + bloqueios. ~5 min, sem reunião.
- **Reunião semanal antes da aula** (~1h): revisar progresso da semana, alinhar próxima semana, discutir bloqueios.
- **Revisão de marco** (após cada M1–M4): meeting dedicado de 1h para confirmar marco atingido + ajustar próximos passos.
- **Status Report da disciplina** (22/05 e 19/06): usar o tempo formal da disciplina como apresentação consolidada de progresso. **SR1 apresenta pivot + plano + protótipos** (não código).

---

## 7. Riscos Vivos

Os 12 riscos consolidados do pivot:

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Acesso insuficiente aos stakeholders dos clientes para Likert | Média | Alto | Bruno inicia contato na semana 8. Plano B: 1 respondente por projeto + declaração de limitação. |
| R2 | Heterogeneidade alta dos `.docx` reais quebra o pipeline | Média | Médio | Inspeção amostral na semana 8; chunking + saneamento documentados antes do Sprint 1. |
| R3 | Custo/limite de tokens da API LLM | Média | Médio | Estimar volume na sem 8 (3 chamadas por projeto agora); modelo mais barato para drafts; caching agressivo. |
| R4 | Concordância entre avaliadores baixa (Kappa < 0,6) | Média | Médio | Valença como piloto. Se rubrica mudar significativamente, refazer Valença. |
| R5 | Esforço do gabarito manual estoura semana 9 | Média | Alto | Reduzido para 3 projetos. Cynthia + Moisés iniciam após T0.3 (meio sem 8). |
| R6 | Mudança no schema mid-sprint | Baixa | Alto | Schema versionado; congelar ao fim da semana 9. |
| R7 | LGPD — dados de marketing em formato semi-aberto | Média | Alto | NDA com clientes; consentimento explícito; criptografia em trânsito; logs de acesso. |
| R8 | Custo de LLM aumentado pelas 3 chamadas por projeto | Média | Médio | Estimativa antes do Sprint 1; modelo mais barato para drafts; caching. |
| R9 | Prazo apertado pós-pivot (perdemos 1 semana) | Alta | Alto | Cortes feitos (Lições, notificações email); SR1 apresenta plano + protótipos, não código. |
| R10 | Complexidade do auth e perfis (não estava previsto) | Média | Médio | Auth simples (JWT, sem OAuth); bibliotecas padrão FastAPI. |
| R11 | Resistência dos clientes a participar do observatório | Média | Alto | Bruno inicia contato cedo; valor proposto: "ver o que estamos observando do seu projeto". |
| R12 | Drafts da IA percebidos como pobres/enviesados | Média | Médio | Consultor SEMPRE revisa antes de publicar; medir percepção via Likert da consultoria (RF10). |

---

## 8. Apêndice — Esqueleto da Matriz de Rastreabilidade

A matriz da T2.3 e T5.1 segue este formato:

| Requisito | US | Atributo do MPO (Quadro 37) ou Conceito | Categoria | Métrica de avaliação | Resultado |
|---|---|---|---|---|---|
| RF01 | US01 | — | — | (não avaliado, infra) | — |
| RF03 | US03 | nome do projeto | geral | comparação exata | (preencher após T4.2) |
| RF03 | US03 | escopo planejado | escopo | rubrica 0/0,5/1 + Kappa | (preencher após T4.2) |
| RF03 | US03 | data início | cronograma | comparação exata | (preencher após T4.2) |
| RF03 | US03 | riscos identificados | riscos | rubrica 0/0,5/1 + Kappa | (preencher após T4.2) |
| RF07 | US07 | — | (todos) | cobertura agregada (%) | (preencher após T3.2 = RF07 implementada) |
| RF09 | US09 | (todos do MPO) | (todos) | precisão/recall/F1/Kappa | (preencher após T4.2) |
| RF10 | US10 | — | — | médias Likert consultoria | (preencher após T4.3) |
| RF14 | US14 | Interatividade (Vieira p. 191) | Característica | engajamento (#comentários) | (preencher após T4.5) |
| RF16 | US16 | Comunicar (Vieira p. 197) | Processo | Likert dimensão "clareza" | (preencher após T4.4) |
| RF18 | US18 | — | — | médias Likert clientes | (preencher após T4.4) |

Linhas novas adicionadas pós-pivot: cada RF de comunidade (RF14, RF15) e de IA-Assistente (RF16, RF17) também mapeia para um **conceito do MPO** (não atributo), reforçando a fundamentação teórica.

A matriz é viva: T2.3 (semente), T5.1 (finalização).
