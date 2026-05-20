# Backend Chassis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete ObiOne backend chassis (auth + projects + documents + extractions stub + health) following the architecture spec in `atividades/arquitetura_backend.md`.

**Architecture:** Pragmatic clean architecture in `backend/src/obione/` with bounded contexts. Each context layers as domain (SQLAlchemy `Mapped[]`) → abstract repository (Protocol) → service (pure, framework-free) → router (thin FastAPI glue). Unit of Work pattern wraps transactions. Ports & adapters isolate external integrations (LLM, blob storage). All code in en-US; comments and docstrings in English.

**Tech Stack:** Python 3.11, FastAPI ≥0.115, SQLAlchemy 2.0 (sync), psycopg 3.x, Alembic 1.13+, Pydantic v2, python-jose + passlib, pytest + httpx, ruff. Docker + Postgres 16.

**Companion docs:**
- Architecture spec: `atividades/arquitetura_backend.md`
- Project conventions: `CLAUDE.md`
- Schema reference: `atividades/schema_extracao.json` (for the JSONB content of extractions)

---

## File Structure

All paths are relative to repo root.

### Project infrastructure (Phase 0)

| Path | Responsibility |
|---|---|
| `backend/pyproject.toml` | Package metadata, deps (runtime + dev), ruff config, pytest config |
| `backend/Dockerfile` | Python 3.11-slim image, installs deps, runs uvicorn |
| `backend/docker-compose.yml` | Two services: `postgres` (16-alpine) + `backend` |
| `backend/Makefile` | Targets: `up`, `down`, `logs`, `shell`, `psql`, `migrate`, `migration`, `test`, `lint`, `format`, `seed`, `clean` |
| `backend/.env.example` | All env vars documented with safe defaults |
| `backend/.gitignore` | `__pycache__/`, `.venv/`, `.env`, `storage/`, `.pytest_cache/`, `.ruff_cache/`, etc. |
| `backend/README.md` | Setup in 4 commands |
| `backend/alembic.ini` | Alembic config (script location, file template, output encoding) |

### Shared infrastructure (Phase 1)

| Path | Responsibility |
|---|---|
| `backend/src/obione/__init__.py` | Package marker |
| `backend/src/obione/settings.py` | `Settings(BaseSettings)` — all env vars typed |
| `backend/src/obione/shared/__init__.py` | Marker |
| `backend/src/obione/shared/database.py` | SQLAlchemy `Base`, `engine`, `SessionLocal`, `get_db` dep |
| `backend/src/obione/shared/exceptions.py` | `ObioneException` hierarchy + FastAPI handler |
| `backend/src/obione/shared/logging.py` | `configure_logging()` — JSON or plain formatter from `LOG_FORMAT` |
| `backend/src/obione/shared/middleware.py` | Request-ID + access log middleware |
| `backend/src/obione/shared/ids.py` | UUID helpers (`new_id()`) |
| `backend/src/obione/unit_of_work.py` | `AbstractUnitOfWork` + `SqlAlchemyUnitOfWork` context manager |
| `backend/alembic/env.py` | Alembic env — imports all models so `target_metadata` is populated |
| `backend/alembic/script.py.mako` | Migration template (default) |
| `backend/tests/__init__.py` | Marker |
| `backend/tests/conftest.py` | Shared fixtures: `db_session`, `client`, `seeded_admin`, etc. |

### Health module (Phase 2)

| Path | Responsibility |
|---|---|
| `backend/src/obione/health/__init__.py` | Marker |
| `backend/src/obione/health/router.py` | `GET /health` + `GET /health/db` |
| `backend/tests/e2e/test_health.py` | Smoke tests for both endpoints |

### Auth module (Phase 3)

| Path | Responsibility |
|---|---|
| `backend/src/obione/auth/__init__.py` | Marker |
| `backend/src/obione/auth/models.py` | `User` SQLAlchemy model (= domain entity) |
| `backend/src/obione/auth/exceptions.py` | `InvalidCredentialsError`, `EmailAlreadyExistsError`, `InvalidRoleError` |
| `backend/src/obione/auth/security.py` | `hash_password`, `verify_password`, `encode_token`, `decode_token` |
| `backend/src/obione/auth/repository.py` | `AbstractUserRepository` (Protocol) + `SqlAlchemyUserRepository` |
| `backend/src/obione/auth/schemas.py` | `LoginRequest`, `TokenResponse`, `UserCreate`, `UserResponse` |
| `backend/src/obione/auth/service.py` | `authenticate(uow, email, password)`, `create_user(uow, data)` |
| `backend/src/obione/auth/dependencies.py` | `get_current_user`, `require_role` (FastAPI Depends) |
| `backend/src/obione/auth/router.py` | `POST /auth/login`, `GET /auth/me`, `POST /auth/users` (admin-only) |
| `backend/alembic/versions/0001_create_users.py` | Migration: `users` table |
| `backend/tests/unit/auth/test_security.py` | bcrypt + JWT unit tests |
| `backend/tests/unit/auth/test_service.py` | Service unit tests with FakeRepo + FakeUoW |
| `backend/tests/integration/auth/test_repository.py` | Real DB repository tests |
| `backend/tests/e2e/test_auth_flow.py` | Login → /me flow |

### Projects module (Phase 4)

| Path | Responsibility |
|---|---|
| `backend/src/obione/projects/__init__.py` | Marker |
| `backend/src/obione/projects/models.py` | `Project`, `ProjectClient` (M2M) |
| `backend/src/obione/projects/exceptions.py` | `ProjectNotFoundError`, `NotProjectOwnerError` |
| `backend/src/obione/projects/repository.py` | `AbstractProjectRepository` + SqlAlchemy impl |
| `backend/src/obione/projects/schemas.py` | DTOs (Create, Update, Response, AddClient) |
| `backend/src/obione/projects/access_control.py` | `visible_project_ids(user)`, `can_user_see(user, project)` |
| `backend/src/obione/projects/service.py` | `list_for_user`, `get_for_user`, `create`, `update`, `delete`, `add_client` |
| `backend/src/obione/projects/router.py` | Full CRUD + add-client endpoint |
| `backend/alembic/versions/0002_create_projects.py` | Migration: `projects` + `project_clients` |
| `backend/tests/unit/projects/test_access_control.py` | Access rules with Fakes |
| `backend/tests/unit/projects/test_service.py` | CRUD with Fakes |
| `backend/tests/integration/projects/test_repository.py` | Real DB |
| `backend/tests/e2e/test_projects_flow.py` | Create + list + cliente access path |

### Documents module (Phase 5)

| Path | Responsibility |
|---|---|
| `backend/src/obione/documents/__init__.py` | Marker |
| `backend/src/obione/documents/models.py` | `Document` |
| `backend/src/obione/documents/exceptions.py` | `UnsupportedMimeTypeError`, `FileTooLargeError`, `DuplicateHashError` |
| `backend/src/obione/documents/repository.py` | Abstract + SqlAlchemy impl |
| `backend/src/obione/documents/schemas.py` | DTOs |
| `backend/src/obione/documents/storage/__init__.py` | Marker |
| `backend/src/obione/documents/storage/port.py` | `AbstractBlobStorage` (Protocol) |
| `backend/src/obione/documents/storage/filesystem.py` | `FilesystemBlobStorage` |
| `backend/src/obione/documents/service.py` | `upload(uow, storage, ...)`, `list_for_project(uow, ...)` |
| `backend/src/obione/documents/router.py` | `POST /projects/{id}/documents`, `GET ...` |
| `backend/alembic/versions/0003_create_documents.py` | Migration |
| `backend/tests/unit/documents/test_service.py` | Uses FakeBlobStorage |
| `backend/tests/integration/documents/test_repository.py` | Real DB |
| `backend/tests/e2e/test_documents_flow.py` | Upload + list |

### Extractions module (Phase 6)

| Path | Responsibility |
|---|---|
| `backend/src/obione/extractions/__init__.py` | Marker |
| `backend/src/obione/extractions/models.py` | `Extraction` (JSONB `content`) |
| `backend/src/obione/extractions/exceptions.py` | `ExtractionNotFoundError`, `InvalidSourceError` |
| `backend/src/obione/extractions/repository.py` | Abstract + SqlAlchemy impl |
| `backend/src/obione/extractions/schemas.py` | DTOs |
| `backend/src/obione/extractions/llm/__init__.py` | Marker |
| `backend/src/obione/extractions/llm/port.py` | `AbstractExtractor` (Protocol) |
| `backend/src/obione/extractions/llm/mock.py` | `MockExtractor` — loads `atividades/schema_extracao_exemplo.json` |
| `backend/src/obione/extractions/service.py` | `create_from_pipeline(uow, extractor, doc)`, `create_from_manual(uow, content)`, `list_for_project` |
| `backend/src/obione/extractions/router.py` | `GET /projects/{id}/extractions`, `POST /projects/{id}/extractions/manual` |
| `backend/alembic/versions/0004_create_extractions.py` | Migration |
| `backend/tests/unit/extractions/test_service.py` | Uses MockExtractor + Fakes |
| `backend/tests/integration/extractions/test_repository.py` | Real DB |
| `backend/tests/e2e/test_extractions_flow.py` | List + manual create |

### Wire-up & CLI (Phase 7)

| Path | Responsibility |
|---|---|
| `backend/src/obione/main.py` | `create_app()` factory: wires middleware, exception handlers, all routers |
| `backend/src/obione/cli/__init__.py` | Marker |
| `backend/src/obione/cli/main.py` | `python -m obione.cli create-user ...` |
| `backend/tests/integration/test_cli.py` | CLI smoke test |

---

## Execution phases (commit at end of each)

- **Phase 0:** Project scaffolding (no Python code yet — gets Docker + Postgres up)
- **Phase 1:** Shared infrastructure (Settings, DB, exceptions, logging, middleware, UoW)
- **Phase 2:** Health module — first working endpoint
- **Phase 3:** Auth — login, JWT, /me, admin user creation
- **Phase 4:** Projects — CRUD + access control
- **Phase 5:** Documents — upload + storage adapter
- **Phase 6:** Extractions stub — model + Mock extractor + endpoints
- **Phase 7:** App wire-up, CLI, README, smoke tests

---

## Phase 0: Project Scaffolding

**Goal:** From an empty `backend/` directory to `docker-compose up` running Postgres + an empty FastAPI app that boots without error.

### Task 0.1: Create pyproject.toml

**Files:**
- Create: `backend/pyproject.toml`

- [ ] **Step 1: Write pyproject.toml**

```toml
[project]
name = "obione-backend"
version = "0.1.0"
description = "ObiOne — Observatorio de Projetos. Backend FastAPI + Postgres."
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    "sqlalchemy>=2.0",
    "psycopg[binary]>=3.2",
    "alembic>=1.13",
    "pydantic>=2.9",
    "pydantic-settings>=2.5",
    "python-jose[cryptography]>=3.3",
    "passlib[bcrypt]>=1.7",
    "python-multipart>=0.0.12",
    "email-validator>=2.2",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3",
    "pytest-cov>=5.0",
    "httpx>=0.27",
    "ruff>=0.7",
]

[project.scripts]
obione = "obione.cli.main:main"

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short --strict-markers"
filterwarnings = ["ignore::DeprecationWarning"]
markers = [
    "unit: pure unit tests with no I/O",
    "integration: tests that hit the real database",
    "e2e: end-to-end tests via FastAPI TestClient",
]

[tool.ruff]
line-length = 100
target-version = "py311"
src = ["src", "tests"]

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "C4", "SIM"]
ignore = ["E501"]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["N802"]  # allow Test_ prefixes if needed
```

- [ ] **Step 2: Commit**

```bash
git add backend/pyproject.toml
git commit -m "chore(backend): add pyproject.toml with deps and tool config"
```

### Task 0.2: Create Dockerfile

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Write Dockerfile**

```dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install -e ".[dev]"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "obione.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "chore(backend): add Dockerfile"
```

### Task 0.3: Create docker-compose.yml

**Files:**
- Create: `backend/docker-compose.yml`

- [ ] **Step 1: Write docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: obione-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-obione}
      POSTGRES_USER: ${POSTGRES_USER:-obione}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-obione}
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-obione} -d ${POSTGRES_DB:-obione}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: obione-backend
    depends_on:
      postgres:
        condition: service_healthy
    env_file:
      - .env
    ports:
      - "8000:8000"
    volumes:
      - ./src:/app/src
      - ./tests:/app/tests
      - ./alembic:/app/alembic
      - ./alembic.ini:/app/alembic.ini
      - storage:/app/storage
    command: uvicorn obione.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  pg_data:
  storage:
```

- [ ] **Step 2: Commit**

```bash
git add backend/docker-compose.yml
git commit -m "chore(backend): add docker-compose with postgres + backend"
```

### Task 0.4: Create .env.example and .gitignore

**Files:**
- Create: `backend/.env.example`
- Create: `backend/.gitignore`

- [ ] **Step 1: Write .env.example**

```env
# Database
POSTGRES_DB=obione
POSTGRES_USER=obione
POSTGRES_PASSWORD=obione
DATABASE_URL=postgresql+psycopg://obione:obione@postgres:5432/obione

# Auth — generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=change-me-this-must-be-at-least-32-characters-long-for-security
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Storage
STORAGE_BACKEND=filesystem
STORAGE_ROOT=/app/storage
MAX_UPLOAD_SIZE_MB=50

# LLM (Sprint 2 placeholder)
LLM_PROVIDER=mock
LLM_BASE_URL=
LLM_API_KEY=

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Observability
LOG_LEVEL=INFO
LOG_FORMAT=plain
```

- [ ] **Step 2: Write .gitignore**

```gitignore
__pycache__/
*.py[cod]
*$py.class
.Python
.venv/
venv/
env/
.env
.env.local
.pytest_cache/
.coverage
htmlcov/
.ruff_cache/
*.egg-info/
dist/
build/
storage/
.DS_Store
```

- [ ] **Step 3: Commit**

```bash
git add backend/.env.example backend/.gitignore
git commit -m "chore(backend): add .env.example and .gitignore"
```

### Task 0.5: Create Makefile

**Files:**
- Create: `backend/Makefile`

- [ ] **Step 1: Write Makefile**

```makefile
.PHONY: help up down logs shell psql migrate migration migrate-down test test-unit test-integration test-e2e lint format seed clean

help:  ## List available targets
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up:  ## Start postgres + backend in background
	docker-compose up -d --build
	@echo "Waiting for backend to be healthy..."
	@sleep 5
	@curl -fsS http://localhost:8000/health > /dev/null 2>&1 \
		&& echo "✓ Backend up: http://localhost:8000/docs" \
		|| (echo "✗ Backend did not respond — check 'make logs'" && exit 1)

down:  ## Stop containers (keep volumes)
	docker-compose down

logs:  ## Tail backend logs
	docker-compose logs -f backend

shell:  ## Bash into backend container
	docker-compose exec backend bash

psql:  ## psql into postgres
	docker-compose exec postgres psql -U obione obione

migrate:  ## Apply pending migrations
	docker-compose exec backend alembic upgrade head

migration:  ## Generate migration (usage: make migration m="add foo table")
	docker-compose exec backend alembic revision --autogenerate -m "$(m)"

migrate-down:  ## Rollback last migration
	docker-compose exec backend alembic downgrade -1

test:  ## Run all tests
	docker-compose exec backend pytest

test-unit:  ## Run only unit tests
	docker-compose exec backend pytest -m unit

test-integration:  ## Run only integration tests
	docker-compose exec backend pytest -m integration

test-e2e:  ## Run only e2e tests
	docker-compose exec backend pytest -m e2e

lint:  ## Check linting + formatting (no changes)
	docker-compose exec backend ruff check .
	docker-compose exec backend ruff format --check .

format:  ## Apply formatting + auto-fix linting
	docker-compose exec backend ruff format .
	docker-compose exec backend ruff check --fix .

seed:  ## Create admin@obione.local / admin123
	docker-compose exec backend python -m obione.cli create-user \
		--email admin@obione.local --password admin123 --role admin --name "Admin"

clean:  ## Stop containers AND remove volumes (DELETES DATA)
	docker-compose down -v
```

- [ ] **Step 2: Commit**

```bash
git add backend/Makefile
git commit -m "chore(backend): add Makefile with dev workflow targets"
```

### Task 0.6: Create README.md

**Files:**
- Create: `backend/README.md`

- [ ] **Step 1: Write README.md**

```markdown
# ObiOne Backend

FastAPI backend for the ObiOne project observatory.

## Setup (4 commands)

```bash
cd backend
cp .env.example .env
make up
make migrate
make seed       # creates admin@obione.local / admin123
```

Then open http://localhost:8000/docs

## Project layout

See `atividades/arquitetura_backend.md` for the full architecture spec.

```
backend/
├── src/obione/        # Package — bounded contexts (auth, projects, documents, extractions)
├── tests/             # 3 tiers: unit/, integration/, e2e/
├── alembic/           # Database migrations
└── Makefile           # Dev workflow
```

## Common commands

```bash
make up         # bring up postgres + backend
make down       # stop containers (keep data)
make logs       # tail backend logs
make psql       # psql shell
make migrate    # apply migrations
make test       # run all tests
make lint       # check style
make format     # apply formatting + auto-fix
```

## Architecture

Pragmatic clean architecture — see `atividades/arquitetura_backend.md`.

- Code in en-US
- 3-tier tests: unit (no I/O, Fakes) / integration (real DB) / e2e (FastAPI TestClient)
- Repository pattern + Unit of Work for transactional boundaries
- Ports & adapters for LLM and blob storage
```

- [ ] **Step 2: Commit**

```bash
git add backend/README.md
git commit -m "chore(backend): add README with setup and architecture pointer"
```

### Task 0.7: Bootstrap minimal app to verify Docker boots

**Files:**
- Create: `backend/src/obione/__init__.py` (empty)
- Create: `backend/src/obione/main.py`

- [ ] **Step 1: Write src/obione/__init__.py** (empty file)

```python
```

- [ ] **Step 2: Write src/obione/main.py** (minimal placeholder)

```python
"""FastAPI app factory. Modules will register routers here in later tasks."""
from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(
        title="ObiOne — Observatorio de Projetos",
        version="0.1.0",
    )

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
```

- [ ] **Step 3: Start the stack**

Run: `cd backend && cp .env.example .env && make up`
Expected: `✓ Backend up: http://localhost:8000/docs`

- [ ] **Step 4: Verify health endpoint**

Run: `curl -s http://localhost:8000/health`
Expected: `{"status":"ok"}`

- [ ] **Step 5: Stop containers (cleanup before next phase)**

Run: `cd backend && make down`

- [ ] **Step 6: Commit**

```bash
git add backend/src/obione/__init__.py backend/src/obione/main.py
git commit -m "feat(backend): bootstrap minimal FastAPI app with health endpoint"
```

---

**End of Phase 0.** At this point: Docker stack boots, postgres is healthy, FastAPI returns `/health`. No business logic yet.

---

## Phase 1: Shared Infrastructure

**Goal:** Settings loading, database engine, exception hierarchy, structured logging, request-id middleware, Unit of Work pattern, Alembic configured, pytest fixtures. After this phase, the app boots with full infra but no business logic.

### Task 1.1: Settings (Pydantic BaseSettings)

**Files:**
- Create: `backend/src/obione/settings.py`
- Create: `backend/tests/__init__.py` (empty)
- Create: `backend/tests/unit/__init__.py` (empty)
- Create: `backend/tests/unit/test_settings.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/test_settings.py
import pytest

from obione.settings import Settings


@pytest.mark.unit
def test_settings_loads_required_fields(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "a" * 32)
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@h:5432/d")
    s = Settings(_env_file=None)
    assert s.JWT_SECRET.get_secret_value() == "a" * 32
    assert s.DATABASE_URL == "postgresql+psycopg://u:p@h:5432/d"
    assert s.JWT_ALGORITHM == "HS256"
    assert s.LOG_FORMAT == "plain"


@pytest.mark.unit
def test_settings_rejects_short_jwt_secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "too-short")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@h:5432/d")
    with pytest.raises(ValueError):
        Settings(_env_file=None)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `make shell` then `pytest tests/unit/test_settings.py -v`
Expected: `ModuleNotFoundError: No module named 'obione.settings'`

- [ ] **Step 3: Implement settings**

```python
# backend/src/obione/settings.py
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str

    # Auth — JWT
    JWT_SECRET: SecretStr = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    # Storage
    STORAGE_BACKEND: Literal["filesystem"] = "filesystem"
    STORAGE_ROOT: str = "/app/storage"
    MAX_UPLOAD_SIZE_MB: int = 50

    # LLM (Sprint 2)
    LLM_PROVIDER: str = "mock"
    LLM_BASE_URL: str | None = None
    LLM_API_KEY: SecretStr | None = None

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Observability
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    LOG_FORMAT: Literal["json", "plain"] = "plain"


settings = Settings()
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pytest tests/unit/test_settings.py -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add backend/src/obione/settings.py backend/tests/__init__.py backend/tests/unit/__init__.py backend/tests/unit/test_settings.py
git commit -m "feat(settings): add typed Settings with env loading and JWT secret validation"
```

### Task 1.2: IDs helper

**Files:**
- Create: `backend/src/obione/shared/__init__.py` (empty)
- Create: `backend/src/obione/shared/ids.py`
- Create: `backend/tests/unit/shared/__init__.py` (empty)
- Create: `backend/tests/unit/shared/test_ids.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/shared/test_ids.py
import uuid

import pytest

from obione.shared.ids import new_id


@pytest.mark.unit
def test_new_id_returns_uuid4():
    result = new_id()
    assert isinstance(result, uuid.UUID)
    assert result.version == 4


@pytest.mark.unit
def test_new_id_unique():
    ids = {new_id() for _ in range(100)}
    assert len(ids) == 100
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/shared/ids.py
"""UUID helpers. Using v4 everywhere to avoid sequential ID leakage."""
import uuid


def new_id() -> uuid.UUID:
    return uuid.uuid4()
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/shared/test_ids.py -v`
Expected: 2 passed

```bash
git add backend/src/obione/shared/__init__.py backend/src/obione/shared/ids.py backend/tests/unit/shared/__init__.py backend/tests/unit/shared/test_ids.py
git commit -m "feat(shared): add new_id() UUID v4 helper"
```

### Task 1.3: Exceptions hierarchy

**Files:**
- Create: `backend/src/obione/shared/exceptions.py`
- Create: `backend/tests/unit/shared/test_exceptions.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/shared/test_exceptions.py
import pytest

from obione.shared.exceptions import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ObioneException,
    UnauthorizedError,
)


@pytest.mark.unit
@pytest.mark.parametrize(
    "exc_cls,expected_status,expected_code",
    [
        (BadRequestError, 400, "bad_request"),
        (UnauthorizedError, 401, "unauthorized"),
        (ForbiddenError, 403, "forbidden"),
        (NotFoundError, 404, "not_found"),
        (ConflictError, 409, "conflict"),
    ],
)
def test_exception_defaults(exc_cls, expected_status, expected_code):
    e = exc_cls("something went wrong")
    assert isinstance(e, ObioneException)
    assert e.status_code == expected_status
    assert e.code == expected_code
    assert str(e) == "something went wrong"


@pytest.mark.unit
def test_subclass_can_override_code():
    class FooError(BadRequestError):
        code = "foo"

    assert FooError("x").code == "foo"
    assert FooError("x").status_code == 400
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/shared/exceptions.py
"""Typed exception hierarchy. Mapped to HTTP responses by FastAPI handler."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ObioneException(Exception):
    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BadRequestError(ObioneException):
    status_code = 400
    code = "bad_request"


class UnauthorizedError(ObioneException):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(ObioneException):
    status_code = 403
    code = "forbidden"


class NotFoundError(ObioneException):
    status_code = 404
    code = "not_found"


class ConflictError(ObioneException):
    status_code = 409
    code = "conflict"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ObioneException)
    async def _obione_handler(request: Request, exc: ObioneException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/shared/test_exceptions.py -v`
Expected: 6 passed

```bash
git add backend/src/obione/shared/exceptions.py backend/tests/unit/shared/test_exceptions.py
git commit -m "feat(shared): add typed exception hierarchy with HTTP handler"
```

### Task 1.4: Database (Base, engine, SessionLocal, get_db)

**Files:**
- Create: `backend/src/obione/shared/database.py`

(No unit test — pure infrastructure wiring; verified by integration tests later.)

- [ ] **Step 1: Implement**

```python
# backend/src/obione/shared/database.py
"""SQLAlchemy 2 engine, sessionmaker, Base. Naming convention applied for stable migrations."""
from collections.abc import Generator

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from obione.settings import settings

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a session, closes at request end."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/shared/database.py
git commit -m "feat(shared): add SQLAlchemy engine, Base with naming convention, get_db dep"
```

### Task 1.5: Structured logging

**Files:**
- Create: `backend/src/obione/shared/logging.py`
- Create: `backend/tests/unit/shared/test_logging.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/shared/test_logging.py
import json
import logging

import pytest

from obione.shared.logging import JsonFormatter, configure_logging


@pytest.mark.unit
def test_json_formatter_produces_valid_json():
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="obione.test", level=logging.INFO, pathname="x.py", lineno=1,
        msg="hello %s", args=("world",), exc_info=None,
    )
    out = formatter.format(record)
    parsed = json.loads(out)
    assert parsed["msg"] == "hello world"
    assert parsed["level"] == "INFO"
    assert parsed["logger"] == "obione.test"
    assert "ts" in parsed


@pytest.mark.unit
def test_json_formatter_includes_extras():
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="x", level=logging.INFO, pathname="x.py", lineno=1,
        msg="m", args=None, exc_info=None,
    )
    record.request_id = "abc-123"
    record.user_id = "user-1"
    parsed = json.loads(formatter.format(record))
    assert parsed["request_id"] == "abc-123"
    assert parsed["user_id"] == "user-1"


@pytest.mark.unit
def test_configure_logging_plain(capsys):
    configure_logging(level="INFO", fmt="plain")
    logging.getLogger("obione.test").info("hello")
    captured = capsys.readouterr()
    assert "hello" in captured.err or "hello" in captured.out
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/shared/logging.py
"""Structured logging: JSON for production, plain for local dev."""
import json
import logging
import sys
from datetime import datetime, timezone
from typing import Literal

_BASE_FIELDS = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "message", "taskName",
}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "ts": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in _BASE_FIELDS and not key.startswith("_"):
                payload[key] = value
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(*, level: str = "INFO", fmt: Literal["json", "plain"] = "plain") -> None:
    handler = logging.StreamHandler(sys.stdout)
    if fmt == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)-7s %(name)s :: %(message)s")
        )
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/shared/test_logging.py -v`
Expected: 3 passed

```bash
git add backend/src/obione/shared/logging.py backend/tests/unit/shared/test_logging.py
git commit -m "feat(shared): add JSON + plain logging with extras propagation"
```

### Task 1.6: Request-ID + access log middleware

**Files:**
- Create: `backend/src/obione/shared/middleware.py`
- Create: `backend/tests/unit/shared/test_middleware.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/shared/test_middleware.py
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from obione.shared.middleware import register_middleware


@pytest.fixture
def app():
    a = FastAPI()
    register_middleware(a)

    @a.get("/ping")
    def ping():
        return {"ok": True}

    return a


@pytest.mark.unit
def test_request_id_generated_when_absent(app):
    with TestClient(app) as c:
        r = c.get("/ping")
    assert r.status_code == 200
    rid = r.headers.get("x-request-id")
    assert rid and len(rid) >= 16


@pytest.mark.unit
def test_request_id_propagated_when_present(app):
    with TestClient(app) as c:
        r = c.get("/ping", headers={"x-request-id": "client-supplied"})
    assert r.headers["x-request-id"] == "client-supplied"
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/shared/middleware.py
"""Request-ID propagation + access log middleware."""
import logging
import time
import uuid

from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from obione.settings import settings

_logger = logging.getLogger("obione.request")


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_id_and_access_log(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - started) * 1000
            _logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id, "method": request.method,
                    "path": request.url.path, "elapsed_ms": round(elapsed_ms, 2),
                },
            )
            raise
        elapsed_ms = (time.perf_counter() - started) * 1000
        response.headers["x-request-id"] = request_id
        _logger.info(
            "request",
            extra={
                "request_id": request_id, "method": request.method,
                "path": request.url.path, "status": response.status_code,
                "elapsed_ms": round(elapsed_ms, 2),
            },
        )
        return response
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/shared/test_middleware.py -v`
Expected: 2 passed

```bash
git add backend/src/obione/shared/middleware.py backend/tests/unit/shared/test_middleware.py
git commit -m "feat(shared): add request-id propagation + access log middleware"
```

### Task 1.7: Unit of Work pattern

**Files:**
- Create: `backend/src/obione/unit_of_work.py`
- Create: `backend/tests/unit/test_unit_of_work.py`

(Repositories will be added to UoW in each bounded-context phase. This task defines the base.)

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/test_unit_of_work.py
import pytest

from obione.unit_of_work import AbstractUnitOfWork, FakeUnitOfWork


class _CountingUoW(FakeUnitOfWork):
    def __init__(self):
        super().__init__()
        self.commit_count = 0
        self.rollback_count = 0

    def commit(self) -> None:
        super().commit()
        self.commit_count += 1

    def rollback(self) -> None:
        super().rollback()
        self.rollback_count += 1


@pytest.mark.unit
def test_uow_commits_explicit():
    uow = _CountingUoW()
    with uow:
        uow.commit()
    assert uow.commit_count == 1
    assert uow.rollback_count == 1  # always rolls back on __exit__ to undo non-committed work


@pytest.mark.unit
def test_uow_rolls_back_on_exception():
    uow = _CountingUoW()
    with pytest.raises(RuntimeError):
        with uow:
            raise RuntimeError("boom")
    assert uow.commit_count == 0
    assert uow.rollback_count == 1


@pytest.mark.unit
def test_abstract_uow_requires_commit_rollback():
    class Incomplete(AbstractUnitOfWork):
        pass

    with pytest.raises(TypeError):
        Incomplete()
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/unit_of_work.py
"""Unit of Work pattern. Services manipulate UoW, never Session directly.

Concrete repositories are attached as attributes on the UoW instance — added
incrementally as each bounded context phase lands.
"""
from __future__ import annotations

import abc
from collections.abc import Callable

from sqlalchemy.orm import Session

from obione.shared.database import SessionLocal


class AbstractUnitOfWork(abc.ABC):
    """Context manager that wraps a transaction boundary.

    Concrete implementations attach repositories as attributes (e.g. self.users).
    Services call uow.commit() to persist; otherwise everything rolls back.
    """

    def __enter__(self) -> AbstractUnitOfWork:
        return self

    def __exit__(self, *args) -> None:
        self.rollback()

    @abc.abstractmethod
    def commit(self) -> None: ...

    @abc.abstractmethod
    def rollback(self) -> None: ...


class SqlAlchemyUnitOfWork(AbstractUnitOfWork):
    """Real implementation. Opens a Session and binds repositories to it.

    Repositories are attached in __enter__ — added in subsequent phases.
    """

    def __init__(self, session_factory: Callable[[], Session] = SessionLocal):
        self._session_factory = session_factory
        self.session: Session | None = None

    def __enter__(self) -> SqlAlchemyUnitOfWork:
        self.session = self._session_factory()
        # Repositories bound here in later phases:
        # self.users = SqlAlchemyUserRepository(self.session)
        # self.projects = SqlAlchemyProjectRepository(self.session)
        # etc.
        return super().__enter__()  # type: ignore[return-value]

    def __exit__(self, *args) -> None:
        super().__exit__(*args)
        if self.session is not None:
            self.session.close()
            self.session = None

    def commit(self) -> None:
        if self.session is not None:
            self.session.commit()

    def rollback(self) -> None:
        if self.session is not None:
            self.session.rollback()


class FakeUnitOfWork(AbstractUnitOfWork):
    """In-memory UoW for unit tests. Fake repositories attached as needed."""

    def __init__(self):
        self.committed = False
        # Fake repositories attached in unit tests of each context.

    def commit(self) -> None:
        self.committed = True

    def rollback(self) -> None:
        # Tests can assert no commit happened
        pass
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/test_unit_of_work.py -v`
Expected: 3 passed

```bash
git add backend/src/obione/unit_of_work.py backend/tests/unit/test_unit_of_work.py
git commit -m "feat: add AbstractUnitOfWork + SqlAlchemy + Fake implementations"
```

### Task 1.8: Alembic configuration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/.gitkeep`

(No tests — verified by running migrations in subsequent phases.)

- [ ] **Step 1: Write alembic.ini**

```ini
[alembic]
script_location = alembic
prepend_sys_path = src
file_template = %%(rev)s_%%(slug)s
truncate_slug_length = 60
output_encoding = utf-8

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARNING
handlers = console
qualname =

[logger_sqlalchemy]
level = WARNING
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: Write alembic/env.py**

```python
# backend/alembic/env.py
"""Alembic env. Imports all model modules so target_metadata is populated."""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from obione.settings import settings
from obione.shared.database import Base

# Import all models so they register on Base.metadata.
# Add new imports here when new bounded contexts add models.
# (No models yet — added in phases 3+.)

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Write alembic/script.py.mako**

```python
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 4: Create empty versions/ directory marker**

```bash
mkdir -p backend/alembic/versions
touch backend/alembic/versions/.gitkeep
```

- [ ] **Step 5: Verify alembic CLI works (no migrations yet, but command runs)**

Run: `make up && docker-compose exec backend alembic current`
Expected: empty output (no current revision yet)

- [ ] **Step 6: Commit**

```bash
git add backend/alembic.ini backend/alembic/env.py backend/alembic/script.py.mako backend/alembic/versions/.gitkeep
git commit -m "chore(alembic): configure migrations env pointing to Base.metadata"
```

### Task 1.9: pytest conftest with shared fixtures

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/integration/__init__.py` (empty)
- Create: `backend/tests/e2e/__init__.py` (empty)

(Fixtures: TestClient, transactional db_session. Used by all later tests.)

- [ ] **Step 1: Write conftest.py**

```python
# backend/tests/conftest.py
"""Shared pytest fixtures.

- `client`: FastAPI TestClient (no DB rollback — for e2e)
- `db_session`: transactional SQLAlchemy session (auto-rollback per test) — for integration
"""
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from obione.main import app
from obione.shared.database import engine, SessionLocal


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Transactional session: every test runs in a transaction that's rolled back."""
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
```

- [ ] **Step 2: Commit**

```bash
git add backend/tests/conftest.py backend/tests/integration/__init__.py backend/tests/e2e/__init__.py
git commit -m "test: add shared conftest with TestClient and transactional db_session"
```

---

**End of Phase 1.** Shared infra is complete. Next: wire health endpoint to use real DB.

---

## Phase 2: Health Module (full)

**Goal:** Replace bootstrap `/health` with proper module that also exposes `/health/db` confirming DB connectivity.

### Task 2.1: Health router with /health and /health/db

**Files:**
- Create: `backend/src/obione/health/__init__.py` (empty)
- Create: `backend/src/obione/health/router.py`
- Modify: `backend/src/obione/main.py` (replace inline health with module router)
- Create: `backend/tests/e2e/test_health.py`

- [ ] **Step 1: Write the failing e2e test**

```python
# backend/tests/e2e/test_health.py
import pytest


@pytest.mark.e2e
def test_health_liveness(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.e2e
def test_health_db(client):
    r = client.get("/health/db")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "PostgreSQL" in body["postgres"]
```

- [ ] **Step 2: Run to verify it fails on /health/db (404 — endpoint missing)**

Run: `make up && pytest tests/e2e/test_health.py -v`
Expected: `test_health_liveness PASSED` (bootstrap still serves it), `test_health_db FAILED` (404)

- [ ] **Step 3: Implement health router**

```python
# backend/src/obione/health/router.py
"""Health endpoints. /health is liveness (no DB); /health/db hits Postgres."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from obione.shared.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def liveness() -> dict:
    return {"status": "ok"}


@router.get("/db")
def db_check(db: Annotated[Session, Depends(get_db)]) -> dict:
    version = db.execute(text("SELECT version()")).scalar_one()
    return {"status": "ok", "postgres": version}
```

- [ ] **Step 4: Update main.py to register router (remove inline /health)**

```python
# backend/src/obione/main.py
"""FastAPI app factory."""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from obione.health.router import router as health_router
from obione.settings import settings
from obione.shared.exceptions import register_exception_handlers
from obione.shared.logging import configure_logging
from obione.shared.middleware import register_middleware


def create_app() -> FastAPI:
    configure_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)

    app = FastAPI(
        title="ObiOne — Observatorio de Projetos",
        description="Backend for the ObiOne project observatory (MPO + Generative AI).",
        version="0.1.0",
    )

    register_middleware(app)
    register_exception_handlers(app)

    app.include_router(health_router)

    @app.get("/", include_in_schema=False)
    def root():
        return RedirectResponse(url="/docs")

    return app


app = create_app()
```

- [ ] **Step 5: Run tests to verify pass**

Run: `make up && pytest tests/e2e/test_health.py -v`
Expected: 2 passed

- [ ] **Step 6: Manual smoke**

Run:
```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/health/db
```

Expected:
```
{"status":"ok"}
{"status":"ok","postgres":"PostgreSQL 16..."}
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/obione/health/__init__.py backend/src/obione/health/router.py backend/src/obione/main.py backend/tests/e2e/test_health.py
git commit -m "feat(health): add /health and /health/db endpoints with e2e tests"
```

---

**End of Phase 2.** App boots, both health endpoints return 200, DB is reachable. Next: auth.

---

## Phase 3: Auth Bounded Context

**Goal:** Login via email+password issuing JWT. `GET /auth/me` returns the authenticated user. `POST /auth/users` is admin-only — no public signup. Users created via API or CLI (Phase 7).

### Task 3.1: User domain model

**Files:**
- Create: `backend/src/obione/auth/__init__.py` (empty)
- Create: `backend/src/obione/auth/models.py`

(SQLAlchemy 2 `Mapped[]` annotations double as the domain entity — pragmatic clean architecture.)

- [ ] **Step 1: Implement**

```python
# backend/src/obione/auth/models.py
"""User domain entity (also the SQLAlchemy model — pragmatic clean architecture)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.shared.database import Base
from obione.shared.ids import new_id

USER_ROLES = ("consultant", "client", "admin")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=new_id
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(f"role IN {USER_ROLES}", name="valid_role"),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/auth/__init__.py backend/src/obione/auth/models.py
git commit -m "feat(auth): add User domain model with role check constraint"
```

### Task 3.2: Auth exceptions

**Files:**
- Create: `backend/src/obione/auth/exceptions.py`

- [ ] **Step 1: Implement**

```python
# backend/src/obione/auth/exceptions.py
"""Auth-specific typed exceptions."""
from obione.shared.exceptions import ConflictError, ForbiddenError, UnauthorizedError


class InvalidCredentialsError(UnauthorizedError):
    code = "invalid_credentials"


class InvalidTokenError(UnauthorizedError):
    code = "invalid_token"


class EmailAlreadyExistsError(ConflictError):
    code = "email_already_exists"


class RoleNotAllowedError(ForbiddenError):
    code = "role_not_allowed"
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/auth/exceptions.py
git commit -m "feat(auth): add typed exceptions for auth flows"
```

### Task 3.3: Security primitives (bcrypt + JWT)

**Files:**
- Create: `backend/src/obione/auth/security.py`
- Create: `backend/tests/unit/auth/__init__.py` (empty)
- Create: `backend/tests/unit/auth/test_security.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/auth/test_security.py
import time

import pytest

from obione.auth.exceptions import InvalidTokenError
from obione.auth.security import (
    decode_token,
    encode_token,
    hash_password,
    verify_password,
)


@pytest.mark.unit
def test_hash_and_verify_password():
    h = hash_password("secret-123")
    assert verify_password("secret-123", h) is True
    assert verify_password("wrong", h) is False


@pytest.mark.unit
def test_encode_decode_token_roundtrip():
    token, expires_in = encode_token(sub="user-123", extra={"role": "admin"})
    assert isinstance(token, str)
    assert expires_in > 0
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert "exp" in payload
    assert "iat" in payload


@pytest.mark.unit
def test_decode_invalid_token_raises():
    with pytest.raises(InvalidTokenError):
        decode_token("not-a-jwt")


@pytest.mark.unit
def test_decode_expired_token_raises(monkeypatch):
    from obione.settings import settings
    monkeypatch.setattr(settings, "JWT_EXPIRE_MINUTES", 0)
    token, _ = encode_token(sub="x")
    time.sleep(1)
    with pytest.raises(InvalidTokenError):
        decode_token(token)
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/auth/security.py
"""Password hashing (bcrypt) + JWT encode/decode. Pure functions."""
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from obione.auth.exceptions import InvalidTokenError
from obione.settings import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def encode_token(*, sub: str, extra: dict | None = None) -> tuple[str, int]:
    """Encode JWT. Returns (token, expires_in_seconds)."""
    expires_delta = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    now = datetime.now(tz=timezone.utc)
    payload: dict = {
        "sub": sub,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(
        payload,
        settings.JWT_SECRET.get_secret_value(),
        algorithm=settings.JWT_ALGORITHM,
    )
    return token, int(expires_delta.total_seconds())


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET.get_secret_value(),
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as e:
        raise InvalidTokenError(f"Token decode failed: {e}") from e
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/auth/test_security.py -v`
Expected: 4 passed

```bash
git add backend/src/obione/auth/security.py backend/tests/unit/auth/__init__.py backend/tests/unit/auth/test_security.py
git commit -m "feat(auth): add bcrypt password hashing and JWT encode/decode"
```

### Task 3.4: User repository (Abstract + Fake + SqlAlchemy)

**Files:**
- Create: `backend/src/obione/auth/repository.py`

(Unit tests for the SqlAlchemy implementation live in `tests/integration/`. The Fake is tested via service tests in Task 3.6.)

- [ ] **Step 1: Implement**

```python
# backend/src/obione/auth/repository.py
"""User repository — abstract port + SqlAlchemy adapter + in-memory fake."""
from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.auth.models import User


class AbstractUserRepository(Protocol):
    def add(self, user: User) -> None: ...
    def get(self, user_id: uuid.UUID) -> User | None: ...
    def get_by_email(self, email: str) -> User | None: ...
    def list(self) -> list[User]: ...


class SqlAlchemyUserRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, user: User) -> None:
        self._session.add(user)

    def get(self, user_id: uuid.UUID) -> User | None:
        return self._session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self._session.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

    def list(self) -> list[User]:
        return list(self._session.execute(select(User)).scalars())


class FakeUserRepository:
    """In-memory repo for unit tests."""

    def __init__(self):
        self._users: dict[uuid.UUID, User] = {}

    def add(self, user: User) -> None:
        if user.id is None:
            from obione.shared.ids import new_id
            user.id = new_id()
        self._users[user.id] = user

    def get(self, user_id: uuid.UUID) -> User | None:
        return self._users.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        return next((u for u in self._users.values() if u.email == email), None)

    def list(self) -> list[User]:
        return list(self._users.values())
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/auth/repository.py
git commit -m "feat(auth): add UserRepository (abstract + SqlAlchemy + Fake)"
```

### Task 3.5: Auth schemas (Pydantic DTOs)

**Files:**
- Create: `backend/src/obione/auth/schemas.py`

- [ ] **Step 1: Implement**

```python
# backend/src/obione/auth/schemas.py
"""Pydantic DTOs for the auth bounded context."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["consultant", "client", "admin"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # seconds


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=255)
    role: Role


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    name: str
    role: Role
    created_at: datetime
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/auth/schemas.py
git commit -m "feat(auth): add Pydantic DTOs for login, token, user create/response"
```

### Task 3.6: Bind user repository to UoW

**Files:**
- Modify: `backend/src/obione/unit_of_work.py:38-44` (uncomment users binding in SqlAlchemy UoW; add users to FakeUoW)

- [ ] **Step 1: Modify SqlAlchemyUnitOfWork.__enter__**

Replace the comment-only `__enter__` body with:

```python
    def __enter__(self) -> SqlAlchemyUnitOfWork:
        self.session = self._session_factory()
        from obione.auth.repository import SqlAlchemyUserRepository
        self.users: SqlAlchemyUserRepository = SqlAlchemyUserRepository(self.session)
        return super().__enter__()  # type: ignore[return-value]
```

- [ ] **Step 2: Modify FakeUnitOfWork.__init__**

```python
    def __init__(self):
        self.committed = False
        from obione.auth.repository import FakeUserRepository
        self.users: FakeUserRepository = FakeUserRepository()
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/unit_of_work.py
git commit -m "feat(uow): bind user repository to SqlAlchemy and Fake UoWs"
```

### Task 3.7: Auth service (use cases)

**Files:**
- Create: `backend/src/obione/auth/service.py`
- Create: `backend/tests/unit/auth/test_service.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/auth/test_service.py
import pytest

from obione.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    RoleNotAllowedError,
)
from obione.auth.models import User
from obione.auth.schemas import UserCreate
from obione.auth.security import hash_password
from obione.auth.service import authenticate, create_user
from obione.unit_of_work import FakeUnitOfWork


def _make_user(email: str = "a@b.com", password: str = "secret123", role: str = "consultant") -> User:
    u = User(email=email, password_hash=hash_password(password), name="X", role=role)
    return u


@pytest.mark.unit
def test_authenticate_success_returns_token():
    uow = FakeUnitOfWork()
    uow.users.add(_make_user())
    token, expires_in, user = authenticate(uow, email="a@b.com", password="secret123")
    assert isinstance(token, str) and len(token) > 20
    assert expires_in > 0
    assert user.email == "a@b.com"


@pytest.mark.unit
def test_authenticate_wrong_password_raises():
    uow = FakeUnitOfWork()
    uow.users.add(_make_user())
    with pytest.raises(InvalidCredentialsError):
        authenticate(uow, email="a@b.com", password="wrong")


@pytest.mark.unit
def test_authenticate_unknown_email_raises():
    uow = FakeUnitOfWork()
    with pytest.raises(InvalidCredentialsError):
        authenticate(uow, email="nobody@x.com", password="x")


@pytest.mark.unit
def test_create_user_success_commits():
    uow = FakeUnitOfWork()
    data = UserCreate(email="new@x.com", password="strong-pwd", name="N", role="consultant")
    user = create_user(uow, data)
    assert user.email == "new@x.com"
    assert uow.committed is True
    assert uow.users.get_by_email("new@x.com") is not None


@pytest.mark.unit
def test_create_user_duplicate_email_raises():
    uow = FakeUnitOfWork()
    uow.users.add(_make_user(email="dup@x.com"))
    data = UserCreate(email="dup@x.com", password="strong-pwd", name="N", role="consultant")
    with pytest.raises(EmailAlreadyExistsError):
        create_user(uow, data)


@pytest.mark.unit
def test_create_user_invalid_role_raises():
    uow = FakeUnitOfWork()
    # Role validation happens at Pydantic boundary; service trusts input.
    # This test asserts service rejects values bypassing pydantic (defense in depth).
    from obione.auth.schemas import UserCreate
    data = UserCreate.model_construct(  # bypass validation
        email="x@x.com", password="pwd", name="N", role="superuser",
    )
    with pytest.raises(RoleNotAllowedError):
        create_user(uow, data)
```

- [ ] **Step 2: Implement**

```python
# backend/src/obione/auth/service.py
"""Auth use cases. Pure functions; no FastAPI."""
from obione.auth.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    RoleNotAllowedError,
)
from obione.auth.models import USER_ROLES, User
from obione.auth.schemas import UserCreate
from obione.auth.security import encode_token, hash_password, verify_password
from obione.unit_of_work import AbstractUnitOfWork


def authenticate(
    uow: AbstractUnitOfWork, *, email: str, password: str
) -> tuple[str, int, User]:
    with uow:
        user = uow.users.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password.")
        token, expires_in = encode_token(sub=str(user.id), extra={"role": user.role})
        return token, expires_in, user


def create_user(uow: AbstractUnitOfWork, data: UserCreate) -> User:
    if data.role not in USER_ROLES:
        raise RoleNotAllowedError(f"Role must be one of {USER_ROLES}.")
    with uow:
        if uow.users.get_by_email(data.email) is not None:
            raise EmailAlreadyExistsError(f"Email already in use: {data.email}")
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            name=data.name,
            role=data.role,
        )
        uow.users.add(user)
        uow.commit()
        return user
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/auth/test_service.py -v`
Expected: 6 passed

```bash
git add backend/src/obione/auth/service.py backend/tests/unit/auth/test_service.py
git commit -m "feat(auth): add authenticate and create_user services with full unit coverage"
```

### Task 3.8: Auth dependencies (FastAPI)

**Files:**
- Create: `backend/src/obione/auth/dependencies.py`

(No unit tests — FastAPI Depends are tested via e2e in Task 3.11.)

- [ ] **Step 1: Implement**

```python
# backend/src/obione/auth/dependencies.py
"""FastAPI dependencies for the auth bounded context."""
from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from obione.auth.exceptions import InvalidTokenError
from obione.auth.models import User
from obione.auth.security import decode_token
from obione.shared.exceptions import ForbiddenError, UnauthorizedError
from obione.unit_of_work import SqlAlchemyUnitOfWork

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_uow() -> SqlAlchemyUnitOfWork:
    return SqlAlchemyUnitOfWork()


def get_current_user(
    token: Annotated[str | None, Depends(_oauth2_scheme)],
) -> User:
    if not token:
        raise UnauthorizedError("Authentication token missing.")
    try:
        payload = decode_token(token)
    except InvalidTokenError as e:
        raise UnauthorizedError(str(e)) from e
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Token has no subject.")
    import uuid
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as e:
        raise UnauthorizedError("Token subject is not a UUID.") from e
    with SqlAlchemyUnitOfWork() as uow:
        user = uow.users.get(user_id)
        if user is None:
            raise UnauthorizedError("User from token does not exist.")
        # Detach from session so caller can use after uow closes
        uow.session.expunge(user)
        return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*allowed: str):
    def _checker(user: CurrentUser) -> User:
        if user.role not in allowed:
            raise ForbiddenError(
                f"This action requires role in {allowed}. Current role: {user.role}."
            )
        return user

    return _checker
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/auth/dependencies.py
git commit -m "feat(auth): add get_current_user and require_role FastAPI dependencies"
```

### Task 3.9: Auth router

**Files:**
- Create: `backend/src/obione/auth/router.py`
- Modify: `backend/src/obione/main.py` (add auth router)

- [ ] **Step 1: Implement router**

```python
# backend/src/obione/auth/router.py
"""HTTP routes for the auth bounded context."""
from fastapi import APIRouter, Depends

from obione.auth import service
from obione.auth.dependencies import CurrentUser, get_uow, require_role
from obione.auth.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    token, expires_in, _user = service.authenticate(
        get_uow(), email=payload.email, password=payload.password
    )
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=UserResponse)
def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=201,
    dependencies=[Depends(require_role("admin"))],
)
def create_user(payload: UserCreate) -> UserResponse:
    user = service.create_user(get_uow(), payload)
    return UserResponse.model_validate(user)
```

- [ ] **Step 2: Register router in main.py**

Modify `backend/src/obione/main.py` to add:

```python
from obione.auth.router import router as auth_router
# ...
    app.include_router(health_router)
    app.include_router(auth_router)   # <-- ADD
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/auth/router.py backend/src/obione/main.py
git commit -m "feat(auth): add /auth/login, /auth/me, /auth/users routes"
```

### Task 3.10: Migration 0001 — users table

**Files:**
- Modify: `backend/alembic/env.py:13` (import User to populate metadata)
- Create: `backend/alembic/versions/0001_create_users.py` (via autogenerate)

- [ ] **Step 1: Modify alembic/env.py to import User**

Add line:
```python
from obione.auth.models import User  # noqa: F401 — populate metadata
```
(Place near the other imports inside env.py.)

- [ ] **Step 2: Generate migration**

Run: `make migration m="create users table"`
Expected: file `backend/alembic/versions/0001_create_users.py` generated.

- [ ] **Step 3: Inspect and rename file**

Open the generated file. Verify it creates `users` table with all columns + check constraint. Rename file to `0001_create_users.py` (strip the autogenerated hash if alembic added one).

The generated upgrade should look like:
```python
def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("role IN ('consultant', 'client', 'admin')", name="valid_role"),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
```

- [ ] **Step 4: Apply migration**

Run: `make migrate`
Expected: `Running upgrade  -> 0001, create users table`

- [ ] **Step 5: Verify in psql**

Run: `make psql` then `\d users`
Expected: table exists with 7 columns + email index + check constraint.

- [ ] **Step 6: Commit**

```bash
git add backend/alembic/env.py backend/alembic/versions/0001_create_users.py
git commit -m "feat(db): add migration 0001 — create users table"
```

### Task 3.11: Integration test for user repository

**Files:**
- Create: `backend/tests/integration/auth/__init__.py` (empty)
- Create: `backend/tests/integration/auth/test_repository.py`

- [ ] **Step 1: Write the test**

```python
# backend/tests/integration/auth/test_repository.py
import pytest

from obione.auth.models import User
from obione.auth.repository import SqlAlchemyUserRepository
from obione.auth.security import hash_password


@pytest.mark.integration
def test_add_and_get_user(db_session):
    repo = SqlAlchemyUserRepository(db_session)
    user = User(email="i@t.com", password_hash=hash_password("x"), name="I", role="consultant")
    repo.add(user)
    db_session.flush()
    assert repo.get(user.id) is not None
    assert repo.get_by_email("i@t.com") is not None
    assert repo.get_by_email("nobody@x.com") is None


@pytest.mark.integration
def test_email_unique_constraint(db_session):
    repo = SqlAlchemyUserRepository(db_session)
    repo.add(User(email="dup@t.com", password_hash="x", name="A", role="consultant"))
    db_session.flush()
    repo.add(User(email="dup@t.com", password_hash="y", name="B", role="client"))
    with pytest.raises(Exception):  # IntegrityError
        db_session.flush()


@pytest.mark.integration
def test_invalid_role_rejected_by_check_constraint(db_session):
    repo = SqlAlchemyUserRepository(db_session)
    repo.add(User(email="r@t.com", password_hash="x", name="R", role="god"))
    with pytest.raises(Exception):  # IntegrityError from CHECK constraint
        db_session.flush()
```

- [ ] **Step 2: Run + commit**

Run: `pytest tests/integration/auth -v`
Expected: 3 passed

```bash
git add backend/tests/integration/auth/__init__.py backend/tests/integration/auth/test_repository.py
git commit -m "test(auth): add integration tests for user repository against real Postgres"
```

### Task 3.12: e2e test for full auth flow

**Files:**
- Create: `backend/tests/e2e/test_auth_flow.py`

- [ ] **Step 1: Write the test**

```python
# backend/tests/e2e/test_auth_flow.py
import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.shared.database import SessionLocal


@pytest.fixture
def admin_user():
    """Create an admin directly via SessionLocal (outside the rollback fixture)."""
    s = SessionLocal()
    try:
        existing = s.query(User).filter_by(email="e2e-admin@x.com").first()
        if existing:
            s.delete(existing)
            s.commit()
        u = User(
            email="e2e-admin@x.com",
            password_hash=hash_password("admin-pwd-1234"),
            name="E2E Admin",
            role="admin",
        )
        s.add(u)
        s.commit()
        yield u
        s.delete(u)
        s.commit()
    finally:
        s.close()


@pytest.mark.e2e
def test_login_returns_token(client, admin_user):
    r = client.post(
        "/auth/login",
        json={"email": "e2e-admin@x.com", "password": "admin-pwd-1234"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.e2e
def test_login_wrong_password_401(client, admin_user):
    r = client.post(
        "/auth/login",
        json={"email": "e2e-admin@x.com", "password": "wrong"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"


@pytest.mark.e2e
def test_me_requires_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


@pytest.mark.e2e
def test_full_login_then_me(client, admin_user):
    r = client.post(
        "/auth/login",
        json={"email": "e2e-admin@x.com", "password": "admin-pwd-1234"},
    )
    token = r.json()["access_token"]
    r2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200, r2.text
    assert r2.json()["email"] == "e2e-admin@x.com"
    assert r2.json()["role"] == "admin"


@pytest.mark.e2e
def test_create_user_requires_admin(client, admin_user):
    # Login as admin
    login = client.post("/auth/login", json={"email": "e2e-admin@x.com", "password": "admin-pwd-1234"})
    token = login.json()["access_token"]
    r = client.post(
        "/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "new-consultant@x.com",
            "password": "newpwd1234",
            "name": "New Consultant",
            "role": "consultant",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["email"] == "new-consultant@x.com"

    # Cleanup
    s = SessionLocal()
    try:
        u = s.query(User).filter_by(email="new-consultant@x.com").first()
        if u:
            s.delete(u)
            s.commit()
    finally:
        s.close()
```

- [ ] **Step 2: Run + commit**

Run: `pytest tests/e2e/test_auth_flow.py -v`
Expected: 5 passed

```bash
git add backend/tests/e2e/test_auth_flow.py
git commit -m "test(auth): add e2e tests covering login → me → create-user flow"
```

---

**End of Phase 3.** Auth is complete: JWT login, /me, admin-only user creation. Repository pattern + UoW exercised. Migration 0001 applied.

---

## Phase 4: Projects Bounded Context

**Goal:** Project CRUD with access control. `consultant` sees own; `client` sees only assigned via M2M; `admin` sees all. M2M table `project_clients`.

### Task 4.1: Project & ProjectClient models

**Files:**
- Create: `backend/src/obione/projects/__init__.py` (empty)
- Create: `backend/src/obione/projects/models.py`

- [ ] **Step 1: Implement**

```python
# backend/src/obione/projects/models.py
"""Project domain entity + M2M for client access."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.shared.database import Base
from obione.shared.ids import new_id

PROJECT_DOMAINS = ("legal", "health", "sports", "branding", "gastronomy", "other")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    consultant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (CheckConstraint(f"domain IN {PROJECT_DOMAINS}", name="valid_domain"),)


class ProjectClient(Base):
    """M2M: which clients can see which projects."""

    __tablename__ = "project_clients"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/projects/__init__.py backend/src/obione/projects/models.py
git commit -m "feat(projects): add Project and ProjectClient (M2M) domain models"
```

### Task 4.2: Project exceptions + schemas

**Files:**
- Create: `backend/src/obione/projects/exceptions.py`
- Create: `backend/src/obione/projects/schemas.py`

- [ ] **Step 1: Write exceptions.py**

```python
# backend/src/obione/projects/exceptions.py
from obione.shared.exceptions import ForbiddenError, NotFoundError


class ProjectNotFoundError(NotFoundError):
    code = "project_not_found"


class NotProjectOwnerError(ForbiddenError):
    code = "not_project_owner"


class ClientCannotMutateError(ForbiddenError):
    code = "client_cannot_mutate"
```

- [ ] **Step 2: Write schemas.py**

```python
# backend/src/obione/projects/schemas.py
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Domain = Literal["legal", "health", "sports", "branding", "gastronomy", "other"]


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    domain: Domain
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    domain: Domain | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: str
    description: str | None
    consultant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AddClientRequest(BaseModel):
    user_id: uuid.UUID
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/projects/exceptions.py backend/src/obione/projects/schemas.py
git commit -m "feat(projects): add exceptions and Pydantic DTOs"
```

### Task 4.3: Project repository (Abstract + SqlAlchemy + Fake)

**Files:**
- Create: `backend/src/obione/projects/repository.py`

- [ ] **Step 1: Implement**

```python
# backend/src/obione/projects/repository.py
"""Project repository (abstract + SqlAlchemy + Fake)."""
from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.projects.models import Project, ProjectClient


class AbstractProjectRepository(Protocol):
    def add(self, project: Project) -> None: ...
    def get(self, project_id: uuid.UUID) -> Project | None: ...
    def list_all(self) -> list[Project]: ...
    def list_by_consultant(self, consultant_id: uuid.UUID) -> list[Project]: ...
    def list_for_client(self, user_id: uuid.UUID) -> list[Project]: ...
    def delete(self, project: Project) -> None: ...
    def is_client_authorized(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool: ...
    def add_client(self, project_id: uuid.UUID, user_id: uuid.UUID) -> None: ...


class SqlAlchemyProjectRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, project: Project) -> None:
        self._session.add(project)

    def get(self, project_id: uuid.UUID) -> Project | None:
        return self._session.get(Project, project_id)

    def list_all(self) -> list[Project]:
        return list(
            self._session.execute(
                select(Project).order_by(Project.created_at.desc())
            ).scalars()
        )

    def list_by_consultant(self, consultant_id: uuid.UUID) -> list[Project]:
        return list(
            self._session.execute(
                select(Project)
                .where(Project.consultant_id == consultant_id)
                .order_by(Project.created_at.desc())
            ).scalars()
        )

    def list_for_client(self, user_id: uuid.UUID) -> list[Project]:
        return list(
            self._session.execute(
                select(Project)
                .join(ProjectClient, ProjectClient.project_id == Project.id)
                .where(ProjectClient.user_id == user_id)
                .order_by(Project.created_at.desc())
            ).scalars()
        )

    def delete(self, project: Project) -> None:
        self._session.delete(project)

    def is_client_authorized(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        return (
            self._session.execute(
                select(ProjectClient).where(
                    ProjectClient.project_id == project_id,
                    ProjectClient.user_id == user_id,
                )
            ).scalar_one_or_none()
            is not None
        )

    def add_client(self, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
        existing = self._session.get(ProjectClient, (project_id, user_id))
        if existing is None:
            self._session.add(ProjectClient(project_id=project_id, user_id=user_id))


class FakeProjectRepository:
    def __init__(self):
        self._projects: dict[uuid.UUID, Project] = {}
        self._clients: set[tuple[uuid.UUID, uuid.UUID]] = set()

    def add(self, project: Project) -> None:
        if project.id is None:
            from obione.shared.ids import new_id
            project.id = new_id()
        self._projects[project.id] = project

    def get(self, project_id: uuid.UUID) -> Project | None:
        return self._projects.get(project_id)

    def list_all(self) -> list[Project]:
        return list(self._projects.values())

    def list_by_consultant(self, consultant_id: uuid.UUID) -> list[Project]:
        return [p for p in self._projects.values() if p.consultant_id == consultant_id]

    def list_for_client(self, user_id: uuid.UUID) -> list[Project]:
        ids = {pid for (pid, uid) in self._clients if uid == user_id}
        return [p for p in self._projects.values() if p.id in ids]

    def delete(self, project: Project) -> None:
        self._projects.pop(project.id, None)
        self._clients = {(pid, uid) for (pid, uid) in self._clients if pid != project.id}

    def is_client_authorized(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        return (project_id, user_id) in self._clients

    def add_client(self, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
        self._clients.add((project_id, user_id))
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/obione/projects/repository.py
git commit -m "feat(projects): add project repository (abstract + SqlAlchemy + Fake)"
```

### Task 4.4: Bind project repository to UoW

**Files:**
- Modify: `backend/src/obione/unit_of_work.py`

- [ ] **Step 1: Add to SqlAlchemyUnitOfWork.__enter__**

```python
    def __enter__(self) -> SqlAlchemyUnitOfWork:
        self.session = self._session_factory()
        from obione.auth.repository import SqlAlchemyUserRepository
        from obione.projects.repository import SqlAlchemyProjectRepository
        self.users = SqlAlchemyUserRepository(self.session)
        self.projects = SqlAlchemyProjectRepository(self.session)
        return super().__enter__()  # type: ignore[return-value]
```

- [ ] **Step 2: Add to FakeUnitOfWork.__init__**

```python
    def __init__(self):
        self.committed = False
        from obione.auth.repository import FakeUserRepository
        from obione.projects.repository import FakeProjectRepository
        self.users = FakeUserRepository()
        self.projects = FakeProjectRepository()
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/unit_of_work.py
git commit -m "feat(uow): bind project repository to SqlAlchemy and Fake UoWs"
```

### Task 4.5: Access control + service

**Files:**
- Create: `backend/src/obione/projects/access_control.py`
- Create: `backend/src/obione/projects/service.py`
- Create: `backend/tests/unit/projects/__init__.py` (empty)
- Create: `backend/tests/unit/projects/test_service.py`

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/unit/projects/test_service.py
import uuid

import pytest

from obione.auth.models import User
from obione.projects.exceptions import (
    ClientCannotMutateError,
    NotProjectOwnerError,
    ProjectNotFoundError,
)
from obione.projects.schemas import ProjectCreate, ProjectUpdate
from obione.projects.service import (
    add_client_to_project,
    create_project,
    delete_project,
    get_project_for_user,
    list_projects_for_user,
    update_project,
)
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _make_user(role: str = "consultant") -> User:
    return User(id=new_id(), email=f"{role}@x.com", password_hash="x", name="N", role=role)


@pytest.mark.unit
def test_admin_sees_all_projects():
    uow = FakeUnitOfWork()
    admin = _make_user("admin")
    c1 = _make_user("consultant")
    p1 = ProjectCreate(name="A", domain="legal")
    p2 = ProjectCreate(name="B", domain="health")
    create_project(uow, c1, p1)
    create_project(uow, c1, p2)
    assert len(list_projects_for_user(uow, admin)) == 2


@pytest.mark.unit
def test_consultant_sees_only_own():
    uow = FakeUnitOfWork()
    c1 = _make_user("consultant")
    c2 = _make_user("consultant")
    create_project(uow, c1, ProjectCreate(name="A", domain="legal"))
    create_project(uow, c2, ProjectCreate(name="B", domain="health"))
    assert len(list_projects_for_user(uow, c1)) == 1


@pytest.mark.unit
def test_client_sees_only_assigned():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    p = create_project(uow, consultant, ProjectCreate(name="X", domain="legal"))
    # Client cannot see yet
    assert list_projects_for_user(uow, client) == []
    add_client_to_project(uow, consultant, p.id, client.id)
    assert len(list_projects_for_user(uow, client)) == 1


@pytest.mark.unit
def test_get_not_found_when_not_visible():
    uow = FakeUnitOfWork()
    c1 = _make_user("consultant")
    c2 = _make_user("consultant")
    p = create_project(uow, c1, ProjectCreate(name="X", domain="legal"))
    with pytest.raises(ProjectNotFoundError):
        get_project_for_user(uow, c2, p.id)


@pytest.mark.unit
def test_client_cannot_create():
    uow = FakeUnitOfWork()
    client = _make_user("client")
    with pytest.raises(ClientCannotMutateError):
        create_project(uow, client, ProjectCreate(name="X", domain="legal"))


@pytest.mark.unit
def test_client_cannot_update_or_delete():
    uow = FakeUnitOfWork()
    consultant = _make_user("consultant")
    client = _make_user("client")
    p = create_project(uow, consultant, ProjectCreate(name="X", domain="legal"))
    add_client_to_project(uow, consultant, p.id, client.id)
    with pytest.raises(ClientCannotMutateError):
        update_project(uow, client, p.id, ProjectUpdate(name="Y"))
    with pytest.raises(ClientCannotMutateError):
        delete_project(uow, client, p.id)


@pytest.mark.unit
def test_consultant_cannot_update_others_project():
    uow = FakeUnitOfWork()
    c1 = _make_user("consultant")
    c2 = _make_user("consultant")
    p = create_project(uow, c1, ProjectCreate(name="X", domain="legal"))
    with pytest.raises(ProjectNotFoundError):
        update_project(uow, c2, p.id, ProjectUpdate(name="Y"))
```

- [ ] **Step 2: Implement access_control.py**

```python
# backend/src/obione/projects/access_control.py
"""Visibility rules — pure functions, no I/O beyond repository calls via UoW."""
import uuid

from obione.auth.models import User
from obione.projects.models import Project
from obione.unit_of_work import AbstractUnitOfWork


def can_user_see(uow: AbstractUnitOfWork, user: User, project: Project) -> bool:
    if user.role == "admin":
        return True
    if user.role == "consultant":
        return project.consultant_id == user.id
    # client
    return uow.projects.is_client_authorized(project.id, user.id)


def list_visible_projects(uow: AbstractUnitOfWork, user: User) -> list[Project]:
    if user.role == "admin":
        return uow.projects.list_all()
    if user.role == "consultant":
        return uow.projects.list_by_consultant(user.id)
    return uow.projects.list_for_client(user.id)
```

- [ ] **Step 3: Implement service.py**

```python
# backend/src/obione/projects/service.py
"""Project use cases."""
import uuid

from obione.auth.models import User
from obione.projects.access_control import can_user_see, list_visible_projects
from obione.projects.exceptions import (
    ClientCannotMutateError,
    ProjectNotFoundError,
)
from obione.projects.models import Project
from obione.projects.schemas import ProjectCreate, ProjectUpdate
from obione.unit_of_work import AbstractUnitOfWork


def _require_mutator(user: User) -> None:
    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot mutate projects.")


def list_projects_for_user(uow: AbstractUnitOfWork, user: User) -> list[Project]:
    with uow:
        return list_visible_projects(uow, user)


def get_project_for_user(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> Project:
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        return project


def create_project(
    uow: AbstractUnitOfWork, user: User, data: ProjectCreate
) -> Project:
    _require_mutator(user)
    with uow:
        project = Project(
            name=data.name,
            domain=data.domain,
            description=data.description,
            consultant_id=user.id,
        )
        uow.projects.add(project)
        uow.commit()
        return project


def update_project(
    uow: AbstractUnitOfWork,
    user: User,
    project_id: uuid.UUID,
    data: ProjectUpdate,
) -> Project:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        uow.commit()
        return project


def delete_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> None:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        uow.projects.delete(project)
        uow.commit()


def add_client_to_project(
    uow: AbstractUnitOfWork,
    user: User,
    project_id: uuid.UUID,
    client_user_id: uuid.UUID,
) -> None:
    _require_mutator(user)
    with uow:
        project = uow.projects.get(project_id)
        if project is None or not can_user_see(uow, user, project):
            raise ProjectNotFoundError(f"Project not found: {project_id}")
        uow.projects.add_client(project_id, client_user_id)
        uow.commit()
```

- [ ] **Step 4: Run + commit**

Run: `pytest tests/unit/projects -v`
Expected: 7 passed

```bash
git add backend/src/obione/projects/access_control.py backend/src/obione/projects/service.py backend/tests/unit/projects/__init__.py backend/tests/unit/projects/test_service.py
git commit -m "feat(projects): add access control + CRUD service with full unit coverage"
```

### Task 4.6: Project router

**Files:**
- Create: `backend/src/obione/projects/router.py`
- Modify: `backend/src/obione/main.py` (register router)

- [ ] **Step 1: Implement router**

```python
# backend/src/obione/projects/router.py
"""HTTP routes for the projects bounded context."""
import uuid

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.projects import service
from obione.projects.schemas import (
    AddClientRequest,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(user: CurrentUser) -> list[ProjectResponse]:
    return [
        ProjectResponse.model_validate(p)
        for p in service.list_projects_for_user(get_uow(), user)
    ]


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(payload: ProjectCreate, user: CurrentUser) -> ProjectResponse:
    project = service.create_project(get_uow(), user, payload)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: uuid.UUID, user: CurrentUser) -> ProjectResponse:
    project = service.get_project_for_user(get_uow(), user, project_id)
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: uuid.UUID, payload: ProjectUpdate, user: CurrentUser
) -> ProjectResponse:
    project = service.update_project(get_uow(), user, project_id, payload)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: uuid.UUID, user: CurrentUser) -> None:
    service.delete_project(get_uow(), user, project_id)


@router.post("/{project_id}/clients", status_code=201)
def add_client(
    project_id: uuid.UUID, payload: AddClientRequest, user: CurrentUser
) -> dict:
    service.add_client_to_project(get_uow(), user, project_id, payload.user_id)
    return {"status": "added"}
```

- [ ] **Step 2: Register in main.py**

Add to `main.py`:
```python
from obione.projects.router import router as projects_router
# ...
    app.include_router(projects_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/projects/router.py backend/src/obione/main.py
git commit -m "feat(projects): add /projects CRUD + add-client endpoints"
```

### Task 4.7: Migration 0002 — projects + project_clients

**Files:**
- Modify: `backend/alembic/env.py` (import Project models)
- Create: `backend/alembic/versions/0002_create_projects.py` (via autogenerate)

- [ ] **Step 1: Add imports to alembic/env.py**

```python
from obione.projects.models import Project, ProjectClient  # noqa: F401
```

- [ ] **Step 2: Generate**

Run: `make migration m="create projects and project_clients"`
Expected: file generated in `backend/alembic/versions/`.

- [ ] **Step 3: Inspect and rename to 0002_create_projects.py**

Verify autogenerated content creates both tables with FKs, indexes, check constraint on domain.

- [ ] **Step 4: Apply + verify**

Run: `make migrate`
Then: `make psql` → `\d projects` and `\d project_clients`

- [ ] **Step 5: Commit**

```bash
git add backend/alembic/env.py backend/alembic/versions/0002_create_projects.py
git commit -m "feat(db): add migration 0002 — projects + project_clients"
```

### Task 4.8: e2e flow test

**Files:**
- Create: `backend/tests/e2e/test_projects_flow.py`

- [ ] **Step 1: Write the test**

```python
# backend/tests/e2e/test_projects_flow.py
import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.shared.database import SessionLocal


@pytest.fixture
def seeded_users():
    """Create consultant + client for tests; cleanup after."""
    s = SessionLocal()
    try:
        for email in ("e2e-c@x.com", "e2e-cl@x.com"):
            u = s.query(User).filter_by(email=email).first()
            if u:
                s.delete(u)
        s.commit()
        consultant = User(
            email="e2e-c@x.com", password_hash=hash_password("pwd1234567"),
            name="C", role="consultant",
        )
        client = User(
            email="e2e-cl@x.com", password_hash=hash_password("pwd1234567"),
            name="Cl", role="client",
        )
        s.add_all([consultant, client])
        s.commit()
        s.refresh(consultant)
        s.refresh(client)
        yield {"consultant": consultant, "client": client}
        for u in (consultant, client):
            s.delete(u)
        s.commit()
    finally:
        s.close()


def _login(client, email: str, password: str) -> str:
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.mark.e2e
def test_consultant_creates_and_lists_project(client, seeded_users):
    token = _login(client, "e2e-c@x.com", "pwd1234567")
    h = {"Authorization": f"Bearer {token}"}
    r = client.post("/projects", json={"name": "P", "domain": "legal"}, headers=h)
    assert r.status_code == 201, r.text
    project_id = r.json()["id"]
    r = client.get("/projects", headers=h)
    assert r.status_code == 200
    assert any(p["id"] == project_id for p in r.json())

    # Cleanup
    client.delete(f"/projects/{project_id}", headers=h)


@pytest.mark.e2e
def test_client_cannot_see_unassigned_project(client, seeded_users):
    consultant_tok = _login(client, "e2e-c@x.com", "pwd1234567")
    client_tok = _login(client, "e2e-cl@x.com", "pwd1234567")
    r = client.post(
        "/projects",
        json={"name": "Hidden", "domain": "health"},
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )
    project_id = r.json()["id"]
    # Client cannot see
    r = client.get("/projects", headers={"Authorization": f"Bearer {client_tok}"})
    assert all(p["id"] != project_id for p in r.json())
    # Cannot get directly either (404)
    r = client.get(
        f"/projects/{project_id}", headers={"Authorization": f"Bearer {client_tok}"}
    )
    assert r.status_code == 404
    # Cleanup
    client.delete(
        f"/projects/{project_id}",
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )


@pytest.mark.e2e
def test_client_sees_assigned_project_after_add(client, seeded_users):
    consultant_tok = _login(client, "e2e-c@x.com", "pwd1234567")
    client_tok = _login(client, "e2e-cl@x.com", "pwd1234567")
    client_user_id = str(seeded_users["client"].id)

    r = client.post(
        "/projects",
        json={"name": "Shared", "domain": "branding"},
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )
    project_id = r.json()["id"]

    client.post(
        f"/projects/{project_id}/clients",
        json={"user_id": client_user_id},
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )

    r = client.get("/projects", headers={"Authorization": f"Bearer {client_tok}"})
    assert any(p["id"] == project_id for p in r.json())

    # Client cannot mutate
    r = client.patch(
        f"/projects/{project_id}",
        json={"name": "Renamed"},
        headers={"Authorization": f"Bearer {client_tok}"},
    )
    assert r.status_code == 403

    # Cleanup
    client.delete(
        f"/projects/{project_id}",
        headers={"Authorization": f"Bearer {consultant_tok}"},
    )
```

- [ ] **Step 2: Run + commit**

Run: `pytest tests/e2e/test_projects_flow.py -v`
Expected: 3 passed

```bash
git add backend/tests/e2e/test_projects_flow.py
git commit -m "test(projects): add e2e coverage of access control end-to-end"
```

---

**End of Phase 4.** Project CRUD + access control fully working. Multi-tenancy verified at HTTP level.

---

## Phase 5: Documents Bounded Context

**Goal:** Upload `.docx` files tied to a project. Blob storage via port + filesystem adapter. Hash-based dedup. Client read-only on documents (consistent with project mutation rules).

### Task 5.1: Blob storage port + filesystem adapter + fake

**Files:**
- Create: `backend/src/obione/documents/__init__.py` (empty)
- Create: `backend/src/obione/documents/storage/__init__.py` (empty)
- Create: `backend/src/obione/documents/storage/port.py`
- Create: `backend/src/obione/documents/storage/filesystem.py`
- Create: `backend/tests/unit/documents/__init__.py` (empty)
- Create: `backend/tests/unit/documents/test_storage_filesystem.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/documents/test_storage_filesystem.py
import uuid

import pytest

from obione.documents.storage.filesystem import FilesystemBlobStorage


@pytest.mark.unit
def test_write_returns_hash_and_path(tmp_path):
    storage = FilesystemBlobStorage(root=str(tmp_path))
    project_id = uuid.uuid4()
    sha, rel_path = storage.write(project_id, b"hello world")
    assert len(sha) == 64
    assert rel_path.endswith(".docx")
    assert (tmp_path / rel_path).exists()
    assert (tmp_path / rel_path).read_bytes() == b"hello world"


@pytest.mark.unit
def test_write_same_bytes_yields_same_hash(tmp_path):
    storage = FilesystemBlobStorage(root=str(tmp_path))
    pid = uuid.uuid4()
    sha1, _ = storage.write(pid, b"identical")
    sha2, _ = storage.write(pid, b"identical")
    assert sha1 == sha2
```

- [ ] **Step 2: Implement port + filesystem adapter + fake**

```python
# backend/src/obione/documents/storage/port.py
"""Blob storage port (hexagonal architecture)."""
from typing import Protocol
from uuid import UUID


class AbstractBlobStorage(Protocol):
    def write(self, project_id: UUID, content: bytes) -> tuple[str, str]:
        """Persist content; return (sha256 hex, relative path)."""
        ...

    def read(self, relative_path: str) -> bytes: ...
```

```python
# backend/src/obione/documents/storage/filesystem.py
"""Filesystem adapter for AbstractBlobStorage."""
import hashlib
from pathlib import Path
from uuid import UUID


class FilesystemBlobStorage:
    def __init__(self, root: str):
        self._root = Path(root)

    def _relative(self, project_id: UUID, sha: str) -> str:
        return f"documents/{project_id}/{sha}.docx"

    def write(self, project_id: UUID, content: bytes) -> tuple[str, str]:
        sha = hashlib.sha256(content).hexdigest()
        rel = self._relative(project_id, sha)
        abs_path = self._root / rel
        abs_path.parent.mkdir(parents=True, exist_ok=True)
        abs_path.write_bytes(content)
        return sha, rel

    def read(self, relative_path: str) -> bytes:
        return (self._root / relative_path).read_bytes()


class FakeBlobStorage:
    """In-memory blob storage for unit tests."""

    def __init__(self):
        self._blobs: dict[str, bytes] = {}

    def write(self, project_id: UUID, content: bytes) -> tuple[str, str]:
        sha = hashlib.sha256(content).hexdigest()
        rel = f"documents/{project_id}/{sha}.docx"
        self._blobs[rel] = content
        return sha, rel

    def read(self, relative_path: str) -> bytes:
        return self._blobs[relative_path]
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/documents/test_storage_filesystem.py -v`
Expected: 2 passed

```bash
git add backend/src/obione/documents/__init__.py backend/src/obione/documents/storage/ backend/tests/unit/documents/
git commit -m "feat(documents): add blob storage port + filesystem adapter + fake"
```

### Task 5.2: Document model, exceptions, schemas

**Files:**
- Create: `backend/src/obione/documents/models.py`
- Create: `backend/src/obione/documents/exceptions.py`
- Create: `backend/src/obione/documents/schemas.py`

- [ ] **Step 1: models.py**

```python
# backend/src/obione/documents/models.py
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.shared.database import Base
from obione.shared.ids import new_id


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    original_name: Mapped[str] = mapped_column(String(512), nullable=False)
    relative_path: Mapped[str] = mapped_column(String(512), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

- [ ] **Step 2: exceptions.py**

```python
# backend/src/obione/documents/exceptions.py
from obione.shared.exceptions import BadRequestError, ConflictError


class UnsupportedMimeTypeError(BadRequestError):
    code = "unsupported_mime_type"


class FileTooLargeError(BadRequestError):
    code = "file_too_large"


class DuplicateDocumentError(ConflictError):
    code = "duplicate_document"
```

- [ ] **Step 3: schemas.py**

```python
# backend/src/obione/documents/schemas.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    original_name: str
    sha256: str
    size_bytes: int
    mime_type: str
    uploaded_at: datetime
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/obione/documents/models.py backend/src/obione/documents/exceptions.py backend/src/obione/documents/schemas.py
git commit -m "feat(documents): add Document model, exceptions, response DTO"
```

### Task 5.3: Document repository + UoW binding

**Files:**
- Create: `backend/src/obione/documents/repository.py`
- Modify: `backend/src/obione/unit_of_work.py`

- [ ] **Step 1: Write repository.py**

```python
# backend/src/obione/documents/repository.py
"""Document repository (abstract + SqlAlchemy + Fake)."""
from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.documents.models import Document


class AbstractDocumentRepository(Protocol):
    def add(self, document: Document) -> None: ...
    def get(self, document_id: uuid.UUID) -> Document | None: ...
    def get_by_sha(self, sha: str) -> Document | None: ...
    def list_by_project(self, project_id: uuid.UUID) -> list[Document]: ...


class SqlAlchemyDocumentRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, document: Document) -> None:
        self._session.add(document)

    def get(self, document_id: uuid.UUID) -> Document | None:
        return self._session.get(Document, document_id)

    def get_by_sha(self, sha: str) -> Document | None:
        return self._session.execute(
            select(Document).where(Document.sha256 == sha)
        ).scalar_one_or_none()

    def list_by_project(self, project_id: uuid.UUID) -> list[Document]:
        return list(
            self._session.execute(
                select(Document)
                .where(Document.project_id == project_id)
                .order_by(Document.uploaded_at.desc())
            ).scalars()
        )


class FakeDocumentRepository:
    def __init__(self):
        self._docs: dict[uuid.UUID, Document] = {}

    def add(self, document: Document) -> None:
        if document.id is None:
            from obione.shared.ids import new_id
            document.id = new_id()
        self._docs[document.id] = document

    def get(self, document_id: uuid.UUID) -> Document | None:
        return self._docs.get(document_id)

    def get_by_sha(self, sha: str) -> Document | None:
        return next((d for d in self._docs.values() if d.sha256 == sha), None)

    def list_by_project(self, project_id: uuid.UUID) -> list[Document]:
        return [d for d in self._docs.values() if d.project_id == project_id]
```

- [ ] **Step 2: Modify unit_of_work.py to bind documents**

In `SqlAlchemyUnitOfWork.__enter__`:
```python
from obione.documents.repository import SqlAlchemyDocumentRepository
self.documents = SqlAlchemyDocumentRepository(self.session)
```

In `FakeUnitOfWork.__init__`:
```python
from obione.documents.repository import FakeDocumentRepository
self.documents = FakeDocumentRepository()
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/documents/repository.py backend/src/obione/unit_of_work.py
git commit -m "feat(documents): add document repository + bind to UoW"
```

### Task 5.4: Document service

**Files:**
- Create: `backend/src/obione/documents/service.py`
- Create: `backend/tests/unit/documents/test_service.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/documents/test_service.py
import uuid

import pytest

from obione.auth.models import User
from obione.documents.exceptions import (
    DuplicateDocumentError,
    FileTooLargeError,
    UnsupportedMimeTypeError,
)
from obione.documents.service import list_documents_for_project, upload_document
from obione.documents.storage.filesystem import FakeBlobStorage
from obione.projects.models import Project
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


def _client_user() -> User:
    return User(id=new_id(), email="cl@x.com", password_hash="x", name="Cl", role="client")


def _setup_project(uow: FakeUnitOfWork) -> tuple[User, Project]:
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    return consultant, project


@pytest.mark.unit
def test_upload_succeeds():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant, project = _setup_project(uow)
    doc = upload_document(
        uow, storage, consultant,
        project_id=project.id, filename="x.docx", content=b"hello",
        mime_type=DOCX_MIME, max_size_mb=10,
    )
    assert doc.project_id == project.id
    assert doc.sha256
    assert len(list_documents_for_project(uow, consultant, project.id)) == 1


@pytest.mark.unit
def test_upload_rejects_non_docx():
    uow = FakeUnitOfWork()
    consultant, project = _setup_project(uow)
    with pytest.raises(UnsupportedMimeTypeError):
        upload_document(
            uow, FakeBlobStorage(), consultant,
            project_id=project.id, filename="x.pdf", content=b"x",
            mime_type="application/pdf", max_size_mb=10,
        )


@pytest.mark.unit
def test_upload_rejects_too_large():
    uow = FakeUnitOfWork()
    consultant, project = _setup_project(uow)
    huge = b"x" * (11 * 1024 * 1024)
    with pytest.raises(FileTooLargeError):
        upload_document(
            uow, FakeBlobStorage(), consultant,
            project_id=project.id, filename="x.docx", content=huge,
            mime_type=DOCX_MIME, max_size_mb=10,
        )


@pytest.mark.unit
def test_upload_rejects_duplicate():
    uow = FakeUnitOfWork()
    storage = FakeBlobStorage()
    consultant, project = _setup_project(uow)
    upload_document(
        uow, storage, consultant, project_id=project.id,
        filename="a.docx", content=b"same", mime_type=DOCX_MIME, max_size_mb=10,
    )
    with pytest.raises(DuplicateDocumentError):
        upload_document(
            uow, storage, consultant, project_id=project.id,
            filename="b.docx", content=b"same", mime_type=DOCX_MIME, max_size_mb=10,
        )


@pytest.mark.unit
def test_client_cannot_upload():
    from obione.projects.exceptions import ClientCannotMutateError
    uow = FakeUnitOfWork()
    consultant, project = _setup_project(uow)
    client = _client_user()
    uow.projects.add_client(project.id, client.id)
    with pytest.raises(ClientCannotMutateError):
        upload_document(
            uow, FakeBlobStorage(), client,
            project_id=project.id, filename="x.docx", content=b"x",
            mime_type=DOCX_MIME, max_size_mb=10,
        )
```

- [ ] **Step 2: Implement service.py**

```python
# backend/src/obione/documents/service.py
"""Document use cases."""
import uuid

from obione.auth.models import User
from obione.documents.exceptions import (
    DuplicateDocumentError,
    FileTooLargeError,
    UnsupportedMimeTypeError,
)
from obione.documents.models import Document
from obione.documents.storage.port import AbstractBlobStorage
from obione.projects.exceptions import ClientCannotMutateError
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def upload_document(
    uow: AbstractUnitOfWork,
    storage: AbstractBlobStorage,
    user: User,
    *,
    project_id: uuid.UUID,
    filename: str,
    content: bytes,
    mime_type: str,
    max_size_mb: int,
) -> Document:
    """Persist a .docx for a project. Only consultants/admins can upload."""
    # Verify project visibility first (raises ProjectNotFoundError if hidden)
    project = get_project_for_user(uow, user, project_id)

    if user.role == "client":
        raise ClientCannotMutateError("Clients cannot upload documents.")

    if mime_type != DOCX_MIME and not filename.lower().endswith(".docx"):
        raise UnsupportedMimeTypeError(
            f"Only .docx is supported. Got: {filename} ({mime_type})"
        )

    if len(content) > max_size_mb * 1024 * 1024:
        raise FileTooLargeError(
            f"File exceeds {max_size_mb}MB (got {len(content) / 1024 / 1024:.1f}MB)"
        )

    with uow:
        sha, rel_path = storage.write(project.id, content)
        if uow.documents.get_by_sha(sha) is not None:
            raise DuplicateDocumentError(f"Document with this content already exists (sha={sha[:12]}...)")
        document = Document(
            project_id=project.id,
            original_name=filename,
            relative_path=rel_path,
            sha256=sha,
            size_bytes=len(content),
            mime_type=DOCX_MIME,
            uploaded_by=user.id,
        )
        uow.documents.add(document)
        uow.commit()
        return document


def list_documents_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Document]:
    # Access check via get_project_for_user
    get_project_for_user(uow, user, project_id)
    with uow:
        return uow.documents.list_by_project(project_id)
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/documents/test_service.py -v`
Expected: 5 passed

```bash
git add backend/src/obione/documents/service.py backend/tests/unit/documents/test_service.py
git commit -m "feat(documents): add upload service with validation, dedup, and access control"
```

### Task 5.5: Document router

**Files:**
- Create: `backend/src/obione/documents/dependencies.py`
- Create: `backend/src/obione/documents/router.py`
- Modify: `backend/src/obione/main.py`

- [ ] **Step 1: Implement dependencies.py**

```python
# backend/src/obione/documents/dependencies.py
"""Wiring of storage adapter selected by settings."""
from obione.documents.storage.filesystem import FilesystemBlobStorage
from obione.documents.storage.port import AbstractBlobStorage
from obione.settings import settings


def get_blob_storage() -> AbstractBlobStorage:
    if settings.STORAGE_BACKEND == "filesystem":
        return FilesystemBlobStorage(root=settings.STORAGE_ROOT)
    raise ValueError(f"Unknown STORAGE_BACKEND: {settings.STORAGE_BACKEND}")
```

- [ ] **Step 2: Implement router.py**

```python
# backend/src/obione/documents/router.py
"""HTTP routes for documents."""
import uuid

from fastapi import APIRouter, Depends, File, UploadFile

from obione.auth.dependencies import CurrentUser, get_uow
from obione.documents import service
from obione.documents.dependencies import get_blob_storage
from obione.documents.schemas import DocumentResponse
from obione.documents.storage.port import AbstractBlobStorage
from obione.settings import settings

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])


@router.get("", response_model=list[DocumentResponse])
def list_documents(project_id: uuid.UUID, user: CurrentUser) -> list[DocumentResponse]:
    docs = service.list_documents_for_project(get_uow(), user, project_id)
    return [DocumentResponse.model_validate(d) for d in docs]


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    project_id: uuid.UUID,
    user: CurrentUser,
    file: UploadFile = File(...),
    storage: AbstractBlobStorage = Depends(get_blob_storage),
) -> DocumentResponse:
    content = await file.read()
    doc = service.upload_document(
        get_uow(), storage, user,
        project_id=project_id,
        filename=file.filename or "document.docx",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
        max_size_mb=settings.MAX_UPLOAD_SIZE_MB,
    )
    return DocumentResponse.model_validate(doc)
```

- [ ] **Step 3: Register in main.py**

```python
from obione.documents.router import router as documents_router
# ...
    app.include_router(documents_router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/obione/documents/dependencies.py backend/src/obione/documents/router.py backend/src/obione/main.py
git commit -m "feat(documents): add upload + list endpoints with storage dependency injection"
```

### Task 5.6: Migration 0003 + e2e test

**Files:**
- Modify: `backend/alembic/env.py` (import Document)
- Create: `backend/alembic/versions/0003_create_documents.py` (autogenerate)
- Create: `backend/tests/e2e/test_documents_flow.py`

- [ ] **Step 1: Add import + generate migration**

Add to `alembic/env.py`:
```python
from obione.documents.models import Document  # noqa: F401
```

Run: `make migration m="create documents table"`
Inspect, rename to `0003_create_documents.py`, apply with `make migrate`.

- [ ] **Step 2: Write e2e test**

```python
# backend/tests/e2e/test_documents_flow.py
import io

import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.shared.database import SessionLocal

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    try:
        existing = s.query(User).filter_by(email="e2e-docc@x.com").first()
        if existing:
            s.delete(existing)
            s.commit()
        u = User(
            email="e2e-docc@x.com", password_hash=hash_password("pwd12345678"),
            name="C", role="consultant",
        )
        s.add(u)
        s.commit()
        r = client.post(
            "/auth/login",
            json={"email": "e2e-docc@x.com", "password": "pwd12345678"},
        )
        yield r.json()["access_token"]
        s.delete(u)
        s.commit()
    finally:
        s.close()


@pytest.mark.e2e
def test_upload_and_list_document(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PDoc", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        # Upload .docx
        files = {"file": ("test.docx", io.BytesIO(b"fake docx content"), DOCX_MIME)}
        r = client.post(f"/projects/{pid}/documents", headers=h, files=files)
        assert r.status_code == 201, r.text
        assert r.json()["original_name"] == "test.docx"

        # List
        r = client.get(f"/projects/{pid}/documents", headers=h)
        assert len(r.json()) == 1
    finally:
        client.delete(f"/projects/{pid}", headers=h)


@pytest.mark.e2e
def test_upload_rejects_pdf(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PDoc2", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        files = {"file": ("evil.pdf", io.BytesIO(b"%PDF"), "application/pdf")}
        r = client.post(f"/projects/{pid}/documents", headers=h, files=files)
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "unsupported_mime_type"
    finally:
        client.delete(f"/projects/{pid}", headers=h)
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/e2e/test_documents_flow.py -v`
Expected: 2 passed

```bash
git add backend/alembic/env.py backend/alembic/versions/0003_create_documents.py backend/tests/e2e/test_documents_flow.py
git commit -m "feat(documents): add migration 0003 + e2e upload/list/reject tests"
```

---

**End of Phase 5.** Documents upload works end-to-end. Storage adapter is swappable via settings.

---

## Phase 6: Extractions Stub

**Goal:** `Extraction` table with JSONB `content`. `AbstractExtractor` port + `MockExtractor` adapter (returns `atividades/schema_extracao_exemplo.json`). Manual extraction endpoint + listing. Real LLM adapter ships in Sprint 2 T2.1 — this phase ensures the slot is ready.

### Task 6.1: Extractor port + Mock adapter

**Files:**
- Create: `backend/src/obione/extractions/__init__.py` (empty)
- Create: `backend/src/obione/extractions/llm/__init__.py` (empty)
- Create: `backend/src/obione/extractions/llm/port.py`
- Create: `backend/src/obione/extractions/llm/mock.py`
- Create: `backend/tests/unit/extractions/__init__.py` (empty)
- Create: `backend/tests/unit/extractions/test_llm_mock.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/extractions/test_llm_mock.py
import pytest

from obione.extractions.llm.mock import MockExtractor


@pytest.mark.unit
def test_mock_extractor_returns_valid_dict():
    extractor = MockExtractor()
    result = extractor.extract(b"any content")
    assert isinstance(result.content, dict)
    assert "_meta" in result.content
    assert result.model_id == "mock"
```

- [ ] **Step 2: Implement port + mock**

```python
# backend/src/obione/extractions/llm/port.py
"""LLM extractor port (hexagonal). Real adapter ships in Sprint 2 T2.1."""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ExtractionResult:
    content: dict
    model_id: str


class AbstractExtractor(Protocol):
    def extract(self, document_bytes: bytes) -> ExtractionResult: ...
```

```python
# backend/src/obione/extractions/llm/mock.py
"""Mock extractor: loads the example JSON. Used in dev and tests."""
import json
from pathlib import Path

from obione.extractions.llm.port import ExtractionResult

# Path inside the container: /app is the WORKDIR; atividades/ is mounted via compose.
# We embed a tiny fallback so the mock works even outside the compose mount.
_FALLBACK = {
    "_meta": {
        "project_name": "mock-project",
        "source_document": "mock.docx",
        "extracted_at": "2026-01-01T00:00:00Z",
        "source": "llm",
    },
    "project_name": "Mock Project",
}


class MockExtractor:
    def __init__(self, example_path: str | None = None):
        self._example_path = example_path

    def extract(self, document_bytes: bytes) -> ExtractionResult:
        if self._example_path and Path(self._example_path).exists():
            content = json.loads(Path(self._example_path).read_text())
        else:
            content = dict(_FALLBACK)
        return ExtractionResult(content=content, model_id="mock")
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/extractions/test_llm_mock.py -v`
Expected: 1 passed

```bash
git add backend/src/obione/extractions/__init__.py backend/src/obione/extractions/llm/ backend/tests/unit/extractions/__init__.py backend/tests/unit/extractions/test_llm_mock.py
git commit -m "feat(extractions): add LLM port + MockExtractor adapter"
```

### Task 6.2: Extraction model, exceptions, schemas

**Files:**
- Create: `backend/src/obione/extractions/models.py`
- Create: `backend/src/obione/extractions/exceptions.py`
- Create: `backend/src/obione/extractions/schemas.py`

- [ ] **Step 1: models.py**

```python
# backend/src/obione/extractions/models.py
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from obione.shared.database import Base
from obione.shared.ids import new_id

EXTRACTION_SOURCES = ("llm", "manual")


class Extraction(Base):
    __tablename__ = "extractions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_id)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True,
    )
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    llm_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (CheckConstraint(f"source IN {EXTRACTION_SOURCES}", name="valid_source"),)
```

- [ ] **Step 2: exceptions.py**

```python
# backend/src/obione/extractions/exceptions.py
from obione.shared.exceptions import BadRequestError, NotFoundError


class ExtractionNotFoundError(NotFoundError):
    code = "extraction_not_found"


class InvalidExtractionSourceError(BadRequestError):
    code = "invalid_extraction_source"
```

- [ ] **Step 3: schemas.py**

```python
# backend/src/obione/extractions/schemas.py
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ExtractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    document_id: uuid.UUID | None
    source: Literal["llm", "manual"]
    llm_model: str | None
    content: dict
    created_at: datetime


class ManualExtractionCreate(BaseModel):
    document_id: uuid.UUID | None = None
    content: dict
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/obione/extractions/models.py backend/src/obione/extractions/exceptions.py backend/src/obione/extractions/schemas.py
git commit -m "feat(extractions): add Extraction model with JSONB content, exceptions, DTOs"
```

### Task 6.3: Extraction repository + UoW binding

**Files:**
- Create: `backend/src/obione/extractions/repository.py`
- Modify: `backend/src/obione/unit_of_work.py`

- [ ] **Step 1: Write repository.py**

```python
# backend/src/obione/extractions/repository.py
"""Extraction repository (abstract + SqlAlchemy + Fake)."""
from __future__ import annotations

import uuid
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from obione.extractions.models import Extraction


class AbstractExtractionRepository(Protocol):
    def add(self, extraction: Extraction) -> None: ...
    def get(self, extraction_id: uuid.UUID) -> Extraction | None: ...
    def list_by_project(self, project_id: uuid.UUID) -> list[Extraction]: ...


class SqlAlchemyExtractionRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, extraction: Extraction) -> None:
        self._session.add(extraction)

    def get(self, extraction_id: uuid.UUID) -> Extraction | None:
        return self._session.get(Extraction, extraction_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[Extraction]:
        return list(
            self._session.execute(
                select(Extraction)
                .where(Extraction.project_id == project_id)
                .order_by(Extraction.created_at.desc())
            ).scalars()
        )


class FakeExtractionRepository:
    def __init__(self):
        self._extractions: dict[uuid.UUID, Extraction] = {}

    def add(self, extraction: Extraction) -> None:
        if extraction.id is None:
            from obione.shared.ids import new_id
            extraction.id = new_id()
        self._extractions[extraction.id] = extraction

    def get(self, extraction_id: uuid.UUID) -> Extraction | None:
        return self._extractions.get(extraction_id)

    def list_by_project(self, project_id: uuid.UUID) -> list[Extraction]:
        return [e for e in self._extractions.values() if e.project_id == project_id]
```

- [ ] **Step 2: Bind in unit_of_work.py**

In `SqlAlchemyUnitOfWork.__enter__`:
```python
from obione.extractions.repository import SqlAlchemyExtractionRepository
self.extractions = SqlAlchemyExtractionRepository(self.session)
```

In `FakeUnitOfWork.__init__`:
```python
from obione.extractions.repository import FakeExtractionRepository
self.extractions = FakeExtractionRepository()
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/obione/extractions/repository.py backend/src/obione/unit_of_work.py
git commit -m "feat(extractions): add extraction repository + bind to UoW"
```

### Task 6.4: Extraction service

**Files:**
- Create: `backend/src/obione/extractions/service.py`
- Create: `backend/tests/unit/extractions/test_service.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/unit/extractions/test_service.py
import pytest

from obione.auth.models import User
from obione.extractions.llm.mock import MockExtractor
from obione.extractions.service import (
    create_extraction_from_manual,
    create_extraction_from_pipeline,
    list_extractions_for_project,
)
from obione.projects.schemas import ProjectCreate
from obione.projects.service import create_project
from obione.shared.ids import new_id
from obione.unit_of_work import FakeUnitOfWork


def _consultant() -> User:
    return User(id=new_id(), email="c@x.com", password_hash="x", name="C", role="consultant")


@pytest.mark.unit
def test_create_from_pipeline_persists_extraction():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    extractor = MockExtractor()
    e = create_extraction_from_pipeline(
        uow, extractor, consultant,
        project_id=project.id, document_id=None, document_bytes=b"x",
    )
    assert e.source == "llm"
    assert e.llm_model == "mock"
    assert "_meta" in e.content
    assert len(list_extractions_for_project(uow, consultant, project.id)) == 1


@pytest.mark.unit
def test_create_manual_persists():
    uow = FakeUnitOfWork()
    consultant = _consultant()
    project = create_project(uow, consultant, ProjectCreate(name="P", domain="legal"))
    e = create_extraction_from_manual(
        uow, consultant,
        project_id=project.id, document_id=None,
        content={"project_name": "Manual Override"},
    )
    assert e.source == "manual"
    assert e.llm_model is None
    assert e.created_by == consultant.id
```

- [ ] **Step 2: Implement service.py**

```python
# backend/src/obione/extractions/service.py
"""Extraction use cases."""
import uuid

from obione.auth.models import User
from obione.extractions.llm.port import AbstractExtractor
from obione.extractions.models import Extraction
from obione.projects.service import get_project_for_user
from obione.unit_of_work import AbstractUnitOfWork


def list_extractions_for_project(
    uow: AbstractUnitOfWork, user: User, project_id: uuid.UUID
) -> list[Extraction]:
    get_project_for_user(uow, user, project_id)  # access check
    with uow:
        return uow.extractions.list_by_project(project_id)


def create_extraction_from_pipeline(
    uow: AbstractUnitOfWork,
    extractor: AbstractExtractor,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    document_bytes: bytes,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    result = extractor.extract(document_bytes)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="llm",
            llm_model=result.model_id,
            content=result.content,
            created_by=None,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction


def create_extraction_from_manual(
    uow: AbstractUnitOfWork,
    user: User,
    *,
    project_id: uuid.UUID,
    document_id: uuid.UUID | None,
    content: dict,
) -> Extraction:
    project = get_project_for_user(uow, user, project_id)
    with uow:
        extraction = Extraction(
            project_id=project.id,
            document_id=document_id,
            source="manual",
            llm_model=None,
            content=content,
            created_by=user.id,
        )
        uow.extractions.add(extraction)
        uow.commit()
        return extraction
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/unit/extractions/test_service.py -v`
Expected: 2 passed

```bash
git add backend/src/obione/extractions/service.py backend/tests/unit/extractions/test_service.py
git commit -m "feat(extractions): add pipeline + manual extraction services"
```

### Task 6.5: Extraction router + migration + e2e

**Files:**
- Create: `backend/src/obione/extractions/router.py`
- Modify: `backend/src/obione/main.py` (register router)
- Modify: `backend/alembic/env.py` (import Extraction)
- Create: `backend/alembic/versions/0004_create_extractions.py` (autogenerate)
- Create: `backend/tests/e2e/test_extractions_flow.py`

- [ ] **Step 1: router.py**

```python
# backend/src/obione/extractions/router.py
"""HTTP routes for extractions."""
import uuid

from fastapi import APIRouter

from obione.auth.dependencies import CurrentUser, get_uow
from obione.extractions import service
from obione.extractions.schemas import ExtractionResponse, ManualExtractionCreate

router = APIRouter(prefix="/projects/{project_id}/extractions", tags=["extractions"])


@router.get("", response_model=list[ExtractionResponse])
def list_extractions(project_id: uuid.UUID, user: CurrentUser) -> list[ExtractionResponse]:
    items = service.list_extractions_for_project(get_uow(), user, project_id)
    return [ExtractionResponse.model_validate(x) for x in items]


@router.post("/manual", response_model=ExtractionResponse, status_code=201)
def create_manual_extraction(
    project_id: uuid.UUID, payload: ManualExtractionCreate, user: CurrentUser,
) -> ExtractionResponse:
    e = service.create_extraction_from_manual(
        get_uow(), user,
        project_id=project_id,
        document_id=payload.document_id,
        content=payload.content,
    )
    return ExtractionResponse.model_validate(e)
```

- [ ] **Step 2: Register router in main.py**

```python
from obione.extractions.router import router as extractions_router
# ...
    app.include_router(extractions_router)
```

- [ ] **Step 3: Migration 0004**

Add to `alembic/env.py`:
```python
from obione.extractions.models import Extraction  # noqa: F401
```

Run: `make migration m="create extractions table"`
Inspect, rename to `0004_create_extractions.py`, `make migrate`.

- [ ] **Step 4: e2e test**

```python
# backend/tests/e2e/test_extractions_flow.py
import pytest

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.shared.database import SessionLocal


@pytest.fixture
def consultant_token(client):
    s = SessionLocal()
    try:
        existing = s.query(User).filter_by(email="e2e-ext@x.com").first()
        if existing:
            s.delete(existing)
            s.commit()
        u = User(
            email="e2e-ext@x.com", password_hash=hash_password("pwd12345678"),
            name="C", role="consultant",
        )
        s.add(u)
        s.commit()
        r = client.post(
            "/auth/login", json={"email": "e2e-ext@x.com", "password": "pwd12345678"}
        )
        yield r.json()["access_token"]
        s.delete(u)
        s.commit()
    finally:
        s.close()


@pytest.mark.e2e
def test_create_manual_then_list(client, consultant_token):
    h = {"Authorization": f"Bearer {consultant_token}"}
    r = client.post("/projects", json={"name": "PExt", "domain": "legal"}, headers=h)
    pid = r.json()["id"]
    try:
        r = client.post(
            f"/projects/{pid}/extractions/manual",
            headers=h,
            json={"content": {"project_name": "Manual"}},
        )
        assert r.status_code == 201, r.text
        assert r.json()["source"] == "manual"

        r = client.get(f"/projects/{pid}/extractions", headers=h)
        assert len(r.json()) == 1
    finally:
        client.delete(f"/projects/{pid}", headers=h)
```

- [ ] **Step 5: Run + commit**

Run: `pytest tests/e2e/test_extractions_flow.py -v`
Expected: 1 passed

```bash
git add backend/src/obione/extractions/router.py backend/src/obione/main.py backend/alembic/env.py backend/alembic/versions/0004_create_extractions.py backend/tests/e2e/test_extractions_flow.py
git commit -m "feat(extractions): add router + migration 0004 + e2e manual creation test"
```

---

**End of Phase 6.** Extractions table + ports/adapters ready. Real LLM adapter slots into `extractions/llm/` in Sprint 2 T2.1 — no other code changes needed.

---

## Phase 7: CLI + Final Wire-up + Smoke

**Goal:** CLI command for bootstrap user creation (`make seed`), final main.py review, full end-to-end smoke verification.

### Task 7.1: CLI for create-user

**Files:**
- Create: `backend/src/obione/cli/__init__.py` (empty)
- Create: `backend/src/obione/cli/main.py`
- Create: `backend/tests/integration/test_cli.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/integration/test_cli.py
import pytest

from obione.auth.models import User
from obione.cli.main import cmd_create_user, main
from obione.shared.database import SessionLocal


@pytest.mark.integration
def test_cli_create_user_persists(monkeypatch, capsys):
    s = SessionLocal()
    try:
        existing = s.query(User).filter_by(email="cli-test@x.com").first()
        if existing:
            s.delete(existing)
            s.commit()
    finally:
        s.close()

    import argparse
    args = argparse.Namespace(
        email="cli-test@x.com", password="cli-pwd-12345",
        name="CLI User", role="admin",
    )
    exit_code = cmd_create_user(args)
    assert exit_code == 0
    out = capsys.readouterr().out
    assert "User created" in out

    # Verify in DB
    s = SessionLocal()
    try:
        u = s.query(User).filter_by(email="cli-test@x.com").one_or_none()
        assert u is not None
        assert u.role == "admin"
        s.delete(u)
        s.commit()
    finally:
        s.close()
```

- [ ] **Step 2: Implement CLI**

```python
# backend/src/obione/cli/main.py
"""Admin CLI.

Usage:
    python -m obione.cli create-user --email x@y.com --password secret --role admin --name "Name"
"""
import argparse
import sys

from obione.auth.schemas import UserCreate
from obione.auth.service import create_user
from obione.unit_of_work import SqlAlchemyUnitOfWork


def cmd_create_user(args: argparse.Namespace) -> int:
    try:
        user = create_user(
            SqlAlchemyUnitOfWork(),
            UserCreate(
                email=args.email,
                password=args.password,
                name=args.name,
                role=args.role,
            ),
        )
        print(f"User created: id={user.id} email={user.email} role={user.role}")
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(prog="obione")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("create-user", help="Create a user")
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--role", choices=["consultant", "client", "admin"], required=True)
    p.set_defaults(func=cmd_create_user)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 3: Run + commit**

Run: `pytest tests/integration/test_cli.py -v`
Expected: 1 passed

```bash
git add backend/src/obione/cli/__init__.py backend/src/obione/cli/main.py backend/tests/integration/test_cli.py
git commit -m "feat(cli): add create-user command + integration test"
```

### Task 7.2: Verify main.py wires everything

**Files:**
- Modify (if needed): `backend/src/obione/main.py`

By now, `main.py` should look like the snippet below. Verify and adjust if any router is missing.

- [ ] **Step 1: Verify content of main.py**

```python
# backend/src/obione/main.py
"""FastAPI app factory."""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from obione.auth.router import router as auth_router
from obione.documents.router import router as documents_router
from obione.extractions.router import router as extractions_router
from obione.health.router import router as health_router
from obione.projects.router import router as projects_router
from obione.settings import settings
from obione.shared.exceptions import register_exception_handlers
from obione.shared.logging import configure_logging
from obione.shared.middleware import register_middleware


def create_app() -> FastAPI:
    configure_logging(level=settings.LOG_LEVEL, fmt=settings.LOG_FORMAT)

    app = FastAPI(
        title="ObiOne — Observatorio de Projetos",
        description="Backend for the ObiOne project observatory (MPO + Generative AI).",
        version="0.1.0",
    )

    register_middleware(app)
    register_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(projects_router)
    app.include_router(documents_router)
    app.include_router(extractions_router)

    @app.get("/", include_in_schema=False)
    def root():
        return RedirectResponse(url="/docs")

    return app


app = create_app()
```

- [ ] **Step 2: Commit any changes**

```bash
git add backend/src/obione/main.py
git commit -m "chore(main): consolidate app factory with all bounded contexts" --allow-empty
```

### Task 7.3: Full smoke

- [ ] **Step 1: Clean restart**

Run: `make clean && make up`
Expected: containers come up healthy.

- [ ] **Step 2: Apply migrations**

Run: `make migrate`
Expected: 4 migrations applied (0001-0004).

- [ ] **Step 3: Seed admin**

Run: `make seed`
Expected: `User created: id=... email=admin@obione.local role=admin`

- [ ] **Step 4: Run all tests**

Run: `make test`
Expected: All unit + integration + e2e pass.

- [ ] **Step 5: Manual API smoke**

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obione.local","password":"admin123"}' \
  | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

# Me
curl -s http://localhost:8000/auth/me -H "Authorization: Bearer $TOKEN"

# Create project
curl -s -X POST http://localhost:8000/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Project","domain":"legal"}'
```

Expected: all return 200/201 with valid JSON.

- [ ] **Step 6: Update README with verified setup**

Re-read `backend/README.md` and confirm the 4 setup commands match reality. Update if needed.

- [ ] **Step 7: Commit final**

```bash
git add backend/README.md
git commit -m "chore(backend): update README after end-to-end smoke verification" --allow-empty
```

---

**End of Phase 7.** Backend chassis complete:
- 4 migrations applied (users, projects+project_clients, documents, extractions)
- 5 bounded contexts (auth, projects, documents, extractions, health)
- Ports & adapters for LLM (mock) + blob storage (filesystem)
- 3-tier tests (unit + integration + e2e) passing
- CLI for admin operations
- Full Docker workflow via Make

Next: Sprint 2 T2.1 — wire the real Ollama/Anthropic adapter into `extractions/llm/`.

---

## Self-review

✅ **Spec coverage:** Every section of `atividades/arquitetura_backend.md` is realized:
- §4 layout (src/obione/) → Phases 0-1
- §5 layer responsibilities → Phases 3-6 follow router/service/repository pattern strictly
- §6 ERD → migrations 0001-0004
- §7 Settings → Task 1.1
- §8 exceptions → Task 1.3
- §9 logging + middleware → Tasks 1.5, 1.6
- §10 tests in 3 tiers → unit/, integration/, e2e/ across all phases
- §11 Alembic + naming convention → Task 1.4, 1.8
- §12 en-US code, ruff rules → enforced in pyproject + every file
- §13 extension points → ports in documents/storage/ and extractions/llm/

✅ **No placeholders:** All code blocks are complete, exact commands shown with expected output, all types consistent across tasks.

✅ **Type consistency:** `AbstractUnitOfWork` attrs (`users`, `projects`, `documents`, `extractions`) added incrementally in matching tasks. Repository signatures match across abstract/SqlAlchemy/Fake.

---

## Plan status

✅ **All 7 phases written** — 42 tasks total.

| Phase | Tasks | Goal |
|---|---|---|
| 0 | 7 | Scaffolding (Docker, Compose, pyproject, etc.) |
| 1 | 9 | Shared infra (Settings, DB, exceptions, logging, middleware, UoW, Alembic, conftest) |
| 2 | 1 | Health module |
| 3 | 12 | Auth (model, security, repo, service, router, migration, integration + e2e) |
| 4 | 8 | Projects (model, access control, CRUD, migration, e2e) |
| 5 | 6 | Documents (storage port + adapter, upload, migration, e2e) |
| 6 | 5 | Extractions stub (LLM port + Mock adapter, model, CRUD, migration, e2e) |
| 7 | 3 | CLI + main.py review + full smoke |

**Estimated execution time:** ~8-12 hours for an engineer following TDD discipline. Subagent-driven execution: faster wall-clock but same logical effort.

---

## Plan status

**Phase 0:** ✅ written (7 tasks)
**Phases 1-7:** to be expanded in next plan increments after Phase 0 is executed and validated.

Rationale for the incremental approach: Phase 0 is the riskiest piece (Docker + Postgres + Compose wiring). Validating it works before writing 30+ more tasks avoids rework if assumptions about the environment turn out wrong (e.g. port conflicts, Docker permissions, Python version availability on the user's machine).
