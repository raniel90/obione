# Spec + Plano — Jornada demoável de ponta a ponta (isolamento do cliente, reaproveitamento, engajamento)

Data: 2026-07-04. Alvo: `backend/` (Java 21/Spring Boot) + `frontend/` (React 19/TanStack). Merge via PR.

## Objetivo

Fazer a **jornada completa do ObiOne** ser **demoável e replicável de ponta a ponta**, adaptada por papel, **sem cortar funcionalidades**. Hoje a app está atrás do conceito em três pontos: (1) o cliente vê o portfólio inteiro (não há isolamento); (2) o reaproveitamento cross-projeto não aflora; (3) nada puxa o cliente para a comunidade. Corrigir os três para que a demonstração alcance o objetivo do artigo (observatório de projetos com participação segura do cliente).

## Fato-chave do código (mapa)

- O vínculo **projeto → cliente já existe**: `projects/entity/Project.java` tem `@ManyToOne User client` (coluna `client_id`), populado no `ProjectDataSeeder` e exposto como `clientId`/`clientName` no `ProjectResponseDTO`. **Isolamento é lacuna de filtragem, não de modelo — sem migração.**
- Papéis: `profiles/enums/ProfileCode` = ADMIN, CONSULTANT, CLIENT. Clientes são `User` com `profile=CLIENT` (seed: `cliente@obione.dev`, `norvik@cliente.dev`, `latam@cliente.dev`).
- O caller é resolvível: `auth/MockTokenAuthFilter` põe no `SecurityContext` principal = `userId` (Long) e authority `ROLE_<profileCode>`. **Nenhum serviço lê isso hoje.**
- `SecurityConfig`: GETs caem em `.anyRequest().authenticated()`; mutações `hasAnyRole("CONSULTANT","ADMIN")`. Sem escopo por cliente.
- Frontend: `getProjects()` (`services/projectService.ts`) chama `/projects` sem filtro; `routes/index.tsx` e `routes/projects.index.tsx` renderizam tudo e **sempre** mostram "Novo projeto". `useAuthSession` (`components/app-shell.tsx`) já carrega `user.profileCode`, mas é hook local, não usado para gating.
- Reaproveitamento: a síntese cross-projeto é `POST /domains/{id}/ai/synthesize` (contexto `ai/`), staff-only; não há surfacing de aprendizados ao abrir/cadastrar projeto.

## Princípio de design

**Adaptar por papel, não remover.** O consultor mantém a jornada inteira (cadastro/wizard, observação, consolidação, síntese). O cliente ganha uma visão **escopada ao seu projeto** e **participativa** (comenta nas conversas), sem ações de staff. Nada é cortado do produto; a UI e as leituras passam a respeitar o papel.

## Jornada-alvo (roteiro de demo replicável)

1. **Consultor** cadastra um projeto (wizard IA-first) e vincula um **cliente**.
2. Consultor **registra observações** ancoradas no MPO.
3. **Comunidade:** consultor e **cliente** conversam sobre a observação.
4. Consultor **consolida um aprendizado** (Sintetizadora).
5. **Reaproveitamento:** ao abrir/cadastrar um projeto do mesmo domínio, **aprendizados relevantes afloram**.
6. **Cliente** faz login e vê **apenas o seu projeto**, com "novidades no seu projeto" em destaque, e participa da conversa.

---

## Capacidade 1 — Isolamento e visão do cliente

### Backend

**T1.1 — Helper de usuário atual.** Criar `common/security/CurrentUser.java` (component) com:
- `Long id()` — lê `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` (é o userId Long).
- `boolean isClient()` / `boolean isStaff()` — via authorities (`ROLE_CLIENT` vs `ROLE_CONSULTANT`/`ROLE_ADMIN`).
- Retorna `Optional`/lança `UnauthorizedException` quando não há auth.

**T1.2 — Repositório.** Em `projects/repository/ProjectRepository.java` adicionar:
- `List<Project> findByClient_Id(Long clientId);`
- `Optional<Project> findByIdAndClient_Id(Long id, Long clientId);`
- `List<Project> findByDomain_IdAndClient_Id(Long domainId, Long clientId);`

**T1.3 — Escopar `ProjectService`.** Em `findAll()`, `findById(id)`, `findByDomainId(domainId)`: se `currentUser.isClient()`, filtrar por `client_id == currentUser.id()` (lista/domínio) e usar `findByIdAndClient_Id` no detalhe (404 `ResourceNotFoundException` se não for do cliente). Staff: comportamento atual (tudo). Projetos com `client == null` **nunca** aparecem para clientes.

**T1.4 — Guard reutilizável de acesso ao projeto.** Criar `projects/service/ProjectAccessGuard.java` com `assertCanRead(Long projectId)`: staff sempre; cliente só se `project.client_id == currentUser.id()` (senão `ResourceNotFoundException`). Injetar e chamar no início dos reads por-projeto de: `observations` (`GET /projects/{pid}/observations`, `GET /observations/{id}`), `discussions` (`GET /projects/{pid}/discussions`, `GET /discussions/{id}` quando ligada a projeto), `phenomena` (`GET /projects/{pid}/phenomena`), `ProjectCoverageService` (`GET /projects/{id}/coverage`). Endpoints "list-all" (`GET /discussions`, `GET /knowledge`, `GET /phenomena`) — para cliente, filtrar aos seus projetos ou negar; decidir por endpoint (ver T1.6).

**T1.5 — Feed escopado.** Em `feed` (o serviço por trás de `getFeed`), se cliente, restringir os eventos ao(s) projeto(s) do cliente.

**T1.6 — Comunidade e conhecimento (decisão de escopo).** `community`/`knowledge` são saída consolidada e (por design) mais aberta. Para a demo, escopar a **home/panorama e o feed** ao cliente é o crítico. Regra adotada: cliente vê **o seu projeto** e a **comunidade do domínio do seu projeto** (conversas/aprendizados daquele domínio), não os demais domínios. Aplicar filtro por domínio do(s) projeto(s) do cliente em `CommunityController`/service e nas listas de discussão/knowledge por domínio.

**T1.7 — Testes backend.** Testes de integração: (a) cliente em `GET /projects` recebe só o seu; (b) cliente em `GET /projects/{outro}` recebe 404; (c) consultor recebe tudo; (d) cliente em `GET /projects/{seu}/observations` OK, `.../{outro}/observations` 404; (e) feed do cliente só do seu projeto. Seguir o padrão de testes existente em `src/test/java`.

### Frontend

**T1.8 — Expor papel.** Promover o papel a um hook/contexto compartilhado (a partir de `useAuthSession` em `components/app-shell.tsx`): exportar `useCurrentUser()` com `{ user, isClient, isStaff }` (via `user.profileCode`).

**T1.9 — Home adaptado ao cliente (`routes/index.tsx`).** Se `isClient`: o cabeçalho e o Panorama passam a "Meu projeto" (o projeto do cliente e sua comunidade), sem o card de portfólio nem o botão "Novo projeto"; a "Atividade recente" já vem escopada (backend). Se staff: inalterado (portfólio completo + Novo projeto).

**T1.10 — Lista de projetos (`routes/projects.index.tsx`).** Para cliente: as listas estreitam sozinhas (backend filtra); esconder "Novo projeto" e rótulos de portfólio. Staff: inalterado.

**T1.11 — Detalhe do projeto (`routes/projects.$id.tsx`).** Cliente: pode ler e **comentar** (participar da conversa); ações de staff (Registrar observação, Iniciar conversa, Consolidar, Sugerir com IA, Editar projeto) ocultas. Estado amigável se o backend 404 um projeto de outro. Staff: inalterado.

**T1.12 — Guardas de navegação.** Rotas de staff (`/projects/new`, `/projects/:id/edit`, telas de consolidação) redirecionam o cliente para o seu projeto.

---

## Capacidade 2 — Reaproveitamento cross-projeto

**T2.1 — Aprendizados relevantes no projeto.** No detalhe do projeto (e/ou no wizard, etapa 2), adicionar um bloco **"Aprendizados do domínio"** que lista os `knowledge` consolidados do mesmo domínio (reuso). Backend: reutilizar `GET /domains/{domainId}/knowledge` (já existe); frontend: novo componente/bloco no `routes/projects.$id.tsx` e/ou no wizard. Fecha "consolidar → reaproveitar".

**T2.2 — (opcional) Síntese sob demanda.** Botão staff "Sintetizar padrões do domínio" que chama `POST /domains/{id}/ai/synthesize` e mostra padrões/lições (a Conectora, hoje sem UI). Mantém-se staff-only.

**T2.3 — Teste/Verificação.** Ao abrir um projeto de um domínio com aprendizados, o bloco aparece com os itens corretos; cliente também vê os aprendizados do seu domínio (leitura consolidada).

---

## Capacidade 3 — Engajamento do cliente

**T3.1 — "Novidades no seu projeto".** No home do cliente, um bloco de destaque com a atividade recente **do seu projeto** (observações, conversas, aprendizados novos), reusando o feed escopado (T1.5). É o que "puxa" o cliente.

**T3.2 — (leve) Indicador de não-lidos.** Opcional: contador simples de itens novos desde o último acesso (via timestamp em localStorage, sem infra de notificação). Se custar muito, cortar.

**T3.3 — Verificação.** Cliente logado vê "novidades no seu projeto" com a atividade correta e chega à conversa em um clique.

---

## Replicabilidade da demo (seed)

**T4.1 — Seed demo garantido.** Assegurar no `ProjectDataSeeder` (ou um seeder dedicado) um cliente (`cliente@obione.dev`) vinculado a um projeto que já tem: ≥2 observações (com atributos MPO), ≥1 discussão com contribuição do cliente, ≥1 aprendizado consolidado — para o roteiro de demo repetir sempre. Documentar o roteiro (passos 1–6) num `README`/nota curta.

**T4.2 — Reset opcional.** Nota de como resetar (apagar `backend/data/` reeseeda), já existente; confirmar que o seed cobre a jornada.

---

## Fora de escopo

- Autenticação real (JWT) — segue mock-token.
- Infra de notificação (push/e-mail) — engajamento é in-app.
- CBAC por atributo da v1 — o isolamento é por projeto, não por atributo.

## Critérios de aceite

- **Cliente** vê apenas o seu projeto em todas as telas (home, lista, detalhe, feed, comunidade do seu domínio); `GET /projects/{outro}` → 404. **Participa** (comenta) sem ações de staff.
- **Consultor/admin** mantêm a jornada completa, incluindo **cadastro** — nada cortado.
- **Reaproveitamento:** bloco "Aprendizados do domínio" aparece no projeto com os itens corretos.
- **Engajamento:** home do cliente destaca "novidades no seu projeto".
- **Demo replicável:** seed cobre observação + conversa (com cliente) + aprendizado; roteiro 1–6 executável fim a fim.
- Backend: novos testes verdes; suíte existente não quebra. Frontend: `tsc` 0 erros; lint/format limpos.

## Sequência sugerida (fases; cada fase deixa a app demoável)

- **Fase 1 — Cap. 1 (isolamento):** T1.1–T1.12 + T4.1. É a peça crítica da demo.
- **Fase 2 — Cap. 2 (reaproveitamento):** T2.1–T2.3.
- **Fase 3 — Cap. 3 (engajamento):** T3.1–T3.3.

## Arquivos-chave

Backend: `common/security/CurrentUser.java` (novo), `projects/service/ProjectAccessGuard.java` (novo), `projects/service/ProjectService.java`, `projects/repository/ProjectRepository.java`, `projects/service/ProjectCoverageService.java`, `observations/service/*`, `discussions/service/*`, `phenomena/service/*`, `community/*`, `feed/*`, `src/test/java/...`.
Frontend: `components/app-shell.tsx` (exportar papel), `routes/index.tsx`, `routes/projects.index.tsx`, `routes/projects.$id.tsx`, novo bloco "Aprendizados do domínio", `services/*` conforme necessário.
Seed: `projects/seed/ProjectDataSeeder.java`.
