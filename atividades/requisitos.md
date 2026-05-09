# Requisitos — ObiOne

Documento de especificação de requisitos do ObiOne, observatório de projetos baseado no MPO (Quadro 37, terceira versão — Vieira, 2022) potencializado por IA Generativa.

Os requisitos funcionais (RF) são derivados 1:1 das user stories do backlog (`backlog_obione.md`). Os requisitos não funcionais (RNF) cobrem qualidade do produto, reprodutibilidade científica e restrições do ambiente acadêmico.

---

## 1. Visão Geral

O ObiOne ingere documentos não-estruturados de projetos (formato Word, `.docx`), extrai automaticamente os atributos previstos no Quadro 37 do MPO usando um pipeline LLM, e disponibiliza os resultados em um dashboard de observação. A avaliação acontece em estudo de caso com 5 projetos reais por meio do método Design Science Research (DSR).

### Stack alvo

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + componentes Lovable |
| Backend | Python 3 + FastAPI |
| Banco de dados | PostgreSQL |
| Comunicação | REST (JSON) |
| LLM | A definir (decisão técnica do backend) |
| Ambiente | Docker Compose local |

---

## 2. Requisitos Funcionais (RF)

### RF01 — Cadastrar projeto
- **US de origem:** US01
- **Descrição:** O sistema deve permitir cadastrar projetos informando nome, domínio e descrição livre.
- **Critérios de aceitação:**
  - Campos obrigatórios: nome, domínio (jurídico, saúde, esporte, branding, outros), descrição.
  - Identificador único atribuído automaticamente.
  - Listagem dos projetos cadastrados disponível.
- **Backend (Raniel):** Modelo `Project` (nome, domínio enum, descrição, UUID); endpoints `POST /projects` (criação) e `GET /projects` (listagem); validação de campos obrigatórios.
- **Frontend (Bruno):** Tela de cadastro com formulário (input nome, dropdown de domínio, textarea descrição); tela de listagem com navegação para detalhe.
- **Prioridade:** Alta

### RF02 — Fazer upload de documentos do projeto
- **US de origem:** US02
- **Descrição:** O sistema deve permitir anexar arquivos `.docx` a um projeto cadastrado, com suporte a múltiplos arquivos.
- **Critérios de aceitação:**
  - Suporte mínimo obrigatório: `.docx` (formato dos casos reais).
  - Múltiplos arquivos por projeto.
  - Persistência do arquivo bruto + metadados (nome, data, tamanho, hash).
- **Backend (Raniel):** Endpoint `POST /projects/{id}/documents` aceitando `multipart/form-data`; validação de extensão `.docx`; persistência do arquivo bruto + metadados (nome, data, tamanho, hash) em Postgres; endpoint `GET /projects/{id}/documents` para listagem.
- **Frontend (Bruno):** Componente de upload com drag-and-drop, suporte a múltiplos arquivos por interação, feedback visual de progresso, listagem dos arquivos já enviados do projeto.
- **Prioridade:** Alta

### RF03 — Extrair atributos do MPO via LLM
- **US de origem:** US03
- **Descrição:** O sistema deve processar os documentos do projeto e extrair automaticamente os atributos previstos no Quadro 37 (terceira versão do MPO).
- **Critérios de aceitação:**
  - Saída JSON conforme schema versionado, contendo as 8 categorias do Quadro 37: geral, stakeholders, escopo, cronograma, custos, riscos, mudanças, lições aprendidas.
  - Para cada atributo preenchido: valor extraído + trecho de origem (citação do documento).
  - Atributos não encontrados marcados como `null` — nunca inventados.
  - Atributos marcados como `fora_de_escopo` (ex.: imagens/fotos) são ignorados pelo pipeline.
  - Versão do prompt e modelo LLM registrados na extração (rastreabilidade).
- **Backend (Raniel):** Pipeline de extração — leitura do `.docx`, estratégia de chunking (se necessário), prompt estruturado a partir da lista de atributos-alvo, chamada ao LLM, parsing da resposta para o schema, marcação de `null` para ausentes; endpoint `POST /projects/{id}/extract` para disparar a extração.
- **Frontend (Bruno):** Botão "Extrair com IA" no detalhe do projeto; indicador de processamento em andamento; notificação visual ao concluir (sucesso ou erro).
- **Prioridade:** Alta

### RF04 — Persistir extração estruturada
- **US de origem:** US04
- **Descrição:** O sistema deve salvar a extração JSON associada ao projeto e aos documentos de origem.
- **Critérios de aceitação:**
  - Schema do JSON deriva diretamente dos atributos do Quadro 37.
  - Cada extração registra: projeto, documento(s), versão do prompt, modelo LLM, timestamp, origem (`automatico` | `manual`).
  - Recuperável posteriormente para comparação com gabarito.
- **Backend (Raniel):** Modelo `Extraction` com referências (FK para projeto e documentos), versão do prompt, identificador do modelo LLM, timestamp, origem, JSON dos atributos; endpoint `GET /projects/{id}/extractions` para recuperar.
- **Frontend (Bruno):** Sem tela própria — dados consumidos pela tela de detalhe do projeto (RF06).
- **Prioridade:** Alta

### RF05 — Visualizar portfólio de projetos
- **US de origem:** US05
- **Descrição:** O sistema deve apresentar uma visão consolidada dos projetos cadastrados.
- **Critérios de aceitação:**
  - Lista os projetos com: nome, domínio, status derivado (`cadastrado` → `ingerido` → `extraído` → `avaliado`), % de cobertura do MPO.
  - Status é derivado do estado dos dados, não editado manualmente.
  - Filtro por domínio.
- **Backend (Raniel):** Endpoint `GET /projects` retornando lista com status derivado e cobertura calculada on-the-fly; lógica de derivação do status a partir do estado dos dados (cadastrado/ingerido/extraído/avaliado); cálculo do % de cobertura por projeto.
- **Frontend (Bruno):** Tela de portfólio em formato tabela com colunas (nome, domínio, status, cobertura); filtro por domínio; clique navega para o detalhe do projeto.
- **Prioridade:** Alta

### RF06 — Visualizar detalhe do projeto
- **US de origem:** US06
- **Descrição:** O sistema deve exibir os atributos extraídos de um projeto específico.
- **Critérios de aceitação:**
  - Exibe todos os atributos do Quadro 37 (preenchidos e vazios) agrupados por categoria.
  - Para cada atributo preenchido: valor + trecho de origem.
  - Acesso aos documentos originais carregados.
- **Backend (Raniel):** Endpoint `GET /projects/{id}` retornando projeto + extração mais recente + lista de documentos; endpoint `GET /projects/{id}/documents/{doc_id}/download` para servir o arquivo original.
- **Frontend (Bruno):** Tela de detalhe com atributos agrupados nas 8 categorias do Quadro 37; cada atributo preenchido exibe valor + trecho de origem; link para baixar os documentos originais.
- **Prioridade:** Alta

### RF07 — Calcular e exibir cobertura do MPO
- **US de origem:** US07
- **Descrição:** O sistema deve calcular e exibir o indicador de cobertura do MPO, por projeto e no portfólio.
- **Critérios de aceitação:**
  - Por projeto: % de atributos preenchidos vs. total de atributos-alvo (Quadro 37, excluindo `fora_de_escopo`).
  - No portfólio: tabela ou heatmap cruzando projetos × atributos.
  - Destaque visual quando cobertura < 50%; sinalização saudável quando ≥ 80%.
- **Backend (Raniel):** Endpoint `GET /coverage` retornando matriz projetos × atributos com estado de cada célula (preenchido / vazio / `fora_de_escopo`); cálculo agregado por projeto e por atributo.
- **Frontend (Bruno):** Componente de heatmap (ou tabela cruzada) com coloração por threshold — < 50% destaque de alerta, ≥ 80% sinalização saudável; tooltip com valor exato por célula.
- **Prioridade:** Alta

### RF08 — Importar gabarito manual
- **US de origem:** US08
- **Descrição:** O sistema deve permitir carregar a extração manual (gabarito) produzida pelos avaliadores na fase preparatória.
- **Critérios de aceitação:**
  - Carga via arquivo (JSON ou planilha convertida para JSON).
  - Validação de schema: cada gabarito conforma o schema de extração definido na T1.3.
  - Persistência no mesmo schema da extração automática, com `origem: manual`.
  - Validação de integridade: os 5 projetos têm gabarito completo antes da execução do RF09.
- **Backend (Raniel):** Endpoint `POST /projects/{id}/baseline` aceitando JSON conforme schema; validação contra schema; persistência reusando o modelo `Extraction` com `origem: manual`; endpoint `GET /baseline-status` retornando quais dos 5 projetos já têm gabarito.
- **Frontend (Bruno):** Componente de upload do arquivo JSON do gabarito por projeto; feedback de validação (sucesso ou erros de schema); indicador visual no portfólio mostrando "gabarito presente" / "gabarito ausente".
- **Prioridade:** Alta

### RF09 — Comparar extração automática vs. gabarito (critério híbrido)
- **US de origem:** US09
- **Descrição:** O sistema deve calcular precisão, recall, F1 e Cohen's Kappa comparando a extração automática com o gabarito manual, aplicando critério híbrido conforme o tipo de atributo.
- **Critérios de aceitação:**
  - Atributos `estruturado` (datas, valores, status, nomes próprios formais): comparação normalizada exata; cálculo binário de TP/FP/FN.
  - Atributos `texto_livre` (escopo, riscos, lições, etc.): rubrica humana 0 / 0,5 / 1 aplicada por dois avaliadores independentes.
  - Cohen's Kappa por atributo e agregado para o grupo `texto_livre`.
  - Métricas reportadas separadamente para os grupos `estruturado` e `texto_livre`, mais agregado total.
  - Tempo de extração registrado: manual (reportado pelos avaliadores) vs. automático (medido pelo sistema).
  - Visualização tabular dos resultados por projeto e consolidados.
- **Backend (Raniel):** Algoritmo híbrido — comparação normalizada exata para atributos `estruturado` (TP/FP/FN); persistência da rubrica 0/0,5/1 aplicada externamente para `texto_livre`; cálculo de precisão, recall, F1 por grupo e Cohen's Kappa para `texto_livre`; endpoint `POST /projects/{id}/rubric` para receber rubricas dos avaliadores; endpoint `GET /projects/{id}/evaluation` retornando resultados.
- **Frontend (Bruno):** UI dedicada para Cynthia/Moisés aplicarem a rubrica 0/0,5/1 atributo por atributo (lado-a-lado: gabarito × extração automática, com botões 0 / 0,5 / 1); tela de visualização tabular dos resultados com métricas por projeto e consolidadas, separadas por grupo.
- **Prioridade:** Alta

### RF10 — Coletar feedback qualitativo (Likert)
- **US de origem:** US10
- **Descrição:** O sistema deve permitir coletar e consolidar respostas de stakeholders dos projetos em escala Likert.
- **Critérios de aceitação:**
  - Formulário com 4 dimensões em escala 1–5: utilidade, clareza, completude, confiabilidade.
  - Identificação do projeto e do respondente (anonimato opcional).
  - Implementação mínima viável: Google Forms externo + import dos resultados.
  - Persistência das respostas e relatório agregado (médias por dimensão por projeto e geral).
- **Backend (Raniel):** Endpoint `POST /projects/{id}/likert-responses` para importar respostas (CSV ou JSON do Forms); endpoint `GET /likert-summary` retornando médias por dimensão por projeto e agregadas.
- **Frontend (Bruno):** Tela de upload do CSV exportado do Google Forms; relatório agregado (gráfico de barras simples) com médias por dimensão (utilidade, clareza, completude, confiabilidade), por projeto e consolidado.
- **Prioridade:** Alta

### RF11 — Exportar resultados consolidados
- **US de origem:** US11
- **Descrição:** O sistema deve gerar exportação dos dados de avaliação para alimentar o relato de experiência e o artigo.
- **Critérios de aceitação:**
  - Exportação em CSV ou JSON contendo: extrações, cobertura, precisão/recall/F1 por grupo, Kappa, respostas Likert.
  - Cabeçalhos compatíveis com importação em planilha.
- **Backend (Raniel):** Endpoint `GET /export?format=csv|json` que monta arquivo único com extrações, cobertura, métricas (precisão/recall/F1 por grupo, Kappa) e respostas Likert; cabeçalhos compatíveis com planilha (Excel, Google Sheets).
- **Frontend (Bruno):** Botão "Exportar resultados" em local visível (ex.: tela de avaliação) que dispara o download do arquivo; seletor de formato (CSV / JSON).
- **Prioridade:** Alta

---

## 3. Requisitos Não Funcionais (RNF)

### RNF01 — Performance da extração
- **Categoria:** Performance
- **Descrição:** O pipeline LLM deve processar um documento de tamanho médio (~10 páginas `.docx`) em tempo aceitável para o ciclo de uso da pesquisa.
- **Métrica verificável:** Tempo médio de extração ≤ 3 minutos por documento, medido sobre os 5 projetos do estudo de caso. Caso ultrapasse, otimizar prompt ou estratégia de chunking.
- **Prioridade:** Média

### RNF02 — Usabilidade
- **Categoria:** Usabilidade
- **Descrição:** Um pesquisador sem conhecimento prévio do sistema deve conseguir realizar o fluxo completo (cadastro → upload → consulta de extração → cobertura) sem treinamento, apenas seguindo a interface.
- **Métrica verificável:** Validação durante o Status Report 1 e 2; ajustes feitos se feedback dos avaliadores indicar dificuldade. Avaliação formal via dimensões "clareza" e "utilidade" do RF10.
- **Prioridade:** Média

### RNF03 — Manutenibilidade e organização
- **Categoria:** Manutenibilidade
- **Descrição:** Backend e frontend devem estar organizados em pastas separadas no repositório (`backend/` e `frontend/`); o schema da extração deve ser versionado; a estrutura deve ser legível para qualquer integrante do grupo.
- **Métrica verificável:** Novo integrante consegue clonar o repositório e rodar o ambiente local em < 30 minutos seguindo o README.
- **Prioridade:** Média

### RNF04 — Reprodutibilidade científica
- **Categoria:** Confiabilidade
- **Descrição:** Toda extração automática deve ser rastreável: a re-execução com os mesmos insumos (documento, prompt, modelo, parâmetros) deve produzir resultado equivalente, dentro da variabilidade esperada do LLM.
- **Métrica verificável:** Cada extração persistida registra a versão do prompt, identificador do modelo LLM, timestamp e parâmetros relevantes (ex.: temperatura).
- **Prioridade:** Alta

### RNF05 — Rastreabilidade de origem
- **Categoria:** Confiabilidade
- **Descrição:** Toda informação extraída automaticamente deve poder ser rastreada até o trecho do documento original que a justifica, permitindo auditoria humana.
- **Métrica verificável:** Para cada atributo preenchido na extração, o sistema persiste e exibe o trecho do documento de origem.
- **Prioridade:** Alta

### RNF06 — Ambiente de execução
- **Categoria:** Portabilidade
- **Descrição:** O sistema deve rodar localmente via Docker Compose, sem dependência de infraestrutura externa além da API do LLM contratada.
- **Métrica verificável:** `docker compose up` provisiona PostgreSQL + backend FastAPI; `npm run dev` levanta o frontend Vite; instruções no README do repositório.
- **Prioridade:** Alta

### RNF07 — Restrições de escopo declaradas
- **Categoria:** Restrição
- **Descrição:** O sistema NÃO implementa autenticação, autorização, multi-tenancy, deploy em produção, pipeline de CI/CD nem suíte automatizada de testes extensiva. Smoke tests pontuais para os fluxos críticos são aceitáveis.
- **Métrica verificável:** Restrição declarativa — nenhuma medida.
- **Prioridade:** Alta (declarativa)

---

## 4. Premissas

- O estudo de caso usa **5 projetos reais**: Freire Batista ADV, Valença Odontologia, Kaka JJ, Bem Viver Fitoterápicos, Dinoah ADV.
- Cada projeto possui um corpo documental fixo (sem versionamento incremental durante o estudo de caso).
- O **gabarito manual** é produzido na fase preparatória (semanas 7-9) por Cynthia e Moisés como avaliadores independentes.
- **Valença Odontologia** atua como projeto piloto para calibrar a rubrica de avaliação antes dos demais.
- A coleta Likert (RF10) depende de acesso aos stakeholders dos 5 projetos, mediado por Bruno; espera-se N entre 8 e 10 respondentes (~2 por projeto).

---

## 5. Fora de Escopo

Itens explicitamente **fora** deste documento (mantidos no backlog futuro):

- Atualização incremental de projetos, detecção de mudanças entre versões, versionamento de extrações.
- Modelo próprio de classificação e scoring de risco (PMBOK ou outro).
- Linha do tempo interativa de eventos.
- Indicadores avançados de portfólio (atrasos cruzados, projeções, etc.).
- Comparação cruzada entre projetos ou por domínio.
- Detecção automática de padrões, alertas, recomendações, insights agregados, resumo automático.
- Chat com IA / interação em linguagem natural.
- Extração de imagens/fotos (atributo do Quadro 37 não-textual).
- Autenticação, autorização, multi-tenancy, deploy em produção.
