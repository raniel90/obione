# Roadmap do Frontend — ObiOne

## 1. Propósito

Este documento é a fonte única do **goal do frontend** do ObiOne e do seu estado.
O goal, em uma frase:

> **Toda tela do frontend funcionando e2e, conforme a spec da tela.**

A espinha do doc é o **inventário de telas** (seção 4): bate o olho e vê o que está
verde e o que falta. As demais seções dão o contrato de "pronto" (seção 2), a visão
por milestone (seção 3), o escopo do que falta (seção 5), as pontas soltas (seção 6)
e como rodar as evidências (seção 7).

Numeração de requisitos: **canônica do `requisitos.md`** (RF01–RF18). Ver dívida em §6.

---

## 2. Definição de Pronto (por tela)

Uma tela só é considerada **pronta (✅)** quando satisfaz todos os critérios abaixo:

1. **Implementada conforme a spec** da tela (design + comportamento).
2. **Vitest verde** — testes de componente/integração (Testing Library + jsdom).
3. **e2e Playwright** — pelo menos um spec que dirige a tela **fim-a-fim** contra o
   backend real + `seed-demo`.
4. **Perfil e CBAC respeitados** — o que cada perfil (consultor/admin/cliente) vê e
   não vê está coberto por teste.
5. **Mergeada na `main` via PR** (nunca commit solto de chassis).

Enquanto qualquer critério faltar, a tela é **🔜 (falta)** — mesmo que já exista
placeholder ou código parcial.

---

## 3. Milestones (M0–M5)

| Milestone | Escopo | Telas | Status | PR |
|---|---|---|---|---|
| **M0** | Chassis Vite/React/Tailwind + design system | — (fundação) | ✅ mergeado | #23 |
| **M1** | Auth JWT + roteamento com guards por perfil | Login | ✅ mergeado | #24 |
| **M2** | Lista perfil-aware + detalhe com 44 atributos MPO por categoria + CBAC | Lista, Detalhe | ✅ mergeado | #25 |
| **M3** | Temática (RF13): sugerir/aceitar/histórico (só-staff) | Temática (no detalhe) | ✅ mergeado | #26 |
| **M4** | UI de configuração do CBAC pelo consultor | Config CBAC | ✅ mergeado | #27 |
| **M5** | Cockpit cross-cliente real (agregação por temática) | Cockpit | ✅ mergeado | #28 |

Camada de e2e (Playwright) introduzida no M3 e aplicada retroativamente a M1/M2.

| Pós-M5 | **UI polish (impeccable) + app shell** — passe de craft em todas as telas | (transversal) | ✅ mergeado | #33 |
| Pós-M5 | **Ciclo de vida do projeto pela UI** — cadastro + extração + vínculo de cliente | Novo projeto (`/projects/new`) + ações no detalhe | 🟡 em PR | #34 |

O passe de polish (PR #33) é **transversal** — não acrescenta tela nova; refina as 6
existentes e adiciona a casca de navegação (ver §6). Sem mudança de comportamento,
escopo ou role-aware.

O ciclo de vida (PR #34) adiciona a 7ª tela (cadastro) e operacionaliza RF03/RF05
na UI — ver §6.

---

## 4. Inventário de telas (espinha)

| Tela | Rota | RFs | Milestone | Status | Evidência (Vitest + e2e) |
|---|---|---|---|---|---|
| **Login** | `/login` | RF01 (autenticar), RF02 (perfis/acesso semi-aberto) | M1 | ✅ | unit de auth/login + `e2e/login.spec.ts` |
| **Lista / Observatório** | `/projects` | RF07 (portfólio perfil-aware) | M2 | ✅ | unit da lista + `e2e/projects-list.spec.ts` |
| **Detalhe do projeto** | `/projects/:id` | RF08 (detalhe), RF09 (cobertura); consome RF04 (CBAC) | M2 | ✅ | `ProjectDetailPage.test.tsx` + `e2e/project-detail.spec.ts` |
| **Temática (IA)** | seção no detalhe (só-staff) | RF13 (categorizar por temática/segmento) | M3 | ✅ | `theme-*.test.tsx` + `e2e/themes.spec.ts` |
| **Config CBAC** | `/projects/:id/visibility` | RF04 (configurar visibilidade via CBAC) | M4 | ✅ | `visibility-*.test.tsx` + `ProjectVisibilityPage.test.tsx` + `e2e/visibility.spec.ts` |
| **Cockpit do portfólio** | `/portfolio/cockpit` | RF14 (cockpit cross-cliente) | M5 | ✅ | `cockpit-kpis.test.tsx` + `theme-breakdown-table.test.tsx` + `PortfolioCockpitPage.test.tsx` + `e2e/cockpit.spec.ts` |
| **Novo projeto (cadastro)** | `/projects/new` | RF03 (registrar projeto), RF05 (extração via IA) | Pós-M5 | 🟡 em PR #34 | `ProjectCreatePage.test.tsx` + `link-client-dialog.test.tsx` + `e2e/project-lifecycle.spec.ts` |

Legenda: ✅ pronto (todos os critérios da §2) · 🟡 em PR · 🔜 falta (não atende a §2 ainda).

Snapshot de verificação (após ciclo de vida, PR #34): **Vitest 182/182** (49 arquivos) ·
**Playwright 25/25** (as 23 + `project-lifecycle`) · **backend 278** (auth `GET /auth/users`) · build + lint limpos.

**Roadmap de telas COMPLETO (M0–M5)** + polish (PR #33) + ciclo de vida (PR #34): o
consultor opera o observatório **fim-a-fim pela UI** (cadastro → extração → vínculo de
cliente → CBAC), sem CLI.

---

## 5. O que falta

**Nada pendente no frontend.** O roadmap M0–M5 está completo (6 telas ✅) e o backlog de
features de tela foi entregue: **RF10** (comentários), **RF12** (drafts/IA) e **RF11**
(feed) — cada um com seu ciclo spec → plano → implementação + e2e. Detalhes e decisões
(RF15–RF16 gabarito, RF17–RF18 Likert fora do app, RF19 export cortado) em §6.

---

## 6. Dívidas & notas

- **Numeração de RFs desatualizada em `telas_observatorio.md`.** Aquele doc usa um
  esquema antigo, anterior à renumeração do `requisitos.md` (canônico, RF01–RF18).
  Mapeamento explícito do que o `telas_observatorio.md` cita → canônico:

  | Tela (`telas_observatorio.md`) | RF citado lá | RF canônico (`requisitos.md`) |
  |---|---|---|
  | Tela de Acesso | RF01, RF02 | RF01, RF02 (iguais) |
  | Observatório de Projetos | RF07, RF09, **RF20** | RF07, RF09, **RF14** (cockpit) |
  | Domínios | **RF19**, **RF20** | **RF13** (temática), **RF14** (comparação) |
  | Design System | RNF02 | RNF02 (igual) |

  Ou seja: o "RF19" de lá = **RF13** (categorizar por temática) e o "RF20" de lá =
  **RF14** (cockpit/comparação cross-projeto). Corrigir o
  `telas_observatorio.md` em si fica fora do escopo deste roadmap (dívida registrada;
  este roadmap usa sempre a numeração canônica).
- **e2e de temática exige `LLM_PROVIDER=mock` no backend.** Com o provedor padrão de
  LLM (ex.: `ollama/...`), o endpoint `themes/suggest` falha com `APIConnectionError`
  (500) por não alcançar um LLM externo. O classificador `mock` é determinístico por
  keyword e é o mesmo que a suíte de testes do backend fixa. O `seed-demo` já usa o
  mock diretamente no código, por isso seeda uma sugestão mesmo com outro provedor
  configurado.
- **RF10 (comentar) — ✅ ENTREGUE (PR #29).** Os comentários no detalhe deixaram de
  ser só-leitura: postar (qualquer um que vê o projeto, incl. cliente — **primeira
  interação de escrita do cliente**), editar (autor), excluir (autor ou moderação:
  admin/consultor dono). Threading (respostas 1-nível) fica para uma iteração futura.
- **RF12 (drafts / IA) — ✅ ENTREGUE (PR #30).** Seção "Próximos Passos & Pontos de
  Atenção" no detalhe: staff gera com IA (lote via LLM), edita, publica e descarta;
  cliente vê só os publicados (read-only). Fecha o tripé da IA (extração → temática →
  drafts). Fora de escopo: reordenar, regenerar item, histórico, despublicar.
- **RF17–RF18 (Likert da consultoria + dos clientes) — NÃO será frontend.** Decidido em
  2026-06-02: é o **instrumento de avaliação DSR** do artefato (N pequeno, one-shot,
  alimenta o relato), não uma funcionalidade de produto. A **coleta fica externa**
  (ex.: Google Form) e a **metodologia** (dimensões, momento de coleta, reporte) é
  decisão acadêmica a definir à parte. O backend `likert` permanece como está (pode
  exportar o agregado pro relato via CLI/script). Sem UI no frontend.
- **RF11 (feed in-app) — ✅ ENTREGUE (PR #32).** Tela `/feed` ("Novidades") read-only,
  perfil-aware: lista comentários + extrações recentes dos projetos visíveis ao usuário;
  link "Novidades" nas duas landings; cada evento leva ao projeto. O backend escopa por
  visibilidade (cliente vê do vinculado; staff dos seus/todos).
- **Backlog de telas de frontend: encerrado.** Não há mais RF de tela pendente. RF15–RF16
  (gabarito / comparação) já aparecem no `EvaluationPanel` do detalhe quando presentes;
  importação de gabarito é escopo de backend/CLI. RF17–RF18 (Likert) é avaliação DSR fora
  do app (acima). RF19 (export) foi cortado do escopo.
- **UI polish (impeccable) + app shell — ✅ MERGEADO (PR #33).** Passe de craft
  *transversal* (tom restrained, sem mudar comportamento/escopo/role-aware) nas 6 telas:
  - **App shell** (`components/app-shell.tsx`): header com logo (→`/`), **nav perfil-aware**
    (Projetos · Cockpit[só staff] · Novidades), toggle de tema e menu do usuário (Sair).
    Aplicado como *layout route* via `<Outlet>` sobre as rotas autenticadas; `/login` e 404
    ficam fora. Removeu os back-links ad-hoc e os wrappers `max-w-*` das páginas — o shell
    dá container e navegação unificados. **O link "Novidades" migrou das landings para a
    nav do shell** (supersede a nota de RF11 sobre "link nas duas landings").
  - **Sinais legíveis**: `DomainBadge` com ponto colorido por domínio (lista/detalhe/cockpit);
    `CockpitKpis` virou painel único dividido (não grid de cards) com status em pontos
    coloridos (registrado/extraído/revisado); `ThemeBreakdownTable` trocou "R/E/Rev" (0/0/1)
    pelos mesmos pontos.
  - **Consistência**: novo `EmptyState` (ícone + msg) em lista/cockpit/feed/atributos; login
    em card; `FeedEventItem` com ícone tintado por tipo; breadcrumb no detalhe/visibilidade.
  - **Role-aware preservado**: cliente não vê Cockpit na nav nem seções staff; guards intactos.
    Verde: Vitest 168/168 · e2e 23/23 · tour headless 2 perfis (11/11 checks role-aware).
- **Ciclo de vida do projeto pela UI (RF03/RF05) — 🟡 EM PR (#34).** Fecha o gap "só dava
  pra criar projeto via CLI". O consultor agora opera o observatório **fim-a-fim pela
  interface**:
  - **Cadastro** (`/projects/new`, staff-only): form nome/domínio/descrição (≥200 chars —
    a descrição é a fonte da extração; mantém a decisão "sem upload"). Botão "Novo projeto"
    na lista (staff). Ao criar, redireciona ao detalhe.
  - **Extração** no detalhe: sem extração LLM, o empty state de atributos ganha ação staff
    "Executar extração" (RF05) → os 44 atributos do MPO renderizam.
  - **Vínculo de cliente**: `LinkClientDialog` (ao lado de "Configurar visibilidade")
    vincula um cliente; depois o consultor libera categorias no CBAC (tela existente).
  - **Backend**: única adição foi `GET /auth/users?role=` (staff-only) para o seletor de
    clientes; o restante (`POST /projects`, `POST /projects/{id}/extractions`,
    `POST /projects/{id}/clients`) já existia.
  - Verde: Vitest 182/182 · e2e 25/25 (`project-lifecycle`) · backend 278 · role-aware
    (cliente não vê "Novo projeto" nem as ações de ciclo).
- **Backlog de "profundidade de observatório" (não iniciado).** O cruzamento das telas
  com o MPO mostrou que os 5 diferenciais de observatório já estão visíveis, mas há
  aprofundamentos de valor ainda fora de escopo: **heatmap de cobertura** projetos×dimensões
  (RF09 cross-portfólio, hoje só um % por projeto); **síntese cross-projeto / Conectora**
  (lições aprendidas por temática — cortada do MVP por risco/tempo); **trilha temporal /
  tendências** no feed. Candidatos a próximos ciclos.

---

## 7. Como rodar as evidências

Pré-requisito dos e2e: backend de pé e seedado, com o classificador **mock**.

```bash
# Backend (com LLM_PROVIDER=mock no backend/.env), em outra aba:
cd backend && make up && make seed-demo
#   consultor@obione.dev / cliente1..3@obione.dev — senha demo12345678
#   4 projetos; cliente1 com CBAC só em "conteudo_geral"; projeto 2 com tema aceito

# Frontend — testes unitários/integração (Vitest):
cd frontend && npm test

# Frontend — e2e (Playwright; sobe o Vite automaticamente e reusa se já estiver no ar):
cd frontend && npm run test:e2e
```
