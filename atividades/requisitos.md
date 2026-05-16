# Requisitos — ObiOne (Pós-Pivot Comunidade)

Documento de especificação de requisitos do ObiOne, observatório-comunidade de projetos baseado no MPO (Quadro 37, terceira versão — Vieira, 2022) potencializado por IA Generativa.

Reformulado em 16/05/2026 após o pivot que introduziu a dimensão de comunidade (ver `pivot_observatorio_comunidade.md`).

Os requisitos funcionais (RF01–RF18) são derivados 1:1 das user stories do backlog. Os requisitos não funcionais (RNF01–RNF09) cobrem qualidade do produto, reprodutibilidade científica, restrições do ambiente acadêmico, conformidade LGPD e controle de custo de LLM. **Cada ficha registra explicitamente a rastreabilidade com o MPO** (Quadro 37 e/ou conceitos do modelo).

**Ordem dos requisitos**: as fichas estão organizadas em **fluxo lógico de construção**, da fundação técnica (autenticação + perfis) até a avaliação final. Os IDs RF01–RF18 são preservados para manter referências cruzadas em outros documentos, mas a ordem visual reflete a sequência em que o sistema é construído.

---

## 1. Visão Geral

O ObiOne combina pipeline LLM de extração de atributos do MPO + espaço de comunidade semi-aberto (consultoria + clientes) + IA-assistente que reduz a fricção operacional (resumos para clientes, drafts para consultores).

### Stack alvo

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + componentes Lovable |
| Backend | Python 3 + FastAPI |
| Banco de dados | PostgreSQL |
| Comunicação | REST (JSON) |
| Autenticação | Email + senha + JWT (sem OAuth) |
| LLM | A definir (decisão técnica do backend) |
| Ambiente | Docker Compose local |

---

## 2. Índice dos Requisitos Funcionais

Os 18 RFs em ordem de construção (do mais fundacional ao mais derivado).

| # | ID | Título | Bloco | Sprint | MoSCoW |
|---|---|---|---|---|---|
| 1 | RF01 | Autenticar usuário | 1 — Fundação técnica e ingestão | 1 | Must |
| 2 | RF02 | Gerenciar perfis e acesso semi-aberto | 1 | 2 | Must |
| 3 | RF03 | Cadastrar projeto | 1 | 1 | Must |
| 4 | RF04 | Fazer upload de documentos do projeto | 1 | 1 | Must |
| 5 | RF05 | Extrair atributos do MPO via LLM | 2 — Pipeline LLM | 1 | Must |
| 6 | RF06 | Persistir extração estruturada | 2 | 1 | Must |
| 7 | RF07 | Visualizar portfólio (perfil-aware) | 3 — Observação e visualização | 2 | Must |
| 8 | RF08 | Visualizar detalhe do projeto | 3 | 2 | Must |
| 9 | RF09 | Calcular e exibir cobertura do MPO | 3 | 2 | Must |
| 10 | RF10 | Comentar no projeto | 4 — Comunidade e IA-Assistente | 3 | Must |
| 11 | RF11 | Visualizar feed in-app de novidades | 4 | 3 | **Should** |
| 12 | RF12 | Gerar Resumo do Projeto para o Cliente | 4 | 3 | Must |
| 13 | RF13 | Gerar drafts de "Próximos Passos / Pontos de Atenção" | 4 | 3 | Must |
| 14 | RF14 | Importar e validar gabarito manual | 5 — Avaliação DSR | 4 | Must |
| 15 | RF15 | Comparar extração automática vs. gabarito | 5 | 4 | Must |
| 16 | RF16 | Coletar feedback Likert da consultoria | 5 | 4 | Must |
| 17 | RF17 | Coletar feedback Likert dos clientes | 5 | 4 | Must |
| 18 | RF18 | Exportar resultados consolidados | 5 | 4 | **Should** |

### Convenção de prioridade — MoSCoW

- **Must**: não-negociável. Sem isto, o trabalho acadêmico não fecha (DSR incompleto, comunidade inviável, ou pipeline quebrado).
- **Should**: importante mas cortável. Se o cronograma estourar, pode ser reduzido ou substituído por fallback declarado.
- **Could**: desejável, sem comprometer o MVP. **Nenhum no MVP atual** — os Could-itens foram movidos para o backlog futuro no pivot (ex.: Lições Aprendidas cross-project, notificações por email externo).

**Justificativa dos "Should"**:
- **RF11 (Feed in-app)**: comunicação interna do observatório. Se Sprint 3 atrasar, pode ser cortado — usuários ainda recebem notificações ao acessar comentários/resumos individualmente.
- **RF18 (Exportação consolidada)**: facilita escrita do relato, mas fallback é fazer queries manuais no banco direto (mais trabalhoso porém viável).

---

## 3. Requisitos Funcionais (RF)

### 3.1 Bloco 1 — Fundação técnica e ingestão

Autenticação, perfis e ingestão de dados. **Sem este bloco, nada mais funciona.** Embora RF02 (perfis) seja implementado no Sprint 2, aparece aqui por dependência conceitual com RF01.

---

### RF01 — Autenticar usuário

**1. Identificação**
- ID: RF01
- Título: Autenticar usuário
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 1 — semana 9 (22-28/05)

**2. Detalhamento**
- Descrição: Permitir login no observatório com email + senha, mantendo sessão via JWT.
- Justificativa de negócio: Sem autenticação, modelo semi-aberto não é possível e LGPD não é atendida.
- Stakeholder: Consultoria + clientes.
- Dependências: —

**3. Validação**
- Critérios de aceite: Login funcional; tokens JWT; logout funcional; senha armazenada com hash (bcrypt ou similar).
- Regras de negócio: Sem cadastro público — usuários criados pela equipe da consultoria. Sem OAuth. Senha mínima de 8 caracteres.
- Rastreabilidade MPO: Característica **Segurança** (Vieira, 2022, p. 192) — controle de acesso e autenticação de usuários.
- Observações: **Backend (Raniel):** endpoints `POST /auth/login`, `POST /auth/logout`; middleware JWT; bibliotecas FastAPI padrão (passlib + python-jose). **Frontend (Bruno):** tela de login + gerenciamento de token na sessão.

---

### RF02 — Gerenciar perfis e acesso semi-aberto

**1. Identificação**
- ID: RF02
- Título: Gerenciar perfis e acesso semi-aberto
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Garantir que cada usuário acessa apenas o que seu perfil permite. Dois perfis: Consultor (todos os projetos) e Cliente (apenas o seu projeto associado).
- Justificativa de negócio: Materializa a característica "Acesso semi-aberto" do MPO e é fundamental para LGPD.
- Stakeholder: Consultoria + clientes.
- Dependências: RF01 (autenticação).

**3. Validação**
- Critérios de aceite: Vínculo cliente ↔ projeto persistido; endpoints e telas filtram conforme perfil; tentativa de acesso indevido retorna 403; equipe da consultoria cria contas; cliente recebe convite por email com senha provisória.
- Regras de negócio: Um cliente vinculado a no máximo 1 projeto (no MVP). Consultor pode acessar todos. Cliente A nunca acessa dados do Cliente B.
- Rastreabilidade MPO: Característica **Acesso semi-aberto** (Vieira, 2022, p. 189) + agentes **Equipe de Gestão** e **Usuários do Observatório** (pp. 200-201).
- Observações: **Backend (Raniel):** modelo `User` com role (`consultor` | `cliente`) + FK opcional para `Project`; middleware de autorização aplicado em todos os endpoints relevantes. **Frontend (Bruno):** roteamento condicional por perfil; tela de gerenciamento de usuários (apenas Consultor).

---

### RF03 — Cadastrar projeto

**1. Identificação**
- ID: RF03
- Título: Cadastrar projeto
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 1 — semanas 9-10 (22/05-04/06)

**2. Detalhamento**
- Descrição: Permitir que o consultor cadastre um projeto informando nome, domínio e descrição livre.
- Justificativa de negócio: Toda extração, visualização e interação ancora em um projeto cadastrado. Sem cadastro, nada acontece.
- Stakeholder: Consultoria (cria projetos para clientes).
- Dependências: RF01 (autenticação) — apenas perfil Consultor pode cadastrar.

**3. Validação**
- Critérios de aceite: Campos obrigatórios validados (nome, domínio, descrição); ID único gerado automaticamente; listagem dos projetos cadastrados disponível.
- Regras de negócio: Domínio limitado a enum (jurídico, saúde, esporte, branding, outros). Apenas perfil Consultor cria projetos.
- Rastreabilidade MPO: — (infraestrutura — habilita as demais funcionalidades sem mapear diretamente a um conceito do MPO).
- Observações: **Backend (Raniel):** modelo `Project` + endpoints `POST /projects`, `GET /projects`. **Frontend (Bruno):** formulário de cadastro + tela de listagem (filtrada por perfil — ver RF02).

---

### RF04 — Fazer upload de documentos do projeto

**1. Identificação**
- ID: RF04
- Título: Fazer upload de documentos do projeto
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 1 — semanas 9-10 (22/05-04/06)

**2. Detalhamento**
- Descrição: Permitir anexar arquivos `.docx` a um projeto cadastrado, com suporte a múltiplos arquivos.
- Justificativa de negócio: Documentos são a fonte da extração do pipeline LLM.
- Stakeholder: Consultoria.
- Dependências: RF03 (cadastro), RF01 (autenticação), RF02 (perfil).

**3. Validação**
- Critérios de aceite: Suporte mínimo `.docx`; múltiplos arquivos por projeto; persistência do arquivo bruto + metadados (nome, data, tamanho, hash).
- Regras de negócio: Tamanho máximo por arquivo a definir; rejeitar arquivos inválidos com mensagem clara. Apenas perfil Consultor faz upload.
- Rastreabilidade MPO: Processo **Coletar** (Vieira, 2022, p. 195) — captura de dados sobre os projetos para o observatório.
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/documents` aceitando `multipart/form-data`; persistência em Postgres + storage local. **Frontend (Bruno):** componente drag-and-drop, suporte a múltiplos arquivos, feedback visual de progresso, listagem dos arquivos do projeto.

---

### 3.2 Bloco 2 — Pipeline LLM

Coração técnico da contribuição. A IA Generativa entra aqui pela primeira vez, no papel de **extratora**.

---

### RF05 — Extrair atributos do MPO via LLM

**1. Identificação**
- ID: RF05
- Título: Extrair atributos do MPO via LLM
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 1 — semana 10 (29/05-04/06)

**2. Detalhamento**
- Descrição: Processar os documentos do projeto e extrair automaticamente os atributos previstos no Quadro 37 (terceira versão do MPO).
- Justificativa de negócio: É o coração da contribuição técnica do trabalho — o pipeline LLM que materializa o Trabalho Futuro #8 do MPO.
- Stakeholder: Consultoria + pesquisa.
- Dependências: RF04 (upload prévio), `docs/schema_extracao.json`, `docs/atributos_alvo_mpo.md` (fase preparatória).

**3. Validação**
- Critérios de aceite: Saída JSON conforme schema; 8 categorias do Quadro 37 contempladas; para cada atributo preenchido, valor + trecho de origem; atributos não encontrados como `null`; atributos `fora_de_escopo` (imagens) ignorados; versão do prompt e modelo registrados.
- Regras de negócio: Nunca inventar valor (alucinação) — preferir `null`. Sempre registrar versão do prompt e modelo para reprodutibilidade.
- Rastreabilidade MPO: **Quadro 37 — Atributos relacionados aos projetos** (Vieira, 2022, p. 264) — todas as 8 categorias (geral, stakeholders, escopo, cronograma, custos, riscos, mudanças, lições aprendidas) + processo **Transformar** (p. 196).
- Observações: **Backend (Raniel):** pipeline completo de extração — leitura `.docx`, chunking se necessário, prompt estruturado, chamada LLM, parsing, validação contra schema, endpoint `POST /projects/{id}/extract`. **Frontend (Bruno):** botão "Extrair com IA" no detalhe do projeto; loading visual; notificação ao concluir.

---

### RF06 — Persistir extração estruturada

**1. Identificação**
- ID: RF06
- Título: Persistir extração estruturada
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 1 — semana 10 (29/05-04/06)

**2. Detalhamento**
- Descrição: Salvar a extração JSON associada ao projeto e aos documentos de origem, com metadados de rastreabilidade.
- Justificativa de negócio: Sem persistência, não há comparação posterior nem auditoria humana.
- Stakeholder: Pesquisa + consultoria.
- Dependências: RF05.

**3. Validação**
- Critérios de aceite: Cada extração registra projeto, documento(s), versão do prompt, modelo LLM, timestamp, `origem` (`automatico` | `manual`); recuperável via API.
- Regras de negócio: Histórico de extrações preservado — nunca sobrescrever silenciosamente.
- Rastreabilidade MPO: Processo **Armazenar** (Vieira, 2022, p. 196).
- Observações: **Backend (Raniel):** modelo `Extraction` com FKs e metadados; endpoints `GET /projects/{id}/extractions`. **Frontend (Bruno):** sem tela própria — dados consumidos por RF08.

---

### 3.3 Bloco 3 — Observação e visualização

Dashboard sobre os dados extraídos, respeitando os perfis. Aqui o observatório começa a "existir" para os usuários.

---

### RF07 — Visualizar portfólio de projetos (perfil-aware)

**1. Identificação**
- ID: RF07
- Título: Visualizar portfólio de projetos
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Apresentar visão consolidada de projetos, com status derivado e cobertura, restrita ao perfil Consultor.
- Justificativa de negócio: Permite ao consultor curar e priorizar o que precisa de atenção no observatório.
- Stakeholder: Consultoria.
- Dependências: RF02 (perfis), RF09 (cobertura).

**3. Validação**
- Critérios de aceite: Lista projetos com nome, domínio, status derivado (`cadastrado` → `ingerido` → `extraído` → `avaliado`), % de cobertura; filtro por domínio.
- Regras de negócio: Cliente NÃO acessa esta tela (redirecionado ao seu próprio detalhe — RF08). Status é derivado, nunca editado.
- Rastreabilidade MPO: Característica **Abrangência** (Vieira, 2022, p. 189) + processo **Disponibilizar** (p. 196) — visão consolidada dos projetos do observatório.
- Observações: **Backend (Raniel):** endpoint `GET /projects` com cálculo de status + cobertura; filtro por perfil. **Frontend (Bruno):** tabela com colunas, filtro por domínio, navegação para detalhe.

---

### RF08 — Visualizar detalhe do projeto

**1. Identificação**
- ID: RF08
- Título: Visualizar detalhe do projeto
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Exibir todos os atributos extraídos de um projeto, agrupados por categoria do Quadro 37, com trecho de origem.
- Justificativa de negócio: É a tela onde o conhecimento do observatório se materializa. Consultor inspeciona; cliente entende.
- Stakeholder: Consultoria + cliente daquele projeto.
- Dependências: RF02 (perfis), RF05/RF06 (extração).

**3. Validação**
- Critérios de aceite: Atributos das 8 categorias agrupados; preenchidos e vazios visíveis; valor + trecho de origem por atributo; acesso aos documentos originais.
- Regras de negócio: Cliente acessa **apenas o seu** projeto; consultor acessa todos. Tentativa de acesso indevido retorna 403.
- Rastreabilidade MPO: Conteúdo **Projetos** (Vieira, 2022, p. 186) — exposição dos atributos do Quadro 37; processo **Disponibilizar** (p. 196).
- Observações: **Backend (Raniel):** endpoint `GET /projects/{id}` com check de perfil; endpoint `GET /projects/{id}/documents/{doc_id}/download`. **Frontend (Bruno):** layout de detalhe agrupado por categoria + visualização de citações.

---

### RF09 — Calcular e exibir cobertura do MPO

**1. Identificação**
- ID: RF09
- Título: Calcular e exibir cobertura do MPO
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Calcular cobertura (% atributos preenchidos vs. total de atributos-alvo) por projeto e exibir matriz cruzada no portfólio.
- Justificativa de negócio: Indicador-chave da avaliação quantitativa — abrangência da extração frente ao MPO.
- Stakeholder: Pesquisa + consultoria.
- Dependências: RF05 (extração).

**3. Validação**
- Critérios de aceite: Por projeto, % calculada; matriz projetos × atributos no portfólio (tabela ou heatmap); destaque visual quando < 50%; sinalização saudável quando ≥ 80%.
- Regras de negócio: Atributos `fora_de_escopo` excluídos do denominador.
- Rastreabilidade MPO: Característica **Abrangência** (Vieira, 2022, p. 189) — operacionalizada como % de atributos do Quadro 37 cobertos por projeto + processo **Avaliar** (p. 198).
- Observações: **Backend (Raniel):** endpoint `GET /coverage` retornando matriz. **Frontend (Bruno):** componente heatmap/tabela com coloração por threshold; tooltip com valor por célula.

---

### 3.4 Bloco 4 — Comunidade e IA-Assistente

Onde o pivot acontece. Comunidade vira primeira-classe; IA assume os papéis de tradutora e redutora de fricção.

---

### RF10 — Comentar no projeto

**1. Identificação**
- ID: RF10
- Título: Comentar no projeto
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: Permitir que consultor e cliente daquele projeto comentem livremente no projeto, respondendo a comentários.
- Justificativa de negócio: Materializa a característica Interatividade e o processo Interagir do MPO. Sem comentários, não há comunidade — apenas dashboard.
- Stakeholder: Consultoria + clientes.
- Dependências: RF02 (perfis).

**3. Validação**
- Critérios de aceite: Thread livre por projeto; identificação do autor visível; resposta com 1 nível de aninhamento; edição/exclusão pelo próprio autor; consultor pode moderar.
- Regras de negócio: Cliente comenta apenas no seu projeto. Comentário não pode ser anônimo. Histórico preservado em soft-delete.
- Rastreabilidade MPO: Característica **Interatividade** (Vieira, 2022, p. 191) + processo **Interagir** (p. 198) + conteúdo **Usuários e Interações** (p. 188).
- Observações: **Backend (Raniel):** modelo `Comment` (FK projeto + FK autor + parent_id); endpoints CRUD com check de perfil. **Frontend (Bruno):** componente de thread com formulário, listagem, resposta e edição.

---

### RF11 — Visualizar feed in-app de novidades

**1. Identificação**
- ID: RF11
- Título: Visualizar feed in-app de novidades
- Prioridade: Should
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: Mostrar feed das novidades dos projetos do usuário: novo comentário, novo resumo gerado, nova extração, novo draft publicado.
- Justificativa de negócio: Materializa o processo Acompanhar do MPO. Mantém comunidade viva sem precisar de email.
- Stakeholder: Consultoria + clientes.
- Dependências: RF02 (perfis), RF10 (comentários), RF12 (resumos), RF13 (drafts).

**3. Validação**
- Critérios de aceite: Feed filtrado por perfil (cliente vê só seu projeto; consultor vê todos); indicador de "não lido" (contador); navegação direta para o evento.
- Regras de negócio: Sem envio de email externo — apenas in-app. Eventos antigos (> 30 dias) podem ser arquivados.
- Rastreabilidade MPO: Processo **Acompanhar** (Vieira, 2022, p. 198) — "usuários podem escolher receber notificações (...) de atualizações dos projetos".
- Observações: **Backend (Raniel):** modelo `ActivityEvent` registrado em hooks dos demais módulos; endpoint `GET /feed`. **Frontend (Bruno):** componente badge no header + tela de feed. **Cortável se Sprint 3 atrasar** — fallback: usuários veem novidades ao acessar diretamente comentários/resumos.

---

### RF12 — Gerar Resumo do Projeto para o Cliente

**1. Identificação**
- ID: RF12
- Título: Gerar Resumo do Projeto para o Cliente
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: IA Generativa lê a extração JSON do projeto e produz texto narrativo em linguagem acessível ao cliente.
- Justificativa de negócio: Materializa o papel de IA-tradutora do pivot. Permite que o cliente entenda o que está sendo observado sem precisar ler JSON.
- Stakeholder: Cliente (consumidor); consultoria (mediadora).
- Dependências: RF05/RF06 (extração persistida).

**3. Validação**
- Critérios de aceite: IA gera texto em linguagem cidadã cobrindo objetivos, escopo, status, riscos relevantes; sempre revisável pelo consultor antes de publicar; versão do prompt + modelo registrados.
- Regras de negócio: Cliente **nunca vê** resumo não-revisado. Resumo publicado vira "current"; histórico preservado.
- Rastreabilidade MPO: Processo **Comunicar** (Vieira, 2022, p. 197) + característica **Usabilidade** — linguagem cidadã (p. 192).
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/summary/generate` (gera draft) + `POST /projects/{id}/summary/publish` (consultor publica). **Frontend (Bruno):** tela "Resumo do Cliente" no detalhe do projeto, com modos "rascunho" (consultor edita) e "publicado" (cliente vê).

---

### RF13 — Gerar drafts de "Próximos Passos / Pontos de Atenção"

**1. Identificação**
- ID: RF13
- Título: Gerar drafts de "Próximos Passos / Pontos de Atenção"
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: IA propõe rascunhos de próximos passos e pontos de atenção a partir da extração + comentários recentes; consultor revisa antes de publicar.
- Justificativa de negócio: Materializa o papel de IA-redutora-de-fricção do pivot. Reduz o trabalho do consultor de manter o observatório informativo.
- Stakeholder: Consultoria (autor mediado pela IA); cliente (consumidor do resultado revisado).
- Dependências: RF05/RF06 (extração), RF10 (comentários).

**3. Validação**
- Critérios de aceite: IA gera drafts a partir da extração + comentários; consultor edita antes de publicar; drafts em rascunho não aparecem para o cliente; versão do prompt + modelo registrados.
- Regras de negócio: Consultor **sempre** revisa antes de publicar — não há publicação automática. Histórico de drafts preservado.
- Rastreabilidade MPO: Processos **Transformar** + **Comunicar** + **Categorizar/Classificar** (Vieira, 2022, pp. 196-197) + motivação **Tomada de Decisão** (p. 203).
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/drafts/generate` + `POST /projects/{id}/drafts/{draft_id}/publish`. **Frontend (Bruno):** seção "Próximos Passos / Pontos de Atenção" no detalhe do projeto, com editor para o consultor revisar drafts.

---

### 3.5 Bloco 5 — Avaliação DSR

Fecha o ciclo de pesquisa. Sem este bloco, o DSR não tem evidência empírica para discutir no relato.

---

### RF14 — Importar e validar gabarito manual

**1. Identificação**
- ID: RF14
- Título: Importar e validar gabarito manual
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Carregar os gabaritos manuais produzidos na fase preparatória (3 projetos) e validá-los contra o schema.
- Justificativa de negócio: Sem gabarito, não há baseline para precisão/recall/F1.
- Stakeholder: Pesquisa (Cynthia + Moisés).
- Dependências: Fase preparatória (gabaritos produzidos), RF05/RF06 (schema versionado).

**3. Validação**
- Critérios de aceite: Carga via arquivo JSON; validação contra `docs/schema_extracao.json`; persistência com `origem: manual`; integridade verificada antes de RF15.
- Regras de negócio: Apenas 3 projetos (Valença piloto + Freire Batista + Kaka JJ). Bem Viver e Dinoah avaliados apenas por cobertura + Likert.
- Rastreabilidade MPO: — (infraestrutura de avaliação DSR — não mapeia diretamente a um conceito do MPO).
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/baseline` reusando modelo `Extraction` com origem manual; endpoint `GET /baseline-status`. **Frontend (Bruno):** upload do JSON + feedback de validação + indicador "gabarito presente/ausente" no portfólio.

---

### RF15 — Comparar extração automática vs. gabarito (critério híbrido)

**1. Identificação**
- ID: RF15
- Título: Comparar extração automática vs. gabarito (critério híbrido)
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Calcular precisão, recall, F1 e Cohen's Kappa comparando extração automática com gabarito manual, aplicando critério híbrido por tipo de atributo.
- Justificativa de negócio: Essência da avaliação quantitativa do DSR.
- Stakeholder: Pesquisa.
- Dependências: RF14 (gabarito carregado), RF05 (extração automática).

**3. Validação**
- Critérios de aceite: Atributos `estruturado` por comparação normalizada exata (TP/FP/FN); atributos `texto_livre` por rubrica 0/0,5/1 aplicada por dois avaliadores; Kappa por atributo e agregado; métricas separadas por grupo + agregado total; tempo manual vs. automático registrado; visualização tabular.
- Regras de negócio: Atributos com Kappa < 0,6 sinalizados como limitação. Métricas calculadas apenas nos 3 projetos com gabarito.
- Rastreabilidade MPO: Processo **Avaliar** (Vieira, 2022, p. 198) — avaliação colaborativa dos dados extraídos do observatório.
- Observações: **Backend (Raniel):** algoritmo híbrido; endpoint `POST /projects/{id}/rubric` (rubrica externa) + `GET /projects/{id}/evaluation`. **Frontend (Bruno):** UI dedicada para Cynthia/Moisés aplicarem a rubrica 0/0,5/1 (lado-a-lado: extração × gabarito); tela tabular de resultados.

---

### RF16 — Coletar feedback Likert da consultoria

**1. Identificação**
- ID: RF16
- Título: Coletar feedback Likert da consultoria
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Registrar percepção da equipe da consultoria sobre redução de fricção e qualidade da assistência da IA.
- Justificativa de negócio: Metade da avaliação qualitativa do DSR. Valida a hipótese do pivot (IA reduz fricção).
- Stakeholder: Pesquisa.
- Dependências: RF12 (resumo gerado), RF13 (drafts gerados).

**3. Validação**
- Critérios de aceite: Formulário com 4 dimensões em escala 1-5 (utilidade dos drafts, redução de fricção, qualidade do resumo gerado, manutenibilidade); N esperado ~4 (toda a equipe); persistência + relatório agregado.
- Regras de negócio: Aplicado após a equipe ter usado o sistema com os 5 projetos.
- Rastreabilidade MPO: Agente **Equipe de Gestão e Desenvolvimento do Observatório** (Vieira, 2022, p. 201) + motivações **Conhecimento** e **Engajamento** (p. 204).
- Observações: **Backend (Raniel):** endpoint `POST /likert-responses?audience=consultoria`. **Frontend (Bruno):** formulário simples + relatório de médias por dimensão.

---

### RF17 — Coletar feedback Likert dos clientes

**1. Identificação**
- ID: RF17
- Título: Coletar feedback Likert dos clientes
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Registrar percepção dos clientes finais sobre clareza do resumo, utilidade do espaço, qualidade do diálogo e sentido de inclusão.
- Justificativa de negócio: Metade da avaliação qualitativa do DSR. Valida a hipótese do pivot do lado do cliente.
- Stakeholder: Pesquisa.
- Dependências: RF12 (resumos visíveis), RF10 (comentários), RF11 (feed).

**3. Validação**
- Critérios de aceite: Formulário com 4 dimensões em escala 1-5 (clareza do resumo, utilidade do espaço, qualidade do diálogo, sentido de inclusão); identificação do projeto (respondente anônimo opcional); N esperado 5-10.
- Regras de negócio: Aplicado após pelo menos 2 semanas de uso pelos clientes. Implementação mínima viável: Google Forms externo + import das respostas.
- Rastreabilidade MPO: Agente **Partes Interessadas dos Projetos** + **Usuários do Observatório** (Vieira, 2022, pp. 200-201) + motivações **Engajamento** e **Conhecimento** (p. 204) + característica **Interatividade** (p. 191).
- Observações: **Backend (Raniel):** endpoint `POST /likert-responses?audience=cliente` para receber respostas importadas. **Frontend (Bruno):** tela de import do CSV + relatório agregado (médias por dimensão por projeto).

---

### RF18 — Exportar resultados consolidados

**1. Identificação**
- ID: RF18
- Título: Exportar resultados consolidados
- Prioridade: Should
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Gerar exportação única (CSV/JSON) com todos os dados de avaliação para alimentar relato e artigo.
- Justificativa de negócio: Sem exportação, o trabalho de escrita do relato fica refém de queries manuais.
- Stakeholder: Pesquisa (Cynthia para relato; Moisés para apresentação).
- Dependências: RF15 (métricas), RF16 + RF17 (Likert), RF09 (cobertura).

**3. Validação**
- Critérios de aceite: Arquivo único contendo extrações, cobertura, métricas (precisão/recall/F1/Kappa) por grupo, respostas Likert (consultoria + clientes), métricas de engajamento (#comentários, #drafts publicados).
- Regras de negócio: Cabeçalhos compatíveis com planilha (Excel, Google Sheets).
- Rastreabilidade MPO: — (infraestrutura de avaliação — não mapeia diretamente a um conceito do MPO).
- Observações: **Backend (Raniel):** endpoint `GET /export?format=csv|json`. **Frontend (Bruno):** botão "Exportar resultados" com seletor de formato. **Cortável se Sprint 4 atrasar** — fallback: queries SQL manuais no banco para extrair os dados de avaliação.

---

## 4. Requisitos Não Funcionais (RNF)

### RNF04 — Reprodutibilidade científica

**1. Identificação**
- ID: RNF04
- Título: Reprodutibilidade científica
- Categoria: Confiabilidade
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Cross-cutting; aplicado em RF05 (Sprint 1), RF12 e RF13 (Sprint 3)

**2. Detalhamento**
- Descrição: Toda extração registra versão do prompt, identificador do modelo LLM, timestamp e parâmetros relevantes.
- Justificativa de negócio: Sem reprodutibilidade, resultados não defendem academicamente.
- Stakeholder: Pesquisa.
- Dependências: RF05, RF12, RF13.

**3. Validação**
- Critérios de aceite: Cada saída de IA carrega versão do prompt + modelo + timestamp + parâmetros.
- Regras de negócio: Mudança de prompt incrementa versão registrada.
- Rastreabilidade MPO: — (qualidade de método científico aplicado ao artefato).
- Observações: Aplicado a extração (RF05), resumo (RF12) e drafts (RF13).

---

### RNF05 — Rastreabilidade de origem

**1. Identificação**
- ID: RNF05
- Título: Rastreabilidade de origem
- Categoria: Confiabilidade
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 1 (gerado em RF05) + Sprint 2 (exibido em RF08)

**2. Detalhamento**
- Descrição: Toda informação extraída automaticamente carrega o trecho do documento original que a justifica.
- Justificativa de negócio: Permite auditoria humana e mitiga risco de alucinação da IA.
- Stakeholder: Pesquisa + consultoria.
- Dependências: RF05.

**3. Validação**
- Critérios de aceite: Para cada atributo preenchido, o sistema persiste e exibe o trecho de origem.
- Regras de negócio: Se a IA não conseguir identificar trecho, atributo deve ficar `null`.
- Rastreabilidade MPO: Processo **Tratar** (Vieira, 2022, p. 195) — qualidade e auditabilidade dos dados coletados/extraídos.
- Observações: Visível na tela de detalhe (RF08).

---

### RNF06 — Ambiente de execução

**1. Identificação**
- ID: RNF06
- Título: Ambiente de execução local
- Categoria: Portabilidade
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Sprint 0 — semana 8 (estabelecido em T0.5)

**2. Detalhamento**
- Descrição: Sistema roda localmente via Docker Compose, sem dependência de infraestrutura externa além da API do LLM.
- Justificativa de negócio: Permite demos no notebook do Raniel; sem necessidade de deploy.
- Stakeholder: Equipe técnica + apresentação.
- Dependências: —

**3. Validação**
- Critérios de aceite: `docker compose up` provisiona PostgreSQL + backend FastAPI; `npm run dev` levanta o frontend; instruções no README.
- Regras de negócio: —
- Rastreabilidade MPO: Conceito de **Infraestrutura de TI** (Vieira, 2022, p. 192) — base computacional que sustenta o observatório.
- Observações: Sem deploy em produção no MVP.

---

### RNF07 — Restrições de escopo declaradas

**1. Identificação**
- ID: RNF07
- Título: Restrições de escopo declaradas
- Categoria: Restrição
- Prioridade: Must (declarativa)
- Status: Backlog
- Sprint/Release: Declarativa — válida em todas as sprints

**2. Detalhamento**
- Descrição: O sistema NÃO implementa OAuth, multi-tenancy, deploy em produção, pipeline de CI/CD nem suíte automatizada de testes extensiva.
- Justificativa de negócio: Manter foco no escopo de pesquisa.
- Stakeholder: Equipe.
- Dependências: —

**3. Validação**
- Critérios de aceite: Restrição declarativa — nenhuma medida.
- Regras de negócio: Smoke tests pontuais para fluxos críticos são aceitáveis.
- Rastreabilidade MPO: — (delimitação de escopo do artefato acadêmico).
- Observações: —

---

### RNF08 — Conformidade LGPD

**1. Identificação**
- ID: RNF08
- Título: Conformidade LGPD
- Categoria: Segurança / Compliance
- Prioridade: Must
- Status: Backlog
- Sprint/Release: Cross-cutting; principal aplicação em Sprint 1 (RF01) e Sprint 2 (RF02)

**2. Detalhamento**
- Descrição: Dados de marketing dos clientes em formato semi-aberto exigem medidas mínimas de proteção e consentimento.
- Justificativa de negócio: Lei Geral de Proteção de Dados (Lei nº 13.709/2018) aplicável. Sem conformidade, há risco legal real para a consultoria participante.
- Stakeholder: Consultoria + clientes + pesquisa.
- Dependências: RF01, RF02.

**3. Validação**
- Critérios de aceite: NDA assinado com clientes participantes; consentimento explícito para uso anonimizado dos resultados; isolamento por perfil (RF02); criptografia em trânsito (HTTPS local via certificado autoassinado para o ambiente); logs de acesso ao observatório.
- Regras de negócio: Cliente A nunca acessa dados do Cliente B. Logs de acesso preservados.
- Rastreabilidade MPO: Característica **Segurança** (Vieira, 2022, p. 192) — explicitamente menciona "política de segurança aderente à Lei Geral de Proteção de Dados (LGPD)".
- Observações: NDA gerenciado fora do sistema.

---

### RNF01 — Performance da extração

**1. Identificação**
- ID: RNF01
- Título: Performance da extração
- Categoria: Performance
- Prioridade: Should
- Status: Backlog
- Sprint/Release: Sprint 1 — semana 10 (medido ao concluir RF05)

**2. Detalhamento**
- Descrição: O pipeline LLM deve processar um documento `.docx` de tamanho médio (~10 páginas) em tempo aceitável para o ciclo de uso da pesquisa.
- Justificativa de negócio: Latência inviabiliza demos e testes iterativos.
- Stakeholder: Equipe técnica + apresentação final.
- Dependências: RF05.

**3. Validação**
- Critérios de aceite: Tempo médio ≤ 3 minutos por documento, medido sobre os 5 projetos.
- Regras de negócio: Se ultrapassar, otimizar prompt ou estratégia de chunking.
- Rastreabilidade MPO: — (qualidade técnica do pipeline, sem mapeamento direto a um conceito do MPO).
- Observações: Reportar no relato como métrica.

---

### RNF02 — Usabilidade

**1. Identificação**
- ID: RNF02
- Título: Usabilidade
- Categoria: Usabilidade
- Prioridade: Should
- Status: Backlog
- Sprint/Release: Cross-cutting; avaliado via RF17 (Sprint 4)

**2. Detalhamento**
- Descrição: Um cliente sem conhecimento técnico deve conseguir acessar seu projeto, ler o resumo, comentar e navegar pelo feed sem treinamento.
- Justificativa de negócio: Sem usabilidade para o cliente final, o observatório não viabiliza comunidade.
- Stakeholder: Clientes.
- Dependências: RF08, RF10, RF11, RF12.

**3. Validação**
- Critérios de aceite: Avaliado via dimensão "clareza do resumo" e "utilidade do espaço" do Likert dos clientes (RF17).
- Regras de negócio: —
- Rastreabilidade MPO: Característica **Usabilidade** (Vieira, 2022, p. 192) — linguagem cidadã, simplicidade e acessibilidade.
- Observações: —

---

### RNF03 — Manutenibilidade e organização

**1. Identificação**
- ID: RNF03
- Título: Manutenibilidade e organização do código
- Categoria: Manutenibilidade
- Prioridade: Should
- Status: Backlog
- Sprint/Release: Cross-cutting; verificado a cada sprint

**2. Detalhamento**
- Descrição: Backend e frontend em pastas separadas; schema versionado; estrutura legível para qualquer integrante.
- Justificativa de negócio: Permite que qualquer integrante contribua em qualquer parte sem bloqueio.
- Stakeholder: Equipe técnica.
- Dependências: —

**3. Validação**
- Critérios de aceite: Novo integrante clona e roda o ambiente local em < 30 minutos seguindo o README.
- Regras de negócio: —
- Rastreabilidade MPO: — (qualidade interna de engenharia, sem mapeamento direto a um conceito do MPO).
- Observações: `backend/` + `frontend/` na raiz do `raniel90/obione`.

---

### RNF09 — Controle de custo de LLM

**1. Identificação**
- ID: RNF09
- Título: Controle de custo de LLM
- Categoria: Operacional
- Prioridade: Should
- Status: Backlog
- Sprint/Release: Cross-cutting; monitorado a partir de Sprint 1

**2. Detalhamento**
- Descrição: As três chamadas adicionais de IA por projeto (extração + resumo + drafts) ampliam o custo de tokens. O sistema deve permitir controle e visibilidade.
- Justificativa de negócio: Sem controle, o orçamento de tokens pode estourar antes da entrega.
- Stakeholder: Equipe técnica.
- Dependências: RF05, RF12, RF13.

**3. Validação**
- Critérios de aceite: Cada chamada LLM registra tokens consumidos (input + output) e custo estimado; relatório agregado de custo por projeto e total.
- Regras de negócio: Estimar volume na semana 8 (orçamento de tokens). Usar modelo mais barato para drafts iniciais; modelo mais capaz só para extração final.
- Rastreabilidade MPO: Característica **Sustentabilidade** (Vieira, 2022, p. 190) — operação no longo prazo do observatório requer controle de custos operacionais.
- Observações: Caching agressivo onde possível (mesma extração para mesmo documento + mesma versão de prompt não re-roda).

---

## 5. Premissas

- O estudo de caso usa **5 projetos reais**: Freire Batista ADV, Valença Odontologia, Kaka JJ, Bem Viver Fitoterápicos, Dinoah ADV.
- **Gabarito manual produzido em apenas 3 projetos** (Valença piloto + Freire Batista + Kaka JJ).
- A coleta Likert depende de acesso aos stakeholders dos 5 projetos, **mediado por Bruno**. N esperado: ~4 (consultoria) + ~5-10 (clientes).
- Valença Odontologia atua como projeto piloto para calibrar a rubrica.
- A empresa que forneceu os documentos `.docx` é referenciada apenas como "consultoria" — sem nominação no relato.

---

## 6. Fora de Escopo

- Atualização incremental, detecção de mudanças, versionamento.
- Modelo próprio de classificação de risco (PMBOK).
- Linha do tempo interativa.
- Indicadores avançados de portfólio.
- Comparação cruzada entre projetos.
- Detecção automática de padrões, alertas, recomendações.
- Chat com IA.
- Sugestão automática de Lições Aprendidas (cortada pelo prazo).
- Notificações por email externo (substituídas por feed in-app — RF11).
- Extração de imagens/fotos.
- OAuth, multi-tenancy, deploy em produção.
