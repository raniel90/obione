# Comparativo de Backlog do ObiOne

**Documento de apoio para reunião do grupo.** Compara o backlog original proposto pelo colega com a versão revisada, justificando cada mudança em termos da **proposta acadêmica** (atividade 1) e da **metodologia DSR de 12 semanas**.

---

## Contexto

O backlog original é um bom desdobramento de **produto**. A revisão não o descarta: parte dele e o ajusta para garantir que o trabalho entregue, ao final das 12 semanas, **um artefato avaliado via DSR** — o que a banca vai cobrar — e não apenas um produto que funciona.

Critério único de revisão: **toda funcionalidade precisa estar a serviço da pesquisa**. Cobertura do MPO, precisão/recall/F1 contra gabarito manual, e Likert dos stakeholders são os entregáveis-fim. Tudo o que não alimenta esses entregáveis foi adiado.

---

## Resumo Executivo

| Categoria | Quantidade |
|---|---|
| **Mantidos** (sem alteração estrutural) | 4 itens |
| **Refinados** (mantidos com ajuste de critério ou escopo) | 3 itens |
| **Adicionados** (estavam ausentes; necessários para fechar o DSR) | 10 itens |
| **Movidos para backlog futuro** (fora das 12 semanas) | 14 itens |
| **Removidos** (não previstos na proposta) | 2 itens |

---

## 1. Mantidos

User stories do original que permanecem com mesma intenção e escopo.

| Original | Revisado | Observação |
|---|---|---|
| US01 — Criar Projeto (nome, domínio, descrição) | US01 — Cadastrar projeto | Mantido. Domínios listados explicitamente: jurídico, saúde, esporte, branding, outros. |
| US02 — Upload de Documento (PDF, TXT, DOCX) | US02 — Upload de documentos | Mantido. Reforço do formato Word (.docx) como obrigatório, por ser o usado nos casos reais. |
| US04 — Estruturação JSON | US04 — Persistir extração estruturada | Mantido. Adiciona registro de versão do prompt e modelo LLM para reprodutibilidade. |
| US12 — Detalhe do Projeto | US06 — Visualizar detalhe do projeto | Mantido. Adiciona agrupamento por categoria do Quadro 37 e trecho de origem por atributo. |

---

## 2. Refinados

Itens cuja **intenção** se manteve, mas o **critério** foi ajustado para alinhar à proposta DSR.

### US03 — Extração com IA → US03 — Extrair atributos do MPO via LLM

| Antes | Depois | Motivo |
|---|---|---|
| Extrair: escopo, objetivos, riscos, stakeholders | Extrair os atributos previstos no **Quadro 37 (terceira versão do MPO — Vieira, 2022)**, abrangendo as 8 categorias: geral, stakeholders, escopo, cronograma, custos, riscos, mudanças, lições aprendidas | A proposta diz textualmente que o pipeline extrai *"os atributos previstos no MPO"*. Lista própria desancora a pesquisa do referencial. |

Critérios adicionais (não estavam no original):
- Cada atributo extraído acompanha **trecho de origem** (citação do documento) — necessário para auditoria humana na avaliação.
- Atributos não encontrados são marcados como `null` — **nunca inventados**.
- Versão do prompt e modelo LLM registrados (reprodutibilidade científica).

### US11 — Dashboard Básico → US05 — Visualizar portfólio

| Antes | Depois | Motivo |
|---|---|---|
| Listar projetos, mostrar risco | Listar projetos com nome, domínio, **status derivado** (cadastrado / ingerido / extraído / avaliado), **% de cobertura do MPO** | "Risco" como métrica de portfólio é parte do EPIC 3 que foi adiado. Cobertura do MPO é o indicador que a avaliação DSR exige. |

### EPIC 5 — US13 (Linha do Tempo)

Removido como US específica. Substituído por **status derivado** em US05, que representa o estado atual sem precisar de timeline interativa. Linha do tempo completa fica no backlog futuro.

---

## 3. Adicionados

Itens que **não existiam** no backlog original, mas são **necessários** para que a metodologia DSR feche.

### Fase Preparatória (semanas 1–2)

Quatro entregáveis sem os quais o Sprint 1 não tem como começar com base sólida:

1. **Lista de atributos-alvo do MPO** — derivada do Quadro 37, com cada atributo categorizado como `estruturado` ou `texto_livre`.
2. **Protocolo de avaliação** — critério híbrido de match (estruturado: comparação exata; texto livre: rubrica humana 0/0,5/1; Cohen's Kappa para concordância).
3. **Schema de extração** — formato estruturado formal, usado tanto pela extração automática quanto pela manual.
4. **Gabaritos manuais dos 5 projetos** — extração manual por dois avaliadores independentes, com **Valença Odontologia como piloto** para calibrar a rubrica.

### Novas User Stories (Sprint 2 e 3)

- **US07 — Indicador de cobertura do MPO** (Sprint 2). É o **indicador-chave** da avaliação quantitativa: % de atributos do Quadro 37 preenchidos por projeto + heatmap projetos × atributos. **Sem isto, a pergunta de pesquisa não é respondida.**
- **US08 — Importar e validar gabarito manual** (Sprint 3). Carrega o gabarito produzido na fase preparatória.
- **US09 — Comparar extração automática vs. gabarito (critério híbrido)** (Sprint 3). Calcula precisão, recall, F1 e Cohen's Kappa, separados por grupo `estruturado` e `texto_livre`. **É a essência da avaliação quantitativa do DSR.**
- **US10 — Coletar feedback Likert** (Sprint 3). Formulário em 4 dimensões (utilidade, clareza, completude, confiabilidade) com ~2 stakeholders por projeto. **É a avaliação qualitativa prevista na metodologia.**
- **US11 — Exportar resultados consolidados** (Sprint 3). Tabela exportável com extrações, cobertura, métricas e respostas Likert — alimenta o relatório e o artigo.

### Estrutura de Governança

- **Marcos do Estudo de Caso (M1–M4)** — pontos verificáveis para garantir que os 5 projetos são processados de ponta a ponta. Sem isto, o time pode terminar o MVP com US "feitas" sem nunca ter rodado os casos reais.
- **Definição de Pronto (DoD)** — por user story e por sprint, incluindo demo curta para o grupo.
- **Riscos do Projeto (R1–R6)** — acesso a stakeholders, heterogeneidade dos documentos de origem, custo de tokens, baixa concordância (Kappa < 0,6), estouro de esforço do gabarito, mudança no schema.

---

## 4. Movidos para Backlog Futuro

Itens do original que ficam **fora das 12 semanas** mas podem virar evolução pós-disciplina.

| Item original | Motivo de adiar |
|---|---|
| US05 — Atualização Incremental | Estudo de caso assume um corpo documental por projeto. Atualização incremental não é avaliada. |
| US06 — Detecção de Mudanças | Idem. |
| US07 — Versionamento | Idem. |
| EPIC 3 (US08-10) — Modelo de Risco PMBOK com pesos | Riscos já são atributo extraído do MPO. Subsistema PMBOK é artefato paralelo, não previsto na proposta. |
| US13 — Linha do Tempo | Não é cobrado pela avaliação DSR. |
| US14 — Indicadores de Portfólio (parcial) | "Cobertura do MPO" foi promovida a US própria (US07). Demais indicadores ficam pós-MVP. |
| RF16 — Qualidade do Projeto | Análise derivada que depende de outros indicadores estabelecidos primeiro. |
| US15 — Comparação entre Projetos | Fora do ciclo único de DSR. |
| RF18 — Comparação por Domínio | Idem. |
| US16 — Problemas de Comunicação | Análise derivada. |
| US17 — Resumo Automático | Feature de produto SaaS, não de artefato avaliado. |
| US18-21 — Padrões, Alertas, Insights, Recomendações | Sprint 4 inteira fica fora. Features de produto, não de pesquisa. |
| US22 — Chat com IA | Já marcado como avançado no original. Mantido fora. |
| Extração de imagens/fotos | Atributo do Quadro 37 não-textual; fora do escopo de pipeline LLM. |

---

## 5. Removidos

Itens do original sem correspondente no revisado nem no backlog futuro, por não terem ancoragem na proposta acadêmica:

| Item original | Motivo da remoção |
|---|---|
| Tabelas de pesos PMBOK (Tempo=3, Escopo=4, etc.) | Pesos sem fundamentação acadêmica; o trabalho não propõe nem valida modelo de risco próprio. |
| Fórmula `Risco Total = soma dos pesos das ocorrências` | Mesmo motivo. |

---

## 6. Conexão com a Proposta Acadêmica

A revisão está ancorada nestes pontos da proposta (atividade 1):

| Frase da proposta | Implicação no backlog |
|---|---|
| *"pipeline de extração baseado em LLM que (...) identifica e estrutura automaticamente os atributos previstos no Quadro 37 (terceira versão) do MPO"* | US03 alinhada ao Quadro 37, não a lista própria. |
| *"alimentando um dashboard de observação do portfólio"* | US05, US06, US07 cobrem o dashboard. |
| *"avaliação do artefato mediante estudo de caso com cinco projetos reais"* | US08, US09, US10, US11 + Marcos M1–M4 garantem que a avaliação acontece nos 5 casos. |
| *"comparando a extração automática com a manual para verificar a cobertura dos atributos do MPO e a acurácia da IA Generativa"* | Gabarito manual (fase preparatória) + US09 (precisão/recall/F1) + US07 (cobertura). |
| *"questionário breve (Likert 1–5) aplicado a stakeholders"* | US10 com 4 dimensões e plano de N esperado. |

---

## 7. Próximos Passos Sugeridos

1. **Revisar este comparativo em conjunto** e ajustar onde fizer sentido.
2. **Definir responsáveis** pelos 4 entregáveis preparatórios na primeira reunião.
3. **Iniciar a lista de atributos-alvo do MPO** imediatamente — é o entregável que destrava todo o resto.
4. **Marcar Valença Odontologia** como projeto piloto do gabarito.
5. **Iniciar contato com stakeholders** dos 5 projetos para o Likert (semana 1).
