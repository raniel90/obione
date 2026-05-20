# Arquitetura do Backend (Sprint 2 — T2.0)

Documento de design da infraestrutura backend do ObiOne. Subsidia a implementação e o relato de experiência (T6).

> **Convenções:** este documento é em português brasileiro (artefato acadêmico). O **código-fonte é em inglês** (en-US) — nomes de pacotes, classes, funções, variáveis, tabelas e colunas. Comentários em código são em inglês. Apenas docstrings de funções acadêmicas (e.g. funções da rubrica de avaliação) podem ter notas em PT.

---

## 1. Contexto & Objetivos

O ObiOne é um observatório-de-portfólio para consultorias de projetos. O backend é a camada que:

1. Persiste projetos, documentos `.docx` enviados e extrações estruturadas
2. Aplica controle de acesso semi-aberto (consultoria curatoriza; cliente vê apenas o seu projeto)
3. Orquestra o pipeline LLM de extração (porta para Ollama agora, Anthropic depois)
4. Expõe API REST para o frontend React

O ciclo de vida esperado: **9 semanas de desenvolvimento + ~3 anos de manutenção pós-defesa** (potencial trabalho de continuação). A arquitetura precisa equilibrar pragmatismo (entregar a tempo) com extensibilidade (não cristalizar decisões hoje que travem o amanhã).

---

## 2. Princípios

Adotamos **clean architecture pragmática** — inspirada em *Architecture Patterns with Python* (Percival & Gregory, 2020) e em *fastapi-best-practices* (zhanymkanov, GitHub), com adaptações para o escopo acadêmico.

### Princípios não-negociáveis

1. **Inversão de dependência:** camadas internas não conhecem camadas externas. Service layer não importa FastAPI; domínio não importa SQLAlchemy.
2. **Bounded contexts:** organização por capacidade de negócio (auth, projects, documents, extractions), não por camada técnica (controllers, services, models).
3. **Repository como interface (Protocol/ABC) + Unit of Work:** desacopla a lógica de aplicação da persistência. Permite trocar SQLAlchemy por outra coisa (improvável) e — mais importante — habilita testes unitários sem banco.
4. **Ports & adapters para integrações externas:** LLM, storage de arquivos, email, etc. são acessados via portas abstratas. Adaptadores concretos plugam por configuração.
5. **Configuração externa:** zero `if env == "prod"` no código. Comportamento controlado por env vars tipadas via Pydantic Settings.
6. **Observabilidade desde o dia 1:** structured logging, request ID propagado, hooks de tracing prontos (mesmo se não usarmos OpenTelemetry agora).
7. **Testes em 3 níveis:** unit (sem I/O), integration (com DB), e2e (HTTP-level).

### Concessões pragmáticas (vs. Cosmic Python puro)

| O que NÃO faremos | Por quê |
|---|---|
| Domain classes separadas das ORM (imperative mapping) | Dobra arquivos sem ganho relevante para escopo CRUD-heavy. SQLAlchemy 2 com `Mapped[]` annotations é expressivo o suficiente para servir de domínio. |
| Eventos de domínio + message bus | Não temos workflows assíncronos que justifiquem. YAGNI. |
| CQRS (separação read/write) | Volume não exige. Postgres serve dos dois lados. |
| Async SQLAlchemy + asyncpg | Gargalo real é o LLM (rodando em processo separado). Sync simplifica reasoning e evita "async coloring". |

---

## 3. Stack tecnológico

| Camada | Tecnologia | Versão alvo | Razão |
|---|---|---|---|
| Linguagem | Python | 3.11 | Estável, suportado, type hints maduros |
| Web framework | FastAPI | ≥0.115 | Spec da disciplina; OpenAPI nativo; ergonomia de DI |
| ORM | SQLAlchemy | 2.0 (sync) | Padrão de facto; `Mapped[]` annotations modernas |
| Driver DB | psycopg | 3.x | Driver síncrono atual, mantido pela equipe do psycopg2 |
| Migrations | Alembic | 1.13+ | Padrão SQLAlchemy |
| DB | PostgreSQL | 16 (Alpine) | Spec da disciplina; JSONB para conteúdo de extrações |
| Validation/Serialization | Pydantic v2 + pydantic-settings | 2.9+ | Type-safe boundaries (HTTP + env vars) |
| Auth | python-jose + passlib (bcrypt) | — | Spec da disciplina (JWT sem OAuth) |
| Testes | pytest + httpx | 8.3+ / 0.27+ | Padrão FastAPI |
| Lint/Format | ruff | 0.7+ | Substitui black + flake8 + isort numa só tool |
| Container | Docker + Compose | — | Spec da disciplina |
| Logging | stdlib `logging` (config JSON) | — | Sem framework extra; saída estruturada via formatter custom |

**Descartado e por quê:**

- *LangChain / LlamaIndex:* peso desnecessário; Instructor cobre nossos casos
- *Celery / message broker:* sem workflows assíncronos pesados
- *Redis:* sem cache real; sessões via JWT stateless
- *MinIO / S3:* filesystem com volume Docker basta (single-instance, dev local)
- *mypy:* validação tipada via Pydantic + ruff (`PYI` rules) é suficiente
- *poetry/uv:* `pip` + `pyproject.toml` é mais portável em ambiente acadêmico
- *async SQLAlchemy:* gargalo é LLM, não DB

---

## 4. Layout do projeto

```
backend/
├── pyproject.toml                  # deps, ruff config, pytest config
├── Dockerfile
├── docker-compose.yml              # postgres + backend
├── Makefile                        # up/down/migrate/test/lint/format/seed
├── alembic.ini
├── .env.example
├── .gitignore
├── README.md
│
├── alembic/
│   ├── env.py                      # aponta para metadata via importação
│   ├── script.py.mako
│   └── versions/                   # migrations (vazia no inicio; primeira em 0001)
│
├── src/
│   └── obione/
│       ├── __init__.py
│       ├── main.py                 # FastAPI app factory: create_app()
│       ├── settings.py             # global Settings (BaseSettings)
│       │
│       ├── shared/                 # cross-cutting concerns
│       │   ├── __init__.py
│       │   ├── database.py         # engine, SessionLocal, Base
│       │   ├── exceptions.py       # base ObioneException + HTTP mapper
│       │   ├── middleware.py       # request_id + structured logging
│       │   ├── logging.py          # logging config (JSON formatter)
│       │   ├── pagination.py       # limit/offset helpers
│       │   └── ids.py              # UUID v4 helpers
│       │
│       ├── unit_of_work.py         # AbstractUnitOfWork + SqlAlchemyUnitOfWork
│       │
│       ├── auth/                   # bounded context: authentication & users
│       │   ├── __init__.py
│       │   ├── models.py           # User (SQLAlchemy + domain)
│       │   ├── repository.py       # AbstractUserRepository (Protocol) + SqlAlchemyUserRepository
│       │   ├── service.py          # authenticate, create_user — pure (no FastAPI)
│       │   ├── security.py         # bcrypt hash + JWT encode/decode
│       │   ├── schemas.py          # Pydantic DTOs (request/response)
│       │   ├── dependencies.py     # FastAPI deps: get_current_user, require_role
│       │   ├── router.py           # FastAPI routes
│       │   └── exceptions.py       # InvalidCredentials, RoleNotAllowed
│       │
│       ├── projects/               # bounded context: projects & access control
│       │   ├── __init__.py
│       │   ├── models.py           # Project, ProjectClient (M2M)
│       │   ├── repository.py
│       │   ├── service.py
│       │   ├── access_control.py   # can_user_see_project / list_visible_projects
│       │   ├── schemas.py
│       │   ├── router.py
│       │   └── exceptions.py       # ProjectNotFound, NotProjectOwner
│       │
│       ├── documents/              # bounded context: .docx upload
│       │   ├── __init__.py
│       │   ├── models.py           # Document
│       │   ├── repository.py
│       │   ├── service.py
│       │   ├── storage/            # ports & adapters for blob storage
│       │   │   ├── __init__.py
│       │   │   ├── port.py         # AbstractBlobStorage (Protocol)
│       │   │   └── filesystem.py   # FilesystemBlobStorage (current impl)
│       │   ├── schemas.py
│       │   ├── router.py
│       │   └── exceptions.py       # UnsupportedMimeType, FileTooLarge, DuplicateHash
│       │
│       ├── extractions/            # bounded context: MPO attribute extraction
│       │   ├── __init__.py
│       │   ├── models.py           # Extraction (with JSONB content)
│       │   ├── repository.py
│       │   ├── service.py          # create_from_pipeline, create_from_manual
│       │   ├── llm/                # ports & adapters for LLM
│       │   │   ├── __init__.py
│       │   │   ├── port.py         # AbstractExtractor (Protocol)
│       │   │   ├── mock.py         # MockExtractor (returns fixture)
│       │   │   └── ollama.py       # OllamaExtractor (Sprint 2 T2.1)
│       │   ├── schemas.py
│       │   ├── router.py
│       │   └── exceptions.py
│       │
│       ├── health/
│       │   ├── __init__.py
│       │   └── router.py           # GET /health, GET /health/db
│       │
│       └── cli/                    # admin CLI
│           ├── __init__.py
│           └── main.py             # python -m obione.cli create-user ...
│
└── tests/
    ├── conftest.py                 # shared fixtures
    ├── unit/                       # no DB, no HTTP — pure logic
    │   ├── auth/
    │   │   ├── test_security.py    # bcrypt + JWT
    │   │   └── test_service.py     # uses FakeUserRepository + FakeUoW
    │   ├── projects/
    │   │   ├── test_access_control.py
    │   │   └── test_service.py
    │   ├── documents/
    │   │   └── test_service.py     # uses FakeBlobStorage
    │   └── extractions/
    │       └── test_service.py     # uses MockExtractor
    ├── integration/                # real DB via testcontainers OR session rollback fixture
    │   ├── auth/
    │   │   └── test_repository.py
    │   ├── projects/
    │   │   └── test_repository.py
    │   └── documents/
    │       └── test_repository.py
    └── e2e/                        # HTTP-level via FastAPI TestClient
        ├── test_health.py
        ├── test_auth_flow.py       # POST /auth/login → GET /auth/me
        └── test_projects_flow.py
```

### Por que `src/` layout

Padrão Python moderno (PEP 517/518). Evita o classic anti-pattern de imports funcionarem em dev mas falharem em prod por causa de `sys.path` poluído. `pip install -e .` instala o pacote `obione` corretamente.

### Por que pacote `obione` (não `app`)

Nome significativo. Reduz colisões de imports (`from obione.auth.service import ...` é inequívoco).

---

## 5. Responsabilidades por camada

### 5.1 Domain layer (dentro de `models.py` de cada contexto)

- **O que faz:** define entidades + value objects + regras de invariância
- **Imports permitidos:** stdlib, Pydantic, SQLAlchemy (apenas para `Mapped[]` annotations)
- **NÃO importa:** FastAPI, repository concreto, settings, qualquer infra
- **Exemplo:** `User` tem método `check_password(plain) -> bool` que usa o `password_hash` interno

### 5.2 Repository layer (`repository.py` de cada contexto)

- **O que faz:** define `AbstractXxxRepository` (Protocol ou ABC) com métodos `add`, `get`, `list_by_*`. Implementa `SqlAlchemyXxxRepository` que recebe um `Session` no `__init__`.
- **Imports permitidos:** typing, SQLAlchemy, domain models
- **NÃO importa:** FastAPI, service, schemas
- **Testabilidade:** todo teste unit que precise de "estado" usa `FakeXxxRepository` (list interna), zero DB.

### 5.3 Unit of Work (`unit_of_work.py` no root)

- **O que faz:** context manager que dá `__enter__` (abre session + instancia repositories) e `__exit__` (rollback default; commit explícito). Implementação concreta `SqlAlchemyUnitOfWork` recebe um `session_factory`.
- **Por quê:** services manipulam UoW (não Session direto). Permite trocar implementação (e.g. `FakeUnitOfWork` em testes) sem mudar service.

### 5.4 Service layer (`service.py` de cada contexto)

- **O que faz:** orquestra domínio + repositories via UoW. Implementa casos de uso (e.g. `authenticate(uow, email, password) -> Token`).
- **Imports permitidos:** typing, domain models, repository abstrato, UoW abstrato, exceptions desse contexto
- **NÃO importa:** FastAPI, Pydantic DTOs, settings concretos
- **Forma:** funções puras (sem classes "Service" — evita estado oculto). Argumentos explícitos: `def authenticate(uow: AbstractUnitOfWork, email: str, password: str) -> tuple[str, int]`.

### 5.5 Schemas (`schemas.py` de cada contexto)

- **O que faz:** define DTOs Pydantic v2 para request body e response. Mapeia entidades de domínio em response models via `ConfigDict(from_attributes=True)`.
- **Imports permitidos:** typing, Pydantic, datetime, UUID
- **NÃO importa:** SQLAlchemy, domain models de outros contextos
- **Convenção:** `XxxCreate`, `XxxUpdate`, `XxxResponse`, `XxxFilter`

### 5.6 Dependencies (`dependencies.py` de cada contexto, quando precisa)

- **O que faz:** funções FastAPI Depends() — extrair user atual do JWT, validar role, paginação
- **Imports permitidos:** FastAPI, Pydantic, service, schemas, settings
- **Quem usa:** routers, exclusivamente

### 5.7 Router layer (`router.py` de cada contexto)

- **O que faz:** declara `APIRouter` e endpoints. Cada endpoint:
  1. Recebe DTOs Pydantic + dependencies
  2. Chama service com argumentos primitivos/UoW
  3. Mapeia retorno do service para response model
- **Imports permitidos:** FastAPI, schemas desse contexto, service desse contexto, dependencies, exceptions
- **NÃO contém lógica de negócio.** Se tiver `if`, geralmente é cheiro.

### 5.8 Adapters externos (`storage/`, `llm/`)

- **O que faz:** implementações concretas de portas. Filesystem, Ollama, Anthropic, etc.
- **Selecionados por configuração** em `settings.py`: `LLM_PROVIDER`, `STORAGE_BACKEND`
- **Factory em `main.py`** que monta as dependências no app startup

---

## 6. Data model (ERD)

```
┌──────────────────┐
│ users            │
├──────────────────┤
│ id        uuid pk│◄───────┐
│ email     unique │        │
│ password_hash    │        │
│ name             │        │
│ role             │        │ enum-string: consultor | client | admin
│ created_at       │        │
│ updated_at       │        │
└──────────────────┘        │
                            │ consultant_id (1:N)
┌──────────────────┐        │
│ projects         │        │
├──────────────────┤        │
│ id        uuid pk│◄───┐   │
│ name             │    │   │
│ domain           │    │   │ enum-string: legal | health | sports | branding | gastronomy | other
│ description text │    │   │
│ consultant_id ───┼────┼───┘
│ created_at       │    │
│ updated_at       │    │
└──────────────────┘    │
                        │
┌──────────────────────┐│
│ project_clients (M2M)││
├──────────────────────┤│
│ project_id  pk fk ───┼┘
│ user_id     pk fk    │
│ created_at           │
└──────────────────────┘

┌──────────────────────┐
│ documents            │
├──────────────────────┤
│ id           uuid pk │◄───┐
│ project_id   fk      │    │
│ original_name        │    │
│ relative_path        │    │ (relative to STORAGE_ROOT)
│ sha256       unique  │    │
│ size_bytes           │    │
│ mime_type            │    │
│ uploaded_by fk users │    │
│ uploaded_at          │    │
└──────────────────────┘    │
                            │
┌──────────────────────────┐│
│ extractions              ││
├──────────────────────────┤│
│ id              uuid pk  ││
│ project_id      fk       ││
│ document_id     fk       ├┘
│ source          string   │ enum-string: llm | manual
│ llm_model       string?  │
│ content         jsonb    │ ← schema_extracao output
│ created_by  fk users?    │ (null when llm-generated)
│ created_at               │
└──────────────────────────┘
```

### Convenções de schema

- **PKs:** UUID v4 (gerado no app, não no DB) — evita IDs sequenciais expostos na API
- **Timestamps:** `TIMESTAMP WITH TIME ZONE`, `server_default=func.now()`
- **Enums:** strings com `CHECK` constraint (não Postgres ENUM nativo) — facilita adicionar valor sem `ALTER TYPE`
- **Naming SQLAlchemy:** convention aplicada em `MetaData` para gerar nomes determinísticos de FK/UNIQUE/CK/IX
- **JSONB em `extractions.content`:** permite query in-place (`WHERE content->>'porte' = 'pequeno'`) — GIN index quando feature de comparativo chegar (YAGNI agora)

### Indexes

| Tabela | Coluna(s) | Tipo | Razão |
|---|---|---|---|
| users | (email) | UNIQUE | login |
| projects | (consultant_id) | btree | "meus projetos" |
| project_clients | (user_id, project_id) | composite PK | acesso M2M |
| documents | (project_id) | btree | listing |
| documents | (sha256) | UNIQUE | dedupe |
| extractions | (project_id) | btree | timeline |
| extractions | (document_id) | btree | última extração por doc |

---

## 7. Configuração

### Pydantic Settings (em `obione/settings.py`)

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Auth
    JWT_SECRET: SecretStr = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24
    
    # Storage
    STORAGE_BACKEND: Literal["filesystem"] = "filesystem"
    STORAGE_ROOT: str = "/app/storage"
    MAX_UPLOAD_SIZE_MB: int = 50
    
    # LLM (Sprint 2)
    LLM_PROVIDER: str = "mock"  # "mock" | "ollama/llama3.1:8b" | "anthropic/claude-..."
    LLM_BASE_URL: str | None = None  # for Ollama
    LLM_API_KEY: SecretStr | None = None  # for cloud providers
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    
    # Observability
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    LOG_FORMAT: Literal["json", "plain"] = "json"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
```

### Por que `SecretStr`

Evita logar segredos por acidente. `repr()` mostra `**********`.

### Per-stage

Stages (dev / test / prod) controlados via env vars, não via classes diferentes. Tests usam fixture que cria `Settings` com overrides.

---

## 8. Tratamento de erros

### Hierarquia

```
ObioneException (base, status 500)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
└── ConflictError (409)
```

Cada bounded context define suas exceções específicas herdando dessa base:

```python
# auth/exceptions.py
class InvalidCredentialsError(UnauthorizedError):
    code = "invalid_credentials"

# projects/exceptions.py
class ProjectNotFoundError(NotFoundError):
    code = "project_not_found"
```

### Mapeamento HTTP

Em `shared/exceptions.py`:

```python
@app.exception_handler(ObioneException)
async def handle(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": str(exc)}},
    )
```

Response body padronizado: `{"error": {"code": ..., "message": ...}}` — facilita parsing no frontend.

---

## 9. Observabilidade

### Structured logging

`shared/logging.py` configura formatter JSON:

```json
{
  "ts": "2026-05-20T10:00:00Z",
  "level": "INFO",
  "logger": "obione.request",
  "msg": "request_completed",
  "request_id": "uuid",
  "method": "POST",
  "path": "/projects",
  "status": 201,
  "elapsed_ms": 12.3,
  "user_id": "uuid?"
}
```

### Middleware

`shared/middleware.py`:
1. Gera/propaga `X-Request-ID`
2. Loga entrada/saída de cada request com elapsed time + status
3. Logs estruturados incluem `request_id` para correlação

### Hooks para tracing (futuro)

Estrutura preparada para OpenTelemetry: instrumentação de FastAPI + SQLAlchemy via `opentelemetry-instrumentation-*`. Não habilitado por padrão — flag em settings.

---

## 10. Estratégia de testes

### Unit tests (`tests/unit/`)

- **Setup:** zero I/O. Sem DB, sem HTTP, sem filesystem.
- **Fakes:** `FakeUserRepository` (list interna), `FakeUnitOfWork`, `FakeBlobStorage` (dict in-mem), `MockExtractor`
- **Cobertura:** lógica de service, regras de domínio, password hashing, JWT encode/decode
- **Velocidade:** <100ms o conjunto

### Integration tests (`tests/integration/`)

- **Setup:** DB Postgres real via Docker (mesmo do compose). Cada teste roda em transaction com rollback.
- **Fixtures:** `db_session` (transactional), `seeded_admin` (user pronto), `seeded_consultant`
- **Cobertura:** repositories (queries SQLAlchemy), migrations, constraints do DB
- **Velocidade:** ~5s o conjunto

### E2E tests (`tests/e2e/`)

- **Setup:** FastAPI TestClient + DB real (mesma fixture). Roda app completo em-process.
- **Cobertura:** fluxos HTTP: login → me → criar projeto → upload doc
- **Velocidade:** ~15s o conjunto

### Filosofia

Não há regra de "% de cobertura". O que medimos:
- 100% dos services com unit tests (são puros — barato)
- 100% das migrations rodadas em integration test
- Pelo menos 1 e2e por bounded context (smoke)

---

## 11. Migrations

### Alembic autogenerate

`alembic/env.py` aponta para `Base.metadata` importando todos os models:

```python
from obione.shared.database import Base
from obione.auth.models import User  # noqa: F401 — populate metadata
from obione.projects.models import Project, ProjectClient  # noqa
from obione.documents.models import Document  # noqa
from obione.extractions.models import Extraction  # noqa

target_metadata = Base.metadata
```

### Workflow

```bash
make migration m="add users and projects tables"
# Cria alembic/versions/0001_add_users_and_projects_tables.py
# Revisa arquivo gerado, ajusta se necessário
make migrate
# Aplica head
```

### Naming convention

```python
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
```

Aplicada em `Base.metadata`. Migrations geradas têm nomes estáveis (não dependem do hash auto do SQLAlchemy).

---

## 12. Convenções de código

### Linguagem

- **Tudo em inglês (en-US).** Classes, funções, variáveis, tabelas, colunas, mensagens de log, comentários, docstrings.
- **Apenas mensagens de erro voltadas ao usuário final** (em response body) podem ser em PT — TBD se precisamos i18n.

### Estilo

- ruff com regras: `E, F, W, I, N, UP, B, C4, SIM` (pycodestyle, pyflakes, isort, pep8-naming, pyupgrade, bugbear, comprehensions, simplify)
- Line length: 100
- Quotes: double (default ruff)
- Type hints em TODA função (parâmetros + return)
- `from __future__ import annotations` quando precisar de forward refs

### Imports

- Absolute imports: `from obione.auth.service import authenticate`
- Nunca `import *`
- Ordem: stdlib, third-party, local (ruff/isort gerencia)

### Naming

- Modules: `snake_case`
- Classes: `PascalCase`
- Funções e variáveis: `snake_case`
- Constantes: `SCREAMING_SNAKE_CASE`
- Tipos genéricos: `T`, `K`, `V` ou `XxxT`

### Docstrings

- Funções públicas têm docstring de 1 linha (Google style)
- Funções complexas: docstring multi-linha com Args/Returns/Raises
- Classes: docstring de propósito

---

## 13. Pontos de extensão

| Ponto | Como estender |
|---|---|
| Novo provider LLM | Implementa `AbstractExtractor` em `extractions/llm/<name>.py`; registra na factory de `main.py` |
| Storage S3/MinIO | Implementa `AbstractBlobStorage` em `documents/storage/<backend>.py` |
| Novo bounded context | Cria pacote `obione/<context>/` com mesma estrutura. Inclui router em `main.py` |
| Novo formato de doc além de .docx | Adiciona parser em `documents/parsers/`; service detecta por mime_type |
| Notificações | Cria contexto `obione/notifications/` com porta `AbstractNotifier`; adapters Email/Slack |
| Cache | Adiciona porta `AbstractCache` em `shared/`; adapter Redis quando precisar |

---

## 14. Fora de escopo (YAGNI)

- Migration data-only (seed via CLI por enquanto)
- Soft delete (não pedido)
- Audit log (logs estruturados cobrem)
- Multi-tenancy via schemas (M2M `project_clients` resolve)
- Internacionalização (PT-only por enquanto)
- Rate limiting (sem público externo)
- API versioning `/api/v1` (sem v2 no horizonte)
- WebSockets (sem feature real-time)
- Refresh tokens (JWT de 24h basta)

---

## 15. Referências

- Percival, H. & Gregory, B. (2020). *Architecture Patterns with Python: Enabling Test-Driven Development, Domain-Driven Design, and Event-Driven Microservices*. O'Reilly. https://www.cosmicpython.com/
- zhanymkanov. *FastAPI Best Practices and Conventions we used at our startup*. https://github.com/zhanymkanov/fastapi-best-practices
- FastAPI Docs. https://fastapi.tiangolo.com/
- SQLAlchemy 2.0 Migration Guide. https://docs.sqlalchemy.org/en/20/changelog/migration_20.html
- Pydantic V2 Migration Guide. https://docs.pydantic.dev/latest/migration/

---

**Status:** Decisões aprovadas em 2026-05-20.
**Próximo passo:** invocar `/writing-plans` para gerar o plano de execução faseado com TDD.
