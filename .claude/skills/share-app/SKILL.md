---
name: share-app
description: Use when asked to expose/share the ObiOne app for remote access — give someone a public URL, "subir para acesso remoto", demo over the internet, or open a tunnel. Brings the app up and exposes it via a Cloudflare quick tunnel (one public URL, no account).
---

# Share the ObiOne app remotely (Cloudflare quick tunnel)

Exposes the running ObiOne app on a **single public URL** so anyone can access it over the
internet, without DNS, port-forwarding, or a Cloudflare account. Uses a **Cloudflare quick
tunnel** (`*.trycloudflare.com`).

This works because the frontend talks to the backend through **one origin**: the Vite dev
server serves the app on `:5173` and proxies `/api` to the backend on `:8080`
(see `frontend/vite.config.ts` + `API_BASE_URL = "/api"` in `apiClient.ts`). So a single
tunnel to `:5173` exposes both the UI and the API.

## Quick start

```bash
.claude/skills/share-app/scripts/share.sh
```

Idempotent and self-contained: ensures `cloudflared` is installed (via Homebrew), brings the
app up (delegates to the `run-app` skill), starts the tunnel in the background
(log in `/tmp/obione-tunnel.log`), and prints the public URL + seeded logins.

It only **reuses** an existing tunnel if it's actually routing: besides checking the process
is alive, it inspects the cloudflared log and confirms the most recent connection event is a
successful registration (not a later failure). A process that's up but whose edge connection
broke is torn down and a fresh tunnel is started. The health check reads the log on purpose,
**not** `curl` to the public URL: the macOS resolver caches an `NXDOMAIN` for the brand-new
subdomain, so a local `curl` returns `000` even when the tunnel works in a browser.

Stop the tunnel (app keeps running):

```bash
.claude/skills/share-app/scripts/unshare.sh
```

## What you get

- A public URL like `https://<random>.trycloudflare.com` serving the whole app.
- **Seeded logins:** `admin@obione.dev` / `admin123` · `consultor@obione.dev` / `consultor123` · `cliente@obione.dev` / `cliente123`

## Heads-up (read before sharing the URL)

- The URL is **ephemeral** — a new random subdomain each run.
- It's the Vite **dev** server — great for a demo, not for sustained/production use.
- **Auth is mock-token** and the demo logins above are public knowledge.
- The **`OPENAI_API_KEY` is live** behind the URL: a logged-in consultant/admin can trigger
  AI calls (cost). Only share the URL deliberately; run `unshare.sh` when done.
- Keep the terminal/process alive — closing it drops the tunnel.

## Troubleshooting

- **`cloudflared: command not found`** → `brew install cloudflared` (the script tries this).
- **URL didn't print** → check `/tmp/obione-tunnel.log`.
- **App not reachable through the URL** → confirm local app is healthy first
  (`.claude/skills/run-app/scripts/run.sh`); the tunnel only forwards `:5173`.
- **"Blocked request. This host is not allowed."** → `frontend/vite.config.ts` must keep
  `server.allowedHosts: true`.
- **App carrega mas login/dados falham no túnel (mas funciona em localhost)** → causado por
  um `VITE_API_BASE_URL` **absoluto** (ex.: `http://localhost:8000`) no `frontend/.env`
  (gitignored), que faz o navegador remoto bater no próprio localhost. O `share.sh`
  **corrige isso sozinho**: reescreve para `VITE_API_BASE_URL=/api` (relativo, servido pelo
  proxy do Vite) e reinicia o frontend antes de abrir o túnel. Nada a fazer manualmente.
