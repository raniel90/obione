# Refinamento do ObiOne — Observatório de Projetos para Consultorias

Documento de design que registra o **segundo refinamento** do escopo do ObiOne em **28/05/2026**, aprofundando o pivot de 16/05/2026 (`pivot_observatorio_comunidade.md`).

Enquanto o primeiro pivot acrescentou a dimensão *comunidade* (consultoria + clientes, comentários, feed, IA-assistente), este refinamento corrige uma limitação mais profunda: o ObiOne ainda girava em torno de um **único quadro do MPO** (Quadro 37, os 44 atributos), tratando o problema como um *de-para* documento→atributos. Este documento reposiciona o ObiOne como um **observatório de projetos para consultorias**, fiel ao MPO **completo** (3 conceitos gerais), em que o portfólio é apenas um conteúdo *contido* no observatório.

---

## 1. Contexto e Motivação

### 1.1 A limitação que persistia após o primeiro pivot

O pivot de 16/05 resolveu a crítica "um observatório é mais que um dashboard" adicionando comunidade e IA-assistente. Mas manteve duas amarras:

1. **Tudo orbitava o Quadro 37.** O Quadro 37 não é o MPO — é **uma folha da árvore**: detalha apenas o conceito específico *Projetos*, dentro de *Conteúdos → Estruturas*. O ObiOne implementava bem a metade "ingestão de dados" do MPO (extrair atributos → mostrar cobertura) e quase nada da metade "produção de conhecimento".
2. **Conhecimento intra-projeto apenas.** O pivot cortou explicitamente o cross-projeto ("Cross-projeto fica fora do MVP") e o papel "Conectora" da IA ("risco de Frankenstein"). Com isso, cada cliente era um observatório isolado — N fichas, não um observatório.

### 1.2 A virada

> Não somos um *observatório de portfólio* — o portfólio está **contido** no observatório. Somos um **observatório de projetos para consultorias**, onde uma consultoria observa seu universo de clientes, projetos, **temáticas** e **conhecimento** que emerge do conjunto.

A multiplicidade de clientes (5-6 casos reais em segmentos distintos: jurídico, saúde, esporte, branding, doceria) deixa de ser coincidência e passa a ser **o objeto de observação**. O Quadro 37 vira **insumo** (a célula-projeto), não destino.

---

## 2. Posicionamento e Pergunta de Pesquisa

### 2.1 Posicionamento

> **ObiOne — Observatório de Projetos para Consultorias**, potencializado por IA Generativa.

| Papel no MPO | Quem/o quê no ObiOne |
|---|---|
| Equipe de Gestão e Desenvolvimento do Observatório | A **consultoria** (organização executora) |
| Partes Interessadas dos Projetos + Usuários do Observatório | Os **clientes** finais |
| Conteúdo → Projetos | O **portfólio** (célula = 44 atributos por projeto) |
| Conteúdo → Temáticas | **Segmentos** (jurídico, saúde, esporte, branding, …) |
| Processo → Combinar | A **Conectora** (síntese cross-projeto por IA) |

### 2.2 Pergunta de pesquisa refinada

> *"Como a IA Generativa pode viabilizar um observatório de projetos para consultorias — convertendo documentos heterogêneos de múltiplos clientes em conhecimento de portfólio observável (transparência, comparação e conhecimento cross-projeto) — reduzindo a fricção de manutenção e fortalecendo a relação consultoria–cliente?"*

### 2.3 A virada conceitual em uma frase

O ObiOne deixa de ser "extrair 44 atributos e mostrar cobertura" (metade *Estruturas / Gerenciar Dados* do MPO) e passa a **fechar o ciclo do MPO**, incorporando *Produzir Conhecimento* (Categorizar, Combinar, Visualizar, Monitorar, Comunicar) e *Motivações* projetadas (Transparência, Conhecimento, Tomada de Decisão, Engajamento).

---

## 3. Fidelidade ao MPO Completo

O MPO (Vieira, 2022; Farias Júnior et al., IEEE Access 2025) organiza-se em **3 conceitos gerais**, ligados por relações horizontais (*Estruturas viabilizam Processos*; *Agentes participam dos Processos*; *Agentes utilizam Estruturas*).

### 3.1 Mapa de cobertura (antes × depois)

| Conceito geral | Conceitos relevantes | ObiOne antes | ObiOne depois |
|---|---|---|---|
| **Estruturas → Componentes** | Coleta, Processamento, Armazenamento, Relacionamento | ✅ Forte | ✅ Mantido |
| **Estruturas → Conteúdos** | Projetos, **Temáticas**, Usuários | ✅ Projetos · ❌ Temáticas | ✅ Projetos · ✅ **Temáticas (novo)** |
| **Estruturas → Características** | Cobertura, **Acesso semi-aberto**, Rede de Colaboração | ⚠️ Cobertura só | ✅ Cobertura + Acesso projetado + Rede |
| **Processos → Gerenciar Dados** | Coletar, Tratar, Armazenar, Disponibilizar | ✅ Forte | ✅ Mantido |
| **Processos → Produzir Conhecimento** | Categorizar, **Combinar**, Visualizar, Monitorar, Comunicar | ❌ Quase ausente | ✅ **Camada nova (núcleo do refino)** |
| **Agentes → Atores** | Equipe de Gestão, Partes Interessadas, Usuários | ✅ Papéis (auth) | ✅ Mantido |
| **Agentes → Motivações** | Transparência, Conhecimento, Decisão, Engajamento | ⚠️ Incidental | ✅ Projetadas no design |

**Conclusão:** o refino ativa exatamente os conceitos do MPO que estavam dormindo — *Temáticas*, *Categorizar*, *Combinar*, *Visualizar/Monitorar* — que são o que distingue um observatório de um repositório, e o que os casos reais da tese (NPI/UFC, OP-UPE, ObrasPE) todos tinham.

---

## 4. Arquitetura Funcional

A célula-projeto (extração dos 44 atributos) **não muda**. O refino adiciona **3 bounded contexts** sobre o backend existente, reusando o padrão atual (models/repository/service/schemas/dependencies/router/exceptions, Unit of Work, ports & adapters).

### 4.1 Contextos novos

| Contexto | Conceito MPO | Responsabilidade |
|---|---|---|
| `themes/` | Conteúdo→Temáticas · Processo→Categorizar | Cada projeto recebe uma temática/segmento. IA infere (via LLM port), consultor curatoria. Base de todo agrupamento cross-cliente. |
| `portfolio/` | Processo→Visualizar/Monitorar · Característica→Cobertura | **Read-model / analytics**: indicadores cross-projeto (status, porte, risco, % cobertura, evolução) agregados e comparáveis, agrupáveis por temática. Não duplica dado — agrega o que já existe. Alimenta o cockpit da consultoria. |
| `synthesis/` | **Processo→Combinar** (a Conectora) | IA lê N projetos de uma temática → gera **rascunho de síntese** (padrões, riscos comuns, boas práticas) → consultor revisa/edita → **publica**. As sínteses publicadas constituem a camada de conhecimento comum visível ao cliente. |

### 4.2 Reúso direto (sem padrão novo)

- `auth` (papéis consultor/cliente/admin), `projects`, `documents`, `extractions` (a célula), `unit_of_work`, `exports`.
- **LLM port:** a Conectora vira um `SynthesisGenerator` com adapters `Mock` + `Instructor`, **espelhando exatamente** `resumos`/`drafts`.
- **Lifecycle consultor-no-loop:** o ciclo `draft → review → published` da síntese é o **mesmo** já implementado em `resumos`/`drafts` — zero padrão novo.
- `feed` notifica conhecimento novo publicado.

### 4.3 Fluxo de dados (cross-cliente)

```
upload .docx
  → extração da célula (44 atributos)        [extractions — existente]
  → categorização: temática do projeto        [themes — novo, IA + curadoria]
  → agregação: indicadores comparáveis         [portfolio — novo, read-model]
  → síntese por temática (Conectora, IA)       [synthesis — novo]
  → revisão/edição do consultor                [synthesis — lifecycle draft→published]
  → publicação                                  [synthesis]
  → conhecimento comum visível ao cliente       [escopado por tema, sanitizado]
```

---

## 5. Modelo de Acesso e Transparência (semi-aberto)

Característica *Acesso* do MPO: "há informações de acesso restrito a um determinado conjunto de usuários" (Vieira, 2022, p. 189).

| Perfil | O que enxerga |
|---|---|
| **Consultoria** | Visão plena — cockpit do portfólio, todas as temáticas, todas as sínteses (rascunho + publicadas). |
| **Cliente** | Próprio projeto + conhecimento comum **publicado** da(s) sua(s) temática(s): padrões/boas práticas agregados. **Nunca** atributos crus de outro cliente. |

### 5.1 Gate de LGPD

A etapa de **revisão do consultor antes de publicar** é o ponto de sanitização. Com **dois clientes no mesmo segmento** (Freire Batista ADV e Dinoah ADV, ambos jurídico), a Conectora gera agregados/anonimizados e o consultor confirma que nada é re-identificável antes de publicar. Vira **RNF explícito** (isolamento entre clientes + anonimização no conhecimento comum).

---

## 6. Avaliação Refinada (DSR, dupla)

### 6.1 Quantitativa — célula (mantida)

Cobertura / precisão / recall / F1 da extração dos 44 atributos (estruturado: comparação exata; texto livre: rubrica humana 0/0,5/1 com índice de concordância entre dois avaliadores). Sem mudança.

### 6.2 Quantitativa/qualitativa — camada nova

- **Acurácia da categorização:** temática atribuída pela IA × curadoria do consultor.
- **Rubrica humana sobre as sínteses** da Conectora: fidelidade, utilidade, ausência de alucinação e **ausência de vazamento cross-cliente**.

### 6.3 Percepção (Likert ajustado, escala 1-5)

| Audiência | Dimensões |
|---|---|
| **Consultoria** | Utilidade dos drafts · Redução de fricção · Qualidade do resumo · **Valor do conhecimento de portfólio para decisão (novo)** · **Qualidade das sínteses / esforço de curadoria (novo)** |
| **Cliente** | Clareza do resumo · Utilidade do espaço · Qualidade do diálogo · Sentido de inclusão · **Valor do conhecimento comum (novo)** · **Transparência (novo)** |

---

## 7. Novos Requisitos (resumo)

Detalhamento completo a ser incorporado em `requisitos.md` e `backlog_obione.md`.

| ID | Requisito | Conceito MPO |
|---|---|---|
| **RF19** | Categorizar projeto por temática/segmento (IA infere + consultor curatoria) | Conteúdo→Temáticas · Categorizar |
| **RF20** | Cockpit de portfólio: indicadores comparáveis cross-projeto, agrupáveis por temática | Visualizar/Monitorar |
| **RF21** | Conectora: síntese cross-projeto por temática (IA, lifecycle draft→review→published) | **Combinar** |
| **RF22** | Conhecimento comum: sínteses publicadas visíveis ao cliente, escopadas por tema e sanitizadas | Comunicar/Disseminar · Acesso semi-aberto |
| **RNF novo** | Isolamento entre clientes + anonimização obrigatória no conhecimento comum (gate de revisão do consultor) | Acesso · Segurança · LGPD |

---

## 8. Faseamento

> **Datas a confirmar com o grupo antes de cristalizar** (histórico de deslize de datas no projeto).

| Fase | Janela (a confirmar) | Entrega |
|---|---|---|
| **Agora → SR2** | ~28/05 → ~19/06/2026 | `themes` (categorização) + `portfolio` (cockpit comparativo). Demonstra **observação cross-cliente**. |
| **SR2 → entrega final** | ~19/06 → ~10/07/2026 | `synthesis` (Conectora) + conhecimento comum + **avaliação dupla** consolidada. |

---

## 9. Artefatos a Atualizar

1. **Este documento** — design do refinamento (✅).
2. `proposta_observatorio_obione.md` + PDF — reposicionamento + nova pergunta de pesquisa + mapa MPO completo.
3. `requisitos.md` — adicionar RF19-RF22 + RNF de isolamento/anonimização.
4. `backlog_obione.md` — 2 epics novos: **Observação de Portfólio** (RF19-RF20) e **Conhecimento Cross-Projeto** (RF21-RF22).
5. `plano_execucao.md` — faseamento SR2/final, redistribuição de tarefas.
6. `protocolo_avaliacao.md` — rubrica de síntese + acurácia de categorização + dimensões Likert novas.
7. Backend — 3 bounded contexts novos (`themes`, `portfolio`, `synthesis`) seguindo a arquitetura existente.

---

## 10. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R13 | Conectora alucinar ou vazar dado cross-cliente | Consultor-no-loop obrigatório; rubrica de avaliação inclui "ausência de vazamento"; anonimização no prompt. |
| R14 | Escopo cross-cliente estourar o prazo | Faseamento: temáticas+cockpit no SR2, Conectora na final; backend já cobre a célula. |
| R15 | Poucos projetos por temática para síntese significativa | Agrupar por temática ampla (ex.: "serviços jurídicos") quando o segmento tem ≥2 projetos; documentar limitação amostral acadêmica. |
| R16 | Categorização automática imprecisa | Curadoria do consultor é obrigatória; IA propõe, humano confirma. |

Riscos R7-R12 do pivot anterior continuam válidos.

---

## 11. Referências

- VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese (Doutorado) — CIn/UFPE, Recife, 2022.
- FARIAS JÚNIOR, I. H.; VIEIRA, J. K. M.; MOURA, H. P.; SAMPAIO, S. **A Conceptual Model for Project Observatories**. IEEE Access, v. 13, 2025.
- VIEIRA, J. K. M.; FARIAS JÚNIOR, I. H.; MOURA, H. P. **Observatories as Transparency Instruments for Projects**. CISTI, 2020.
- VIEIRA, J. K. M.; FARIAS JÚNIOR, I. H.; MOURA, H. P. **Utilization of a Conceptual Model in Projects Observatories Development: A Case Study**. SBSI.
- `pivot_observatorio_comunidade.md` — primeiro pivot (16/05/2026).
