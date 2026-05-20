# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ObiOne** — Observatório de Projetos. PhD-level course project (TAES — Tópicos Avançados em Engenharia de Software, UPE/POLI), supervised by Prof. Ivaldir Honório de Farias Júnior.

ObiOne is an **observatório-de-portfólio para consultorias de projetos**, powered by Generative AI. It combines:

1. **MPO-based observation** — extracts 44 attributes from the *Modelo de Observatório de Projetos* (Vieira, 2022, Quadro 37) from `.docx` project documents via LLM
2. **Semi-open community** — consultancy curates; each client sees only their own project
3. **AI-Assistant** — Resumo do Cliente (translates technical → accessible) + Drafts (assists consultant)

Repository: `raniel90/obione` (this repo). Code lives in `backend/` (FastAPI) and `frontend/` (React + Vite + Lovable, not yet started).

## Repository Structure

```
.
├── atividades/                          # Course deliverables (PT-BR docs)
│   ├── arquitetura_backend.md          # Backend architecture spec — MUST follow
│   ├── arquitetura_pipeline.md         # LLM pipeline spec (Sprint 2 T2.1)
│   ├── atributos_alvo_mpo.md           # 44 MPO attributes
│   ├── backlog_obione.md               # Sprints 1-5, US01-US18
│   ├── plano_execucao.md               # Execution plan
│   ├── protocolo_avaliacao.md          # Hybrid rubric for evaluation
│   ├── requisitos.md                   # 18 RFs + RNFs
│   ├── schema_extracao.json            # JSON Schema for extraction (T1.3)
│   ├── schema_extracao_exemplo.json    # Sample extraction (Valença stub)
│   └── apresentacoes/                  # Status reports (.pptx)
├── contexto/
│   ├── apresentacoes/                  # Course slide PDFs
│   ├── artigos/                        # Academic papers (PDFs)
│   └── projetos/                       # Client .docx files (6 projects)
├── backend/                            # FastAPI app (Sprint 2 onwards)
└── CLAUDE.md
```

## Language Conventions

- **Academic docs** (`atividades/`, `contexto/`, slides): **Brazilian Portuguese**
- **Code** (`backend/`, `frontend/`): **English (en-US)** — class names, function names, variables, table names, columns, log messages, comments, docstrings
- **User-facing error messages** in API responses: may be PT-BR (no i18n yet)
- **Default conversation language**: Brazilian Portuguese (unless user switches)

## Backend Architecture

**Authoritative spec:** `atividades/arquitetura_backend.md` — read it before touching `backend/`.

**Quick summary** (do not paraphrase; reference the spec):

- **Layout:** `backend/src/obione/` (src layout, installable package). Each bounded context is a subpackage.
- **Bounded contexts:** `auth/`, `projects/`, `documents/`, `extractions/`, plus shared `health/`, `shared/`.
- **Layering (pragmatic clean architecture):**
  - `models.py` — domain entities (SQLAlchemy 2 with `Mapped[]` annotations doubles as domain class)
  - `repository.py` — `AbstractXxxRepository` (Protocol) + `SqlAlchemyXxxRepository` (concrete)
  - `service.py` — application use cases. **Pure functions**, no FastAPI imports. Receives `AbstractUnitOfWork`.
  - `schemas.py` — Pydantic v2 DTOs (request/response)
  - `dependencies.py` — FastAPI `Depends` helpers (e.g. `get_current_user`)
  - `router.py` — thin FastAPI routes; map DTO → service → DTO
  - `exceptions.py` — typed exception classes inheriting from `obione.shared.exceptions.ObioneException`
- **Unit of Work:** `obione/unit_of_work.py` — `AbstractUnitOfWork` + `SqlAlchemyUnitOfWork` context manager. Services manipulate UoW, not `Session` directly.
- **Ports & adapters for external integrations:**
  - LLM: `extractions/llm/port.py` (Abstract) + adapters (`mock.py`, `ollama.py`, `anthropic.py`)
  - File storage: `documents/storage/port.py` + `filesystem.py`
  - Adapter selection via `settings.LLM_PROVIDER`, `settings.STORAGE_BACKEND`

## Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Python | 3.11 |
| Web | FastAPI | ≥0.115 |
| ORM | SQLAlchemy | 2.0 (sync) |
| DB driver | psycopg | 3.x |
| Migrations | Alembic | 1.13+ |
| DB | PostgreSQL | 16-alpine |
| Validation | Pydantic v2 + pydantic-settings | 2.9+ |
| Auth | python-jose + passlib (bcrypt) | — |
| Tests | pytest + httpx TestClient | 8.3+ / 0.27+ |
| Lint/Format | ruff | 0.7+ |
| Container | Docker + Compose | — |

**Avoid:** LangChain, Celery, Redis (no need), MinIO (filesystem volume suffices), async SQLAlchemy (LLM is the bottleneck, not DB), mypy (Pydantic + ruff cover us), poetry/uv (pip + pyproject.toml is portable).

## Code Conventions

- **Naming:** modules `snake_case`, classes `PascalCase`, functions/vars `snake_case`, constants `SCREAMING_SNAKE_CASE`
- **Type hints:** every parameter + return
- **Imports:** absolute (`from obione.auth.service import authenticate`), no `import *`
- **Ruff rules:** `E, F, W, I, N, UP, B, C4, SIM`; line length 100
- **Docstrings:** Google style; 1-line for simple functions
- **No business logic in routers.** Routers wire DTOs to services. If a router has `if/else`, refactor to service.
- **No FastAPI imports in `service.py`.** Service layer is framework-agnostic.

## Testing Strategy

3 tiers under `backend/tests/`:

1. `unit/` — pure logic, **no I/O**. Uses `FakeRepository`, `FakeUnitOfWork`, `FakeBlobStorage`, `MockExtractor`. Runs in <100ms total.
2. `integration/` — real Postgres via Docker Compose; each test in transaction-with-rollback fixture. ~5s.
3. `e2e/` — FastAPI TestClient + real DB. Covers HTTP flow (login → me → CRUD). ~15s.

No mandatory coverage %. Required: 100% of services have unit tests, every migration runs in an integration test, every bounded context has at least 1 e2e smoke test.

## Common Commands (Backend)

All via `make` from `backend/`:

```bash
make up         # docker-compose up -d + healthcheck
make down       # stop containers
make logs       # tail backend logs
make shell      # bash inside backend container
make psql       # psql inside postgres container
make migrate    # alembic upgrade head
make migration m="add foo table"  # alembic autogenerate
make test       # pytest
make lint       # ruff check + ruff format --check
make format     # ruff format + ruff check --fix
make seed       # create admin@obione.local / admin123
make clean      # down + remove volumes (DANGER)
```

## Authorization Model

Three roles: `consultor`, `client`, `admin`.

Access control enforced in **service layer via WHERE filter** (not Postgres RLS):

- `admin` sees everything
- `consultor` sees projects where `consultant_id == user.id`
- `client` sees projects where `id IN (SELECT project_id FROM project_clients WHERE user_id = user.id)`

Endpoints that mutate (POST/PATCH/DELETE) further restrict by role (clients are read-only on projects/documents).

User registration is **admin-only** (no public signup) — `POST /auth/users` requires `admin`. Bootstrap via `make seed` or `python -m obione.cli create-user ...`.

## What NOT to do

- Don't add documentation files (`*.md`) outside `atividades/` unless explicitly asked
- Don't introduce new top-level dependencies without a documented reason
- Don't import FastAPI inside `service.py` (use `dependencies.py` for FastAPI glue)
- Don't query SQLAlchemy directly inside `router.py` (always go through service)
- Don't add `if env == "prod"` — use Pydantic Settings + DI
- Don't translate code to Portuguese — code is **en-US** by convention
- Don't add async to backend unless there's a measured concurrency problem
- Don't create migrations manually — use `make migration m="..."` (Alembic autogenerate)

## Notes for Working with Academic Artifacts

- PDFs in `contexto/`: use Read with `pages` parameter for large files
- `.docx` files in `contexto/projetos/`: client project case studies; **never name the consultancy company** in artifacts — use "consultoria" or "organização executora"
- Slides in `atividades/apresentacoes/`: generated via the `apresentacao-poli` skill; never hand-edit `.pptx` directly
- Date references: always confirm with user before crystallizing absolute dates in docs (history of slipping dates)
