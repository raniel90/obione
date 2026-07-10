#!/usr/bin/env bash
# Reset the ObiOne demo data: stop the stack, wipe the file-based H2 database
# (backend/data/), and bring everything back up — the seeders repopulate the
# demo dataset on boot. One command to get a pristine demo state.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo "→ stopping the stack…"
"$SCRIPT_DIR/stop.sh" || true

echo "→ wiping backend/data/ (H2 file DB)…"
rm -rf "$REPO_ROOT/backend/data"

echo "→ starting fresh (seeders repopulate on boot)…"
exec "$SCRIPT_DIR/run.sh"
