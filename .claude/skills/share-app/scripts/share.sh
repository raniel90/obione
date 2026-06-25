#!/usr/bin/env bash
# Expose the ObiOne app on a public URL via a Cloudflare quick tunnel.
# Idempotent: ensures cloudflared, brings the app up (run-app skill), starts the
# tunnel in the background, and prints the public URL.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && git rev-parse --show-toplevel)"
TUNNEL_LOG="/tmp/obione-tunnel.log"
TUNNEL_PID="/tmp/obione-tunnel.pid"
TARGET="http://localhost:5173"

url_from_log() {
  grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1
}

# --- Reuse an existing tunnel if still alive --------------------------------
if [ -f "$TUNNEL_PID" ] && kill -0 "$(cat "$TUNNEL_PID")" 2>/dev/null; then
  EXISTING="$(url_from_log)"
  if [ -n "$EXISTING" ]; then
    echo "• Túnel já ativo (PID $(cat "$TUNNEL_PID"))"
    URL="$EXISTING"
  fi
fi

# --- Ensure cloudflared is installed ---------------------------------------
if [ -z "${URL:-}" ]; then
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "• cloudflared não encontrado — instalando via Homebrew…"
    if command -v brew >/dev/null 2>&1; then
      brew install cloudflared || { echo "✗ falha ao instalar cloudflared"; exit 1; }
    else
      echo "✗ Homebrew não encontrado. Instale o cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
      exit 1
    fi
  fi

  # --- Bring the app up (idempotent) ---------------------------------------
  echo "• Garantindo que a app está no ar (run-app)…"
  "$ROOT/.claude/skills/run-app/scripts/run.sh" >/dev/null 2>&1 || true

  if [ "$(curl -s -o /dev/null -w '%{http_code}' "$TARGET" 2>/dev/null)" != "200" ]; then
    echo "✗ Frontend não respondeu em $TARGET. Rode .claude/skills/run-app/scripts/run.sh e tente de novo."
    exit 1
  fi

  # --- Start the tunnel -----------------------------------------------------
  echo "• Abrindo o túnel Cloudflare para ${TARGET} …"
  : > "$TUNNEL_LOG"
  nohup cloudflared tunnel --url "$TARGET" >"$TUNNEL_LOG" 2>&1 &
  echo $! > "$TUNNEL_PID"

  for _ in $(seq 1 30); do
    URL="$(url_from_log)"
    [ -n "$URL" ] && break
    sleep 2
  done
fi

if [ -z "${URL:-}" ]; then
  echo "✗ Não consegui obter a URL do túnel. Veja $TUNNEL_LOG"
  exit 1
fi

cat <<EOF

ObiOne está público:
  URL          $URL
  (API)        $URL/api/health

Logins (senha entre parênteses):
  admin@obione.dev (admin123) · consultor@obione.dev (consultor123) · cliente@obione.dev (cliente123)

Atenção: URL efêmera · servidor de dev · auth mock · a chave OpenAI fica viva atrás da URL.
Pare quando terminar:  .claude/skills/share-app/scripts/unshare.sh
Logs do túnel:         tail -f $TUNNEL_LOG
EOF
