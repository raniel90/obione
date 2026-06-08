# ObiOne — Observatório de Projetos

Observatório-de-portfólio para consultorias de projetos, observando projetos sob a ótica do **Modelo de Observatório de Projetos (MPO)**. Projeto de doutorado da cadeira **TAES** (UPE/POLI).

- **Backend** — Java 21 + Spring Boot 3.5 (Maven), H2 em memória, API em `http://localhost:8080/api`.
- **Frontend** — React 19 + TanStack Start/Router (bun, Vite), em `http://localhost:5173`.

> As versões anteriores (FastAPI/Python + React/Vite) estão arquivadas em `backend/v1/` e `frontend/v1/`.

## Pré-requisitos

- **JDK 21** — `brew install openjdk@21`
- **bun** — https://bun.sh (`curl -fsSL https://bun.sh/install | bash`)

## Subir a app (backend + frontend)

Um comando, que resolve o JDK 21, libera portas, sobe os dois servidores em dev e faz health-check:

```bash
.claude/skills/run-app/scripts/run.sh
```

Parar tudo:

```bash
.claude/skills/run-app/scripts/stop.sh
```

### Manualmente (dois terminais)

```bash
# Backend (dev, hot-reload via devtools) — precisa do Java 21
cd backend
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo "$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home")"
./mvnw spring-boot:run            # → http://localhost:8080/api

# Frontend
cd frontend
bun install                       # só na primeira vez
bun run dev                       # → http://localhost:5173
```

## Endereços

| | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api (health: `/api/health`) |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| H2 console | http://localhost:8080/api/h2-console (`jdbc:h2:mem:obione_dev`, user `sa`, sem senha) |

## Logins semeados

O backend popula o H2 com dados de demonstração a cada boot (sem passo de seed/migração).

| Papel | E-mail | Senha |
|---|---|---|
| Admin | `admin@obione.dev` | `admin123` |
| Consultor | `consultor@obione.dev` | `consultor123` |
| Cliente | `cliente@obione.dev` | `cliente123` |

> Auth é mock-token com sessão **em memória** — reiniciar o backend desconecta todos.

## Testes & qualidade

```bash
cd backend  && ./mvnw test          # testes do backend (H2)
cd frontend && bun run lint         # ESLint + Prettier (v2; v1 é ignorado)
cd frontend && bun run build        # build de produção
```

O CI (GitHub Actions, `.github/workflows/ci.yml`) roda esses gates em todo PR.

## Estrutura

```
backend/    # Spring Boot REST API (br.com.obione.<contexto>)   — v1/ = legado Python
frontend/   # TanStack Start SPA (src/routes, src/services)      — v1/ = legado React/Vite
atividades/ # Entregas da cadeira (PT-BR)
contexto/   # Fontes acadêmicas (PDFs, .docx)
```

Detalhes de arquitetura, convenções e regras: ver [`CLAUDE.md`](CLAUDE.md).
