# Aderência da v2 ao conceito de Observatório de Projetos (MPO)

> **Status:** documento de estratégia de produto (PM) para a v2 do ObiOne.
> Redefine o escopo para a versão atualmente construída (Spring Boot + TanStack). O documento `requisitos.md` permanece como **registro da proposta original (v1)** e é referenciado abaixo.
>
> **Atualização 10/06/2026:** o roadmap do §7 foi **integralmente entregue** (PRs #49–#54 na branch `dev`). O scorecard do §2 descreve o estado *anterior*; o estado atual está no **§9 (Adendo)**.

## 1. A pergunta certa

A avaliação **não** é "a v2 cumpre os 18 RF da proposta?". É: **a aplicação atual entrega a essência de um observatório de projetos**, no sentido do *Modelo de Observatório de Projetos* (MPO — Vieira, 2022)?

Essência de um observatório, comprimida a partir do MPO (características, processos e motivações):

1. **Lente de observação definida** — um esquema consistente do *que* se observa (no MPO: os 44 atributos / 8 categorias do Quadro 37).
2. **Coletar / Transformar rastreável** — capturar e transformar o bruto em estruturado, com **origem** (de onde veio a informação).
3. **Armazenar / Disponibilizar** — persistir e expor o conhecimento de forma perfil-aware.
4. **Categorizar / Abrangência** — organizar por temáticas/domínios; visão cross-projeto.
5. **Interagir** — comunidade que discute e dá sentido às observações.
6. **Acompanhar** — evolução ao longo do tempo (dimensão longitudinal).
7. **Avaliar** — medir (quanto conhecemos? qualidade/cobertura).
8. **Acesso semi-aberto / governança** — quem vê o quê.

Motivações do MPO: **Conhecimento, Tomada de Decisão, Engajamento.**

## 2. Scorecard — essência × v2

| Dimensão do observatório | v2 | Evidência no código |
|---|---|---|
| Lente de observação definida | ⚠️ **Fraco** | Atributos são strings opacas (`mpo-1..8`); front usa `data/mockMpoAttributes.ts` (eixo "granularidade", não o 44/8). Sem catálogo canônico no backend. |
| Coletar/Transformar rastreável (evidência→estruturado, com origem) | ❌ **Ausente** | Observação é texto digitado à mão (`observations/`); sem evidência/fonte; sem pipeline de transformação. |
| Armazenar/Disponibilizar perfil-aware | ✅ Bom | Persistência JPA; telas por domínio/projeto. |
| Categorizar/Abrangência (cross-projeto) | ✅ **Forte** | `domains/` como entidade de 1ª classe; `phenomena/` transversais; observatório agrega. |
| Interagir (comunidade) | ✅ **Forte** | `discussions/` com contribuições tipadas → `knowledge/` consolidado. |
| Acompanhar/temporal | ⚠️ Fraco | Feeds/timeline são mock; pouca longitudinalidade real. |
| Avaliar (cobertura/qualidade) | ❌ **Ausente** | Sem medição de "quanto conhecemos" de cada projeto. |
| Acesso semi-aberto/governança | ⚠️ Simulado | Papéis existem, mas `SecurityConfig` = `permitAll`; settings é "governança simulada (mock)". |
| Motivações (Conhecimento/Decisão/Engajamento) | ✅/➖ | Conhecimento e Engajamento fortes; Decisão média. |
| **IA Generativa (diferencial declarado)** | ❌ **Ausente** | Zero contexto LLM/IA no backend (`grep` por llm/openai/anthropic/extract/prompt → nada). |

## 3. Veredito

A v2 é hoje um **forte observatório-comunidade** (Abrangência + Interação→conhecimento + Engajamento) e um **fraco observatório-de-medição** (lente + evidência rastreável + cobertura + governança efetiva). Tem a essência *social/conhecimento*; falta a essência *instrumento/medição*. Além disso, **a IA — diferencial central da proposta — não está implementada**.

Sem lente consistente, sem medição e sem IA, há o risco de a banca classificar a v2 como **"comunidade colaborativa sobre um portfólio"**, não como **observatório**. A boa notícia: dá para reconquistar o rótulo "observatório" de forma legítima e barata, sem reconstruir do zero (ver §7).

## 4. Drift por bloco/RF (contexto de apoio)

| Bloco | RF | Status na v2 |
|---|---|---|
| 1 — Fundação/governança | RF01 Auth | ~Mantido (mock-token, sem JWT real) |
| | RF02 Perfis semi-abertos | Simulado (papéis sem enforcement — `permitAll`) |
| | RF03 Cadastro c/ **descrição textual** | Mutado — sem `description` longa (insumo do LLM); virou summary+objetivo+atributos/fenômenos manuais |
| | RF04 **CBAC** por atributo | Abandonado — trocado por permissão por papel |
| 2 — Pipeline LLM | RF05 Extração 44 atributos · RF06 Persistir | Abandonado (sem IA) |
| 3 — Observação/visualização | RF07 Portfólio perfil-aware | ~Mantido (perfil não filtra) |
| | RF08 Detalhe c/ 44 atributos + trecho-fonte | Mutado (mostra observações/fenômenos/discussões) |
| | RF09 **Cobertura do MPO** | Abandonado |
| 4 — Comunidade/assistente | RF10 Comentar | Mutado → discussões tipadas |
| | RF11 Feed | Mock |
| | RF12 Drafts IA | Abandonado |
| 5 — Cross-cliente | RF13 Categorizar (IA) | Mutado — domínio manual; domínio virou entidade de 1ª classe |
| | RF14 Cockpit | Mutado → dashboard de fenômenos/insights |
| 6 — Avaliação DSR | RF15–18 gabarito + Likert | Não representável na v2 (sem MPO/extração/cobertura) |

**O que a v2 ganhou (não estava no requisito):** domínios navegáveis; camada de comunidade (participantes, discussões, conhecimento consolidado com confiança); fenômenos como entidades; pipeline **observação → discussão → conhecimento**; settings de governança; `/register` público (que o RF01 proíbe).

## 5. Tese v2 (redefinida e defensável)

**ObiOne é um observatório-comunidade de conhecimento para consultorias de projetos.** A consultoria organiza o portfólio por **domínios**; cada projeto é observado e gera **observações** (evidências ancoradas em atributos do MPO e fenômenos); a comunidade (consultoria + clientes, em acesso semi-aberto por papel) **debate** essas observações em **discussões** tipadas e as **consolida em conhecimento** validado e reutilizável. O valor não é um dashboard de métricas, e sim **transformar observações dispersas em conhecimento coletivo acionável.**

**A IA Generativa volta como camada assistiva sobre esse pipeline, usando o MPO como gramática** (sempre *human-in-the-loop*, o consultor decide):
- **Categorizadora** — sugere o domínio/temática do projeto.
- **Observadora assistida** (a extratora, adaptada) — do texto/artefatos do projeto, sugere **observações candidatas mapeadas às categorias/atributos do MPO**, com trecho-fonte.
- **Sintetizadora** — resume as contribuições de uma discussão num rascunho de **conhecimento**.
- **Conectora** — sintetiza padrões/lições **cross-projeto** por domínio.

**Rastreabilidade com o MPO (honesta):** a v2 ancora-se nas características **Interatividade, Conhecimento e Engajamento** e nos processos **Observar / Interagir / Avaliar / Acompanhar** (Vieira, 2022), e responde a Trabalhos Futuros do MPO sobre interatividade e soluções computacionais — em vez de reduzir-se à extração dos 44 atributos.

### Ontologia v2

`domínio → projeto → observação → discussão → conhecimento` (com **fenômenos** transversais). Cada termo tem entidade/rota correspondente: `domains/`, `projects/`, `observations/`, `discussions/`, `knowledge/`, `phenomena/` (backend) e `routes/{domains,projects,community}*` (frontend).

## 6. Itens de honestidade (o que ajustar no discurso)

1. **IA = assistiva, não extração end-to-end.** Parar de prometer "extração automática dos 44 atributos"; a IA sugere observações/categorias/sínteses que o consultor revisa.
2. **Governança hoje é simulada** (`permitAll` + settings mock). Declarar como limitação de MVP e **risco LGPD** — endereçado pelo reforço de governança (§7).
3. **`/register` público** contradiz o RF01 ("sem cadastro público"). Documentar como *signup-com-aprovação* (`status PENDING`, deliberado para a comunidade semi-aberta) ou restringir.
4. **CBAC por atributo (RF04) → governança por papel.** A granularidade caiu; registrar a mudança.
5. **Atributos opacos `mpo-1..8`** → serão mapeados ao catálogo 44/8 (§7) para a lente ficar consistente.

## 7. Roadmap — tornar a v2 um observatório de fato (sem reconstruir)

Reforços de código baixo-médio, em PRs pequenos, **sem** IA monolítica:

1. **Lente consistente** — catálogo MPO 44/8 no backend (reaproveita o catálogo do legado `frontend/v1/src/lib/mpo/catalog.ts`); atributos de observação/projeto passam a referenciá-lo. *(Coletar/Transformar com esquema)*
2. **Cobertura** — % de categorias/atributos com ≥1 observação por projeto/domínio. *(Avaliar)*
3. **IA assistiva** — porta LLM (Spring AI: adapter **mock** default + **Ollama** local) com os 4 papéis acima, human-in-the-loop. *(Transformar rastreável + diferencial de IA)*
4. **Governança real mínima** — enforcement por papel (sai do `permitAll`). *(Acesso semi-aberto)*
5. **Acompanhamento temporal real** — feed de eventos verdadeiros (observação/discussão/conhecimento). *(Acompanhar)*

## 8. Avaliação redefinida (volta a ser mensurável)

Com a IA assistiva e a lente/cobertura, a contribuição volta a ter medição, agora alinhada à tese comunidade-conhecimento:

- **Acurácia da categorização** (domínio sugerido vs. consenso humano).
- **Qualidade das observações sugeridas** pela IA vs. gabarito humano (precisão/recall sobre a lente MPO).
- **Cobertura** alcançada por projeto/domínio ao longo do tempo.
- **Funil observação → discussão → conhecimento** (taxas de conversão; conhecimento consolidado por domínio).
- **Engajamento** (participantes ativos, contribuições/discussão, mix de tipos de contribuição).
- **Likert adaptado** — consultoria (utilidade da camada de conhecimento, redução de fricção, valor de domínios/cockpit, usabilidade da governança) e clientes (clareza, inclusão/controle, utilidade do conhecimento, qualidade do diálogo).

---

## 9. Adendo (10/06/2026) — roadmap entregue: scorecard pós-§7

Os 5 reforços do §7 foram implementados e mergeados em `dev` (PRs #49–#54). Scorecard atualizado:

| Dimensão do observatório | Antes (§2) | Agora | Evidência no código |
|---|---|---|---|
| Lente de observação definida | ⚠️ Fraco | ✅ **Forte** | Catálogo canônico 44/8 (Quadro 37) em `backend/.../mpo/MpoCatalog.java` (1 atributo `fora_de_escopo` ⇒ **43 em escopo**, alinhado ao protocolo); `GET /mpo/categories` e `/mpo/attributes`; formulários do frontend religados ao catálogo (fim do `mockMpoAttributes.ts`) |
| Avaliar (cobertura/qualidade) | ❌ Ausente | ✅ | `ProjectCoverageService` — % por categoria + global (observados/43); `GET /projects/{id}/coverage`; seção "Cobertura observacional" no detalhe do projeto |
| IA Generativa (diferencial) | ❌ Ausente | ✅ | Contexto `ai/` com 5 papéis (Categorizadora, Observadora, Sintetizadora, Conectora + setup assistido de projeto); Spring AI com `MockLlmClient` (default, sem chave) + `OpenAiLlmClient` (`gpt-4o-mini`; Ollama removido); **human-in-the-loop**: a IA só sugere, a observação nasce quando o consultor aceita |
| Acesso semi-aberto/governança | ⚠️ Simulado | ✅ (por papel) | `SecurityConfig` sai do `permitAll`: leitura autenticada; mutações `CONSULTANT`/`ADMIN`; cliente contribui em discussões (`MockTokenAuthFilter`) |
| Acompanhar/temporal | ⚠️ Fraco | ✅ | `FeedService` agrega eventos reais (observação/discussão/conhecimento), DESC por data, filtros por domínio/projeto |
| Coletar/Transformar rastreável | ❌ Ausente | ✅ | A Observadora sugere observações mapeadas a atributos do MPO **com trecho-fonte** (`sourceExcerpt`); a observação aceita persiste `origin`/`sourceExcerpt`/`suggestionId`. Resta versão de prompt + hash da fonte para rigor pleno (ver limitações) |
| Categorizar/Abrangência · Interagir · Armazenar | ✅ | ✅ | Mantidos |

**Ciclo central ponta a ponta:** IA sugere observação → consultor aceita → observação criada → cobertura sobe.

### Limitações declaradas (pós-roadmap)

1. ~~**RNF04/RNF05 não atendidos**~~ — **atendidos em 10/06/2026** (PRs #56–#60, ciclo IA): toda sugestão de IA é registrada em `ai_suggestion_logs` com provider/modelo/timestamp/payload (RNF04); a Observadora cita trecho-fonte (`sourceExcerpt`) e a observação aceita carrega `origin`/`sourceExcerpt`/`suggestionId` (RNF05); a **taxa de aceitação** por papel é derivada do log (`GET /ai/stats`). A IA ganhou provider real — **OpenAI** (`gpt-4o-mini` via Spring AI; Ollama removido; mock segue como default sem chave) — e um 5º papel: **setup assistido de projeto** (`POST /ai/project-setup`), que alimenta o novo wizard IA-first de criação (`/projects/new`, 2 etapas: descrever → revisar sugestões). Resta para o rigor pleno: versão de prompt e hash da fonte no log.
2. **RNF09 (custo de LLM) não implementado** — agora relevante com OpenAI real (era mitigado pelo Ollama local); o log de sugestões é o lugar natural para tokens/latência.
3. **Governança é por papel, não CBAC por atributo (RF04)** — mutação deliberada (§6.4); nota correspondente adicionada ao `protocolo_avaliacao.md` (10/06/2026).
4. ~~**`/register` ficou efetivamente bloqueado**~~ — **corrigido em 16/06/2026** (PR #75): a página deixou de chamar `POST /users` (staff-only) e passou a usar o novo `POST /auth/register` público (sob o `permitAll` de `/auth/**`). O `UserService.register` força `CLIENT` + `PENDING` no servidor, ignorando qualquer papel vindo do cliente (fechou o buraco de escalonamento de privilégio que existia na UI anterior, onde o visitante escolhia o próprio papel). Sem token: um usuário PENDING não loga até um admin ativá-lo em `/settings` (o `login` já exige `ACTIVE`). É exatamente o **signup-com-aprovação do §6.3** — o conflito com o RF01 ("sem cadastro público") foi documentado como decisão deliberada da comunidade semi-aberta.

---

## 10. Adendo (16/06/2026) — produto comunidade-first + validação fim a fim

Após o ciclo de IA (§9), uma onda de produto/UX consolidou a tese comunidade-conhecimento na interface e fechou o ciclo de vida do projeto. Tudo mergeado em `dev` e promovido para `main` (PRs #55 e #76; `main == dev`).

**Comunidade como conceito central (PRs #69, #70).** A comunidade passou a ser o conceito principal e o domínio um agregador dela (relação 1:1 no backend — a comunidade é derivada do `Domain`, sem entidade própria). O menu reorganizou-se em Observatório → Comunidade → Projetos → Configurações; `/community` é o hub; os projetos exibem "Comunidade" em vez de "Domínio".

**Detalhe do projeto redesenhado (PRs #68, #71, #72, #73).** A tela passou a 4 abas por contexto — **Observações** (default) · **Fenômenos** · **Aprendizados** · **Linha do tempo** — com um **funil observação → conversa → aprendizado** no topo. As discussões viraram **conversas** inline dentro de cada observação; o conhecimento consolidado virou **Aprendizados**; o `evidenceCount` do fenômeno é derivado das observações vinculadas. O **jargão MPO foi removido da UI** (o cliente não conhece o modelo) — a lente continua viva nos dados e nos docs, não na linguagem da tela.

**Loop do wizard fechado (PRs #66, #67).** Os fenômenos esperados declarados no cadastro viram **hipóteses** reais (entidades `Phenomenon`); a Observadora **prioriza os atributos declarados** no projeto; criou-se a tela `/projects/:id/edit` com roteiro de observação editável.

**`/register` corrigido (PR #75).** Vide §9, limitação #4 (resolvida): signup-com-aprovação público, `CLIENT`/`PENDING` forçados no servidor.

**Validação fim a fim (16/06/2026).** O ciclo central foi exercitado de ponta a ponta com dados de simulação, com a IA real (OpenAI): cadastro via wizard IA-first → hipóteses criadas → a Observadora prioriza os riscos declarados → consultor aceita sugestões → observação manual alimenta a cobertura e as hipóteses → conversa com participação do cliente → home e feed refletindo a atividade. Governança por papel confirmada na UI (o cliente não vê ações de staff nem a cobertura; contribui em conversas).

**Estado do scorecard.** As dimensões do §9 permanecem ✅; esta onda reforça **Interagir → conhecimento** (conversas/aprendizados de primeira classe) e **Acompanhar** (funil + linha do tempo), e melhora a legibilidade da **lente** para o cliente (sem jargão). Pendências de software remanescentes (não acadêmicas): suíte de testes do v2; JWT real (segue mock-token); **RNF09** (custo/latência de LLM, ainda não logado); versão de prompt + hash da fonte no log de IA; Postgres de produção (hoje H2 file-based).

---

*Referência: VIEIRA, J. K. M. **Observatórios de Projetos: Um Modelo Conceitual**. Tese de Doutorado — CIn/UFPE, 2022 (Quadro 37, p. 264). Proposta original do ObiOne: `atividades/requisitos.md` (v1).*
