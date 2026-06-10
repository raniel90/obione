---
name: run-app
description: Use when asked to start, run, boot, serve, or "subir" the ObiOne app locally — the Spring Boot backend and the TanStack frontend together. Covers dev servers, ports, JDK 21, seeded logins, and stopping them.
---

# Run the ObiOne app (backend + frontend)

Brings up the full local stack: **Spring Boot backend** (dev mode, `:8080/api`, H2 file-based em `backend/data/`) and the **TanStack frontend** (Vite dev, `:5173`). No external database — demo data is seeded on the first boot and survives restarts (delete `backend/data/` to reseed).

## Quick start

```bash
.claude/skills/run-app/scripts/run.sh
```

Idempotent and self-contained: resolves **JDK 21**, frees stale ports, starts both servers in the background (logs in `/tmp/obione-*.log`), waits until both are healthy, then prints URLs + logins. If a server is already healthy it is left running.

Stop everything:

```bash
.claude/skills/run-app/scripts/stop.sh
```

## What you get

| | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api (health: `/api/health`) |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| H2 console | http://localhost:8080/api/h2-console (`jdbc:h2:file:./data/obione_dev`, user `sa`, empty password) |

**Seeded logins:** `admin@obione.dev` / `admin123` · `consultor@obione.dev` / `consultor123` · `cliente@obione.dev` / `cliente123`

## Manual fallback (run the two servers yourself)

```bash
# Backend (dev, hot-reload via devtools) — needs Java 21
cd backend
export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo "$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home")"
./mvnw spring-boot:run            # → http://localhost:8080/api

# Frontend (separate terminal)
cd frontend
bun install                       # first time only
bun run dev                       # → http://localhost:5173
```

## Troubleshooting

- **`UnsupportedClassVersionError` / build fails** → wrong JDK. The backend requires **Java 21**: `brew install openjdk@21`, then re-run (the script auto-detects it). Don't `java -jar` with an older JDK; use `./mvnw spring-boot:run`.
- **`Port 5173/8080 is already in use`** → a stale dev server. `run.sh` frees those ports automatically; otherwise run `stop.sh`.
- **`./mvnw: permission denied`** → `chmod +x backend/mvnw` (the script also does this).
- **Login fails** → sessions are in-memory, so restarting the backend logs everyone out (data persists in `backend/data/`). Use a seeded login above.
- **Backend didn't come up** → `tail -f /tmp/obione-backend.log`. Frontend → `tail -f /tmp/obione-frontend.log`.
