# Smoke Test — Pipeline LLM com Ollama / Llama 3.1 8B

Registro do primeiro smoke ponta-a-ponta do pipeline de extração contra um `.docx` real de cliente. Subsidia o relato de experiência (T6).

**Data:** 2026-05-20
**Branch:** `feat/backend-chassis-phase-0`
**Modelo:** `llama3.1:8b` (Q4_K_M, 4.9 GB) via Ollama 0.24.0
**Host:** MacBook M-series (ARM64), 8 GB RAM, OLLAMA_FLASH_ATTENTION=1, OLLAMA_KV_CACHE_TYPE=q8_0

---

## Configuração

`.env` do backend:
```
LLM_PROVIDER=ollama/llama3.1:8b
LLM_BASE_URL=http://host.docker.internal:11434
```

`docker-compose.yml` precisa do mount `../atividades:/app/atividades:ro` para o `MockExtractor` fallback e para o adapter futuro consumir o schema formal.

Ollama rodando no host:
```
brew install ollama
OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 \
  /opt/homebrew/opt/ollama/bin/ollama serve &
ollama pull llama3.1:8b
```

---

## Documento de entrada

`contexto/projetos/Valença Odontologia/Consultório Valença Odontologia _ Blindagem Contratual e Consentimento.docx`

- 2.098 caracteres de texto extraído (parágrafos + tabelas via python-docx)
- Estrutura clara em seções numeradas (1. Identificação, 2. Contexto e Objetivo, 3. Escopo, 4. Planejamento, 5. Execução, 6. Resultado real, 7. Lições aprendidas, 8. Governança)
- Domínio: consultoria jurídica para clínica odontológica

---

## Resultado

**Endpoint:** `POST /projects/{pid}/extractions/from-document/{did}` → 201 em **~46 s**.

**Cobertura: 19/44 atributos preenchidos** (43%), excluindo `_meta` (sempre stampado pelo servidor).

| Atributo | Valor extraído |
|---|---|
| nome_projeto | "Revisão contratual e termos de consentimento odontológico" |
| descricao | "Construir contrato de tratamento, incluir cláusulas protetivas…" |
| tipo | "jurídico + compliance documental + proteção contratual" |
| porte | "pequeno" |
| objetivos | "blindar juridicamente o consultório com documentos mais sólidos…" |
| justificativas_projeto | "fragilidade contratual e risco jurídico em relação a procedimentos ortodônticos." |
| impactos_projeto | "curto/longo prazo" |
| indicadores_projeto | "redução de risco contratual, padronização de consentimento, melhor segurança operacional" |
| artefatos_produzidos | "contrato 1º versão, termo geral e termo específico de ortodontia." |
| detalhes_equipe | "advogado, cliente, documentação clínica" |
| requisitos | "clareza, concisão e proteção jurídica" |
| data_inicio | "2026-01-01" (correctamente normalizado de "jan/2026") |
| data_fim_planejada | "2026-04-01" (correctamente normalizado de "abr/2026") |
| entregas_realizadas | "documentação contratual consolidada" |
| status_cronograma | "concluido" (enum aceito após normalização lowercase) |
| custo_estimado | 800.0 (R$ 800 → number puro) |
| pontos_fortes | "foco em cláusulas realmente úteis" |
| pontos_fracos | "risco inicial de contrato ficar extenso demais" |
| dificuldades_encontradas | "escopo evolutivo e necessidade de equilíbrio entre proteção e simplicidade" |

Atributos que voltaram `null` foram, na maioria, genuinamente ausentes no documento (e.g. `nome_stakeholders`, `tarefas_projeto`, `riscos_identificados`).

---

## Decisões que destravaram a extração

1. **Direct OpenAI SDK em vez de Instructor wrapper.** Com `Instructor.Mode.TOOLS` + Llama 3.1 8B, o modelo respondia em prosa, não via tool_calls — três tentativas dentro do retry budget e todas falhavam validação. Com `Instructor.Mode.JSON_SCHEMA`, o modelo emitia all-null em 13 s (path-of-least-resistance). Solução: chamar `openai.OpenAI.chat.completions.create(response_format={"type":"json_object"})` direto, sem o overlay do Instructor.
2. **Embedir o nome dos 44 campos no system prompt.** O modelo precisa SABER os nomes exatos — `extra="ignore"` no Pydantic descarta silenciosamente chaves inventadas (`"nome"` em vez de `"nome_projeto"`), o que dava cobertura 0%.
3. **`_meta` stampado server-side.** O modelo inventava `datePublished`, `_projeto_nome` com underscore, etc. Forçar o LLM a emitir `_meta` correto custava todo o retry budget. Solução: o LLM produz só os 44 atributos via `_ProjetoSemMeta`, e o adapter monta `_meta` autoritativo após validação.
4. **Lowercase enum normalizer.** Pré-validator (`@field_validator(mode="before")`) abaixa "Pequeno" → "pequeno" antes da `Literal` validation.
5. **`base_url=host.docker.internal:11434/v1`.** O backend roda em container, Ollama no host; default `localhost:11434` do Ollama provider não alcança.

---

## Limitações conhecidas

- **Cobertura 43%** está abaixo do alvo do MPO mas dentro do que se espera de um modelo 8B aberto na primeira passada. Sprint 5 (US15) avalia formalmente com gabarito manual + métricas (precisão/recall/F1/Kappa).
- **Latência ~46 s/documento** no M-series sem GPU dedicada. Cada doc do estudo de caso (5×) custaria ~4 min — aceitável para batch overnight, lento para iteração interativa.
- **Sem provenance por atributo** ainda — _meta é nivel-documento. Sprint 5 (US15) pode requerer trecho-de-origem por atributo; ficaria como nova entrega.
- **Provider Anthropic foi removido do adapter direto** — o `from_provider` da Instructor era a única ponte. Para benchmarkar contra Claude (Sprint 5), reintroduzir Instructor para esse caminho específico.
- **Não é determinístico** — `temperature=0.2` reduz variância mas execuções repetidas variam de 17 a 21 campos preenchidos.

---

## Próximos passos

- Rodar smoke nos outros 4 projetos do estudo (Freire Batista, Kaka JJ, Bem Viver, Dinoah) antes de abrir PR pro `main`.
- Cobertura por categoria do MPO no Sprint 5 (US09 indicador de cobertura + US15 avaliação).
- Reabilitar caminho Anthropic via Instructor antes da Sprint 5 (US15 benchmark OS vs SOTA).
