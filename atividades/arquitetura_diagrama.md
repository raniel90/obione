# ObiOne — Diagramas de Arquitetura

> Companion visual dos docs [`arquitetura_backend.md`](arquitetura_backend.md) (spec autoritativa) e [`arquitetura_pipeline.md`](arquitetura_pipeline.md) (decisões do pipeline LLM). Todos os diagramas são Mermaid — o GitHub renderiza nativamente.

---

## 1. Contexto do sistema (deployment view)

Quem fala com quem, e onde os dados moram. O frontend está pendente (Bruno); todo o resto está em produção local via `docker-compose`.

```mermaid
flowchart LR
    User["👤 Usuário<br/>(consultor / cliente / admin)"]
    Frontend["🖥️ Frontend<br/>React + Vite + Lovable<br/>(pendente)"]
    Backend["⚙️ Backend<br/>FastAPI 0.115+ / Python 3.11<br/>10 bounded contexts"]
    DB[("🗄️ Postgres 16<br/>8 migrations")]
    Storage[("💾 Filesystem Volume<br/>uploads/&lt;sha256&gt;.docx")]
    LLM[("🤖 LLM Provider<br/>mock | Ollama Llama 3.1 8B | OpenAI")]

    User -->|HTTPS + JWT| Frontend
    Frontend -->|REST + JWT| Backend
    Backend -->|SQLAlchemy 2.0 sync<br/>psycopg 3.x| DB
    Backend -->|read/write .docx<br/>STORAGE_BACKEND=filesystem| Storage
    Backend -->|openai SDK<br/>LLM_PROVIDER env| LLM

    classDef pending stroke-dasharray: 5 5,fill:#fff7e6
    class Frontend pending
```

**Notas:**
- Frontend rodaria em `localhost:5173` (Vite); CORS já configurado.
- Postgres em container, porta `5435:5432` no host (evita conflito com outros DBs locais).
- LLM provider via env: `mock` (default em testes), `ollama/<model>` ou `openai/<model>`.

---

## 2. Bounded contexts (modelagem por domínio)

Cada caixa = pacote Python independente em `backend/src/obione/`. Setas = "X invoca Y através do UoW". O grafo é majoritariamente em estrela em torno de `projects` porque o conceito de projeto é a raiz semântica do observatório.

```mermaid
flowchart TB
    subgraph BC["obione (10 bounded contexts + helpers)"]
        direction TB
        auth["auth<br/>JWT + bcrypt"]
        projects["projects<br/>+ access_control<br/>(consultor/cliente/admin)"]
        documents["documents<br/>+ storage port"]
        extractions["extractions<br/>+ LLM port<br/>+ coverage + evaluation"]
        comments["comments<br/>(1-level threading)"]
        resumos["resumos<br/>+ generator port"]
        drafts["drafts<br/>+ generator port"]
        likert["likert<br/>(US16 + US17)"]
        feed["feed<br/>(chronological merge)"]
        exports["exports<br/>(JSON + CSV)"]
    end

    documents -->|by project| projects
    extractions -->|by project + doc| projects
    extractions -->|by document| documents
    comments -->|by project| projects
    resumos -->|by project| projects
    resumos -->|reads latest| extractions
    drafts -->|by project| projects
    drafts -->|reads latest| extractions
    drafts -->|reads recent| comments
    likert -->|by project| projects
    feed -->|merges events from| documents
    feed -->|merges events from| extractions
    feed -->|merges events from| comments
    exports -->|bundles| projects
    auth -.->|valida JWT em todos| BC
```

**Princípios:**
- **Projects** é a raiz de visibilidade — `get_project_for_user(uow, user, project_id)` é o ponto único de check de acesso, reusado por todos os contextos.
- **Resumos** e **Drafts** seguem o mesmo shape (port + adapter + lifecycle draft→published) porque são variações do mesmo padrão "IA propõe, consultor revisa, cliente vê só o publicado".
- **Feed** e **exports** são read-only — não definem tabelas próprias, só consolidam dados dos outros contextos.

---

## 3. Camadas dentro de um bounded context

Pragmatic clean architecture. Cada caixa é um arquivo Python; as setas vão sempre no sentido `router → service → uow → repository → models → DB`. Nenhuma seta atravessa para trás (`service.py` nunca importa FastAPI; `models.py` nunca conhece HTTP).

```mermaid
flowchart TD
    HTTP["🌐 HTTP Request"]
    Router["router.py<br/>Thin route handlers<br/>Maps DTO → service call<br/>FastAPI Depends para auth"]
    Schemas["schemas.py<br/>Pydantic v2 DTOs<br/>(request + response)"]
    Service["service.py<br/>Use cases (pure functions)<br/>SEM imports de FastAPI<br/>recebe AbstractUnitOfWork"]
    UoW["unit_of_work.py<br/>Reentrant context manager<br/>Abstrato + SqlAlchemy + Fake"]
    Repo["repository.py<br/>Protocol (AbstractXxxRepository)<br/>+ SqlAlchemy + Fake impls"]
    Models["models.py<br/>SQLAlchemy 2 Mapped[]<br/>domain entity = ORM model"]
    DB[("Postgres")]

    HTTP --> Router
    Router -->|valida| Schemas
    Router -->|chama use case| Service
    Service -->|with uow:| UoW
    UoW -->|attach as attribute| Repo
    Repo -->|query/persist| Models
    Models --> DB
    Schemas -.->|model_validate| Service

    classDef external fill:#e3f2fd
    class HTTP,DB external
```

**Invariantes que valem em TODO bounded context:**
1. **Router nunca tem if/else de regra de negócio** — se aparecer, refatore para `service.py`.
2. **Service.py nunca importa FastAPI** — recebe `AbstractUnitOfWork`, retorna entidades de domínio ou `None`.
3. **UoW é reentrante** — `with uow:` aninhado reusa a sessão da chamada externa (evita `InvalidRequestError`).
4. **`expire_on_commit=False` + `eager_defaults=True`** — ORM objects ficam legíveis depois do `commit()`.

---

## 4. Fluxo de extração via LLM (US05)

Sequência completa quando o consultor clica "extrair via IA" para um `.docx` previamente uploaded.

```mermaid
sequenceDiagram
    autonumber
    actor User as Consultor
    participant FE as Frontend (placeholder)
    participant API as Backend FastAPI
    participant Auth as auth.dependencies<br/>(JWT)
    participant Svc as extractions.service
    participant UoW as SqlAlchemyUnitOfWork
    participant Docs as documents.repository
    participant Storage as Filesystem
    participant LLM as InstructorExtractor
    participant Ollama as Ollama Llama 3.1 8B
    participant Ext as extractions.repository
    participant DB as Postgres

    User->>FE: clica "extrair via IA"
    FE->>API: POST /projects/{pid}/extractions/from-document/{did}
    API->>Auth: get_current_user(Bearer JWT)
    Auth-->>API: User (com role)
    API->>Svc: create_extraction_from_document(uow, user, pid, did)
    Svc->>UoW: with uow:
    UoW->>Docs: get(did)
    Docs->>DB: SELECT * FROM documents WHERE id=$1
    DB-->>Docs: Document row
    Docs-->>UoW: Document
    UoW->>Storage: read uploads/{sha256}.docx
    Storage-->>UoW: bytes
    UoW->>LLM: extract(doc_bytes)
    LLM->>LLM: python-docx → texto
    LLM->>LLM: build_extraction_messages(text, 44 fields)
    LLM->>Ollama: POST /v1/chat/completions<br/>(JSON mode, temperature=0.2)
    Note over Ollama: ~50-80s no M-series
    Ollama-->>LLM: JSON com atributos preenchidos
    LLM->>LLM: Pydantic validate<br/>+ _normalize_enums (lower/accent/hedge)
    LLM->>LLM: stamp _meta server-side
    LLM-->>UoW: ExtractionResult(content, model_id)
    UoW->>Ext: add(Extraction)
    Ext->>DB: INSERT INTO extractions
    UoW->>UoW: commit()
    UoW-->>Svc: Extraction
    Svc-->>API: Extraction
    API-->>FE: 201 Created + JSON
    FE-->>User: mostra os 44 atributos
```

**Tempos observados (Ollama Llama 3.1 8B, M-series):**
- Leitura `.docx` + montagem do prompt: <100ms
- Chamada LLM: 46-80s por documento
- Validação Pydantic + persistência: <200ms

---

## 5. Lifecycle de Resumo do Cliente (US12)

Resumo é gerado pela IA em `draft`, editado pelo consultor, e só vira visível pro cliente após `publish`. Publish é **irreversível**.

```mermaid
sequenceDiagram
    autonumber
    actor Cons as Consultor
    actor Cli as Cliente
    participant API as Backend
    participant Gen as ResumoGenerator<br/>(Mock ou Instructor)
    participant DB as resumos table

    rect rgb(230, 247, 255)
        Note over Cons,DB: Geração (status=draft, invisível ao cliente)
        Cons->>API: POST /projects/{pid}/resumos/generate
        API->>API: get_project_for_user (visibilidade)
        API->>API: list_by_project(extractions) → latest
        API->>Gen: generate(extraction_content, project_name)
        Gen-->>API: GeneratedResumo(body, model_id)
        API->>DB: INSERT status=draft, llm_model
        DB-->>API: id
        API-->>Cons: 201 Created (status=draft)
    end

    rect rgb(255, 247, 230)
        Note over Cons,DB: Revisão (apenas consultor, ainda draft)
        Cons->>API: PATCH /resumos/{id} body=...
        API->>DB: UPDATE body, updated_at<br/>WHERE status='draft'
        DB-->>API: OK
        API-->>Cons: 200 OK
    end

    rect rgb(232, 245, 233)
        Note over Cons,DB: Publicação (irreversível)
        Cons->>API: POST /resumos/{id}/publish
        API->>DB: UPDATE status='published',<br/>reviewed_by, reviewed_at
        DB-->>API: OK
        API-->>Cons: 200 OK (status=published)
    end

    rect rgb(252, 232, 252)
        Note over Cons,DB: Cliente passa a ver
        Cli->>API: GET /projects/{pid}/resumos
        API->>DB: SELECT * WHERE project_id=$1<br/>AND status='published'
        DB-->>API: linhas publicadas
        API-->>Cli: 200 OK (só published)
    end

    rect rgb(255, 235, 238)
        Note over Cons,API: Tentativas pós-publish bloqueadas
        Cons->>API: PATCH /resumos/{id} (após publish)
        API-->>Cons: 409 resumo_already_published
        Cons->>API: POST /resumos/{id}/publish (de novo)
        API-->>Cons: 409 resumo_already_published
    end
```

**Drafts (US13) seguem o mesmíssimo shape**, com duas diferenças:
- `generate` retorna **N items** num batch (não 1)
- Cada item tem `kind ∈ {next_step, attention_point}` e `DELETE` é permitido enquanto draft

---

## 6. Como navegar o código

Mapa rápido de onde cada conceito vive (relativo a `backend/src/obione/`):

| Conceito | Caminho |
|---|---|
| App entrypoint (FastAPI) | `main.py` |
| Settings (Pydantic + .env) | `settings.py` |
| Database Base + Session | `shared/database.py` |
| Unit of Work | `unit_of_work.py` |
| Auth dependencies (JWT) | `auth/dependencies.py` |
| LLM port (extração) | `extractions/llm/port.py` |
| LLM real adapter (extração) | `extractions/llm/instructor_adapter.py` |
| LLM port (resumo) | `resumos/generator/port.py` |
| LLM real adapter (resumo) | `resumos/generator/instructor.py` |
| LLM port (drafts) | `drafts/generator/port.py` |
| LLM real adapter (drafts) | `drafts/generator/instructor.py` |
| Cobertura MPO | `extractions/coverage.py` |
| Avaliação extração vs gabarito | `extractions/evaluation.py` |
| Validador de gabarito (JSON Schema) | `extractions/validation.py` |
| Migrations | `../alembic/versions/0001..0008_*.py` |

E os artefatos acadêmicos (`atividades/`):

| Documento | Propósito |
|---|---|
| [`arquitetura_backend.md`](arquitetura_backend.md) | Spec autoritativa da arquitetura |
| [`arquitetura_pipeline.md`](arquitetura_pipeline.md) | Decisões do pipeline LLM (T2.1) |
| [`schema_extracao.json`](schema_extracao.json) | JSON Schema dos 44 atributos do MPO |
| [`atributos_alvo_mpo.md`](atributos_alvo_mpo.md) | Lista PT-BR dos atributos com tipo + categoria |
| [`protocolo_avaliacao.md`](protocolo_avaliacao.md) | Rubrica híbrida 0/0,5/1 + Kappa |
| [`backlog_obione.md`](backlog_obione.md) | 18 USs com status atual |
| [`plano_execucao.md`](plano_execucao.md) | 22 tarefas T0.1..T5.4 |
| [`pipeline_smoke_ollama.md`](pipeline_smoke_ollama.md) | Resultados de smoke em 5 docs |
| [`api_responses.md`](api_responses.md) | Request/response reais de todos os endpoints |
