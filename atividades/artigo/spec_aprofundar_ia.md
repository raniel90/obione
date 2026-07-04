# Spec — Aprofundar a Camada de IA no artigo (§4.3)

Data: 2026-07-03 · Base: `atividades/artigo/build_sbc_docx.py` (canônico SBC) + `artigo_obione.md` (espelho).

## Objetivo

A camada de IA é o diferencial da solução e está descrita de forma rasa (um parágrafo em §4.3). Aprofundá-la com base **no código real** (`backend/.../ai/`), de forma **enxuta e explicativa**, respeitando o limite do documento: sem prompts verbatim, sem apêndice novo, com **um diagrama simples embutido** (não PNG).

## Decisões aprovadas (brainstorming)

1. Aprofundar **na §4.3** (corpo), não em apêndice; sem prompts literais (apenas explicar).
2. Apresentar os **5 papéis reais** (o texto atual erra: diz 4, incluindo uma "Consultora" inexistente).
3. **Conectora**: descrita como "implementada com mitigações, avaliação em aberto"; reconciliar §7.
4. Diagrama = **fluxo simples dentro do documento** (tabela/linha de etapas com setas), não imagem PNG.
5. Ganho líquido ~1 página; proporcional ao papel de diferencial.

## Fatos do código (fonte da verdade — não inventar)

Arquivos: `backend/src/main/java/br/com/obione/ai/` (`LlmClient`, `OpenAiLlmClient`, `MockLlmClient`, `service/AiAssistantService`, `service/AiSuggestionAcceptanceService`, `controller/AiController`, `entity/AiSuggestionLog`, `enums/AiSuggestionType`, `dto/*`), `mpo/MpoCatalog`, `observations/service/ObservationService`, `src/main/resources/application.yml`.

- **5 papéis generativos** (enum `AiSuggestionType`: DOMAIN, OBSERVATIONS, KNOWLEDGE, SYNTHESIS, PROJECT_SETUP), expostos em `AiController`:
  - **Categorizadora** — `POST /projects/{id}/ai/suggest-domain`: resumo + objetivo + slugs → domínio (slug) + confiança + justificativa.
  - **Observadora** — `POST /projects/{id}/ai/suggest-observations`: resumo + objetivo + lente MPO + atributos prioritários → observações, cada uma mapeada a um attributeId + impacto (LOW/MEDIUM/HIGH) + trecho literal.
  - **Sintetizadora** — `POST /discussions/{id}/ai/suggest-knowledge`: título + pergunta + contribuições → rascunho de aprendizado (título, resumo, evidência, recomendação, confiança).
  - **Conectora** — `POST /domains/{id}/ai/synthesize`: nome do domínio + resumos dos projetos → síntese anonimizada (padrões, lições). **Implementada, não avaliada.**
  - **Configuradora** — `POST /ai/project-setup`: nome + descrição + objetivo → domínio + 3-8 attributeIds + 2-4 fenômenos esperados + justificativa (pré-criação, wizard).
  - (`GET /ai/stats` = métricas, não papel.)
- **Técnicas**: saída estruturada via Spring AI `.entity(DTO.class)` (JSON mapeado ao schema, sem parsing manual); **grounding** na "lente MPO" (44 atributos do Quadro 37, `MpoCatalog.inScopeAttributes()`, injetados no prompt); instruções anti-alucinação nos prompts ("não inventar attributeId fora da lista", "citar o trecho literal"); **validação determinística em Java** (attributeIds filtrados contra o catálogo; slug de domínio inválido é descartado antes de retornar); `gpt-4o-mini`, `temperature 0.3` (`application.yml`); sem few-shot/tools/retry/chunking.
- **Provedor** selecionável por `obione.llm.provider` (`@ConditionalOnProperty`): `mock` (determinístico, sem chave, default) ou `openai` (Spring AI). Interface `LlmClient` (port) com dois adaptadores.
- **O que é feito com os dados / pipeline**: `description`/contexto → `AiAssistantService` monta contexto + lente MPO → `LlmClient` (mock|openai, saída estruturada) → **journaled em `ai_suggestion_logs`** (type, provider, model, projectId/discussionId/domainId, payload JSON, accepted, createdAt = RNF04). **A IA nunca grava em observações/aprendizados.** A persistência só ocorre na **aceitação humana**: `ObservationService.create` (origem `AI_SUGGESTED`, guarda suggestionId/excerpt) e `ProjectService.create` chamam `AiSuggestionAcceptanceService.markAccepted`, que marca o log. Taxa de aceite via `GET /ai/stats`.

## Conteúdo-alvo da §4.3 reescrita (enxuta)

Ordem e blocos (substituem o parágrafo único atual de 4.3):

1. **Abertura (1-2 frases):** a IA é a camada assistiva sobre o ciclo observação → conversa → aprendizado, organizada em cinco papéis; todas as saídas são sugestões (human-in-the-loop).
2. **Tabela — os cinco papéis.** Colunas: *Papel · Função (o que faz) · Entrada · Saída*. 5 linhas (acima). A linha da Conectora indica "implementada; não avaliada". Larguras definidas para caber A4 (ex.: 3.0 / 4.5 / 3.75 / 3.75 cm). Numeração: por ordem de aparição, a §4.3 vem antes da §5.2, então esta é a **Tabela 3** (após 1 Participantes em §3.3 e 2 Rastreabilidade em §4.1). Referenciar no texto ("A Tabela 3 resume os papéis"). **Consequência:** o comparativo em §5.2 renumera de Tabela 3 para **Tabela 4** (caption + referência in-text "A Tabela 4 apresenta o comparativo").
3. **Fluxo de processamento (1 parágrafo + diagrama simples).** Diagrama = **Figura 1**: uma tabela de 1 linha com as etapas em caixas e setas entre elas (ou linha centralizada com `→`): `Descrição do projeto → Contexto + lente MPO (44 atributos) → Provedor de IA (mock | OpenAI, saída estruturada) → Registro em ai_suggestion_logs (proveniência) → Revisão do consultor → Observação/Aprendizado`. Legenda estilo SBC. É a **primeira Figura numerada do corpo** (as telas do Apêndice C são C.1–C.6); nomear "Figura 1. Pipeline da camada de IA."
4. **Técnicas (1 parágrafo, explicando):** saída estruturada (JSON forçado ao schema); grounding na lente MPO; orientação anti-alucinação (não inventar atributos fora da lista; citar o trecho literal); validação determinística em Java que descarta ids/domínios inválidos; `gpt-4o-mini` com temperatura 0,3; provedor configurável (mock determinístico para testes / OpenAI para uso real). **Sem citar prompts na íntegra.**
5. **Human-in-the-loop + proveniência (1 parágrafo):** a IA sugere e registra tudo em `ai_suggestion_logs` (provedor, modelo, instante, aceite — reprodutibilidade), mas **não escreve** nas observações/aprendizados; a persistência ocorre apenas na aceitação humana, com origem `AI_SUGGESTED`; a taxa de aceite é observável (`/ai/stats`).

## Ajustes fora da §4.3

- **§4.6 / demais menções a "quatro papéis":** corrigir qualquer referência a "quatro papéis" ou "Consultora" para os cinco papéis reais (verificar §4.3 antiga e §5/§6 se citarem). A Sintetizadora aparece em §4.6 ("consolidação de aprendizados com apoio da Sintetizadora") — manter.
- **§7 Conclusão / Questões em aberto:** trocar "explorar a síntese cross-projeto (Conectora), que ficou fora do escopo deste estudo" por algo como "avaliar a síntese cross-projeto (Conectora), já implementada com mitigações (anonimização e gate de publicação), cuja avaliação permanece em aberto".
- **§4.2 Arquitetura:** manter; opcionalmente uma frase ligando a camada de IA como port/adaptador (sem inflar).

## Numeração e figuras (impacto)

- Nova **Tabela 3** (papéis) em §4.3; o comparativo em §5.2 renumera para **Tabela 4** (caption + in-text). Tabela 1 (Participantes) e Tabela 2 (Rastreabilidade) inalteradas; A.1/C.1 seguem com prefixo de letra.
- Nova **Figura 1** (pipeline) em §4.3; as figuras do Apêndice C permanecem C.1–C.6 (prefixo de letra). Não há outras "Figura N" no corpo, então "Figura 1" é livre.

## Fora de escopo

- Prompts verbatim; apêndice técnico novo; mudanças no código; avaliação da Conectora.

## Critérios de aceite

- §4.3 reescrita com: tabela dos 5 papéis (Conectora marcada), diagrama de fluxo simples (Figura 1), parágrafo de técnicas (explicado, sem prompts), parágrafo de human-in-the-loop + proveniência.
- Nenhuma menção remanescente a "quatro papéis" ou "Consultora".
- §7 reconciliado quanto à Conectora.
- Fatos batem com o código (papéis, endpoints, gpt-4o-mini/0,3, ai_suggestion_logs, aceitação humana).
- 0 em dash no corpo; docx + PDF regenerados; markdown espelho sincronizado; crescimento ~1 página (não massivo).

## Implementação (visão geral, para o writing-plans)

1. Reescrever a §4.3 em `build_sbc_docx.py` (tabela dos papéis via `table(..., widths=...)`; diagrama de fluxo via uma `table` de 1 linha com setas + `caption("Figura 1. ...")`; 3 parágrafos).
2. Corrigir menções a "quatro papéis/Consultora"; ajustar §7 (Conectora).
3. Sincronizar `artigo_obione.md` (mesma tabela em GFM; o fluxo como linha de etapas com `→` ou lista).
4. Regenerar docx + PDF; QC visual (caber A4, sem quebras feias); copiar para o Desktop; commit (novo PR ou empilhar em `dev`).
