#!/usr/bin/env bash
# Stop the ObiOne dev servers (backend :8080, frontend :5173, LiveReload :35729).
set -uo pipefail
stopped=0
for port in 8080 5173 35729; do
  pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null && echo "• stopped :$port ($pids)" && stopped=1
  fi
done
[ "$stopped" -eq 0 ] && echo "• nothing was running on :8080 / :5173 / :35729"
