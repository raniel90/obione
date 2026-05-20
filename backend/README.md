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
