# ObiOne — Backlog de Produto (Pós-Pivot Comunidade)

> Versão pós-pivot do backlog (16/05/2026), alinhada à proposta acadêmica reformulada, à metodologia DSR e ao calendário real da disciplina TAES (semana 8 atual, entrega em 10/07/2026).

## Visão Geral

O ObiOne é um **observatório-comunidade de projetos** baseado no MPO (Farias Jr. *et al.*, 2025; Vieira, 2022) e potencializado por IA Generativa. O MVP demonstra duas frentes integradas:

1. **Pipeline LLM** que extrai atributos do Quadro 37 do MPO de documentos `.docx` não-estruturados.
2. **Espaço de comunidade** semi-aberto onde a equipe da consultoria curatoriza todos os projetos e cada cliente acessa apenas o seu, com comentários, feed de novidades, resumos automáticos e drafts assistidos pela IA.

**Não é um produto SaaS nem um dashboard de gestão.** É um artefato de pesquisa avaliado via DSR que materializa as características de Interatividade e Rede de Colaboração do MPO (Vieira, 2022).

---

## Princípios de Escopo

1. **Fidelidade ao MPO.** Atributos extraídos seguem o **Quadro 37 (terceira versão — Vieira, 2022)**. Funcionalidades de comunidade derivam dos conceitos do MPO (Componentes/Relacionamento, Conteúdo/Interações, Característica Interatividade, Processo Interagir).
2. **Comunidade primeiro, IA como enabler.** A IA Generativa é redutora de fricção e tradutora — não é fim em si mesma. Toda funcionalidade serve à viabilidade do observatório-comunidade.
3. **Avaliação dupla.** Quantitativa (extração) + qualitativa (Likert separado por audiência).
4. **9 semanas, não 12.** Hoje é 16/05/2026, semana 8 da disciplina. Entrega: 10/07/2026.
5. **Estudo de caso definido.** 5 projetos: Freire Batista ADV, Valença Odontologia (piloto), Kaka JJ, Bem Viver Fitoterápicos, Dinoah ADV. **Gabarito manual reduzido a 3 projetos** (Valença + Freire Batista + Kaka JJ).

---

## Estratégia de IA

A IA Generativa cumpre três papéis combinados no observatório:

- **Extratora**: lê `.docx` e estrutura os atributos do Quadro 37 em JSON.
- **Tradutora**: converte a extração técnica em **Resumo do Projeto para o Cliente** em linguagem acessível.
- **Redutora de fricção**: gera **drafts** de "Próximos Passos / Pontos de Atenção" que o consultor revisa antes de publicar.

Chat com IA e detecção automática de padrões entre projetos: fora do escopo do MVP — backlog futuro.

---

# Entregáveis da Fase Preparatória (semana 8)

Não são US de produto, são **decisões metodológicas e baselines de avaliação** que destravam o resto. Sem elas, Sprint 1 estoura e Sprint 4 (avaliação) não roda.

| Entregável | Conteúdo |
|---|---|
| `docs/atributos_alvo_mpo.md` | Lista derivada do Quadro 37. Para cada atributo: nome, categoria, **tipo** (`estruturado` ou `texto_livre`), e marcação `fora_de_escopo` para imagens/fotos. |
| `docs/protocolo_avaliacao.md` | Critério híbrido de match: (i) estruturado por comparação normalizada exata; (ii) texto livre por rubrica humana 0/0,5/1; (iii) Cohen's Kappa para concordância; (iv) protocolo de resolução de divergências. |
| `docs/schema_extracao.json` | Schema JSON formal derivado da lista de atributos-alvo, usado pela extração automática e pelo gabarito manual. |
| `docs/gabarito/<projeto>.json` (×3) | Extração manual de Valença (piloto), Freire Batista e Kaka JJ por dois avaliadores independentes. Divergências resolvidas conforme protocolo. |
| Protótipos das telas (Bruno) | Wireframes/mockups das telas novas: login, portfólio (consultor), detalhe do projeto (cliente), comentários, Resumo do Cliente, Drafts. |

**Responsáveis:** Cynthia (atributos-alvo + matriz semente), Moisés (protocolo + rubrica), Raniel (schema + setup técnico), Bruno (protótipos). Cynthia + Moisés produzem os 3 gabaritos como par de avaliadores independentes.

---

# MVP

## Sprint 0 — Preparatória (semana 8: 15-21/05)

Entregáveis acima + alinhamento do grupo no pivot.

## Sprint 1 — Cadastro, Upload, Auth e Pipeline (semanas 9-10: 22/05-04/06)

### US01 — Autenticar usuário
**Como** usuário, **quero** acessar o observatório com login **para** que minhas permissões sejam respeitadas.

Critérios:
- Login com email + senha; JWT como token de sessão.
- Sem OAuth, sem cadastro público — usuários criados pela equipe da consultoria.
- Logout funcional.

> Característica **Segurança** do MPO (Vieira, p. 192). Sem auth, modelo semi-aberto não é possível.

---

### US03 — Cadastrar projeto
**Como** consultor, **quero** cadastrar um projeto **para** ancorar documentos e extrações.

Critérios:
- Campos: nome, domínio (jurídico, saúde, esporte, branding, outros), descrição livre.
- Identificador único.
- Listagem dos projetos cadastrados (filtrada por perfil — ver US02).

---

### US04 — Fazer upload de documentos do projeto
**Como** consultor, **quero** anexar arquivos `.docx` **para** alimentar a extração.

Critérios:
- `.docx` obrigatório; múltiplos arquivos por projeto.
- Persistência do bruto + metadados (nome, data, tamanho, hash).

---

### US05 — Extrair atributos do MPO via LLM
**Como** sistema, **devo** processar os documentos e extrair os atributos previstos no Quadro 37.

Critérios:
- Prompt estruturado a partir de `docs/atributos_alvo_mpo.md`.
- JSON conforme `docs/schema_extracao.json` cobrindo as 8 categorias.
- Cada atributo preenchido carrega trecho de origem.
- Atributos não encontrados como `null` — nunca inventados.
- `fora_de_escopo` (imagens/fotos) ignorados.
- Versão do prompt + modelo LLM registrados.

---

### US06 — Persistir extração estruturada
**Como** sistema, **devo** salvar a extração com metadados.

Critérios:
- Registra: projeto, documento(s), versão do prompt, modelo, timestamp, `origem` (`automatico` | `manual`).
- Recuperável para comparação posterior.

---

## Sprint 2 — Dashboard, Cobertura e Perfis (semana 11: 05-11/06)

### US02 — Gerenciar perfis e acesso semi-aberto
**Como** sistema, **devo** garantir que cada usuário acessa apenas o que seu perfil permite.

Critérios:
- Dois perfis: **Consultor** (acesso a todos os projetos), **Cliente** (acesso apenas ao seu projeto associado).
- Vínculo cliente ↔ projeto persistido.
- Endpoints e telas filtram conforme o perfil; tentativa de acesso indevido retorna 403.
- Equipe da consultoria cria contas; cliente recebe convite por email com senha provisória.

> Característica **Acesso semi-aberto** (Vieira, p. 189). Materializa o modelo do MPO.

---

### US07 — Visualizar portfólio (perfil-aware)
**Como** consultor, **quero** uma visão consolidada de todos os projetos **para** observar o portfólio.

Critérios:
- Lista projetos com: nome, domínio, status derivado, % de cobertura do MPO.
- Status derivado dos dados: `cadastrado` → `ingerido` → `extraído` → `avaliado`.
- Filtro por domínio.
- **Restrito ao perfil Consultor** — Cliente não acessa essa tela (ver US02).

---

### US08 — Visualizar detalhe do projeto
**Como** consultor ou cliente daquele projeto, **quero** ver os atributos extraídos **para** inspecionar o conteúdo do observatório.

Critérios:
- Atributos do Quadro 37 agrupados por categoria; preenchidos e vazios visíveis.
- Cada atributo preenchido: valor + trecho de origem.
- Acesso aos documentos originais.
- **Cliente vê apenas o seu projeto**; Consultor vê todos (ver US02).

---

### US09 — Indicador de cobertura do MPO
**Como** consultor, **quero** saber quais atributos do MPO foram preenchidos pela IA **para** avaliar a abrangência do pipeline.

Critérios:
- Por projeto: % de atributos preenchidos vs. total de atributos-alvo (excluindo `fora_de_escopo`).
- No portfólio: tabela ou heatmap projetos × atributos.
- Destaque visual quando < 50%; sinalização saudável quando ≥ 80%.

---

## Sprint 3 — Comunidade e IA-Assistente (semanas 12-13: 12-25/06)

### US10 — Comentar no projeto
**Como** consultor ou cliente daquele projeto, **quero** comentar e responder comentários **para** dialogar sobre o conteúdo observado.

Critérios:
- Thread livre por projeto; consultor e cliente daquele projeto comentam.
- Resposta a comentário (1 nível de aninhamento).
- Identificação do autor visível.
- Edição/exclusão pelo próprio autor; consultor pode moderar.

> Característica **Interatividade** + processo **Interagir** (Vieira, pp. 191, 198).

---

### US11 — Visualizar feed in-app de novidades
**Como** consultor ou cliente, **quero** ver as novidades dos meus projetos **para** acompanhar o que mudou.

Critérios:
- Feed listando: novo comentário, novo resumo gerado, nova extração, novo draft publicado.
- Filtrado por perfil (cliente vê só seu projeto; consultor vê todos).
- Indicador de "não lido" (contador).
- **Sem envio de email** — feed apenas in-app.

> Processo **Acompanhar** (Vieira, p. 198).

---

### US12 — Gerar Resumo do Projeto para o Cliente
**Como** sistema, **devo** gerar uma narrativa acessível do projeto a partir da extração técnica **para** que o cliente compreenda o que está sendo observado.

Critérios:
- IA Generativa lê a extração JSON do projeto e produz texto narrativo em linguagem acessível ao cliente.
- Resumo cobre os pontos principais: objetivos, escopo, status, riscos relevantes.
- **Sempre revisável pelo consultor antes de publicar** — cliente nunca vê resumo não-revisado.
- Versão e modelo LLM registrados.

> Processo **Comunicar** (Vieira, p. 197) + característica **Usabilidade** (linguagem cidadã, p. 192).

---

### US13 — Gerar drafts de "Próximos Passos / Pontos de Atenção"
**Como** consultor, **quero** drafts gerados pela IA dos próximos passos e pontos de atenção do projeto **para** reduzir o tempo de manutenção do observatório.

Critérios:
- IA propõe rascunhos a partir da extração + comentários recentes.
- Consultor revisa e **edita** antes de publicar para o cliente.
- Drafts pendentes ficam em rascunho — não aparecem para o cliente até publicação.
- Versão e modelo LLM registrados.

> Materialização do papel de IA-redutora-de-fricção do pivot.

---

## Sprint 4 — Avaliação (semana 14: 26/06-02/07)

### US14 — Importar e validar gabarito manual
**Como** sistema, **devo** carregar os gabaritos produzidos na fase preparatória **para** servir de baseline na comparação.

Critérios:
- Carga dos arquivos `docs/gabarito/<projeto>.json` (**3 projetos** — não 5).
- Validação contra `docs/schema_extracao.json`.
- Persistência com `origem: manual`.

---

### US15 — Comparar extração automática vs. gabarito (critério híbrido)
**Como** pesquisador, **quero** métricas de precisão, recall, F1 e Kappa **para** avaliar quantitativamente o pipeline.

Critérios:
- Atributos `estruturado`: comparação normalizada exata (TP/FP/FN).
- Atributos `texto_livre`: rubrica humana 0/0,5/1 aplicada por dois avaliadores.
- Cohen's Kappa por atributo e agregado.
- Métricas separadas por grupo + agregado total.
- Tempo de extração: manual (reportado) vs. automático (medido).
- Visualização tabular.

> Atributos com Kappa < 0,6: registrar como limitação.

---

### US16 — Coletar feedback Likert da consultoria
**Como** pesquisador, **quero** registrar a percepção da equipe da consultoria **para** avaliar a redução de fricção e qualidade da assistência da IA.

Critérios:
- Formulário com 4 dimensões em escala 1-5: utilidade dos drafts, redução de fricção, qualidade do resumo gerado, manutenibilidade do papel de mediador.
- Identificação do respondente.
- N esperado: ~4 (toda a equipe da consultoria/grupo do TAES).
- Persistência das respostas e relatório agregado.

---

### US17 — Coletar feedback Likert dos clientes
**Como** pesquisador, **quero** registrar a percepção dos clientes finais **para** avaliar a clareza do resumo e a qualidade do diálogo no observatório.

Critérios:
- Formulário com 4 dimensões em escala 1-5: clareza do resumo, utilidade do espaço, qualidade do diálogo, sentido de inclusão.
- Identificação do projeto e do respondente (anonimato opcional).
- N esperado: 5-10 (~1-2 stakeholders por projeto).
- Implementação mínima: Google Forms externo + import.

> **Plano B** se N total < 8: declarar limitação no relato.

---

### US18 — Exportar resultados consolidados
**Como** pesquisador, **quero** exportar todos os resultados **para** alimentar o relato e o artigo.

Critérios:
- CSV/JSON com: extrações, cobertura, precisão/recall/F1 por grupo, Kappa, respostas Likert (consultoria + clientes), métricas de engajamento por projeto (#comentários, #drafts publicados).
- Cabeçalhos compatíveis com planilha.

---

# Marcos do Estudo de Caso

| Marco | Quando | Critério de aprovação |
|---|---|---|
| **M1** — Preparação conceitual concluída | Fim da semana 9 (28/05, após SR1) | Entregáveis preparatórios versionados; gabarito dos 3 projetos iniciado; protótipos aprovados. |
| **M2** — Pipeline operacional nos 5 casos | Fim da semana 11 (11/06) | Extração rodada nos 5 projetos sem erro fatal; JSONs persistidos; auth + perfis funcionais. |
| **M3** — Dashboard + IA-Assistente operacionais | Fim da semana 13 (25/06, após SR2) | Cobertura visualizável; comentários funcionando; Resumo do Cliente e Drafts gerando saída revisável. |
| **M4** — Avaliação concluída | Fim da semana 14 (02/07) | Precisão/recall/F1/Kappa calculados nos 3 com gabarito; Likert consultoria + clientes consolidados; exportação pronta. |

---

# Backlog Futuro (fora do MVP)

| Item | Motivo de adiar |
|---|---|
| Modelo de risco PMBOK com pesos próprios | Não previsto na proposta. Riscos já são atributo extraído. |
| Atualização incremental, detecção de mudanças, versionamento | Estudo de caso assume corpus fixo por projeto. |
| Linha do tempo interativa | Não cobrado pela avaliação. |
| Indicadores de portfólio avançados (atrasos cruzados, projeções) | Cobertura do MPO é o indicador-alvo; demais ficam pós-MVP. |
| Comparação entre projetos / por domínio | Fora do ciclo único de DSR (intra-projeto). |
| **Lições aprendidas cross-project (IA-conectora)** | Era NICE no plano anterior; cortada pelo prazo apertado. |
| Notificações por email externo | Reduzido para feed in-app simples. |
| Detecção automática de padrões, alertas, recomendações | Features SaaS, não de pesquisa. |
| Chat com IA / linguagem natural | Marcado como avançado desde a 1ª revisão do backlog. |
| Extração de imagens/fotos | Atributo do Quadro 37 não-textual; fora do escopo LLM textual. |
| Deploy em produção, multi-tenancy, OAuth | Fora do MVP acadêmico. |

---

# Cronograma (alinhado à metodologia e ao calendário da disciplina)

| Sem | Data | Atividade | Sprint | Marco |
|---|---|---|---|---|
| 8 | 15-21/05 | Fase preparatória (atributos, protocolo, schema, protótipos, setup) + alinhamento do grupo no pivot | Sprint 0 | — |
| 9 | 22-28/05 | US01 (auth), US03 (cadastro), US04 (upload); iniciar gabarito (3 projetos) | Sprint 1 | M1 + SR1 |
| 10 | 29/05-04/06 | US05 (extração), US06 (persistência); finalizar gabarito; matriz semente | Sprint 1 | — |
| 11 | 05-11/06 | US02 (perfis), US07 (portfólio), US08 (detalhe), US09 (cobertura) | Sprint 2 | M2 |
| 12 | 12-18/06 | US10, US11, US12 (Resumo), US13 (Drafts) | Sprint 3 | — |
| 13 | 19-25/06 | Polish + aplicação da rubrica nos 3 projetos + lançar Likert | Sprint 3 | M3 + SR2 |
| 14 | 26/06-02/07 | US14, US15, US16, US17, US18 (avaliação consolidada) | Sprint 4 | M4 |
| 15 | 03-09/07 | Escrita do relato + slides + screencast | — | — |
| 16 | 10/07 | **Apresentação final + entrega do artigo** | — | Entrega |

---

# Definição de Pronto (DoD)

**Por User Story:**
- Critérios de aceitação atendidos.
- Código mergeado em `main` após revisão de pelo menos um integrante.
- Smoke test funcional documentado.

**Por Sprint:**
- Marco da sprint atingido (M1, M2, M3 ou M4).
- Demo curta para o grupo (15 min) cobrindo as US da sprint.
- README/wiki interna atualizada com mudanças relevantes.

---

# Riscos do Projeto

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Acesso insuficiente aos stakeholders dos clientes para Likert | Média | Alto | **Bruno inicia contato na semana 8.** Plano B: 1 respondente por projeto + declaração de limitação. |
| R2 | Heterogeneidade alta dos `.docx` reais quebra o pipeline | Média | Médio | Inspeção amostral na semana 8; chunking + saneamento documentados antes do Sprint 1. |
| R3 | Custo/limite de tokens da API LLM (aumentado pós-pivot) | Média | Médio | Estimar volume na semana 8 considerando 3 chamadas por projeto (extração + resumo + drafts); modelo apropriado por etapa; caching. |
| R4 | Concordância entre avaliadores baixa (Kappa < 0,6) | Média | Médio | **Valença como projeto piloto**. Se rubrica mudar significativamente, refazer Valença com a rubrica final. |
| R5 | Esforço do gabarito manual estoura semana 8 | Média | Alto | **Reduzido para 3 projetos** (10 → 6 anotações). Cynthia + Moisés iniciam após atributos-alvo (meio da sem 8). |
| R6 | Mudança no schema mid-sprint | Baixa | Alto | Schema versionado; congelar ao fim da semana 9 (antes do Sprint 2). |
| R7 | LGPD — dados de marketing de clientes em formato semi-aberto | Média | Alto | NDA com clientes; consentimento explícito; criptografia em trânsito; logs de acesso. |
| R8 | Custo de LLM aumentado pelas 3 chamadas por projeto | Média | Médio | Estimativa de tokens antes do Sprint 1; modelo mais barato para drafts iniciais; caching agressivo. |
| R9 | Prazo apertado pós-pivot (perdemos 1 semana) | Alta | Alto | Cortes já feitos (Lições, notificações email); SR1 apresenta pivot + plano + protótipos, não código. |
| R10 | Complexidade do auth e perfis (não estava previsto) | Média | Médio | Auth simples (email+senha+JWT); sem OAuth; bibliotecas padrão FastAPI (passlib + python-jose). |
| R11 | Resistência dos clientes a participar do observatório | Média | Alto | Bruno inicia contato cedo; valor proposto: "ver o que estamos observando do seu projeto". |
| R12 | Drafts da IA percebidos como pobres ou enviesados | Média | Médio | Consultor SEMPRE revisa antes de publicar; medir percepção via Likert da consultoria (US16). |

---

# Definição do MVP

> Cadastro + Upload + Extração LLM (Quadro 37) + Auth + Perfis semi-abertos + Comentários + Feed in-app + Resumo automático para o Cliente + Drafts assistidos para o Consultor + Cobertura do MPO + Avaliação (precisão/recall/F1/Kappa em 3 projetos + Likert consultoria + Likert clientes) + Exportação.

O MVP **não é produto comercial**. É um artefato de pesquisa funcional o suficiente para que: (i) os 5 projetos sejam processados de ponta a ponta; (ii) a equipe da consultoria utilize o observatório como espaço de mediação; (iii) os clientes acessem seu próprio projeto, comentem e recebam resumos automáticos; (iv) a avaliação quantitativa e qualitativa seja exportável para o relato.

---

# Definição do Produto

O ObiOne é um **observatório-comunidade de projetos** baseado no MPO que utiliza IA Generativa para reduzir a fricção operacional de manter o observatório vivo — extraindo atributos de documentos não-estruturados, traduzindo a extração técnica em narrativa acessível para os clientes e gerando drafts assistidos para o consultor revisar. O artefato endereça diretamente os Trabalhos Futuros #4 (Interatividade), #7 (Estudos comparativos com outras soluções) e #8 (Soluções computacionais à luz do MPO) propostos por Vieira (2022, pp. 215-217), estendendo a aplicabilidade do MPO de contextos públicos e acadêmicos para contextos organizacionais privados multissetoriais.
