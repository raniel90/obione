# Arquitetura do Pipeline LLM (T2.1)

Documento de decisões de arquitetura para a extração de atributos do MPO a partir de documentos `.docx`. Subsidia o relato de experiência (T6).

> **Atualização (21/05/2026):** A IA Generativa cumpre **três papéis** no ObiOne, todos seguindo o mesmo padrão de portas-e-adaptadores (Hexagonal): **Extração** (T2.1, este documento), **Resumo do Cliente** (US12) e **Drafts assistidos** (US13). As três trilhas vivem em pacotes Python distintos do backend, cada uma com sua `port.py` (`Abstract*Generator`) e adaptadores `mock.py` + (futuro) `instructor.py`. Hoje só a Extração tem adaptador LLM real validado (Llama 3.1 8B via Ollama); Resumo e Drafts rodam com geradores mock determinísticos prontos para substituição. Ver §7.

---

## Visão geral

```
.docx  →  loader (python-docx)  →  prompt builder  →  Instructor client
                                                            │
                                       OBIONE_LLM_PROVIDER (env var)
                                          ↓                  ↓
                                    ollama/llama3.1     anthropic/claude
                                          ↓                  ↓
                                       Pydantic ProjetoExtraido (validado)
                                          ↓
                                       JSON Schema validate (schema_extracao.json)
                                          ↓
                                       backend/extracoes/<projeto>.json
```

---

## Stack

| Camada | Biblioteca | Justificativa |
|---|---|---|
| Provider abstraction | [Instructor](https://python.useinstructor.com/) + Pydantic v2 | Uma linha (`from_provider`) troca Ollama ↔ Anthropic ↔ OpenAI. Retry automático em erro de validação. |
| Modelo local (dev) | Ollama + Llama 3.1 8B | $0, roda em M-series 8GB+, PT-BR razoável, JSON mode estável |
| Modelo cloud (eval opcional) | Anthropic Claude (Sprint 5) | Comparativo OS vs SOTA no relato (Sprint 5) |
| Document loader | python-docx | Parsing nativo `.docx` (parágrafos + tabelas) |
| Validação saída | jsonschema + Pydantic | Defesa em camadas |
| Mock mode | env var `OBIONE_LLM_MOCK=true` | Carrega `schema_extracao_exemplo.json`; sem dep extra |

**Descartado:** LangChain / LlamaIndex (peso desnecessário — Instructor cobre nossos casos), fine-tuning local (fora do escopo da disciplina), RAG via embeddings (cada `.docx` cabe em 128k context da Llama 3.1).

---

## Decisões de design

### 1. Provider abstraído via Instructor

Decisão: usar Instructor como camada única de chamada LLM. Trocar de provider é alterar uma string.

```python
client = instructor.from_provider(os.getenv("OBIONE_LLM_PROVIDER", "ollama/llama3.1:8b"))
projeto = client.create(response_model=ProjetoExtraido, messages=[...])
```

Razão: permite começar com Ollama (zero custo, iteração rápida no dev local) e benchmarkar contra Claude na Sprint 5 sem reescrever código. O comparativo OS vs comercial vira contribuição do relato.

### 2. Single-shot por documento

Decisão: passar o `.docx` inteiro em UMA chamada com response_model contendo os 44 atributos.

Razão: os 5-6 documentos do estudo de caso têm 10-20 páginas — cabe folgado em 16k tokens (Llama 3.1 tem 128k de context). Chunking adicionaria complexidade (estado, agregação) sem ganho mensurável nessa escala. Se algum doc estourar, fallback é dividir por seção.

### 3. Mega-prompt único (não 8 por categoria)

Decisão: um Pydantic model com 44 fields, uma chamada por documento.

Razão: Instructor reentregar erros de validação automaticamente. 8 chamadas por categoria seria 8× latência, 8× custos se trocar pra cloud, 8× pontos de falha. A retry-loop do Instructor cobre malformações sem orquestração manual.

### 4. Pydantic hand-written espelhando o schema

Decisão: escrever `ProjetoExtraido(BaseModel)` à mão, mantendo paridade com `atividades/schema_extracao.json`.

Razão: `schema_extracao.json` é a spec acadêmica formal (referenciada no protocolo de avaliação, no gabarito manual, e na avaliação). O Pydantic é o runtime de extração. Manter dois artefatos com propósitos distintos — pequena duplicação intencional, controle total sobre `description` dos fields (usado pela LLM como hint).

Auto-geração via `datamodel-code-generator` foi descartada: as extensões `x-categoria` e `x-numero` do schema seriam preservadas como metadata estranho no Python, e ganho marginal não compensa.

### 5. Modelo Llama 3.1 8B como baseline

Decisão: padrão `ollama/llama3.1:8b`.

Razão:
- ~5GB quantizado — roda em qualquer M-series com 8GB+ RAM
- Llama 3.1 tem 128k de context — single-shot sem chunking
- PT-BR razoável (treinado com corpus multilingual)
- JSON mode estável no Ollama

Configurável via env var — testes futuros com Qwen 2.5 14B, Mistral Nemo 12B etc. sem mudança de código.

### 6. Mock minimalista (sem mocker sofisticado)

Decisão: `if os.getenv("OBIONE_LLM_MOCK") == "true": return json.load(exemplo)`.

Razão: o exemplo já existe (`schema_extracao_exemplo.json`). Usado para testes do orquestrador e para o frontend desenvolver sem rodar modelo. Não há valor em frameworks de mock (pytest-mock, responses) para o escopo desse projeto.

---

## 7. Estendendo o padrão para Resumo e Drafts (US12 + US13)

A mesma arquitetura de portas-e-adaptadores foi replicada para os outros dois papéis da IA quando da implementação das US12 (Resumo do Cliente) e US13 (Drafts assistidos) em 21/05/2026. **Não é uma reescrita**: é a mesma decisão #1 acima aplicada a dois domínios diferentes.

```
                    extraction_content (JSON)
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │Extractor │ │ Resumo   │ │ Drafts   │
         │  Port    │ │Generator │ │Generator │
         │          │ │  Port    │ │  Port    │
         └────┬─────┘ └────┬─────┘ └────┬─────┘
              │            │            │
         mock + ollama  mock + (todo)  mock + (todo)
              │            │            │
              ▼            ▼            ▼
        MPOAttributes    Resumo       Draft × N
        (44 fields)      (texto)      (kind, title, body)
```

### Resumo do Cliente (US12)

- **Pacote:** `backend/src/obione/resumos/`
- **Porta:** `AbstractResumoGenerator` em `generator/port.py` — recebe `extraction_content: dict` e `project_name: str`, retorna `GeneratedResumo(body, model_id)`.
- **Adaptador atual:** `MockResumoGenerator` — produz texto narrativo Markdown PT-BR templated a partir dos 44 atributos do MPO. Determinístico (mesma entrada → mesma saída).
- **Substituição por LLM real:** uma linha em `obione.resumos.dependencies.get_resumo_generator()`. Espelhar `instructor_adapter.py` do Extractor: mesma `openai.OpenAI`, prompt diferente (pede narrativa em vez de JSON estruturado).
- **Lifecycle:** generate → draft (consultor edita) → publish (imutável, stampa `reviewed_by` + `reviewed_at`). Cliente só vê `published`.

### Drafts (US13)

- **Pacote:** `backend/src/obione/drafts/`
- **Porta:** `AbstractDraftGenerator` em `generator/port.py` — recebe extração + comentários recentes do projeto, retorna `GeneratedDrafts(items: list[GeneratedDraftItem], model_id)`. Cada item tem `kind ∈ {next_step, attention_point}`.
- **Adaptador atual:** `MockDraftGenerator` — 7 regras heurísticas sobre sinais da extração (escopo planejado sem executado, status_cronograma="atrasado", custo_realizado > custo_estimado, riscos_identificados presente etc.) + extração de perguntas abertas nos comentários (mensagens terminadas com `?`). Retorna 1-N items por chamada.
- **Substituição por LLM real:** mesmo padrão. Prompt pede um array de objetos JSON; Instructor garante validação contra `GeneratedDraftItem`.
- **Lifecycle:** generate (batch de N items) → cada item segue draft → publish individual, ou `DELETE` enquanto draft. Cliente só vê `published`.

### Por que o padrão se sustenta

1. **Testes hermeticos.** Os geradores mock rodam offline. CI nunca depende de Ollama/Anthropic disponível. 265 testes verdes na suíte completa.
2. **Troca de provider sem mudar serviço.** O serviço (`obione.resumos.service.generate_resumo`) recebe o gerador via parâmetro — pattern matching com o que já fazíamos no Extractor.
3. **Telemetria uniforme.** Todos os adaptadores reportam `model_id` que é persistido na coluna `llm_model` da respectiva tabela (`resumos.llm_model`, `drafts.llm_model`). No relato, conseguimos reconstituir qual versão gerou cada artefato.

### Status atual

| Papel | Tabela DB | Endpoint generate | Mock | LLM real |
|---|---|---|---|---|
| Extração | `extractions` | `POST /projects/{id}/extractions/from-document/{doc_id}` | ✅ `MockExtractor` | ✅ `InstructorExtractor` (Ollama Llama 3.1 8B smokeado em Valença, 19/44 em ~46s — ver `pipeline_smoke_ollama.md`) |
| Resumo | `resumos` | `POST /projects/{id}/resumos/generate` | ✅ `MockResumoGenerator` | ⏳ slot pronto, pendente de implementação quando Ollama for re-ativado |
| Drafts | `drafts` | `POST /projects/{id}/drafts/generate` | ✅ `MockDraftGenerator` | ⏳ slot pronto, pendente de implementação quando Ollama for re-ativado |

---

## Estrutura de pastas

```
backend/
├── pipeline/
│   ├── __init__.py
│   ├── models.py          # Pydantic ProjetoExtraido (espelha schema_extracao.json)
│   ├── loader.py          # docx_to_text(path) → str
│   ├── prompts.py         # build_extraction_prompt(text) → list[Message]
│   ├── extractor.py       # extract(text) → ProjetoExtraido (via instructor)
│   ├── validator.py       # validate_against_schema(json) — defesa em camadas
│   └── cli.py             # python -m backend.pipeline.cli --doc <path>
├── extracoes/             # output: <projeto>.json
├── tests/
│   └── test_pipeline.py   # com OBIONE_LLM_MOCK=true
├── pyproject.toml         # instructor, pydantic, python-docx, jsonschema, ollama
└── .env.example
```

---

## Workflow de desenvolvimento

```bash
# Setup uma vez
ollama pull llama3.1:8b
cd backend && pip install -e .

# Extração de um documento
export OBIONE_LLM_PROVIDER=ollama/llama3.1:8b
python -m backend.pipeline.cli --doc "../contexto/projetos/Valença Odontologia/Plano de Marketing.docx"
# → extracoes/valenca-odontologia.json

# Iteração sem rodar modelo (frontend dev, CI, testes de orquestração)
export OBIONE_LLM_MOCK=true
pytest backend/tests/

# Benchmark com Claude (Sprint 5)
export OBIONE_LLM_PROVIDER=anthropic/claude-sonnet-4-6
python -m backend.pipeline.cli --doc ...
```

---

## Riscos & contingências

| Risco | Mitigação |
|---|---|
| Llama 3.1 8B alucina demais em PT-BR | Trocar pra Qwen 2.5 14B via env var; se inviável, escalar para Claude (cloud) |
| `.docx` com layout complexo (tabelas aninhadas) confunde python-docx | Tabelas viram texto plano via `for row in table.rows: ...`; vinhetas de texto livre cobrem o resto |
| Modelo gera JSON malformado | Retry automático do Instructor (até 3×); se persistir, log + skip do documento + nota no relato |
| Single-shot extrapola context | Fallback de chunking por seção — não implementar até precisar |
| Ollama lento no M-series | Tempo aceitável: ~30-60s por doc × 5 docs = ~5 min. Cached entre runs. |

---

## Referência

- Instructor (Pydantic + structured output): https://python.useinstructor.com/
- Ollama (modelos locais): https://ollama.com/library/llama3.1
- python-docx: https://python-docx.readthedocs.io/

---

**Status:** Decisões aprovadas em 2026-05-19. Implementação concluída antecipadamente em 21/05/2026 — Extração + Resumo + Drafts em produção no backend (`main`), com Resumo e Drafts ainda em modo mock até a re-ativação do Ollama para Sprint 5.
