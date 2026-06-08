.PHONY: help up up-all down logs shell psql migrate migration migrate-down test test-unit test-integration test-e2e lint format seed seed-demo frontend-dev frontend-build frontend-lint clean

help:  ## List available targets
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up:  ## Start postgres + backend in background
	docker-compose up -d --build
	@echo "Waiting for backend to be healthy..."
	@sleep 5
	@curl -fsS http://localhost:8000/health > /dev/null 2>&1 \
		&& echo "✓ Backend up: http://localhost:8000/docs" \
		|| (echo "✗ Backend did not respond — check 'make logs'" && exit 1)

up-all:  ## Start postgres + backend + frontend in background
	docker-compose --profile full up -d --build
	@echo "Waiting for backend + frontend..."
	@sleep 8
	@curl -fsS http://localhost:8000/health > /dev/null 2>&1 \
		&& echo "✓ Backend up: http://localhost:8000/docs" \
		|| (echo "✗ Backend did not respond — check 'make logs'" && exit 1)
	@echo "✓ Frontend dev: http://localhost:5173 (npm install may still be running — tail with 'docker-compose logs -f frontend')"

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

seed:  ## Create admin@obione.dev / admin123
	docker-compose exec backend python -m obione.cli create-user \
		--email admin@obione.dev --password admin123 --role admin --name "Admin"

seed-demo:  ## Rich seed: admin + consultor + 3 clientes + 4 projetos + extrações + CBAC + sugestão de tema
	docker-compose exec backend python -m obione.cli seed-demo

frontend-dev:  ## Start only the frontend container (dev mode)
	docker-compose --profile full up -d --build frontend
	@echo "✓ Frontend dev: http://localhost:5173"

frontend-build:  ## Production build (npm run build) of the frontend
	cd ../frontend && npm install && npm run build

frontend-lint:  ## Run ESLint on the frontend
	cd ../frontend && npm install && npm run lint

clean:  ## Stop containers AND remove volumes (DELETES DATA)
	docker-compose --profile full down -v
