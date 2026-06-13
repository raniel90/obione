# ObiOne — O que mudou (antes × hoje)

Resumo para o time: o que era a versão anterior e o que é a v2 hoje, e o que melhoramos para a aplicação ser **de fato um observatório** (e não só uma comunidade colaborativa).

> As versões antigas ficaram arquivadas em `backend/v1/` e `frontend/v1/`.

## Stack

| | Antes (v1) | Hoje (v2) |
|---|---|---|
| Backend | Python · FastAPI | **Java 21 · Spring Boot** |
| Frontend | React · Vite | **React · TanStack Start** (bun) |
| Banco (dev) | PostgreSQL | **H2 em memória** (sem container) |

## O produto: antes × hoje

A v2 já era um forte **observatório‑comunidade** (domínios, discussões, conhecimento), mas faltava o **rigor de observatório**. Foi o que adicionamos:

| Área | Antes | Hoje |
|---|---|---|
| **Lente de observação** | atributos soltos / ids genéricos (`mpo‑1..8`, texto livre) | **catálogo MPO: 44 atributos em 8 categorias** (Quadro 37) — toda observação é tagueada por um esquema consistente |
| **Medição** | não existia | **Cobertura por projeto** — "quanto do MPO já foi observado" (por categoria e total) |
| **IA Generativa** | ausente no backend | **camada assistiva** (4 papéis): sugere o **domínio**, sugere **observações já mapeadas ao MPO**, **sintetiza conhecimento** de uma discussão e faz **síntese cross‑projeto**. Sempre *human‑in‑the‑loop* (a IA sugere; o consultor decide) |
| **Acesso / governança** | tudo liberado (`permitAll`, "simulado") | **enforcement por papel**: leitura exige login; **mutações são de consultor/admin**; cliente lê e contribui em discussões |
| **Linha do tempo** | mock | **feed real** (observações + discussões + conhecimento ordenados por data) |

## O que isso significa, em uma frase

A aplicação agora **observa** (lente MPO), **mede** (cobertura), **usa IA** para reduzir trabalho, **governa** o acesso e **acompanha** a evolução no tempo — com a **comunidade** (discussões → conhecimento) por cima. O ciclo central funciona ponta a ponta: **a IA sugere observações → o consultor aceita → a observação é criada → a cobertura sobe.**

## Como rodar (local)

- Pré‑requisitos: **JDK 21** (`brew install openjdk@21`) e **bun**.
- Um comando sobe tudo: `.claude/skills/run-app/scripts/run.sh` → backend em `http://localhost:8080/api`, frontend em `http://localhost:5173`. Para parar: `.claude/skills/run-app/scripts/stop.sh`.
- Logins de demonstração:
  - `admin@obione.dev` / `admin123`
  - `consultor@obione.dev` / `consultor123`
  - `cliente@obione.dev` / `cliente123`

## Em aberto (trabalho futuro)

- **Autenticação**: hoje é mock‑token (sessão única, compartilhada); falta **JWT por usuário**.
- **IA**: as sugestões de conhecimento/síntese são "display‑first" (a consolidação fina pode ser aprofundada). Provider real via Ollama local (`obione.llm.provider=ollama`); o padrão é mock.
- **Testes**: a v2 ainda não tem **e2e automatizado** (a v1 tinha; hoje a verificação é manual + CI de build/lint).

---

*Detalhe técnico e raciocínio: `atividades/aderencia_observatorio_v2.md`. Guia de dev: `CLAUDE.md`.*
