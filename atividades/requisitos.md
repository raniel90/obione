# Requisitos — ObiOne (Observatório de Projetos para Consultorias)

ObiOne é um **observatório de projetos para consultorias** baseado no MPO — *Model for Projects Observatories* (Vieira, 2022) — potencializado por IA Generativa. Uma consultoria observa seu universo de clientes, projetos, temáticas e o conhecimento que emerge do conjunto; cada cliente acessa o próprio projeto e uma camada de conhecimento comum, em modelo de acesso semi-aberto.

A IA Generativa atua em três papéis: **extratora** (atributos do MPO a partir de `.docx`), **tradutora/redutora de fricção** (resumos para clientes, drafts para consultores) e **conectora** (síntese de conhecimento cross-projeto por temática). O Quadro 37 do MPO (44 atributos) é o **insumo** — a célula-projeto; o observatório é o agregado.

Este documento especifica **22 requisitos funcionais (RF01–RF22)** e **10 requisitos não funcionais (RNF01–RNF10)**. Cada requisito registra explicitamente sua **rastreabilidade com o MPO**. O histórico de decisões de escopo está em `pivot_observatorio_comunidade.md` (16/05/2026) e `refinamento_observatorio_consultorias.md` (28/05/2026).

---

## 1. Visão Geral

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Backend | Python 3 + FastAPI |
| Banco de dados | PostgreSQL |
| Comunicação | REST (JSON) |
| Autenticação | Email + senha + JWT (sem OAuth) |
| LLM | Local (Ollama) por padrão; provider plugável via configuração |
| Ambiente | Docker Compose local |

---

## 2. Índice dos Requisitos Funcionais

| ID | Título | Bloco | Prioridade |
|---|---|---|---|
| RF01 | Autenticar usuário | 1 | Must |
| RF02 | Gerenciar perfis e acesso semi-aberto | 1 | Must |
| RF03 | Cadastrar projeto | 1 | Must |
| RF04 | Fazer upload de documentos do projeto | 1 | Must |
| RF05 | Extrair atributos do MPO via LLM | 2 | Must |
| RF06 | Persistir extração estruturada | 2 | Must |
| RF07 | Visualizar portfólio de projetos (perfil-aware) | 3 | Must |
| RF08 | Visualizar detalhe do projeto | 3 | Must |
| RF09 | Calcular e exibir cobertura do MPO | 3 | Must |
| RF10 | Comentar no projeto | 4 | Must |
| RF11 | Visualizar feed in-app de novidades | 4 | Should |
| RF12 | Gerar Resumo do Projeto para o Cliente | 4 | Must |
| RF13 | Gerar drafts de "Próximos Passos / Pontos de Atenção" | 4 | Must |
| RF14 | Importar e validar gabarito manual | 5 | Must |
| RF15 | Comparar extração automática vs. gabarito | 5 | Must |
| RF16 | Coletar feedback Likert da consultoria | 5 | Must |
| RF17 | Coletar feedback Likert dos clientes | 5 | Must |
| RF18 | Exportar resultados consolidados | 5 | Should |
| RF19 | Categorizar projeto por temática/segmento | 6 | Must |
| RF20 | Visualizar cockpit de portfólio (comparação cross-projeto) | 6 | Must |
| RF21 | Gerar síntese cross-projeto por temática (Conectora) | 6 | Must |
| RF22 | Publicar conhecimento comum para o cliente | 6 | Should |

**Blocos:** 1 — Fundação técnica e ingestão · 2 — Pipeline LLM · 3 — Observação e visualização · 4 — Comunidade e IA-Assistente · 5 — Avaliação DSR · 6 — Observação de portfólio e conhecimento cross-projeto.

**Prioridade (MoSCoW):** *Must* — não-negociável para fechar o trabalho acadêmico; *Should* — importante, mas com fallback declarado se o prazo apertar.

---

## 3. Requisitos Funcionais

### Bloco 1 — Fundação técnica e ingestão

#### RF01 — Autenticar usuário
- **Descrição.** Permitir login no observatório com email + senha, mantendo a sessão via JWT.
- **Justificativa.** Sem autenticação, o modelo semi-aberto não é possível e a LGPD não é atendida.
- **Dependências.** —
- **Critérios de aceite.** Login e logout funcionais; tokens JWT; senha armazenada com hash (bcrypt).
- **Regras de negócio.** Sem cadastro público — contas criadas pela consultoria. Sem OAuth. Senha mínima de 8 caracteres.
- **Rastreabilidade MPO.** Característica **Segurança** (Vieira, 2022, p. 192).

#### RF02 — Gerenciar perfis e acesso semi-aberto
- **Descrição.** Garantir que cada usuário acessa apenas o que seu perfil permite. Perfis: Consultor (todos os projetos) e Cliente (apenas o projeto associado).
- **Justificativa.** Materializa a característica "Acesso semi-aberto" do MPO e é fundamental para a LGPD.
- **Dependências.** RF01.
- **Critérios de aceite.** Vínculo cliente↔projeto persistido; endpoints e telas filtram por perfil; acesso indevido retorna 403; a consultoria cria contas; cliente recebe convite com senha provisória.
- **Regras de negócio.** Um cliente vinculado a no máximo 1 projeto (MVP). Consultor acessa todos. Cliente A nunca acessa dados do Cliente B.
- **Rastreabilidade MPO.** Característica **Acesso semi-aberto** (p. 189) + agentes **Equipe de Gestão** e **Usuários do Observatório** (pp. 200-201).

#### RF03 — Cadastrar projeto
- **Descrição.** Permitir que o consultor cadastre um projeto informando nome, temática/domínio e descrição livre.
- **Justificativa.** Toda extração, visualização e interação ancora em um projeto cadastrado.
- **Dependências.** RF01.
- **Critérios de aceite.** Campos obrigatórios validados (nome, temática, descrição); ID único gerado automaticamente; listagem disponível.
- **Regras de negócio.** Temática/domínio limitada a enum (jurídico, saúde, esporte, branding, outros) — pode ser sugerida pela IA e confirmada pelo consultor (ver RF19). Apenas o perfil Consultor cria projetos.
- **Rastreabilidade MPO.** Infraestrutura habilitadora — sem mapeamento direto a um conceito do MPO.

#### RF04 — Fazer upload de documentos do projeto
- **Descrição.** Permitir anexar arquivos `.docx` a um projeto cadastrado, com suporte a múltiplos arquivos.
- **Justificativa.** Documentos são a fonte da extração do pipeline LLM.
- **Dependências.** RF01, RF02, RF03.
- **Critérios de aceite.** Suporte a `.docx`; múltiplos arquivos por projeto; persistência do arquivo bruto + metadados (nome, data, tamanho, hash).
- **Regras de negócio.** Tamanho máximo por arquivo definido; arquivos inválidos rejeitados com mensagem clara. Apenas o perfil Consultor faz upload.
- **Rastreabilidade MPO.** Processo **Coletar** (p. 195).

### Bloco 2 — Pipeline LLM

#### RF05 — Extrair atributos do MPO via LLM
- **Descrição.** Processar os documentos do projeto e extrair automaticamente os atributos previstos no Quadro 37 (terceira versão do MPO).
- **Justificativa.** Coração da contribuição técnica — o pipeline LLM que materializa o Trabalho Futuro #8 do MPO.
- **Dependências.** RF04, schema de extração e lista de atributos-alvo.
- **Critérios de aceite.** Saída JSON conforme schema; 8 categorias do Quadro 37 contempladas; valor + trecho de origem por atributo; atributos não encontrados como `null`; `fora_de_escopo` ignorados; versão do prompt e modelo registrados.
- **Regras de negócio.** Nunca inventar valor (alucinação) — preferir `null`. Sempre registrar versão do prompt e modelo.
- **Rastreabilidade MPO.** **Quadro 37 — Atributos relacionados aos projetos** (p. 264, 8 categorias) + processo **Transformar** (p. 196).

#### RF06 — Persistir extração estruturada
- **Descrição.** Salvar a extração JSON associada ao projeto e aos documentos de origem, com metadados de rastreabilidade.
- **Justificativa.** Sem persistência, não há comparação posterior nem auditoria humana.
- **Dependências.** RF05.
- **Critérios de aceite.** Cada extração registra projeto, documento(s), versão do prompt, modelo, timestamp e origem (`automatico` | `manual`); recuperável via API.
- **Regras de negócio.** Histórico de extrações preservado — nunca sobrescrever silenciosamente.
- **Rastreabilidade MPO.** Processo **Armazenar** (p. 196).

### Bloco 3 — Observação e visualização

#### RF07 — Visualizar portfólio de projetos (perfil-aware)
- **Descrição.** Apresentar visão consolidada de projetos, com status derivado e cobertura, restrita ao perfil Consultor.
- **Justificativa.** Permite ao consultor curar e priorizar o que precisa de atenção no observatório.
- **Dependências.** RF02, RF09.
- **Critérios de aceite.** Lista projetos com nome, temática, status derivado (`cadastrado` → `ingerido` → `extraído` → `avaliado`) e % de cobertura; filtro por temática.
- **Regras de negócio.** Cliente não acessa esta tela (é redirecionado ao seu detalhe — RF08). Status é derivado, nunca editado. A comparação cross-projeto agrupada por temática é a RF20; aqui é a lista perfil-aware.
- **Rastreabilidade MPO.** Característica **Abrangência** (p. 189) + processo **Disponibilizar** (p. 196).

#### RF08 — Visualizar detalhe do projeto
- **Descrição.** Exibir todos os atributos extraídos de um projeto, agrupados por categoria do Quadro 37, com trecho de origem.
- **Justificativa.** É onde o conhecimento do observatório se materializa: o consultor inspeciona, o cliente entende.
- **Dependências.** RF02, RF05/RF06.
- **Critérios de aceite.** Atributos das 8 categorias agrupados; preenchidos e vazios visíveis; valor + trecho de origem por atributo; acesso aos documentos originais.
- **Regras de negócio.** Cliente acessa apenas o seu projeto; consultor acessa todos. Acesso indevido retorna 403.
- **Rastreabilidade MPO.** Conteúdo **Projetos** (p. 186) + processo **Disponibilizar** (p. 196).

#### RF09 — Calcular e exibir cobertura do MPO
- **Descrição.** Calcular a cobertura (% de atributos preenchidos vs. total de atributos-alvo) por projeto e exibir matriz cruzada no portfólio.
- **Justificativa.** Indicador-chave da avaliação quantitativa — abrangência da extração frente ao MPO.
- **Dependências.** RF05.
- **Critérios de aceite.** % calculada por projeto; matriz projetos × atributos (tabela ou heatmap); destaque visual quando < 50%; sinalização saudável quando ≥ 80%.
- **Regras de negócio.** Atributos `fora_de_escopo` excluídos do denominador.
- **Rastreabilidade MPO.** Característica **Abrangência** (p. 189) + processo **Avaliar** (p. 198).

### Bloco 4 — Comunidade e IA-Assistente

#### RF10 — Comentar no projeto
- **Descrição.** Permitir que consultor e cliente daquele projeto comentem livremente, respondendo a comentários.
- **Justificativa.** Materializa a característica Interatividade e o processo Interagir do MPO. Sem comentários, não há comunidade — apenas dashboard.
- **Dependências.** RF02.
- **Critérios de aceite.** Thread por projeto; autor visível; resposta com 1 nível de aninhamento; edição/exclusão pelo próprio autor; consultor pode moderar.
- **Regras de negócio.** Cliente comenta apenas no seu projeto. Comentário não pode ser anônimo. Histórico preservado em soft-delete.
- **Rastreabilidade MPO.** Característica **Interatividade** (p. 191) + processo **Interagir** (p. 198) + conteúdo **Usuários e Interações** (p. 188).

#### RF11 — Visualizar feed in-app de novidades
- **Descrição.** Mostrar feed das novidades dos projetos do usuário: novo comentário, novo resumo, nova extração, novo draft publicado.
- **Justificativa.** Materializa o processo Acompanhar do MPO. Mantém a comunidade viva sem depender de email.
- **Dependências.** RF02, RF10, RF12, RF13.
- **Critérios de aceite.** Feed filtrado por perfil (cliente vê só o seu projeto; consultor vê todos); indicador de não-lido; navegação direta para o evento.
- **Regras de negócio.** Sem email externo — apenas in-app. Eventos antigos (> 30 dias) podem ser arquivados.
- **Rastreabilidade MPO.** Processo **Acompanhar** (p. 198).

#### RF12 — Gerar Resumo do Projeto para o Cliente
- **Descrição.** A IA Generativa lê a extração JSON do projeto e produz texto narrativo em linguagem acessível ao cliente.
- **Justificativa.** Papel de IA-tradutora — o cliente entende o que está sendo observado sem precisar ler JSON.
- **Dependências.** RF05/RF06.
- **Critérios de aceite.** Texto em linguagem cidadã cobrindo objetivos, escopo, status e riscos relevantes; sempre revisável pelo consultor antes de publicar; versão do prompt + modelo registrados.
- **Regras de negócio.** Cliente nunca vê resumo não-revisado. O resumo publicado vira "current"; histórico preservado.
- **Rastreabilidade MPO.** Processo **Comunicar** (p. 197) + característica **Usabilidade** (p. 192).

#### RF13 — Gerar drafts de "Próximos Passos / Pontos de Atenção"
- **Descrição.** A IA propõe rascunhos de próximos passos e pontos de atenção a partir da extração + comentários recentes; o consultor revisa antes de publicar.
- **Justificativa.** Papel de IA-redutora-de-fricção — reduz o trabalho do consultor de manter o observatório informativo.
- **Dependências.** RF05/RF06, RF10.
- **Critérios de aceite.** Drafts gerados a partir da extração + comentários; consultor edita antes de publicar; rascunhos não aparecem para o cliente; versão do prompt + modelo registrados.
- **Regras de negócio.** Consultor sempre revisa antes de publicar — sem publicação automática. Histórico preservado.
- **Rastreabilidade MPO.** Processos **Transformar** + **Comunicar** + **Categorizar/Classificar** (pp. 196-197) + motivação **Tomada de Decisão** (p. 203).

### Bloco 5 — Avaliação DSR

#### RF14 — Importar e validar gabarito manual
- **Descrição.** Carregar os gabaritos manuais produzidos na fase preparatória (3 projetos) e validá-los contra o schema.
- **Justificativa.** Sem gabarito, não há baseline para precisão/recall/F1.
- **Dependências.** Gabaritos produzidos, RF05/RF06.
- **Critérios de aceite.** Carga via arquivo JSON; validação contra o schema; persistência com `origem: manual`; integridade verificada antes da RF15.
- **Regras de negócio.** Apenas 3 projetos (Valença piloto + Freire Batista + Kaka JJ). Bem Viver e Dinoah avaliados apenas por cobertura + Likert.
- **Rastreabilidade MPO.** Infraestrutura de avaliação DSR — sem mapeamento direto.

#### RF15 — Comparar extração automática vs. gabarito (critério híbrido)
- **Descrição.** Calcular precisão, recall, F1 e índice de concordância comparando a extração automática com o gabarito manual, com critério híbrido por tipo de atributo.
- **Justificativa.** Essência da avaliação quantitativa do DSR.
- **Dependências.** RF14, RF05.
- **Critérios de aceite.** Atributos `estruturado` por comparação normalizada exata (TP/FP/FN); atributos `texto_livre` por rubrica 0/0,5/1 aplicada por dois avaliadores; concordância por atributo e agregada; métricas por grupo + total; tempo manual vs. automático registrado; visualização tabular.
- **Regras de negócio.** Atributos com baixa concordância sinalizados como limitação. Métricas calculadas apenas nos 3 projetos com gabarito.
- **Rastreabilidade MPO.** Processo **Avaliar** (p. 198).

#### RF16 — Coletar feedback Likert da consultoria
- **Descrição.** Registrar a percepção da equipe da consultoria sobre a assistência da IA e o valor do observatório.
- **Justificativa.** Metade da avaliação qualitativa do DSR — valida a hipótese de que a IA reduz a fricção e agrega valor de decisão.
- **Dependências.** RF12, RF13, RF20, RF21.
- **Critérios de aceite.** Formulário em escala 1-5 cobrindo: utilidade dos drafts, redução de fricção, qualidade do resumo gerado, manutenibilidade do papel de mediador, valor do conhecimento de portfólio para decisão (RF20) e qualidade das sínteses / esforço de curadoria (RF21); N esperado ~4 (toda a equipe); persistência + relatório agregado.
- **Regras de negócio.** Aplicado após a equipe ter usado o sistema com os projetos do estudo.
- **Rastreabilidade MPO.** Agente **Equipe de Gestão e Desenvolvimento do Observatório** (p. 201) + motivações **Conhecimento** e **Engajamento** (p. 204).

#### RF17 — Coletar feedback Likert dos clientes
- **Descrição.** Registrar a percepção dos clientes finais sobre clareza, utilidade, diálogo, inclusão e conhecimento comum.
- **Justificativa.** Metade da avaliação qualitativa do DSR — valida a hipótese do lado do cliente.
- **Dependências.** RF12, RF10, RF11, RF22.
- **Critérios de aceite.** Formulário em escala 1-5 cobrindo: clareza do resumo, utilidade do espaço, qualidade do diálogo, sentido de inclusão, valor do conhecimento comum (RF22) e transparência; identificação do projeto (respondente anônimo opcional); N esperado 5-10.
- **Regras de negócio.** Aplicado após pelo menos 2 semanas de uso pelos clientes.
- **Rastreabilidade MPO.** Agentes **Partes Interessadas dos Projetos** + **Usuários do Observatório** (pp. 200-201) + motivações **Engajamento** e **Conhecimento** (p. 204) + característica **Interatividade** (p. 191).

#### RF18 — Exportar resultados consolidados
- **Descrição.** Gerar exportação única (CSV/JSON) com todos os dados de avaliação para alimentar o relato e o artigo.
- **Justificativa.** Sem exportação, a escrita do relato fica refém de queries manuais.
- **Dependências.** RF15, RF16, RF17, RF09.
- **Critérios de aceite.** Arquivo único com extrações, cobertura, métricas (precisão/recall/F1/concordância) por grupo, respostas Likert (consultoria + clientes) e métricas de engajamento (nº de comentários, nº de drafts publicados).
- **Regras de negócio.** Cabeçalhos compatíveis com planilha (Excel, Google Sheets).
- **Rastreabilidade MPO.** Infraestrutura de avaliação — sem mapeamento direto.

### Bloco 6 — Observação de Portfólio e Conhecimento Cross-Projeto

O observatório deixa de tratar cada projeto isoladamente e passa a observar o **portfólio cross-cliente** — agrupando por temática, comparando indicadores e produzindo conhecimento que emerge do conjunto. Ativa os conceitos do MPO antes ausentes: *Conteúdo→Temáticas*, *Categorizar*, **Combinar**, *Visualizar/Acompanhar*.

#### RF19 — Categorizar projeto por temática/segmento
- **Descrição.** Atribuir a cada projeto uma temática/segmento (jurídico, saúde, esporte, branding, …). A IA infere a partir da extração + descrição; o consultor revisa e confirma.
- **Justificativa.** A temática é a base de todo agrupamento cross-cliente. Materializa o conteúdo "Temáticas dos Projetos" do MPO, ausente até aqui.
- **Dependências.** RF03, RF05/RF06.
- **Critérios de aceite.** A IA sugere a temática; o consultor aceita ou sobrescreve; temática persistida e exibida no portfólio; projetos agrupáveis por temática.
- **Regras de negócio.** A categorização da IA é sempre uma sugestão — o consultor confirma. A temática é o mesmo campo que o `domínio` do RF03 (mesmo enum, termo do MPO), agora assistido por IA. Um projeto tem exatamente uma temática no MVP.
- **Rastreabilidade MPO.** Conteúdo **Temáticas dos Projetos** (p. 188) + processo **Categorizar/Classificar** (p. 197).

#### RF20 — Visualizar cockpit de portfólio (comparação cross-projeto)
- **Descrição.** Apresentar à consultoria uma visão agregada e comparável do portfólio: indicadores cross-projeto (status, porte, risco, % cobertura, evolução) agrupáveis por temática.
- **Justificativa.** É o que dá "cara de observatório" à consultoria — observar o conjunto, não fichas isoladas. Materializa os processos Visualizar/Acompanhar do MPO, presentes nos casos reais da tese.
- **Dependências.** RF02 (consultoria apenas), RF09, RF19.
- **Critérios de aceite.** Indicadores agregados por temática e no total; comparação lado-a-lado de projetos (status, porte, risco, cobertura); filtro por temática; cliente não acessa o cockpit.
- **Regras de negócio.** O cockpit é um read-model — apenas agrega dados já existentes, sem duplicá-los. Exclusivo do perfil Consultor.
- **Rastreabilidade MPO.** Processos **Acompanhar** e **Avaliar** (p. 198) + característica **Abrangência** (p. 189) + conceito **Visualizar** (Farias Júnior et al., 2025).

#### RF21 — Gerar síntese cross-projeto por temática (Conectora)
- **Descrição.** A IA lê o conjunto de projetos de uma temática e produz um rascunho de síntese de portfólio — padrões recorrentes, riscos comuns, lições e boas práticas. O consultor revisa/edita e publica.
- **Justificativa.** Coração da contribuição de pesquisa do refinamento — IA Generativa produzindo conhecimento de portfólio (processo Combinar do MPO), não só extraindo atributos.
- **Dependências.** RF19, RF05/RF06.
- **Critérios de aceite.** Rascunho de síntese por temática a partir das extrações dos projetos daquela temática; consultor edita antes de publicar; rascunho não publicado não é visível ao cliente; versão do prompt + modelo registrados; síntese só gerada quando a temática tem ≥ 2 projetos.
- **Regras de negócio.** Consultor sempre revisa antes de publicar — sem publicação automática. A IA recebe dados anonimizados/agregados; nunca expõe atributo cru identificável de cliente específico (ver RNF10). Histórico preservado.
- **Rastreabilidade MPO.** Processo **Combinar** (p. 198) + processos **Transformar** (p. 196) e **Categorizar/Classificar** (p. 197) + motivação **Conhecimento** (p. 204).

#### RF22 — Publicar conhecimento comum para o cliente
- **Descrição.** Expor ao cliente as sínteses publicadas da(s) sua(s) temática(s) como uma camada de conhecimento comum — padrões e boas práticas agregados do segmento, sem dados crus de outros clientes.
- **Justificativa.** Dá ao cliente o "espaço de outros membros" que caracteriza um observatório, respeitando o acesso semi-aberto.
- **Dependências.** RF21, RF02.
- **Critérios de aceite.** Cliente vê as sínteses publicadas da sua temática; não vê rascunhos nem dados de outros clientes; conteúdo escopado por temática.
- **Regras de negócio.** Apenas sínteses publicadas e sanitizadas (RNF10) chegam ao cliente. Cliente nunca acessa o cockpit (RF20) nem extrações de terceiros.
- **Rastreabilidade MPO.** Processos **Comunicar** (p. 197) e **Disponibilizar** (p. 196) + características **Acesso semi-aberto** e **Rede de Colaboração** (p. 189).

---

## 4. Requisitos Não Funcionais

#### RNF01 — Performance da extração
- **Categoria.** Performance.
- **Descrição.** O pipeline LLM deve processar um documento `.docx` de tamanho médio (~10 páginas) em tempo aceitável para o ciclo de uso da pesquisa.
- **Critérios de aceite.** Tempo médio ≤ 3 minutos por documento, medido sobre os projetos do estudo.
- **Rastreabilidade MPO.** Qualidade técnica do pipeline — sem mapeamento direto.

#### RNF02 — Usabilidade
- **Categoria.** Usabilidade.
- **Descrição.** Um cliente sem conhecimento técnico deve conseguir acessar seu projeto, ler o resumo, comentar e navegar pelo feed sem treinamento.
- **Critérios de aceite.** Avaliado via dimensões "clareza do resumo" e "utilidade do espaço" do Likert dos clientes (RF17).
- **Rastreabilidade MPO.** Característica **Usabilidade** (p. 192).

#### RNF03 — Manutenibilidade e organização
- **Categoria.** Manutenibilidade.
- **Descrição.** Backend e frontend em pastas separadas; schema versionado; arquitetura organizada por contextos (ports & adapters para LLM e storage); estrutura legível para qualquer integrante.
- **Critérios de aceite.** Um novo integrante clona e roda o ambiente local em < 30 minutos seguindo o README.
- **Rastreabilidade MPO.** Qualidade interna de engenharia — sem mapeamento direto.

#### RNF04 — Reprodutibilidade científica
- **Categoria.** Confiabilidade.
- **Descrição.** Toda saída de IA registra versão do prompt, identificador do modelo, timestamp e parâmetros relevantes.
- **Critérios de aceite.** Cada extração, resumo, draft e síntese carrega versão do prompt + modelo + timestamp + parâmetros.
- **Regras de negócio.** Mudança de prompt incrementa a versão registrada.
- **Rastreabilidade MPO.** Qualidade de método científico — aplicado a RF05, RF12, RF13 e RF21.

#### RNF05 — Rastreabilidade de origem
- **Categoria.** Confiabilidade.
- **Descrição.** Toda informação extraída automaticamente carrega o trecho do documento original que a justifica.
- **Critérios de aceite.** Para cada atributo preenchido, o sistema persiste e exibe o trecho de origem.
- **Regras de negócio.** Se a IA não conseguir identificar trecho, o atributo deve ficar `null`.
- **Rastreabilidade MPO.** Processo **Tratar** (p. 195).

#### RNF06 — Ambiente de execução local
- **Categoria.** Portabilidade.
- **Descrição.** O sistema roda localmente via Docker Compose, sem dependência de infraestrutura externa além do LLM.
- **Critérios de aceite.** `docker compose up` provisiona PostgreSQL + backend; o frontend sobe localmente; instruções no README.
- **Rastreabilidade MPO.** Conceito de **Infraestrutura de TI** (p. 192).

#### RNF07 — Restrições de escopo declaradas
- **Categoria.** Restrição.
- **Descrição.** O sistema não implementa OAuth, multi-tenancy nem deploy em produção.
- **Rastreabilidade MPO.** Delimitação de escopo do artefato acadêmico.

#### RNF08 — Conformidade LGPD
- **Categoria.** Segurança / Compliance.
- **Descrição.** Dados de marketing dos clientes em formato semi-aberto exigem medidas mínimas de proteção e consentimento.
- **Critérios de aceite.** NDA com clientes participantes; consentimento explícito para uso anonimizado dos resultados; isolamento por perfil (RF02); criptografia em trânsito; logs de acesso ao observatório.
- **Regras de negócio.** Cliente A nunca acessa dados do Cliente B. Estendido pelo RNF10 para a camada de conhecimento cross-cliente.
- **Rastreabilidade MPO.** Característica **Segurança** (p. 192) — menciona explicitamente política aderente à LGPD.

#### RNF09 — Controle de custo de LLM
- **Categoria.** Operacional.
- **Descrição.** As chamadas de IA por projeto (extração + resumo + drafts + síntese) ampliam o custo de tokens; o sistema deve permitir controle e visibilidade.
- **Critérios de aceite.** Cada chamada LLM registra tokens consumidos (entrada + saída) e custo estimado; relatório agregado por projeto e total.
- **Regras de negócio.** LLM local (Ollama) como padrão; caching de extrações idênticas (mesmo documento + mesma versão de prompt não re-roda).
- **Rastreabilidade MPO.** Característica **Sustentabilidade** (p. 190).

#### RNF10 — Isolamento entre clientes e anonimização no conhecimento comum
- **Categoria.** Segurança / Compliance.
- **Descrição.** O conhecimento cross-projeto exposto a clientes deve ser agregado e anonimizado — nenhum atributo cru re-identificável de um cliente pode aparecer para outro.
- **Justificativa.** O estudo tem dois clientes do mesmo segmento (Freire Batista e Dinoah, ambos jurídico); sem isolamento, a síntese poderia vazar dados de um para o outro, violando a LGPD e o NDA.
- **Critérios de aceite.** Síntese publicada sem nome, valor ou trecho atribuível a um cliente específico; gate de revisão do consultor obrigatório; síntese só gerada com ≥ 2 projetos na temática; rubrica de avaliação inclui "ausência de vazamento cross-cliente".
- **Regras de negócio.** Cliente A nunca infere dados do Cliente B a partir do conhecimento comum. Complementa o RNF08.
- **Rastreabilidade MPO.** Características **Segurança** (p. 192) e **Acesso semi-aberto** (p. 189).

---

## 5. Premissas

- O estudo de caso usa **5 projetos reais** de uma consultoria de marketing e estratégia, atendendo clientes em segmentos distintos (jurídico, saúde, esporte, branding).
- **Gabarito manual produzido em 3 projetos** (Valença piloto + Freire Batista + Kaka JJ); os demais são avaliados por cobertura + Likert.
- A coleta Likert depende de acesso aos stakeholders dos projetos. N esperado: ~4 (consultoria) + ~5-10 (clientes).
- Valença Odontologia atua como projeto piloto para calibrar a rubrica de avaliação.
- A empresa que forneceu os documentos `.docx` é referenciada apenas como "consultoria" — sem nominação no relato.

---

## 6. Fora de Escopo

- Atualização incremental, detecção de mudanças e versionamento de extrações.
- Modelo próprio de classificação de risco (PMBOK).
- Linha do tempo interativa.
- Alertas automáticos e recomendações proativas (a *síntese* de padrões cross-projeto entra via RF21; alertas/recomendações disparados pelo sistema ficam fora).
- Chat com IA.
- Notificações por email externo (substituídas pelo feed in-app — RF11).
- Extração de imagens/fotos dos documentos.
- OAuth, multi-tenancy e deploy em produção.
- Cliente acessar dados crus de outros clientes (vedado pelo RNF10 — apenas conhecimento agregado e sanitizado via RF22).

---

## 7. Referências

- VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese (Doutorado) — CIn/UFPE, Recife, 2022. (MPO; Quadro 37, p. 264.)
- FARIAS JÚNIOR, I. H.; VIEIRA, J. K. M.; PERRELLI DE MOURA, H.; SAMPAIO, S. **A Conceptual Model for Project Observatories**. IEEE Access, v. 13, 2025.
- Decisões de escopo: `pivot_observatorio_comunidade.md` (16/05/2026) e `refinamento_observatorio_consultorias.md` (28/05/2026).
