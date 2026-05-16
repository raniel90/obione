# Requisitos — ObiOne (Pós-Pivot Comunidade)

Documento de especificação de requisitos do ObiOne, observatório-comunidade de projetos baseado no MPO (Quadro 37, terceira versão — Vieira, 2022) potencializado por IA Generativa.

Reformulado em 16/05/2026 após o pivot que introduziu a dimensão de comunidade (ver `pivot_observatorio_comunidade.md`).

Os requisitos funcionais (RF01–RF18) são derivados 1:1 das user stories do backlog. Os requisitos não funcionais (RNF01–RNF09) cobrem qualidade do produto, reprodutibilidade científica, restrições do ambiente acadêmico, conformidade LGPD e controle de custo de LLM.

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

## 2. Requisitos Funcionais (RF)

### RF01 — Cadastrar projeto

**1. Identificação**
- ID: RF01
- Título: Cadastrar projeto
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 1 — semanas 9-10 (22/05-04/06)

**2. Detalhamento**
- Descrição: Permitir que o consultor cadastre um projeto informando nome, domínio e descrição livre.
- Justificativa de negócio: Toda extração, visualização e interação ancora em um projeto cadastrado. Sem cadastro, nada acontece.
- Stakeholder: Consultoria (cria projetos para clientes).
- Dependências: RF12 (autenticação) — apenas perfil Consultor pode cadastrar.

**3. Validação**
- Critérios de aceite: Campos obrigatórios validados (nome, domínio, descrição); ID único gerado automaticamente; listagem dos projetos cadastrados disponível.
- Regras de negócio: Domínio limitado a enum (jurídico, saúde, esporte, branding, outros). Apenas perfil Consultor cria projetos.
- Observações: **Backend (Raniel):** modelo `Project` + endpoints `POST /projects`, `GET /projects`. **Frontend (Bruno):** formulário de cadastro + tela de listagem (filtrada por perfil — ver RF13).

---

### RF02 — Fazer upload de documentos do projeto

**1. Identificação**
- ID: RF02
- Título: Fazer upload de documentos do projeto
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 1 — semanas 9-10 (22/05-04/06)

**2. Detalhamento**
- Descrição: Permitir anexar arquivos `.docx` a um projeto cadastrado, com suporte a múltiplos arquivos.
- Justificativa de negócio: Documentos são a fonte da extração do pipeline LLM.
- Stakeholder: Consultoria.
- Dependências: RF01 (cadastro), RF12 (autenticação), RF13 (perfil).

**3. Validação**
- Critérios de aceite: Suporte mínimo `.docx`; múltiplos arquivos por projeto; persistência do arquivo bruto + metadados (nome, data, tamanho, hash).
- Regras de negócio: Tamanho máximo por arquivo a definir; rejeitar arquivos inválidos com mensagem clara. Apenas perfil Consultor faz upload.
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/documents` aceitando `multipart/form-data`; persistência em Postgres + storage local. **Frontend (Bruno):** componente drag-and-drop, suporte a múltiplos arquivos, feedback visual de progresso, listagem dos arquivos do projeto.

---

### RF03 — Extrair atributos do MPO via LLM

**1. Identificação**
- ID: RF03
- Título: Extrair atributos do MPO via LLM
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 1 — semana 10 (29/05-04/06)

**2. Detalhamento**
- Descrição: Processar os documentos do projeto e extrair automaticamente os atributos previstos no Quadro 37 (terceira versão do MPO).
- Justificativa de negócio: É o coração da contribuição técnica do trabalho — o pipeline LLM que materializa o Trabalho Futuro #8 do MPO.
- Stakeholder: Consultoria + pesquisa.
- Dependências: RF02 (upload prévio), `docs/schema_extracao.json`, `docs/atributos_alvo_mpo.md` (fase preparatória).

**3. Validação**
- Critérios de aceite: Saída JSON conforme schema; 8 categorias do Quadro 37 contempladas; para cada atributo preenchido, valor + trecho de origem; atributos não encontrados como `null`; atributos `fora_de_escopo` (imagens) ignorados; versão do prompt e modelo registrados.
- Regras de negócio: Nunca inventar valor (alucinação) — preferir `null`. Sempre registrar versão do prompt e modelo para reprodutibilidade.
- Observações: **Backend (Raniel):** pipeline completo de extração — leitura `.docx`, chunking se necessário, prompt estruturado, chamada LLM, parsing, validação contra schema, endpoint `POST /projects/{id}/extract`. **Frontend (Bruno):** botão "Extrair com IA" no detalhe do projeto; loading visual; notificação ao concluir.

---

### RF04 — Persistir extração estruturada

**1. Identificação**
- ID: RF04
- Título: Persistir extração estruturada
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 1 — semana 10 (29/05-04/06)

**2. Detalhamento**
- Descrição: Salvar a extração JSON associada ao projeto e aos documentos de origem, com metadados de rastreabilidade.
- Justificativa de negócio: Sem persistência, não há comparação posterior nem auditoria humana.
- Stakeholder: Pesquisa + consultoria.
- Dependências: RF03.

**3. Validação**
- Critérios de aceite: Cada extração registra projeto, documento(s), versão do prompt, modelo LLM, timestamp, `origem` (`automatico` | `manual`); recuperável via API.
- Regras de negócio: Histórico de extrações preservado — nunca sobrescrever silenciosamente.
- Observações: **Backend (Raniel):** modelo `Extraction` com FKs e metadados; endpoints `GET /projects/{id}/extractions`. **Frontend (Bruno):** sem tela própria — dados consumidos por RF06.

---

### RF05 — Visualizar portfólio de projetos (perfil-aware)

**1. Identificação**
- ID: RF05
- Título: Visualizar portfólio de projetos
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Apresentar visão consolidada de projetos, com status derivado e cobertura, restrita ao perfil Consultor.
- Justificativa de negócio: Permite ao consultor curar e priorizar o que precisa de atenção no observatório.
- Stakeholder: Consultoria.
- Dependências: RF13 (perfis), RF07 (cobertura).

**3. Validação**
- Critérios de aceite: Lista projetos com nome, domínio, status derivado (`cadastrado` → `ingerido` → `extraído` → `avaliado`), % de cobertura; filtro por domínio.
- Regras de negócio: Cliente NÃO acessa esta tela (redirecionado ao seu próprio detalhe — RF06). Status é derivado, nunca editado.
- Observações: **Backend (Raniel):** endpoint `GET /projects` com cálculo de status + cobertura; filtro por perfil. **Frontend (Bruno):** tabela com colunas, filtro por domínio, navegação para detalhe.

---

### RF06 — Visualizar detalhe do projeto

**1. Identificação**
- ID: RF06
- Título: Visualizar detalhe do projeto
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Exibir todos os atributos extraídos de um projeto, agrupados por categoria do Quadro 37, com trecho de origem.
- Justificativa de negócio: É a tela onde o conhecimento do observatório se materializa. Consultor inspeciona; cliente entende.
- Stakeholder: Consultoria + cliente daquele projeto.
- Dependências: RF13 (perfis), RF03/RF04 (extração).

**3. Validação**
- Critérios de aceite: Atributos das 8 categorias agrupados; preenchidos e vazios visíveis; valor + trecho de origem por atributo; acesso aos documentos originais.
- Regras de negócio: Cliente acessa **apenas o seu** projeto; consultor acessa todos. Tentativa de acesso indevido retorna 403.
- Observações: **Backend (Raniel):** endpoint `GET /projects/{id}` com check de perfil; endpoint `GET /projects/{id}/documents/{doc_id}/download`. **Frontend (Bruno):** layout de detalhe agrupado por categoria + visualização de citações.

---

### RF07 — Calcular e exibir cobertura do MPO

**1. Identificação**
- ID: RF07
- Título: Calcular e exibir cobertura do MPO
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Calcular cobertura (% atributos preenchidos vs. total de atributos-alvo) por projeto e exibir matriz cruzada no portfólio.
- Justificativa de negócio: Indicador-chave da avaliação quantitativa — abrangência da extração frente ao MPO.
- Stakeholder: Pesquisa + consultoria.
- Dependências: RF03 (extração).

**3. Validação**
- Critérios de aceite: Por projeto, % calculada; matriz projetos × atributos no portfólio (tabela ou heatmap); destaque visual quando < 50%; sinalização saudável quando ≥ 80%.
- Regras de negócio: Atributos `fora_de_escopo` excluídos do denominador.
- Observações: **Backend (Raniel):** endpoint `GET /coverage` retornando matriz. **Frontend (Bruno):** componente heatmap/tabela com coloração por threshold; tooltip com valor por célula.

---

### RF08 — Importar e validar gabarito manual

**1. Identificação**
- ID: RF08
- Título: Importar e validar gabarito manual
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Carregar os gabaritos manuais produzidos na fase preparatória (3 projetos) e validá-los contra o schema.
- Justificativa de negócio: Sem gabarito, não há baseline para precisão/recall/F1.
- Stakeholder: Pesquisa (Cynthia + Moisés).
- Dependências: Fase preparatória (gabaritos produzidos), RF03/RF04 (schema versionado).

**3. Validação**
- Critérios de aceite: Carga via arquivo JSON; validação contra `docs/schema_extracao.json`; persistência com `origem: manual`; integridade verificada antes de RF09.
- Regras de negócio: Apenas 3 projetos (Valença piloto + Freire Batista + Kaka JJ). Bem Viver e Dinoah avaliados apenas por cobertura + Likert.
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/baseline` reusando modelo `Extraction` com origem manual; endpoint `GET /baseline-status`. **Frontend (Bruno):** upload do JSON + feedback de validação + indicador "gabarito presente/ausente" no portfólio.

---

### RF09 — Comparar extração automática vs. gabarito (critério híbrido)

**1. Identificação**
- ID: RF09
- Título: Comparar extração automática vs. gabarito (critério híbrido)
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Calcular precisão, recall, F1 e Cohen's Kappa comparando extração automática com gabarito manual, aplicando critério híbrido por tipo de atributo.
- Justificativa de negócio: Essência da avaliação quantitativa do DSR.
- Stakeholder: Pesquisa.
- Dependências: RF08 (gabarito carregado), RF03 (extração automática).

**3. Validação**
- Critérios de aceite: Atributos `estruturado` por comparação normalizada exata (TP/FP/FN); atributos `texto_livre` por rubrica 0/0,5/1 aplicada por dois avaliadores; Kappa por atributo e agregado; métricas separadas por grupo + agregado total; tempo manual vs. automático registrado; visualização tabular.
- Regras de negócio: Atributos com Kappa < 0,6 sinalizados como limitação. Métricas calculadas apenas nos 3 projetos com gabarito.
- Observações: **Backend (Raniel):** algoritmo híbrido; endpoint `POST /projects/{id}/rubric` (rubrica externa) + `GET /projects/{id}/evaluation`. **Frontend (Bruno):** UI dedicada para Cynthia/Moisés aplicarem a rubrica 0/0,5/1 (lado-a-lado: extração × gabarito); tela tabular de resultados.

---

### RF10 — Coletar feedback Likert da consultoria

**1. Identificação**
- ID: RF10
- Título: Coletar feedback Likert da consultoria
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Registrar percepção da equipe da consultoria sobre redução de fricção e qualidade da assistência da IA.
- Justificativa de negócio: Metade da avaliação qualitativa do DSR. Valida a hipótese do pivot (IA reduz fricção).
- Stakeholder: Pesquisa.
- Dependências: RF16 (resumo gerado), RF17 (drafts gerados).

**3. Validação**
- Critérios de aceite: Formulário com 4 dimensões em escala 1-5 (utilidade dos drafts, redução de fricção, qualidade do resumo gerado, manutenibilidade); N esperado ~4 (toda a equipe); persistência + relatório agregado.
- Regras de negócio: Aplicado após a equipe ter usado o sistema com os 5 projetos.
- Observações: **Backend (Raniel):** endpoint `POST /likert-responses?audience=consultoria`. **Frontend (Bruno):** formulário simples + relatório de médias por dimensão.

---

### RF11 — Exportar resultados consolidados

**1. Identificação**
- ID: RF11
- Título: Exportar resultados consolidados
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Gerar exportação única (CSV/JSON) com todos os dados de avaliação para alimentar relato e artigo.
- Justificativa de negócio: Sem exportação, o trabalho de escrita do relato fica refém de queries manuais.
- Stakeholder: Pesquisa (Cynthia para relato; Moisés para apresentação).
- Dependências: RF09 (métricas), RF10 + RF18 (Likert), RF07 (cobertura).

**3. Validação**
- Critérios de aceite: Arquivo único contendo extrações, cobertura, métricas (precisão/recall/F1/Kappa) por grupo, respostas Likert (consultoria + clientes), métricas de engajamento (#comentários, #drafts publicados).
- Regras de negócio: Cabeçalhos compatíveis com planilha (Excel, Google Sheets).
- Observações: **Backend (Raniel):** endpoint `GET /export?format=csv|json`. **Frontend (Bruno):** botão "Exportar resultados" com seletor de formato.

---

### RF12 — Autenticar usuário

**1. Identificação**
- ID: RF12
- Título: Autenticar usuário
- Prioridade: Alta
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
- Observações: **Backend (Raniel):** endpoints `POST /auth/login`, `POST /auth/logout`; middleware JWT; bibliotecas FastAPI padrão (passlib + python-jose). **Frontend (Bruno):** tela de login + gerenciamento de token na sessão.

---

### RF13 — Gerenciar perfis e acesso semi-aberto

**1. Identificação**
- ID: RF13
- Título: Gerenciar perfis e acesso semi-aberto
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 2 — semana 11 (05-11/06)

**2. Detalhamento**
- Descrição: Garantir que cada usuário acessa apenas o que seu perfil permite. Dois perfis: Consultor (todos os projetos) e Cliente (apenas o seu projeto associado).
- Justificativa de negócio: Materializa a característica "Acesso semi-aberto" do MPO (Vieira, 2022, p. 189) e é fundamental para LGPD.
- Stakeholder: Consultoria + clientes.
- Dependências: RF12 (autenticação).

**3. Validação**
- Critérios de aceite: Vínculo cliente ↔ projeto persistido; endpoints e telas filtram conforme perfil; tentativa de acesso indevido retorna 403; equipe da consultoria cria contas; cliente recebe convite por email com senha provisória.
- Regras de negócio: Um cliente vinculado a no máximo 1 projeto (no MVP). Consultor pode acessar todos. Cliente A nunca acessa dados do Cliente B.
- Observações: **Backend (Raniel):** modelo `User` com role (`consultor` | `cliente`) + FK opcional para `Project`; middleware de autorização aplicado em todos os endpoints relevantes. **Frontend (Bruno):** roteamento condicional por perfil; tela de gerenciamento de usuários (apenas Consultor).

---

### RF14 — Comentar no projeto

**1. Identificação**
- ID: RF14
- Título: Comentar no projeto
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: Permitir que consultor e cliente daquele projeto comentem livremente no projeto, respondendo a comentários.
- Justificativa de negócio: Materializa a característica Interatividade e o processo Interagir do MPO (Vieira, pp. 191, 198). Sem comentários, não há comunidade — apenas dashboard.
- Stakeholder: Consultoria + clientes.
- Dependências: RF13 (perfis).

**3. Validação**
- Critérios de aceite: Thread livre por projeto; identificação do autor visível; resposta com 1 nível de aninhamento; edição/exclusão pelo próprio autor; consultor pode moderar.
- Regras de negócio: Cliente comenta apenas no seu projeto. Comentário não pode ser anônimo. Histórico preservado em soft-delete.
- Observações: **Backend (Raniel):** modelo `Comment` (FK projeto + FK autor + parent_id); endpoints CRUD com check de perfil. **Frontend (Bruno):** componente de thread com formulário, listagem, resposta e edição.

---

### RF15 — Visualizar feed in-app de novidades

**1. Identificação**
- ID: RF15
- Título: Visualizar feed in-app de novidades
- Prioridade: Média
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: Mostrar feed das novidades dos projetos do usuário: novo comentário, novo resumo gerado, nova extração, novo draft publicado.
- Justificativa de negócio: Materializa o processo Acompanhar do MPO (Vieira, p. 198). Mantém comunidade viva sem precisar de email.
- Stakeholder: Consultoria + clientes.
- Dependências: RF13 (perfis), RF14 (comentários), RF16 (resumos), RF17 (drafts).

**3. Validação**
- Critérios de aceite: Feed filtrado por perfil (cliente vê só seu projeto; consultor vê todos); indicador de "não lido" (contador); navegação direta para o evento.
- Regras de negócio: Sem envio de email externo — apenas in-app. Eventos antigos (> 30 dias) podem ser arquivados.
- Observações: **Backend (Raniel):** modelo `ActivityEvent` registrado em hooks dos demais módulos; endpoint `GET /feed`. **Frontend (Bruno):** componente badge no header + tela de feed.

---

### RF16 — Gerar Resumo do Projeto para o Cliente

**1. Identificação**
- ID: RF16
- Título: Gerar Resumo do Projeto para o Cliente
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: IA Generativa lê a extração JSON do projeto e produz texto narrativo em linguagem acessível ao cliente.
- Justificativa de negócio: Materializa o papel de IA-tradutora do pivot. Permite que o cliente entenda o que está sendo observado sem precisar ler JSON.
- Stakeholder: Cliente (consumidor); consultoria (mediadora).
- Dependências: RF03/RF04 (extração persistida).

**3. Validação**
- Critérios de aceite: IA gera texto em linguagem cidadã cobrindo objetivos, escopo, status, riscos relevantes; sempre revisável pelo consultor antes de publicar; versão do prompt + modelo registrados.
- Regras de negócio: Cliente **nunca vê** resumo não-revisado. Resumo publicado vira "current"; histórico preservado.
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/summary/generate` (gera draft) + `POST /projects/{id}/summary/publish` (consultor publica). **Frontend (Bruno):** tela "Resumo do Cliente" no detalhe do projeto, com modos "rascunho" (consultor edita) e "publicado" (cliente vê).

---

### RF17 — Gerar drafts de "Próximos Passos / Pontos de Atenção"

**1. Identificação**
- ID: RF17
- Título: Gerar drafts de "Próximos Passos / Pontos de Atenção"
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 3 — semana 12 (12-18/06)

**2. Detalhamento**
- Descrição: IA propõe rascunhos de próximos passos e pontos de atenção a partir da extração + comentários recentes; consultor revisa antes de publicar.
- Justificativa de negócio: Materializa o papel de IA-redutora-de-fricção do pivot. Reduz o trabalho do consultor de manter o observatório informativo.
- Stakeholder: Consultoria (autor mediado pela IA); cliente (consumidor do resultado revisado).
- Dependências: RF03/RF04 (extração), RF14 (comentários).

**3. Validação**
- Critérios de aceite: IA gera drafts a partir da extração + comentários; consultor edita antes de publicar; drafts em rascunho não aparecem para o cliente; versão do prompt + modelo registrados.
- Regras de negócio: Consultor **sempre** revisa antes de publicar — não há publicação automática. Histórico de drafts preservado.
- Observações: **Backend (Raniel):** endpoint `POST /projects/{id}/drafts/generate` + `POST /projects/{id}/drafts/{draft_id}/publish`. **Frontend (Bruno):** seção "Próximos Passos / Pontos de Atenção" no detalhe do projeto, com editor para o consultor revisar drafts.

---

### RF18 — Coletar feedback Likert dos clientes

**1. Identificação**
- ID: RF18
- Título: Coletar feedback Likert dos clientes
- Prioridade: Alta
- Status: Backlog
- Sprint/Release: Sprint 4 — semana 14 (26/06-02/07)

**2. Detalhamento**
- Descrição: Registrar percepção dos clientes finais sobre clareza do resumo, utilidade do espaço, qualidade do diálogo e sentido de inclusão.
- Justificativa de negócio: Metade da avaliação qualitativa do DSR. Valida a hipótese do pivot do lado do cliente.
- Stakeholder: Pesquisa.
- Dependências: RF16 (resumos visíveis), RF14 (comentários), RF15 (feed).

**3. Validação**
- Critérios de aceite: Formulário com 4 dimensões em escala 1-5 (clareza do resumo, utilidade do espaço, qualidade do diálogo, sentido de inclusão); identificação do projeto (respondente anônimo opcional); N esperado 5-10.
- Regras de negócio: Aplicado após pelo menos 2 semanas de uso pelos clientes. Implementação mínima viável: Google Forms externo + import das respostas.
- Observações: **Backend (Raniel):** endpoint `POST /likert-responses?audience=cliente` para receber respostas importadas. **Frontend (Bruno):** tela de import do CSV + relatório agregado (médias por dimensão por projeto).

---

## 3. Requisitos Não Funcionais (RNF)

### RNF01 — Performance da extração

**1. Identificação**
- ID: RNF01
- Título: Performance da extração
- Categoria: Performance
- Prioridade: Média
- Status: Backlog

**2. Detalhamento**
- Descrição: O pipeline LLM deve processar um documento `.docx` de tamanho médio (~10 páginas) em tempo aceitável para o ciclo de uso da pesquisa.
- Justificativa de negócio: Latência inviabiliza demos e testes iterativos.
- Stakeholder: Equipe técnica + apresentação final.
- Dependências: RF03.

**3. Validação**
- Critérios de aceite: Tempo médio ≤ 3 minutos por documento, medido sobre os 5 projetos.
- Regras de negócio: Se ultrapassar, otimizar prompt ou estratégia de chunking.
- Observações: Reportar no relato como métrica.

---

### RNF02 — Usabilidade

**1. Identificação**
- ID: RNF02
- Título: Usabilidade
- Categoria: Usabilidade
- Prioridade: Média
- Status: Backlog

**2. Detalhamento**
- Descrição: Um cliente sem conhecimento técnico deve conseguir acessar seu projeto, ler o resumo, comentar e navegar pelo feed sem treinamento.
- Justificativa de negócio: Sem usabilidade para o cliente final, o observatório não viabiliza comunidade.
- Stakeholder: Clientes.
- Dependências: RF06, RF14, RF15, RF16.

**3. Validação**
- Critérios de aceite: Avaliado via dimensão "clareza do resumo" e "utilidade do espaço" do Likert dos clientes (RF18).
- Regras de negócio: —
- Observações: Característica Usabilidade do MPO (Vieira, p. 192).

---

### RNF03 — Manutenibilidade e organização

**1. Identificação**
- ID: RNF03
- Título: Manutenibilidade e organização do código
- Categoria: Manutenibilidade
- Prioridade: Média
- Status: Backlog

**2. Detalhamento**
- Descrição: Backend e frontend em pastas separadas; schema versionado; estrutura legível para qualquer integrante.
- Justificativa de negócio: Permite que qualquer integrante contribua em qualquer parte sem bloqueio.
- Stakeholder: Equipe técnica.
- Dependências: —

**3. Validação**
- Critérios de aceite: Novo integrante clona e roda o ambiente local em < 30 minutos seguindo o README.
- Regras de negócio: —
- Observações: `backend/` + `frontend/` na raiz do `raniel90/obione`.

---

### RNF04 — Reprodutibilidade científica

**1. Identificação**
- ID: RNF04
- Título: Reprodutibilidade científica
- Categoria: Confiabilidade
- Prioridade: Alta
- Status: Backlog

**2. Detalhamento**
- Descrição: Toda extração registra versão do prompt, identificador do modelo LLM, timestamp e parâmetros relevantes.
- Justificativa de negócio: Sem reprodutibilidade, resultados não defendem academicamente.
- Stakeholder: Pesquisa.
- Dependências: RF03, RF16, RF17.

**3. Validação**
- Critérios de aceite: Cada saída de IA carrega versão do prompt + modelo + timestamp + parâmetros.
- Regras de negócio: Mudança de prompt incrementa versão registrada.
- Observações: Aplicado a extração (RF03), resumo (RF16) e drafts (RF17).

---

### RNF05 — Rastreabilidade de origem

**1. Identificação**
- ID: RNF05
- Título: Rastreabilidade de origem
- Categoria: Confiabilidade
- Prioridade: Alta
- Status: Backlog

**2. Detalhamento**
- Descrição: Toda informação extraída automaticamente carrega o trecho do documento original que a justifica.
- Justificativa de negócio: Permite auditoria humana e mitiga risco de alucinação da IA.
- Stakeholder: Pesquisa + consultoria.
- Dependências: RF03.

**3. Validação**
- Critérios de aceite: Para cada atributo preenchido, o sistema persiste e exibe o trecho de origem.
- Regras de negócio: Se a IA não conseguir identificar trecho, atributo deve ficar `null`.
- Observações: Visível na tela de detalhe (RF06).

---

### RNF06 — Ambiente de execução

**1. Identificação**
- ID: RNF06
- Título: Ambiente de execução local
- Categoria: Portabilidade
- Prioridade: Alta
- Status: Backlog

**2. Detalhamento**
- Descrição: Sistema roda localmente via Docker Compose, sem dependência de infraestrutura externa além da API do LLM.
- Justificativa de negócio: Permite demos no notebook do Raniel; sem necessidade de deploy.
- Stakeholder: Equipe técnica + apresentação.
- Dependências: —

**3. Validação**
- Critérios de aceite: `docker compose up` provisiona PostgreSQL + backend FastAPI; `npm run dev` levanta o frontend; instruções no README.
- Regras de negócio: —
- Observações: Sem deploy em produção no MVP.

---

### RNF07 — Restrições de escopo declaradas

**1. Identificação**
- ID: RNF07
- Título: Restrições de escopo declaradas
- Categoria: Restrição
- Prioridade: Alta (declarativa)
- Status: Backlog

**2. Detalhamento**
- Descrição: O sistema NÃO implementa OAuth, multi-tenancy, deploy em produção, pipeline de CI/CD nem suíte automatizada de testes extensiva.
- Justificativa de negócio: Manter foco no escopo de pesquisa.
- Stakeholder: Equipe.
- Dependências: —

**3. Validação**
- Critérios de aceite: Restrição declarativa — nenhuma medida.
- Regras de negócio: Smoke tests pontuais para fluxos críticos são aceitáveis.
- Observações: —

---

### RNF08 — Conformidade LGPD (NOVO — pós-pivot)

**1. Identificação**
- ID: RNF08
- Título: Conformidade LGPD
- Categoria: Segurança / Compliance
- Prioridade: Alta
- Status: Backlog

**2. Detalhamento**
- Descrição: Dados de marketing dos clientes em formato semi-aberto exigem medidas mínimas de proteção e consentimento.
- Justificativa de negócio: Lei Geral de Proteção de Dados (Lei nº 13.709/2018) aplicável. Sem conformidade, há risco legal real para a consultoria participante.
- Stakeholder: Consultoria + clientes + pesquisa.
- Dependências: RF12, RF13.

**3. Validação**
- Critérios de aceite: NDA assinado com clientes participantes; consentimento explícito para uso anonimizado dos resultados; isolamento por perfil (RF13); criptografia em trânsito (HTTPS local via certificado autoassinado para o ambiente); logs de acesso ao observatório.
- Regras de negócio: Cliente A nunca acessa dados do Cliente B. Logs de acesso preservados.
- Observações: Característica Segurança do MPO (Vieira, p. 192). NDA gerenciado fora do sistema.

---

### RNF09 — Controle de custo de LLM (NOVO — pós-pivot)

**1. Identificação**
- ID: RNF09
- Título: Controle de custo de LLM
- Categoria: Operacional
- Prioridade: Média
- Status: Backlog

**2. Detalhamento**
- Descrição: As três chamadas adicionais de IA por projeto (extração + resumo + drafts) ampliam o custo de tokens. O sistema deve permitir controle e visibilidade.
- Justificativa de negócio: Sem controle, o orçamento de tokens pode estourar antes da entrega.
- Stakeholder: Equipe técnica.
- Dependências: RF03, RF16, RF17.

**3. Validação**
- Critérios de aceite: Cada chamada LLM registra tokens consumidos (input + output) e custo estimado; relatório agregado de custo por projeto e total.
- Regras de negócio: Estimar volume na semana 8 (orçamento de tokens). Usar modelo mais barato para drafts iniciais; modelo mais capaz só para extração final.
- Observações: Caching agressivo onde possível (mesma extração para mesmo documento + mesma versão de prompt não re-roda).

---

## 4. Premissas

- O estudo de caso usa **5 projetos reais**: Freire Batista ADV, Valença Odontologia, Kaka JJ, Bem Viver Fitoterápicos, Dinoah ADV.
- **Gabarito manual produzido em apenas 3 projetos** (Valença piloto + Freire Batista + Kaka JJ).
- A coleta Likert depende de acesso aos stakeholders dos 5 projetos, **mediado por Bruno**. N esperado: ~4 (consultoria) + ~5-10 (clientes).
- Valença Odontologia atua como projeto piloto para calibrar a rubrica.
- A empresa que forneceu os documentos `.docx` é referenciada apenas como "consultoria" — sem nominação no relato.

---

## 5. Fora de Escopo

- Atualização incremental, detecção de mudanças, versionamento.
- Modelo próprio de classificação de risco (PMBOK).
- Linha do tempo interativa.
- Indicadores avançados de portfólio.
- Comparação cruzada entre projetos.
- Detecção automática de padrões, alertas, recomendações.
- Chat com IA.
- Sugestão automática de Lições Aprendidas (cortada pelo prazo).
- Notificações por email externo (substituídas por feed in-app — RF15).
- Extração de imagens/fotos.
- OAuth, multi-tenancy, deploy em produção.
