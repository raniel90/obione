# ObiOne Backend

FastAPI backend for the ObiOne project observatory — an observatório-comunidade powered by an MPO-aware Generative-AI pipeline. Architecture spec: [`atividades/arquitetura_backend.md`](../atividades/arquitetura_backend.md).

## Setup

```bash
cd backend
cp .env.example .env
make up            # postgres + backend, healthcheck blocks until ready
make migrate       # alembic upgrade head
make seed          # creates admin@obione.dev / admin123
```

Then open <http://localhost:8000/docs> for the interactive OpenAPI surface.

## Project layout

```
backend/
├── src/obione/        # 8 bounded contexts (auth, projects, documents, extractions,
│                      # comments, likert, feed, exports) + health + shared infra
├── tests/             # 3 tiers: unit/ (Fakes, no I/O) / integration/ (real Postgres)
│                      # / e2e/ (FastAPI TestClient)
├── alembic/           # Migrations 0001..0006
└── Makefile           # Dev workflow
```

## Make targets

| Target | What it does |
|---|---|
| `make up` | Start postgres + backend; blocks until `/health` returns 200 |
| `make down` | Stop containers (keep volumes) |
| `make logs` | Tail backend logs |
| `make psql` | Open psql against the local postgres |
| `make migrate` | `alembic upgrade head` |
| `make migration m="…"` | `alembic revision --autogenerate -m "…"` |
| `make test` | Run the full pytest suite inside the backend container |
| `make test-unit` / `test-integration` / `test-e2e` | Run one tier |
| `make lint` | `ruff check` + `ruff format --check` |
| `make format` | `ruff format` + `ruff check --fix` |
| `make seed` | Create the bootstrap admin user |
| `make clean` | Stop containers + remove volumes ⚠️ destroys data |

## HTTP API

All endpoints require `Authorization: Bearer <jwt>` except `POST /auth/login` and `GET /health*`. Error responses follow `{ "error": { "code": "snake_case_code", "message": "...", "details": [...] } }` where `details` carries per-field violations when applicable.

### Auth — `obione.auth`

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/auth/login` | any | Email + password → JWT (24h). |
| GET | `/auth/me` | any logged in | Identity of the bearer. |
| POST | `/auth/users` | admin | Create user with role `consultant` / `client` / `admin`. |

### Projects — `obione.projects`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/projects` | any | List projects visible to the caller. Consultant → own, client → assigned, admin → all. |
| POST | `/projects` | consultant + admin | Body: `{name, domain, description?}`. Domain ∈ `legal\|health\|sports\|branding\|gastronomy\|other`. |
| GET | `/projects/{id}` | visible | Project metadata only. |
| GET | `/projects/{id}/detail` | visible | **US08** consolidated view: project + documents + latest llm + latest gabarito + coverage + evaluation (when both kinds present) + recent comments (`?comments_limit=20`, max 100). |
| PATCH | `/projects/{id}` | consultant of project, admin | Partial update. |
| DELETE | `/projects/{id}` | consultant of project, admin | Cascades to documents/extractions/comments. |
| POST | `/projects/{id}/clients` | consultant of project, admin | Body: `{user_id}`. Assigns a client user to a project. |
| GET | `/projects/portfolio?domain=…` | consultant + admin | **US07** Status (`registered`/`ingested`/`extracted`/`reviewed`) + coverage % + has_gabarito per project. 403 for clients. |

### Documents — `obione.documents`

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/projects/{id}/documents` | consultant + admin | Multipart `.docx` upload. Rejects non-docx + > `MAX_UPLOAD_SIZE_MB` + duplicate sha256. |
| GET | `/projects/{id}/documents` | visible | List by project. |

### Extractions — `obione.extractions`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/projects/{id}/extractions` | visible | List all extractions. |
| POST | `/projects/{id}/extractions/manual` | visible (mutator role) | Body `{content, document_id?}`. **US14** validates content against [`schema_extracao.json`](../atividades/schema_extracao.json) — returns 400 with `details[]` on schema violation. |
| POST | `/projects/{id}/extractions/from-document/{doc_id}` | consultant + admin | Runs the LLM pipeline on a stored document. Provider picked from `LLM_PROVIDER`. |
| GET | `/projects/{id}/extractions/coverage` | visible | **US09** MPO coverage report: `filled / total_in_scope`, 8-category breakdown. `imagens_fotos` excluded. |
| GET | `/projects/{id}/extractions/evaluation` | visible | **US15** Compares latest llm vs latest gabarito_manual. TP/FP/FN/TN + precision/recall/F1 over `estruturado` attrs. `texto_livre` marked `needs_human_review` for the Sprint 5 rubric. 404 if either kind missing. |

### Comments — `obione.comments`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/projects/{id}/comments` | visible | Ordered ascending. |
| POST | `/projects/{id}/comments` | visible | Body `{body, parent_id?}`. **US10** 1-level threading enforced — replies to replies return 400. |
| PATCH | `/comments/{id}` | author | Only the author can edit. |
| DELETE | `/comments/{id}` | author OR project consultant + admin | Consultant moderates. Cascades to replies. |

### Feed — `obione.feed`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/feed?limit=N` | any | **US11** Chronological merge of `new_comment` + `new_extraction` + `new_document` events scoped to projects the caller can see. Default limit 50, max 200. |

### Likert feedback — `obione.likert`

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/likert/consultoria` | consultant + admin | **US16** 4 dimensions 1-5: `utilidade_drafts`, `reducao_friccao`, `qualidade_resumo`, `manutenibilidade_mediador`. |
| POST | `/likert/client` | client + admin | **US17** 4 dimensions 1-5 + `project_id`: `clareza_resumo`, `utilidade_espaco`, `qualidade_dialogo`, `sentido_inclusao`. |
| GET | `/likert/responses?kind=consultoria\|client` | consultant + admin | Raw rows. |
| GET | `/likert/summary?kind=…` | consultant + admin | Aggregate per-dimension (count/mean/min/max + respondent_count). |

### Export — `obione.exports`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/projects/{id}/export?format=json\|csv` | visible | **US18** JSON bundle (project + docs + extractions + comments + coverage) OR long-format CSV (one row per extraction × attribute) for the Sprint 5 rubric workflow. |

### Health

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness; no DB call. |
| GET | `/health/db` | Hits `SELECT version()`. |

## LLM provider switch

The pipeline behind `/projects/{id}/extractions/from-document/{doc_id}` reads `settings.LLM_PROVIDER`. Tests pin it to `mock` via an autouse fixture so the suite doesn't depend on a network reachable LLM. Switch it through `.env`:

| Value | Behavior |
|---|---|
| `mock` (default) | Loads `atividades/schema_extracao_exemplo.json`. Offline. |
| `ollama/llama3.1:8b` | Talks to a local Ollama instance over `LLM_BASE_URL` (defaults to `http://localhost:11434`). For Docker, point to `http://host.docker.internal:11434`. |
| `openai/<model>` | Uses `LLM_API_KEY`. |

To run a real Ollama smoke locally:

```bash
brew install ollama                 # one-time
brew services start ollama
ollama pull llama3.1:8b             # ~5 GB
# .env:
#   LLM_PROVIDER=ollama/llama3.1:8b
#   LLM_BASE_URL=http://host.docker.internal:11434
make down && make up
```

See [`atividades/pipeline_smoke_ollama.md`](../atividades/pipeline_smoke_ollama.md) for the Valença smoke result (19/44 attributes in ~46s).

## Architecture

Pragmatic clean architecture — see [`atividades/arquitetura_backend.md`](../atividades/arquitetura_backend.md).

- **en-US in code, PT-BR in academic content** — class names, function names, columns are en-US; the 44 MPO attribute keys keep their PT-BR names (canonical academic identifiers).
- **3-tier tests** — `unit/` (no I/O, Fakes) / `integration/` (real Postgres, transactional rollback) / `e2e/` (FastAPI TestClient).
- **Repository + Unit of Work** — services manipulate UoW, never `Session` directly. UoW is **reentrant**: nested `with uow:` reuses the outermost session.
- **Ports & adapters** for LLM (`extractions/llm/port.py`) and blob storage (`documents/storage/port.py`).
- **`expire_on_commit=False`** + `eager_defaults=True` on `Base` so ORM objects stay readable after the UoW closes.
- **`_meta.origem` is the single source of truth** for distinguishing `gabarito_manual` from `llm` extractions (the `source` column is too coarse — the manual endpoint accepts both).

## Continuous integration

`.github/workflows/backend-tests.yml` runs on every push to `main` and every PR targeting `main`:

1. Postgres 16-alpine service container.
2. `pip install -e ".[dev]"` from `pyproject.toml`.
3. `ruff check` + `ruff format --check` (`atividades/` excluded — see `pyproject.toml`).
4. `alembic upgrade head`.
5. Full `pytest` suite.

PRs that don't go green there can't be merged. Branch protection is up to you to wire on the GitHub side.
