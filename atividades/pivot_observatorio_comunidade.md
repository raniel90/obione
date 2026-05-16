# Pivot do ObiOne — Observatório-Comunidade

Documento de decisão que registra a reformulação do escopo do ObiOne em **16/05/2026**, após crítica do professor.

Captura o motivo do pivot, fundamentação na tese de Vieira (2022), novo norte, escopo, cronograma adaptado e implicações nos artefatos existentes.

---

## 1. Contexto e Motivação

### Estado anterior

O ObiOne vinha sendo desenvolvido como **pipeline de extração + dashboard de cobertura + avaliação contra gabarito**:

- IA Generativa extraía atributos do MPO (Quadro 37) de documentos `.docx`
- Dashboard mostrava cobertura por projeto
- Avaliação quantitativa via precisão/recall/F1/Kappa
- Avaliação qualitativa via Likert de stakeholders

### Crítica do professor (Ivaldir Honório de Farias Júnior)

> *"Um observatório é mais que um dashboard, pois já existem diversas ferramentas de gestão de projetos que fazem isso. O observatório é um espaço de conhecimento e de outros membros. Temos que pensar quem seriam os outros usuários dessa solução."*

A crítica aponta que o escopo anterior **não diferencia o ObiOne de uma ferramenta de gestão de projetos**. Faltava o tecido social que caracteriza um observatório: comunidade, interação, conhecimento compartilhado entre membros.

### Direção do repensar

A consultoria que forneceu os 5 documentos do estudo de caso atua em marketing e estratégia, atendendo clientes em múltiplos segmentos (jurídico, saúde, esporte, branding). O pivot trata a comunidade como **consultoria + clientes**, com modelo de acesso semi-aberto.

---

## 2. Fundamentação no MPO (Vieira, 2022)

A leitura aprofundada de Vieira (2022) — capítulo 5 (MPO) e seção 6.4 (Trabalhos Futuros) — fundamenta o pivot em cinco dimensões que tornam um observatório qualitativamente diferente de uma ferramenta de gestão.

### 2.1 As cinco dimensões diferenciadoras

| Dimensão | O que define | Página da tese |
|---|---|---|
| **Componentes de Relacionamento** | "Coordenam os relacionamentos entre os usuários e a interação desses com os projetos e com o observatório." | 186 |
| **Conteúdo de Usuários e Interações** | "Os dados relacionados aos usuários e suas interações com o conteúdo (...) também podem ser compreendidos como um conteúdo do observatório." | 188 |
| **Características — Rede de Colaboração, Acesso semi-aberto** | "Estruturação de um observatório de projetos como uma rede de colaboradores (...) com o objetivo em comum de compartilhar dados, informações e conhecimento sobre projetos." Acesso semi-aberto: "há informações que são de acesso restrito a um determinado conjunto de usuários." | 189 |
| **Agentes plurais e Motivações** | Partes Interessadas, Equipe de Gestão, Usuários — com motivações distintas (Transparência, Conhecimento, Melhoria, Engajamento). | 199-204 |
| **Processos de Produção de Conhecimento** | Transformar, Comunicar, Interagir, Colaborar — "transforma dados em conhecimento coletivo e inteligência negociada." | 196-199 |

### 2.2 OPTI-PE como exemplo prático

A tese descreve o OPTI-PE (Observatório de Projetos de TI do Estado de Pernambuco) como observatório real funcionando como comunidade:

- **Página por projeto** com seção de comentários (p. 188).
- **Usuários respondem comentários de outros usuários**; gestores participam (p. 188).
- **Equipe de mediação** dedicada (p. 186).
- **Crowdsourcing** em alguns projetos (testes, sugestões) (p. 199).
- **Notificações por e-mail** sobre atualizações dos projetos (p. 198).

### 2.3 Trabalhos Futuros que o pivot endereça

A própria tese de Vieira indica como Trabalhos Futuros áreas que o pivot do ObiOne aborda diretamente:

| Trabalho Futuro | Página | Como o pivot endereça |
|---|---|---|
| #4 — **Interatividade nos observatórios de projetos** | 216 | Implementamos comentários, perfis, feed de novidades. |
| #7 — **Estudos comparativos com outras soluções** (vs. ferramentas de gestão) | 216 | A própria pergunta de pesquisa nova explicita essa diferenciação. |
| #8 — **Desenvolvimento de soluções computacionais à luz do MPO** | 216-217 | O ObiOne é literalmente uma dessas soluções. |

**Conclusão da fundamentação:** o pivot não é uma reação ad hoc à crítica do professor — é alinhamento explícito com a agenda de pesquisa do autor do referencial teórico.

---

## 3. Novo Norte

### 3.1 Pergunta de pesquisa reformulada

> *"Como a IA Generativa pode viabilizar um observatório-comunidade de projetos, reduzindo a fricção de manutenção e promovendo o engajamento entre a organização executora e seus clientes?"*

### 3.2 Objetivos do artefato

1. **Demonstrar viabilidade técnica do pipeline** — IA Generativa extrai atributos do MPO (Quadro 37) de `.docx` não-estruturados (mantido do escopo anterior, com avaliação reduzida).
2. **Demonstrar viabilidade comunitária** — o observatório, com features de comunidade e IA assistente, cria engajamento real entre consultoria e clientes em 5 casos reais.
3. **Avaliar percepção de valor** — por ambos os perfis (consultor e cliente), separadamente.

### 3.3 Comunidade-alvo

- **Consultoria** (organização executora): curadora, moderadora, mantém o pipeline. Acessa todos os projetos.
- **Clientes finais** (cada um dos 5 casos): acessam apenas o seu próprio projeto, comentam, recebem resumos gerados por IA, validam pontos de atenção.

### 3.4 Modelo de acesso

**Semi-aberto** (Vieira, p. 189). Isolamento garantido entre clientes.

### 3.5 Escopo do conhecimento

**Intra-projeto** (consultoria + cliente daquele caso). Cross-projeto (padrões entre clientes) fica fora do MVP — pode ser trabalho futuro.

### 3.6 Papel da IA Generativa

**Combinada — redutora de fricção + tradutora:**

- **Tradutora:** gera "Resumo do Projeto para o Cliente" em linguagem acessível.
- **Redutora de fricção:** gera drafts de "Próximos Passos / Pontos de Atenção" que o consultor revisa antes de publicar.

O papel "Conectora" (padrões entre projetos) **não entra** no MVP — risco de Frankenstein.

---

## 4. Novo Escopo (Resumo)

**19 funcionalidades** classificadas. Detalhe completo nos artefatos a serem atualizados (backlog e requisitos).

| Grupo | F# | Classificação | Conteúdo |
|---|---|---|---|
| Pipeline | F1-F4 | Mantido | Cadastro, upload, extração LLM, persistência |
| Observação | F5-F7 | Mantido + ajustado | Portfólio, detalhe, cobertura (perfil-aware) |
| Comunidade | F8-F11 | **Novo** | Auth, perfis, comentários, feed in-app |
| IA-Assistente | F12-F13 | **Novo** | Resumo Cliente, Drafts |
| IA-Assistente (NICE) | F14 | **Cortado** | Lições Aprendidas — vai para backlog futuro |
| Avaliação | F15-F19 | Ajustado | Gabarito reduzido, Likert split |

**Resumo de uma frase:** o ObiOne passa de "pipeline de extração + dashboard" para "espaço onde consultoria e cliente coabitam, mediados por IA Generativa que reduz a fricção operacional."

---

## 5. Cronograma Adaptado

**Hoje: 16/05/2026 (semana 8 da disciplina já em curso).** Restam ~8 semanas até a entrega final em 10/07/2026.

| Sem | Data | Foco geral | Marco |
|---|---|---|---|
| 8 | 15-21/05 (atual) | Alinhar grupo no pivot. Bruno: protótipos. Raniel: setup repo + schema + design auth. Cynthia: atributos-alvo MPO. Moisés: protocolo de avaliação. | — |
| 9 | 22-28/05 | Cadastro+upload (B+R). Auth backend (R). Iniciar gabarito 3 projetos (C+M). | **M1 (preparação conceitual) + SR1** |
| 10 | 29/05-04/06 | Detalhe + comentários (B+R). Pipeline LLM (R). Finalizar gabarito + matriz semente (C+M). | — |
| 11 | 05-11/06 | Portfólio + cobertura (B+R). Extração nos 5 + perfis (R). Estrutura do relato (C). Refino Likert (M). | **M2 (pipeline operacional)** |
| 12 | 12-18/06 | UI Resumo Cliente + UI Drafts (B). Prompts (R). Aplicar rubrica nos 3 projetos (C+M). | — |
| 13 | 19-25/06 | Likert UI + polish (B). Exportação + suporte (R). Iterar relato (C). Lançar Likert + SR2 (M). | **M3 (dashboard+IA) + SR2** |
| 14 | 26/06-02/07 | Polish final. Métricas e Likert consolidados. Exportação completa. | **M4 (avaliação concluída)** |
| 15 | 03-09/07 | Bruno: screencast. Raniel: deploy local. Cynthia: escrita final. Moisés: slides. | — |
| 16 | 10/07 | **Apresentação final + entrega do artigo** | **Entrega** |

### Status Reports da disciplina como checkpoints

- **SR1 (22/05)**: apresenta o **pivot + plano + protótipos** ao professor (sem código necessário ainda).
- **SR2 (19/06)**: demo do dashboard + cobertura + comentários + Resumo do Cliente funcionando nos 5 projetos.

---

## 6. Avaliação Adaptada

### 6.1 Quantitativa

| Métrica | Mudança |
|---|---|
| Cobertura do MPO | Sem mudança — calculada sobre os 5 projetos |
| Precisão / Recall / F1 | Calculados sobre **3 projetos** com gabarito (Valença piloto + 2 outros), não os 5 |
| Cohen's Kappa | Idem (concordância entre os 2 avaliadores nos 3 projetos) |
| Tempo de extração | Sem mudança |

**Justificativa do gabarito reduzido:** com o pivot agregando 6 novas funcionalidades em 8 semanas, o esforço de produzir 5 gabaritos completos (10 anotações) compromete o cronograma. Reduzir para 3 (6 anotações) libera ~40% do esforço de avaliação manual sem comprometer a defensibilidade estatística para o tamanho de amostra acadêmica.

### 6.2 Qualitativa (Likert)

| Audiência | Dimensões (escala 1-5) |
|---|---|
| **Consultoria** (~4 respondentes) | Utilidade dos drafts; Redução de fricção; Qualidade do resumo gerado; Manutenibilidade do papel de mediador |
| **Clientes** (~5-10 respondentes) | Clareza do resumo; Utilidade do espaço; Qualidade do diálogo; Sentido de inclusão (participante, não só observador) |

### 6.3 Exportação

Adiciona métricas de engajamento por projeto: número de comentários, taxa de resposta, dimensões Likert.

---

## 7. Implicações nos Artefatos Existentes

| Doc | Mudanças |
|---|---|
| `proposta_observatorio_obione.md` + `.pdf` | Reformular resumo com nova pergunta de pesquisa; citar Trabalhos Futuros #4, #7, #8; adicionar parágrafo sobre dimensão comunidade; regenerar PDF |
| `metodologia_detalhada.md` | Seção 2.2 reflete comunidade; 2.3 com split do Likert + gabarito reduzido; nota sobre ética/LGPD |
| `backlog_obione.md` | 2 novos epics (Comunidade, IA-Assistente); 6 novas US; split Likert; remover Lições Aprendidas; novo cronograma |
| `requisitos.md` | **Recriar com novo formato (ficha)**; RF01-RF18; novo RNF de LGPD e custo LLM; Backend/Frontend em Observações |
| `plano_execucao.md` | **Corrigir data T0.1 (07/05 → 16/05)**; reorganizar tarefas; redistribuir entre Bruno/Raniel (Bruno ganha stakeholders Likert); atualizar marcos; novos riscos |
| `comparativo_backlog.md` + `.pdf` | Sem mudança — histórico do 1º comparativo. Este doc de pivot é o complemento. |

---

## 8. Riscos Novos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R7 | LGPD — dados de marketing de clientes em formato semi-aberto | Média | Alto | NDA com clientes participantes; consentimento explícito; criptografia em trânsito; logs de acesso |
| R8 | Custo de LLM aumentado (mais calls: extração + resumo + drafts) | Média | Médio | Estimativa de tokens na semana 8; modelo mais barato para drafts iniciais; caching agressivo |
| R9 | Prazo apertado pós-pivot (perdemos 1 semana) | Alta | Alto | Cortes já feitos (Lições, notificações email); SR1 apresenta plano, não código; Bruno+Raniel paralelos |
| R10 | Complexidade do auth e perfis (não estava previsto) | Média | Médio | Auth simples (email+senha+JWT); sem OAuth; bibliotecas FastAPI padrão (passlib + python-jose) |
| R11 | Resistência dos clientes a participar do observatório | Média | Alto | Bruno inicia contato na semana 8; valor proposto na 1ª conversa é "ver o que estamos observando do seu projeto" |
| R12 | Drafts gerados pela IA serem percebidos como pobres ou enviesados | Média | Médio | Consultor SEMPRE revisa antes de publicar; medir no Likert da consultoria |

Os riscos R1-R6 do backlog original (acesso stakeholders, heterogeneidade `.docx`, custo LLM, Kappa baixo, esforço gabarito, mudança schema) continuam válidos com os ajustes do gabarito reduzido.

---

## 9. Próximos Passos

Sequência de atualizações dos artefatos, em ordem de dependência:

1. ✅ **Este doc de pivot** — fundamentação ancorada na tese
2. Atualizar `proposta_observatorio_obione.md` + regenerar PDF
3. Atualizar `metodologia_detalhada.md`
4. Atualizar `backlog_obione.md`
5. **Recriar `requisitos.md`** com novo formato (ficha — RF01-RF18, BE/FE em Observações)
6. Atualizar `plano_execucao.md` (incluindo correção da data de T0.1)
7. Salvar memórias (decisão de pivot + lembrete de data)
8. Commits temáticos (2-3 separados para rastro claro)

**Convenções decididas durante a discussão:**
- IDs dos requisitos: **RF01-RF18** (continuidade com docs atuais)
- Backend/Frontend split: **em "Observações"** de cada ficha
- Cliente piloto da rubrica de avaliação: **Valença Odontologia** (complexidade baixa)
- LLM: a definir pelo Raniel (decisão técnica)
- Auth: email + senha + JWT, sem OAuth
- Notificações: **feed in-app simples** (não email externo)
