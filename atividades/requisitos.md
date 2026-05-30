# Requisitos do ObiOne (Observatório de Projetos para Consultorias)

ObiOne é um **observatório de projetos para consultorias** baseado no MPO, *Model for Projects Observatories* (Vieira, 2022), potencializado por IA Generativa. Uma consultoria observa seu universo de clientes, projetos e temáticas; cada cliente acessa o próprio projeto, em modelo de acesso semi-aberto governado por **Content-Based Access Control (CBAC)**.

A IA Generativa atua sobre o texto descritivo de cada projeto em três papéis complementares: (i) **extratora** dos 44 atributos do Quadro 37; (ii) **categorizadora**, sugerindo a temática/segmento ao consultor; (iii) **assistente** do consultor, propondo rascunhos de próximos passos e pontos de atenção. O Quadro 37 do MPO é o insumo, a célula-projeto. O CBAC garante que o cliente veja apenas o que o consultor liberou.

Esta versão (29/05/2026) revisa a versão anterior (28/05): a fonte da extração passa a ser um campo `description` no payload de criação do projeto (sem upload de `.docx`); o gate de "consultor revisa e publica resumo/síntese" é substituído por CBAC ancorado nos atributos do MPO; saem do escopo o Resumo do Cliente, a Conectora (síntese cross-projeto) e a camada de conhecimento comum publicada. Sobrevivem a categorização assistida por IA e o cockpit cross-cliente da consultoria.

Este documento especifica **19 requisitos funcionais** e **10 requisitos não funcionais**. Cada requisito registra explicitamente sua **rastreabilidade com o MPO**. Os IDs são preservados em relação à versão anterior (com gaps onde houve remoção) para manter rastreabilidade.

---

## 1. Índice dos Requisitos Funcionais

| ID | Título | Bloco | Prioridade |
|---|---|---|---|
| RF01 | Autenticar usuário | 1 | Must |
| RF02 | Gerenciar perfis e acesso semi-aberto | 1 | Must |
| RF03 | Cadastrar projeto (com descrição textual) | 1 | Must |
| RF05 | Extrair atributos do MPO via LLM | 2 | Must |
| RF06 | Persistir extração estruturada | 2 | Must |
| RF07 | Visualizar portfólio de projetos (perfil-aware) | 3 | Must |
| RF08 | Visualizar detalhe do projeto | 3 | Must |
| RF09 | Calcular e exibir cobertura do MPO | 3 | Must |
| RF10 | Comentar no projeto | 4 | Must |
| RF11 | Visualizar feed in-app de novidades | 4 | Should |
| RF13 | Gerar drafts de "Próximos Passos / Pontos de Atenção" | 4 | Must |
| RF14 | Importar e validar gabarito manual | 5 | Must |
| RF15 | Comparar extração automática vs. gabarito | 5 | Must |
| RF16 | Coletar feedback Likert da consultoria | 5 | Must |
| RF17 | Coletar feedback Likert dos clientes | 5 | Must |
| RF18 | Exportar resultados consolidados | 5 | Should |
| RF19 | Categorizar projeto por temática/segmento | 6 | Must |
| RF20 | Visualizar cockpit de portfólio (comparação cross-projeto) | 6 | Must |
| RF23 | Configurar visibilidade do projeto via CBAC | 7 | Must |

**Blocos:** (1) Fundação técnica e ingestão · (2) Pipeline LLM · (3) Observação e visualização · (4) Comunidade e assistente do consultor · (5) Avaliação DSR · (6) Observação cross-cliente · (7) Governança de visibilidade.

**Removidos em relação à versão de 28/05:** RF04 (upload de `.docx` — substituído pelo campo `description` no RF03); RF12 (Resumo do Cliente — substituído pela ficha de atributos liberados via CBAC); RF21 (Conectora — síntese cross-projeto); RF22 (Conhecimento Comum publicado ao cliente).

**Prioridade (MoSCoW):** *Must*: não-negociável para fechar o trabalho acadêmico; *Should*: importante, mas com fallback declarado se o prazo apertar.

---

## 2. Requisitos Funcionais

### Bloco 1: Fundação técnica e ingestão

#### RF01: Autenticar usuário
- **Descrição.** Permitir login no observatório com email + senha, mantendo a sessão via JWT.
- **Justificativa.** Sem autenticação, o modelo semi-aberto não é possível e a LGPD não é atendida.
- **Dependências.** Nenhuma.
- **Critérios de aceite.** Login e logout funcionais; tokens JWT; senha armazenada com hash (bcrypt).
- **Regras de negócio.** Sem cadastro público; contas criadas pela consultoria. Sem OAuth. Senha mínima de 8 caracteres.
- **Rastreabilidade MPO.** Característica **Segurança** (Vieira, 2022, p. 192).

#### RF02: Gerenciar perfis e acesso semi-aberto
- **Descrição.** Garantir que cada usuário acessa apenas o que seu perfil permite. Perfis: Consultor (todos os projetos) e Cliente (apenas o projeto associado, e apenas os atributos liberados pelo CBAC).
- **Justificativa.** Materializa a característica "Acesso semi-aberto" do MPO, agora operacionalizada por CBAC (ver RF23), e é fundamental para a LGPD.
- **Dependências.** RF01.
- **Critérios de aceite.** Vínculo cliente↔projeto persistido; endpoints e telas filtram por perfil; o filtro de visibilidade interno aplica-se aos atributos da extração antes de devolver ao cliente; acesso indevido retorna 403; a consultoria cria contas; cliente recebe convite com senha provisória.
- **Regras de negócio.** Um cliente vinculado a no máximo 1 projeto (MVP). Consultor acessa todos. Cliente A nunca acessa dados do Cliente B. O cliente nunca vê atributos do seu projeto que o consultor não tenha liberado via RF23.
- **Rastreabilidade MPO.** Característica **Acesso semi-aberto** (p. 189) + agentes **Equipe de Gestão** e **Usuários do Observatório** (pp. 200-201).

#### RF03: Cadastrar projeto (com descrição textual)
- **Descrição.** Permitir que o consultor cadastre um projeto informando nome, temática/domínio e uma **descrição textual longa** (`description`) que carrega o conteúdo bruto a ser processado pela IA.
- **Justificativa.** Toda extração, visualização e interação ancora em um projeto cadastrado. O campo `description` substitui o upload de `.docx` da versão anterior, simplificando ingestão e atendendo casos em que o consultor recebe o material em formatos diversos (texto colado, email, ata).
- **Dependências.** RF01.
- **Critérios de aceite.** Campos obrigatórios validados (nome, temática, descrição com tamanho mínimo); ID único gerado automaticamente; listagem disponível; descrição editável via PATCH (consultor pode disparar nova extração após editar).
- **Regras de negócio.** Temática/domínio limitada a enum (jurídico, saúde, esporte, branding, doceria, outros); pode ser sugerida pela IA e confirmada pelo consultor (ver RF19). Apenas o perfil Consultor cria projetos. Editar a `description` não re-extrai automaticamente; o consultor dispara explicitamente.
- **Rastreabilidade MPO.** Processo **Coletar** (p. 195) — agora aplicado a um campo textual no payload em vez de arquivo anexado.

### Bloco 2: Pipeline LLM

#### RF05: Extrair atributos do MPO via LLM
- **Descrição.** Processar o texto da `description` do projeto e extrair automaticamente os atributos previstos no Quadro 37 (terceira versão do MPO).
- **Justificativa.** Coração da contribuição técnica: o pipeline LLM que materializa o Trabalho Futuro #8 do MPO.
- **Dependências.** RF03, schema de extração e lista de atributos-alvo.
- **Critérios de aceite.** Saída JSON conforme schema; 8 categorias do Quadro 37 contempladas; valor + trecho de origem por atributo; atributos não encontrados como `null`; `fora_de_escopo` ignorados; versão do prompt, modelo e *hash* da `description` usada como insumo registrados.
- **Regras de negócio.** Nunca inventar valor (alucinação); preferir `null`. Sempre registrar versão do prompt, modelo e o hash da descrição-fonte (para detectar drift quando a `description` for editada).
- **Rastreabilidade MPO.** **Quadro 37: Atributos relacionados aos projetos** (p. 264, 8 categorias) + processo **Transformar** (p. 196).

#### RF06: Persistir extração estruturada
- **Descrição.** Salvar a extração JSON associada ao projeto, com metadados de rastreabilidade.
- **Justificativa.** Sem persistência, não há comparação posterior nem auditoria humana.
- **Dependências.** RF05.
- **Critérios de aceite.** Cada extração registra projeto, versão do prompt, modelo, timestamp, *hash* da descrição-fonte e origem (`automatico` | `manual`); recuperável via API.
- **Regras de negócio.** Histórico de extrações preservado; nunca sobrescrever silenciosamente.
- **Rastreabilidade MPO.** Processo **Armazenar** (p. 196).

### Bloco 3: Observação e visualização

#### RF07: Visualizar portfólio de projetos (perfil-aware)
- **Descrição.** Apresentar visão consolidada de projetos, com status derivado e cobertura, restrita ao perfil Consultor.
- **Justificativa.** Permite ao consultor curar e priorizar o que precisa de atenção no observatório.
- **Dependências.** RF02, RF09.
- **Critérios de aceite.** Lista projetos com nome, temática, status derivado (`cadastrado` → `extraído` → `avaliado`) e % de cobertura; filtro por temática.
- **Regras de negócio.** Cliente não acessa esta tela (é redirecionado ao seu detalhe, RF08). Status é derivado, nunca editado. A comparação cross-projeto agrupada por temática é a RF20; aqui é a lista perfil-aware.
- **Rastreabilidade MPO.** Característica **Abrangência** (p. 189) + processo **Disponibilizar** (p. 196).

#### RF08: Visualizar detalhe do projeto
- **Descrição.** Exibir os atributos extraídos de um projeto, agrupados por categoria do Quadro 37, com trecho de origem. Para o cliente, devolve apenas os atributos liberados pelo CBAC (RF23); para consultor/admin, devolve todos.
- **Justificativa.** É onde o conhecimento do observatório se materializa: o consultor inspeciona o todo, o cliente vê apenas o que foi explicitamente liberado.
- **Dependências.** RF02, RF05/RF06, RF23.
- **Critérios de aceite.** Atributos das 8 categorias agrupados; preenchidos e vazios visíveis (para o consultor); valor + trecho de origem por atributo; cliente recebe apenas os atributos com flag de visibilidade `true` no momento da consulta; atributos ocultos não aparecem na resposta da API (não há placeholder revelando estrutura).
- **Regras de negócio.** Cliente acessa apenas o seu projeto; consultor acessa todos. Acesso indevido retorna 403. O filtro CBAC é aplicado no service layer antes de qualquer serialização.
- **Rastreabilidade MPO.** Conteúdo **Projetos** (p. 186) + processo **Disponibilizar** (p. 196) + característica **Acesso semi-aberto** (p. 189).

#### RF09: Calcular e exibir cobertura do MPO
- **Descrição.** Calcular a cobertura (% de atributos preenchidos vs. total de atributos-alvo) por projeto e exibir matriz cruzada no portfólio. Para o cliente, o denominador é restrito aos atributos liberados via CBAC.
- **Justificativa.** Indicador-chave da avaliação quantitativa: abrangência da extração frente ao MPO. Para o cliente, o cálculo restrito evita inferência sobre o que está oculto.
- **Dependências.** RF05, RF23.
- **Critérios de aceite.** Para consultor/admin: % calculada sobre os 44 atributos in_scope; matriz projetos × atributos; destaque visual quando < 50%; sinalização saudável quando ≥ 80%. Para cliente: denominador = atributos liberados; numerador = preenchidos entre os liberados.
- **Regras de negócio.** Atributos `fora_de_escopo` excluídos do denominador. Atributos ocultos do cliente também são excluídos do denominador para o cliente.
- **Rastreabilidade MPO.** Característica **Abrangência** (p. 189) + processo **Avaliar** (p. 198).

### Bloco 4: Comunidade e assistente do consultor

#### RF10: Comentar no projeto
- **Descrição.** Permitir que consultor e cliente daquele projeto comentem livremente, respondendo a comentários.
- **Justificativa.** Materializa a característica Interatividade e o processo Interagir do MPO. Sem comentários, não há comunidade, apenas dashboard.
- **Dependências.** RF02.
- **Critérios de aceite.** Thread por projeto; autor visível; resposta com 1 nível de aninhamento; edição/exclusão pelo próprio autor; consultor pode moderar.
- **Regras de negócio.** Cliente comenta apenas no seu projeto. Comentário não pode ser anônimo. Histórico preservado em soft-delete.
- **Rastreabilidade MPO.** Característica **Interatividade** (p. 191) + processo **Interagir** (p. 198) + conteúdo **Usuários e Interações** (p. 188).

#### RF11: Visualizar feed in-app de novidades
- **Descrição.** Mostrar feed das novidades do projeto: novo comentário, nova extração, novo draft publicado. Para o cliente, eventos relativos a atributos não liberados pelo CBAC são suprimidos.
- **Justificativa.** Materializa o processo Acompanhar do MPO. Mantém a comunidade viva sem depender de email.
- **Dependências.** RF02, RF10, RF13, RF23.
- **Critérios de aceite.** Feed filtrado por perfil; indicador de não-lido; navegação direta para o evento; para o cliente, eventos do tipo "atributo atualizado" só aparecem se o atributo estava liberado no momento do envio.
- **Regras de negócio.** Sem email externo, apenas in-app. Eventos antigos (> 30 dias) podem ser arquivados. Mudança posterior do CBAC não retro-filtra eventos já entregues (decisão consciente do MVP).
- **Rastreabilidade MPO.** Processo **Acompanhar** (p. 198).

#### RF13: Gerar drafts de "Próximos Passos / Pontos de Atenção"
- **Descrição.** A IA propõe rascunhos de próximos passos e pontos de atenção a partir da extração + comentários recentes; o consultor revisa e mantém os drafts como ferramenta interna de decisão.
- **Justificativa.** Papel de IA-assistente: reduz o trabalho do consultor de extrair conclusões da extração.
- **Dependências.** RF05/RF06, RF10.
- **Critérios de aceite.** Drafts gerados a partir da extração + comentários; consultor edita; drafts não são expostos ao cliente em nenhuma circunstância; versão do prompt + modelo registrados.
- **Regras de negócio.** Recurso exclusivo do consultor; nunca aparece ao cliente. Histórico preservado.
- **Rastreabilidade MPO.** Processos **Transformar** + **Categorizar/Classificar** (pp. 196-197) + motivação **Tomada de Decisão** (p. 203).

### Bloco 5: Avaliação DSR

#### RF14: Importar e validar gabarito manual
- **Descrição.** Carregar os gabaritos manuais produzidos na fase preparatória (3 projetos) e validá-los contra o schema.
- **Justificativa.** Sem gabarito, não há baseline para precisão/recall/F1.
- **Dependências.** Gabaritos produzidos, RF05/RF06.
- **Critérios de aceite.** Carga via arquivo JSON; validação contra o schema; persistência com `origem: manual`; integridade verificada antes da RF15.
- **Regras de negócio.** Apenas 3 projetos têm gabarito; os demais são avaliados por cobertura + Likert.
- **Rastreabilidade MPO.** Infraestrutura de avaliação DSR, sem mapeamento direto.

#### RF15: Comparar extração automática vs. gabarito (critério híbrido)
- **Descrição.** Calcular precisão, recall, F1 e índice de concordância comparando a extração automática com o gabarito manual, com critério híbrido por tipo de atributo.
- **Justificativa.** Essência da avaliação quantitativa do DSR.
- **Dependências.** RF14, RF05.
- **Critérios de aceite.** Atributos `estruturado` por comparação normalizada exata (TP/FP/FN); atributos `texto_livre` por rubrica 0/0,5/1 aplicada por dois avaliadores; concordância por atributo e agregada; métricas por grupo + total; tempo manual vs. automático registrado; visualização tabular.
- **Regras de negócio.** Atributos com baixa concordância sinalizados como limitação. Métricas calculadas apenas nos 3 projetos com gabarito.
- **Rastreabilidade MPO.** Processo **Avaliar** (p. 198).

#### RF16: Coletar feedback Likert da consultoria
- **Descrição.** Registrar a percepção da equipe da consultoria sobre a assistência da IA, a governança via CBAC e o valor do observatório.
- **Justificativa.** Metade da avaliação qualitativa do DSR: valida a hipótese de que a IA reduz a fricção do consultor e que o CBAC viabiliza acesso semi-aberto na prática.
- **Dependências.** RF13, RF20, RF23.
- **Critérios de aceite.** Formulário em escala 1-5 cobrindo: utilidade dos drafts (RF13), redução de fricção, manutenibilidade do papel de mediador, valor do cockpit cross-cliente para decisão (RF20) e usabilidade/confiança na governança CBAC (RF23); N esperado ~4 (toda a equipe); persistência + relatório agregado.
- **Regras de negócio.** Aplicado após a equipe ter usado o sistema com os projetos do estudo.
- **Rastreabilidade MPO.** Agente **Equipe de Gestão e Desenvolvimento do Observatório** (p. 201) + motivações **Conhecimento** e **Engajamento** (p. 204).

#### RF17: Coletar feedback Likert dos clientes
- **Descrição.** Registrar a percepção dos clientes finais sobre clareza dos atributos liberados, sentido de controle e transparência, utilidade do espaço, qualidade do diálogo e sentido de inclusão.
- **Justificativa.** Metade da avaliação qualitativa do DSR: valida a hipótese de que a ficha de atributos liberados é compreensível e que o CBAC produz percepção de controle/transparência adequada ao cliente.
- **Dependências.** RF08, RF10, RF11, RF23.
- **Critérios de aceite.** Formulário em escala 1-5 cobrindo: clareza dos atributos liberados, sentido de controle / transparência sobre o que vê, utilidade do que foi liberado, qualidade do diálogo, sentido de inclusão; identificação do projeto (respondente anônimo opcional); N esperado 5-10.
- **Regras de negócio.** Aplicado após pelo menos 2 semanas de uso pelos clientes.
- **Rastreabilidade MPO.** Agentes **Partes Interessadas dos Projetos** + **Usuários do Observatório** (pp. 200-201) + motivações **Engajamento** e **Conhecimento** (p. 204) + característica **Interatividade** (p. 191).

#### RF18: Exportar resultados consolidados
- **Descrição.** Gerar exportação única (CSV/JSON) com todos os dados de avaliação para alimentar o relato e o artigo.
- **Justificativa.** Sem exportação, a escrita do relato fica refém de queries manuais.
- **Dependências.** RF15, RF16, RF17, RF09.
- **Critérios de aceite.** Arquivo único com extrações, cobertura, métricas (precisão/recall/F1/concordância) por grupo, respostas Likert (consultoria + clientes), métricas de engajamento (nº de comentários, nº de drafts) e configurações de CBAC por projeto (snapshot do que esteve visível ao cliente).
- **Regras de negócio.** Cabeçalhos compatíveis com planilha (Excel, Google Sheets).
- **Rastreabilidade MPO.** Infraestrutura de avaliação, sem mapeamento direto.

### Bloco 6: Observação cross-cliente

O observatório deixa de tratar cada projeto isoladamente e passa a observar o **portfólio cross-cliente** da consultoria, agrupando por temática e comparando indicadores. Ativa os conceitos do MPO antes ausentes: *Conteúdo→Temáticas*, *Categorizar*, *Visualizar/Acompanhar*.

#### RF19: Categorizar projeto por temática/segmento
- **Descrição.** Atribuir a cada projeto uma temática/segmento (jurídico, saúde, esporte, branding, doceria, outros). A IA infere a partir da `description` + extração; o consultor revisa e confirma.
- **Justificativa.** A temática é a base de todo agrupamento cross-cliente. Materializa o conteúdo "Temáticas dos Projetos" do MPO, ausente até a versão anterior.
- **Dependências.** RF03, RF05/RF06.
- **Critérios de aceite.** A IA sugere a temática com nível de confiança; o consultor aceita ou sobrescreve; temática persistida no projeto e exibida no portfólio; projetos agrupáveis por temática; o log de sugestões é preservado (para a avaliação de acurácia da categorização).
- **Regras de negócio.** A categorização da IA é sempre uma sugestão; o consultor confirma. A temática é o mesmo campo que o `domínio` do RF03 (mesmo enum, termo do MPO), agora assistido por IA. Um projeto tem exatamente uma temática no MVP.
- **Rastreabilidade MPO.** Conteúdo **Temáticas dos Projetos** (p. 188) + processo **Categorizar/Classificar** (p. 197).

#### RF20: Visualizar cockpit de portfólio (comparação cross-projeto)
- **Descrição.** Apresentar à consultoria uma visão agregada e comparável do portfólio: indicadores cross-projeto (status, cobertura, distribuição por temática) agrupáveis por temática.
- **Justificativa.** É o que dá "cara de observatório" à consultoria: observar o conjunto, não fichas isoladas. Materializa os processos Visualizar/Acompanhar do MPO, presentes nos casos reais da tese.
- **Dependências.** RF02 (consultoria apenas), RF09, RF19.
- **Critérios de aceite.** Indicadores agregados por temática e no total; comparação de cobertura média e distribuição de status por temática; filtro por temática; cliente não acessa o cockpit (403).
- **Regras de negócio.** O cockpit é um read-model: apenas agrega dados já existentes, sem duplicá-los. Exclusivo do perfil Consultor (e admin).
- **Rastreabilidade MPO.** Processos **Acompanhar** e **Avaliar** (p. 198) + característica **Abrangência** (p. 189) + conceito **Visualizar** (Farias Júnior et al., 2025).

### Bloco 7: Governança de visibilidade

#### RF23: Configurar visibilidade do projeto via CBAC
- **Descrição.** Permitir que o consultor configure, por projeto, quais atributos do MPO ficam visíveis ao cliente. A configuração tem **dois níveis**: liberação por **categoria** (uma das 8 categorias do Quadro 37, propaga a todos os atributos daquela categoria) e **override por atributo individual** (vence sobre a categoria). O estado default ao criar o projeto é "**tudo oculto**" (privacy by default).
- **Justificativa.** Substitui o gate de "consultor revisa e publica resumo/síntese" por uma governança granular e auditável: o cliente vê exatamente o que o consultor decidiu liberar, nem mais nem menos. Materializa a característica Acesso semi-aberto do MPO de forma operacional, e atende LGPD/NDA sem depender de revisão humana de texto livre.
- **Dependências.** RF02, RF05/RF06.
- **Critérios de aceite.** Endpoint de configuração disponível ao consultor (e admin); leitura do estado atual devolve as 8 categorias com seu estado + lista de overrides + mapa resolvido dos 44 atributos; alterações (libera/oculta categoria, libera/oculta atributo, remover override) refletem imediatamente em todos os endpoints servidos ao cliente (RF08, RF09, RF11, RF17); cliente recebe 403 ao tentar configurar.
- **Regras de negócio.** Resolução: o override por atributo, se existir, vence; senão, vale o estado da categoria; senão (ausência de configuração), o atributo é oculto. Mudança de visibilidade é aplicada imediatamente; não há retroatividade sobre eventos de feed já entregues. Apenas o consultor "dono" do projeto (vínculo `consultant_id`) e o admin podem configurar.
- **Rastreabilidade MPO.** Característica **Acesso semi-aberto** (p. 189) + característica **Segurança** (p. 192).

---

## 3. Requisitos Não Funcionais

#### RNF01: Performance da extração
- **Categoria.** Performance.
- **Descrição.** O pipeline LLM deve processar um texto descritivo (~10 páginas) em tempo aceitável para o ciclo de uso da pesquisa.
- **Critérios de aceite.** Tempo médio ≤ 3 minutos por projeto, medido sobre os projetos do estudo.
- **Rastreabilidade MPO.** Qualidade técnica do pipeline, sem mapeamento direto.

#### RNF02: Usabilidade
- **Categoria.** Usabilidade.
- **Descrição.** Um cliente sem conhecimento técnico deve conseguir acessar seu projeto, ler os atributos liberados, comentar e navegar pelo feed sem treinamento. O consultor deve conseguir configurar o CBAC do projeto sem ambiguidade.
- **Critérios de aceite.** Avaliado via dimensões "clareza dos atributos liberados" e "sentido de controle" do Likert dos clientes (RF17); e "usabilidade da governança CBAC" do Likert da consultoria (RF16).
- **Rastreabilidade MPO.** Característica **Usabilidade** (p. 192).

#### RNF03: Manutenibilidade e organização
- **Categoria.** Manutenibilidade.
- **Descrição.** Backend e frontend em pastas separadas; schema versionado; arquitetura organizada por contextos (ports & adapters para LLM); estrutura legível para qualquer integrante.
- **Critérios de aceite.** Um novo integrante clona e roda o ambiente local em < 30 minutos seguindo o README.
- **Rastreabilidade MPO.** Qualidade interna de engenharia, sem mapeamento direto.

#### RNF04: Reprodutibilidade científica
- **Categoria.** Confiabilidade.
- **Descrição.** Toda saída de IA registra versão do prompt, identificador do modelo, timestamp e parâmetros relevantes; cada extração registra o *hash* da `description` que a originou.
- **Critérios de aceite.** Cada extração, draft e sugestão de temática carrega versão do prompt + modelo + timestamp + parâmetros. Extrações carregam adicionalmente o hash da descrição-fonte.
- **Regras de negócio.** Mudança de prompt incrementa a versão registrada.
- **Rastreabilidade MPO.** Qualidade de método científico, aplicado a RF05, RF13 e RF19.

#### RNF05: Rastreabilidade de origem
- **Categoria.** Confiabilidade.
- **Descrição.** Toda informação extraída automaticamente carrega o trecho da `description` do projeto que a justifica.
- **Critérios de aceite.** Para cada atributo preenchido, o sistema persiste e exibe o trecho da descrição-fonte.
- **Regras de negócio.** Se a IA não conseguir identificar trecho, o atributo deve ficar `null` (não inventar).
- **Rastreabilidade MPO.** Processo **Tratar** (p. 195).

#### RNF06: Ambiente de execução local
- **Categoria.** Portabilidade.
- **Descrição.** O sistema roda localmente via Docker Compose, sem dependência de infraestrutura externa além do LLM (que também é local por default via Ollama).
- **Critérios de aceite.** `docker compose up` provisiona PostgreSQL + backend; o frontend sobe localmente; instruções no README.
- **Rastreabilidade MPO.** Conceito de **Infraestrutura de TI** (p. 192).

#### RNF07: Restrições de escopo declaradas
- **Categoria.** Restrição.
- **Descrição.** O sistema não implementa OAuth, multi-tenancy, upload de arquivos nem deploy em produção.
- **Rastreabilidade MPO.** Delimitação de escopo do artefato acadêmico.

#### RNF08: Conformidade LGPD
- **Categoria.** Segurança / Compliance.
- **Descrição.** Dados dos projetos dos clientes em formato semi-aberto exigem medidas mínimas de proteção e consentimento.
- **Critérios de aceite.** NDA com clientes participantes; consentimento explícito para uso anonimizado dos resultados; isolamento por perfil (RF02); governança CBAC operacional (RF23); criptografia em trânsito; logs de acesso ao observatório.
- **Regras de negócio.** Cliente A nunca acessa dados do Cliente B. Estendido pelo RNF10.
- **Rastreabilidade MPO.** Característica **Segurança** (p. 192), que menciona explicitamente política aderente à LGPD.

#### RNF09: Controle de custo de LLM
- **Categoria.** Operacional.
- **Descrição.** As chamadas de IA por projeto (extração + drafts + sugestão de temática) consomem tokens; o sistema deve permitir controle e visibilidade.
- **Critérios de aceite.** Cada chamada LLM registra tokens consumidos (entrada + saída) e custo estimado; relatório agregado por projeto e total.
- **Regras de negócio.** LLM local (Ollama) como padrão; caching de extrações idênticas (mesmo *hash* de descrição + mesma versão de prompt não re-roda).
- **Rastreabilidade MPO.** Característica **Sustentabilidade** (p. 190).

#### RNF10: Isolamento estrito entre clientes via CBAC
- **Categoria.** Segurança / Compliance.
- **Descrição.** O cliente só vê os atributos do MPO explicitamente liberados pelo consultor para o seu próprio projeto. Nunca vê atributos não liberados, nunca vê dados de outros clientes, nunca infere a existência de atributo oculto a partir da estrutura da resposta. O estado default é "tudo oculto".
- **Justificativa.** O estudo tem dois clientes do mesmo segmento (jurídico); sem isolamento estrito, mesmo a inferência por estrutura de payload poderia revelar informação indevida. O CBAC com "ausência = oculto" e "atributo oculto sumido da resposta" elimina essa superfície.
- **Critérios de aceite.** Atributos não liberados não aparecem no payload servido ao cliente (não há placeholder "oculto"); cobertura cliente usa denominador escopado; feed cliente filtra eventos por visibilidade; testes e2e cobrem os 3 endpoints (RF08, RF09, RF11) para garantir o isolamento.
- **Regras de negócio.** Mudança de CBAC tem efeito imediato sobre reads; não há retroatividade sobre eventos de feed já entregues (decisão consciente do MVP).
- **Rastreabilidade MPO.** Características **Segurança** (p. 192) e **Acesso semi-aberto** (p. 189).

---

## 4. Premissas

- O estudo de caso usa **5 projetos reais** de uma consultoria, atendendo clientes em segmentos distintos (jurídico, saúde, esporte, branding).
- O conteúdo bruto de cada projeto é passado ao sistema como **texto descritivo** (campo `description` no payload de criação), substituindo o upload de `.docx` da versão anterior.
- **Gabarito manual produzido em 3 projetos**; os demais são avaliados por cobertura + Likert.
- A coleta Likert depende de acesso aos stakeholders dos projetos. N esperado: ~4 (consultoria) + ~5-10 (clientes).
- Valença Odontologia atua como projeto piloto para calibrar a rubrica de avaliação.
- A empresa que forneceu os materiais é referenciada apenas como "consultoria", sem nominação no relato.

---

## 5. Fora de Escopo

- Upload de arquivos (`.docx`, PDF, imagens) — substituído pelo campo `description` no payload (RF03).
- Resumo do projeto em linguagem narrativa gerado pela IA para o cliente — substituído pela ficha de atributos liberados via CBAC (RF08 + RF23).
- Síntese cross-projeto por temática gerada pela IA (Conectora) e camada de conhecimento comum publicada ao cliente — escopo deslocado para trabalhos futuros.
- Atualização incremental, detecção de mudanças automatizadas e versionamento granular de extrações.
- Modelo próprio de classificação de risco (PMBOK).
- Linha do tempo interativa.
- Alertas automáticos e recomendações proativas disparados pelo sistema.
- Chat com IA.
- Notificações por email externo (substituídas pelo feed in-app, RF11).
- OAuth, multi-tenancy e deploy em produção.
- Cliente acessar dados de outros clientes (vedado por RF23 + RNF10).
- Cliente ver atributos não liberados ou inferir a existência deles a partir da resposta (vedado pelo RNF10).

---

## 6. Referências

- VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese (Doutorado), CIn/UFPE, Recife, 2022. (MPO; Quadro 37, p. 264.)
- FARIAS JÚNIOR, I. H.; VIEIRA, J. K. M.; PERRELLI DE MOURA, H.; SAMPAIO, S. **A Conceptual Model for Project Observatories**. IEEE Access, v. 13, 2025.
