# ObiOne — Frontend

Camada de apresentação do ObiOne (observatório de projetos para consultorias).
React 19 + Vite 8 + Tailwind 4 + shadcn/ui + React Router 7 + TanStack Query 5.

## Status

M0 (chassis) — esqueleto compilando. Próximos milestones em
`/Users/raniel/.claude/plans/iterative-snacking-simon.md`.

## Desenvolvimento

### Via Docker (recomendado, junto com o backend)

A partir de `backend/`:

```bash
make up-all      # sobe Postgres + backend + frontend
```

Frontend em http://localhost:5173, backend em http://localhost:8000.

A primeira execução pode demorar 2-3 minutos (`npm install` no container).

### Local (mais rápido pra iterar no frontend)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Requer o backend rodando em `http://localhost:8000` (rodar `make up` em
`backend/` antes).

## Build & lint

```bash
npm run build     # tsc -b && vite build → dist/
npm run lint      # eslint
```

## Convenções

- **Path alias.** `@/*` aponta para `src/*` (configurado em `tsconfig.app.json`
  e `vite.config.ts`).
- **Estilos.** Tailwind v4 via `@tailwindcss/vite`. Tokens (cores, raios)
  centralizados em `src/styles.css`. Tema light/dark via classe `.dark` na
  raiz.
- **Componentes UI.** shadcn/ui em `src/components/ui/`. Adicionar novos via
  `npx shadcn@latest add <componente>`.
- **Data fetching.** TanStack Query — chaves padronizadas como
  `["domain", "action", { params }]` (ver plano).
- **Auth.** JWT em `localStorage` (`obione_token`); context React em
  `src/lib/auth-context.tsx` (chega no M1).

## Variáveis de ambiente

| Var | Descrição | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base do backend | `http://localhost:8000` |
