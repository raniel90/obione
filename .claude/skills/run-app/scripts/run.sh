#!/usr/bin/env bash
# Bring up the ObiOne app locally: Spring Boot backend (dev) + TanStack frontend (dev).
# Idempotent — if a server is already healthy it is left running.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && git rev-parse --show-toplevel)"
BACKEND_LOG="/tmp/obione-backend.log"
FRONTEND_LOG="/tmp/obione-frontend.log"

# --- Local secrets (.env: OPENAI_API_KEY, OBIONE_LLM_PROVIDER, ...) ----------
if [ -f "$ROOT/.env" ]; then
  set -a; . "$ROOT/.env"; set +a
  echo "• loaded $ROOT/.env (provider: ${OBIONE_LLM_PROVIDER:-mock})"
fi

# --- JDK 21 (the backend requires Java 21) ---------------------------------
JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
if [ -z "$JAVA_HOME" ] && command -v brew >/dev/null 2>&1; then
  cand="$(brew --prefix openjdk@21 2>/dev/null)/libexec/openjdk.jdk/Contents/Home"
  [ -d "$cand" ] && JAVA_HOME="$cand"
fi
if [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "✗ JDK 21 not found. Install it:  brew install openjdk@21" >&2
  exit 1
fi
export JAVA_HOME
echo "• JAVA_HOME=$JAVA_HOME"

free_port() { lsof -ti "tcp:$1" 2>/dev/null | xargs kill -9 2>/dev/null || true; }

wait_for() { # url name
  for _ in $(seq 1 90); do
    curl -sf -m 2 "$1" >/dev/null 2>&1 && { echo "✓ $2 up"; return 0; }
    sleep 1
  done
  echo "✗ $2 did NOT come up — check the log" >&2
  return 1
}

# --- Backend ----------------------------------------------------------------
if curl -sf -m 2 http://localhost:8080/api/health >/dev/null 2>&1; then
  echo "✓ backend already running"
else
  echo "• starting backend (./mvnw spring-boot:run) → $BACKEND_LOG"
  free_port 8080
  ( cd "$ROOT/backend" && chmod +x ./mvnw 2>/dev/null; \
    JAVA_HOME="$JAVA_HOME" nohup ./mvnw spring-boot:run >"$BACKEND_LOG" 2>&1 & )
fi

# --- Frontend ---------------------------------------------------------------
if curl -sf -m 2 http://localhost:5173/ >/dev/null 2>&1; then
  echo "✓ frontend already running"
else
  echo "• starting frontend (bun run dev) → $FRONTEND_LOG"
  free_port 5173
  ( cd "$ROOT/frontend" && { [ -d node_modules ] || bun install; } \
    && nohup bun run dev >"$FRONTEND_LOG" 2>&1 & )
fi

# --- Health-check -----------------------------------------------------------
ok=0
wait_for http://localhost:8080/api/health "backend  (:8080/api)" || ok=1
wait_for http://localhost:5173/            "frontend (:5173)"     || ok=1

cat <<EOF

ObiOne is up:
  Frontend     http://localhost:5173
  Backend API  http://localhost:8080/api   (health: /api/health)
  Swagger UI   http://localhost:8080/api/swagger-ui.html
  H2 console   http://localhost:8080/api/h2-console   (jdbc:h2:file:./data/obione_dev, user sa)

Seeded logins (password in parentheses):
  admin@obione.dev (admin123) · consultor@obione.dev (consultor123) · cliente@obione.dev (cliente123)

Logs:  tail -f $BACKEND_LOG   |   tail -f $FRONTEND_LOG
Stop:  .claude/skills/run-app/scripts/stop.sh
EOF
exit $ok
