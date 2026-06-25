#!/usr/bin/env bash
# Stop the Cloudflare quick tunnel started by share.sh. Leaves the app running.
set -uo pipefail

TUNNEL_PID="/tmp/obione-tunnel.pid"

if [ -f "$TUNNEL_PID" ] && kill -0 "$(cat "$TUNNEL_PID")" 2>/dev/null; then
  kill "$(cat "$TUNNEL_PID")" 2>/dev/null && echo "• túnel parado (PID $(cat "$TUNNEL_PID"))"
  rm -f "$TUNNEL_PID"
else
  # Fallback: mata qualquer cloudflared apontando para :5173
  pkill -f "cloudflared tunnel --url http://localhost:5173" 2>/dev/null \
    && echo "• túnel parado (pkill)" || echo "• nenhum túnel ativo"
  rm -f "$TUNNEL_PID"
fi

echo "A app local continua no ar. Para pará-la: .claude/skills/run-app/scripts/stop.sh"
