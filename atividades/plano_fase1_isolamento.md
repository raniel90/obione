# Plano — Fase 1: Isolamento do cliente (jornada demoável)

> Executar com subagent-driven-development ou manualmente, tarefa a tarefa. Base: `feat/jornada-demoavel`. Spec: `atividades/spec_plano_jornada_demoavel.md`.

**Meta:** um usuário CLIENT vê e acessa **apenas o(s) seu(s) projeto(s)** (e a comunidade do seu domínio); staff (CONSULTANT/ADMIN) mantém tudo, incluindo cadastro. Sem migração — o vínculo `Project.client_id` já existe.

**Stack:** Java 21 / Spring Boot (`./mvnw`), JPA/H2; React 19 / TanStack (bun). Verificação por testes de integração (backend) + `tsc`/navegação (frontend).

**Fato confirmado (baseline):** hoje `GET /projects` devolve os 4 projetos para o cliente id 3, e `GET /projects/{1..4}` retorna 200 em todos. Alvo: cliente id 3 recebe só o projeto 1; `GET /projects/{2,3,4}` → 404.

---

## Backend

### B1 — Helper `CurrentUser`

**Files:** Create `backend/src/main/java/br/com/obione/common/security/CurrentUser.java`

- [ ] Criar o component. O `MockTokenAuthFilter` põe principal = `Long` (userId) e authority `ROLE_<profileCode>`.

```java
package br.com.obione.common.security;

import br.com.obione.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    public Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("Usuário não autenticado.");
        }
        return userId;
    }

    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String target = "ROLE_" + role;
        for (GrantedAuthority a : auth.getAuthorities()) {
            if (target.equals(a.getAuthority())) return true;
        }
        return false;
    }

    public boolean isClient() { return hasRole("CLIENT"); }

    public boolean isStaff() { return hasRole("CONSULTANT") || hasRole("ADMIN"); }
}
```

- [ ] **Verificar compilação:** `cd backend && ./mvnw -q -DskipTests compile` → sem erros. (Confirmar que `UnauthorizedException` existe em `common/exception`; se o nome diferir, usar o existente.)
- [ ] **Commit:** `git add backend/src/main/java/br/com/obione/common/security/CurrentUser.java && git commit -m "feat(backend): helper CurrentUser (id/role do SecurityContext)"`

### B2 — Finders por cliente no `ProjectRepository`

**Files:** Modify `backend/src/main/java/br/com/obione/projects/repository/ProjectRepository.java`

- [ ] Adicionar (respeitar o nome da relação: `client` → `client_id`; domínio já usa `findByDomain_Id`):

```java
java.util.List<br.com.obione.projects.entity.Project> findByClient_Id(Long clientId);
java.util.Optional<br.com.obione.projects.entity.Project> findByIdAndClient_Id(Long id, Long clientId);
java.util.List<br.com.obione.projects.entity.Project> findByDomain_IdAndClient_Id(Long domainId, Long clientId);
```
(Se o arquivo já importa `List`/`Optional` e `Project`, usar os nomes simples.)

- [ ] `./mvnw -q -DskipTests compile` → sem erros.
- [ ] **Commit:** `git add ... && git commit -m "feat(backend): finders por cliente no ProjectRepository"`

### B3 — Escopar `ProjectService` por papel

**Files:** Modify `backend/src/main/java/br/com/obione/projects/service/ProjectService.java`

- [ ] Injetar `CurrentUser currentUser` (via construtor/`@RequiredArgsConstructor`). Reescrever os três reads:

```java
@Transactional(readOnly = true)
public List<ProjectResponseDTO> findAll() {
    List<Project> projects = currentUser.isClient()
            ? projectRepository.findByClient_Id(currentUser.id())
            : projectRepository.findAll();
    return projects.stream().map(ProjectMapper::toResponseDTO).toList();
}

@Transactional(readOnly = true)
public ProjectResponseDTO findById(Long id) {
    Project project = currentUser.isClient()
            ? projectRepository.findByIdAndClient_Id(id, currentUser.id())
                    .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + id))
            : projectRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + id));
    return ProjectMapper.toResponseDTO(project);
}

@Transactional(readOnly = true)
public List<ProjectResponseDTO> findByDomainId(Long domainId) {
    List<Project> projects = currentUser.isClient()
            ? projectRepository.findByDomain_IdAndClient_Id(domainId, currentUser.id())
            : projectRepository.findByDomain_Id(domainId);
    return projects.stream().map(ProjectMapper::toResponseDTO).toList();
}
```
(Ajustar assinaturas de mapper/repo aos nomes reais do arquivo. Projetos com `client == null` nunca casam com um cliente — ficam invisíveis, correto.)

- [ ] **Teste manual (API):** subir a app; login cliente; `GET /projects` deve devolver 1; `GET /projects/2` → 404; login consultor; `GET /projects` devolve 4.
- [ ] **Commit:** `feat(backend): ProjectService escopa leituras por cliente`

### B4 — Guard reutilizável `ProjectAccessGuard`

**Files:** Create `backend/src/main/java/br/com/obione/projects/service/ProjectAccessGuard.java`

- [ ] Guard que serviços por-projeto chamam antes de devolver dados:

```java
package br.com.obione.projects.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.projects.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProjectAccessGuard {
    private final CurrentUser currentUser;
    private final ProjectRepository projectRepository;

    /** Staff: sempre. Cliente: só o próprio projeto (senão 404). */
    public void assertCanRead(Long projectId) {
        if (!currentUser.isClient()) return;
        boolean owns = projectRepository.findByIdAndClient_Id(projectId, currentUser.id()).isPresent();
        if (!owns) throw new ResourceNotFoundException("Projeto não encontrado: " + projectId);
    }
}
```

- [ ] `./mvnw -q -DskipTests compile`.
- [ ] **Commit:** `feat(backend): ProjectAccessGuard (leitura por-projeto por cliente)`

### B5 — Aplicar o guard nos reads por-projeto

**Files:** Modify os services por trás de: `observations` (`GET /projects/{pid}/observations`, `GET /observations/{id}`), `discussions` (`GET /projects/{pid}/discussions`, e `GET /discussions/{id}` quando houver `projectId`), `phenomena` (`GET /projects/{pid}/phenomena`), `projects/service/ProjectCoverageService` (`GET /projects/{id}/coverage`).

- [ ] Ler cada service/controller, injetar `ProjectAccessGuard` e chamar `guard.assertCanRead(projectId)` no início do método de leitura por-projeto. Para `GET /observations/{id}` e `GET /discussions/{id}`, resolver o `projectId` da entidade e então `assertCanRead`.
- [ ] Endpoints "list-all" sem projeto (`GET /discussions`, `GET /knowledge`, `GET /phenomena`): para cliente, filtrar aos seus projetos/domínio (ver B7) ou, se for simples, restringir a staff. Escolher por endpoint, documentando no commit.
- [ ] **Teste manual:** login cliente; `GET /projects/2/observations` → 404; `GET /projects/1/observations` → 200; `GET /projects/1/coverage` → 200; `GET /projects/2/coverage` → 404.
- [ ] **Commit:** `feat(backend): guard de acesso por-projeto em observações/discussões/fenômenos/cobertura`

### B6 — Feed escopado ao cliente

**Files:** Modify o service do feed (por trás de `getFeed`).

- [ ] Se `currentUser.isClient()`, restringir os eventos ao(s) projeto(s) do cliente (`findByClient_Id`). Staff: inalterado.
- [ ] **Teste manual:** feed do cliente só traz eventos do projeto 1.
- [ ] **Commit:** `feat(backend): feed escopado ao projeto do cliente`

### B7 — Comunidade escopada ao domínio do cliente

**Files:** Modify `community/controller/CommunityController` + service (overview e por-domínio) e as listas de discussão/knowledge por domínio.

- [ ] Para cliente: o overview de comunidade e as listas por domínio limitam-se ao(s) domínio(s) do(s) projeto(s) do cliente. Staff: inalterado.
- [ ] **Teste manual:** cliente id 3 (domínio Marketing Estratégico) vê a comunidade daquele domínio; não vê Branding/LATAM.
- [ ] **Commit:** `feat(backend): comunidade escopada ao domínio do cliente`

### B8 — Testes de integração

**Files:** Create `backend/src/test/java/.../ClientIsolationTest.java` (seguir o padrão dos testes existentes; autenticar via mock-token/login).

- [ ] Casos: (a) cliente `GET /projects` → só o seu; (b) `GET /projects/{outro}` → 404; (c) consultor → 4; (d) cliente `GET /projects/{seu}/observations` 200, `.../{outro}/observations` 404; (e) feed do cliente só do seu projeto.
- [ ] `./mvnw test` → verde (suíte existente não quebra).
- [ ] **Commit:** `test(backend): isolamento do cliente`

---

## Frontend

### F1 — Expor o papel do usuário

**Files:** Modify `frontend/src/components/app-shell.tsx` (promover `useAuthSession` a exportado, ou criar `useCurrentUser`).

- [ ] Exportar um hook `useCurrentUser()` que devolve `{ user, isClient, isStaff }` a partir de `user.profileCode` ("CLIENT" vs "CONSULTANT"/"ADMIN"). Reusar o carregamento já existente.
- [ ] `bunx tsc --noEmit` → 0 erros.
- [ ] **Commit:** `feat(frontend): expõe papel do usuário (useCurrentUser)`

### F2 — Home adaptado ao cliente

**Files:** Modify `frontend/src/routes/index.tsx`

- [ ] Se `isClient`: título "Meu projeto"; Panorama mostra o projeto do cliente + a comunidade do seu domínio (sem card de portfólio nem botão "Novo projeto"); "Atividade recente" já vem escopada (backend). Staff: inalterado.
- [ ] `bunx tsc --noEmit` → 0.
- [ ] **Commit:** `feat(frontend): home do cliente escopado ao seu projeto`

### F3 — Lista de projetos + esconder ações de staff

**Files:** Modify `frontend/src/routes/projects.index.tsx`

- [ ] Para cliente: esconder "Novo projeto" e rótulos de portfólio (as listas já estreitam pelo backend). Staff: inalterado.
- [ ] `bunx tsc --noEmit` → 0.
- [ ] **Commit:** `feat(frontend): lista sem ações de staff para o cliente`

### F4 — Detalhe do projeto: cliente participa, sem ações de staff

**Files:** Modify `frontend/src/routes/projects.$id.tsx`

- [ ] Cliente: pode ler e **comentar** (participar da conversa); ocultar "Registrar observação", "Iniciar conversa", "Consolidar", "Sugerir com IA", "Editar projeto". Estado amigável se o backend 404 um projeto de outro. Staff: inalterado.
- [ ] `bunx tsc --noEmit` → 0.
- [ ] **Commit:** `feat(frontend): detalhe permite ao cliente comentar, sem ações de staff`

### F5 — Guardas de rota

**Files:** Modify as rotas de staff (`/projects/new`, `/projects/:id/edit`, telas de consolidação).

- [ ] Se `isClient`, redirecionar ao seu projeto (ou home). `bunx tsc --noEmit` → 0.
- [ ] **Commit:** `feat(frontend): guardas de rota de staff contra cliente`

---

## Seed e verificação end-to-end

### S1 — Confirmar seed demoável

- [ ] O cliente `cliente@obione.dev` (id 3) já está vinculado ao projeto 1 (Athos Capital), que tem 2 observações + 1 discussão (com contribuição) + 1 aprendizado. Confirmar que basta para o roteiro; se faltar contribuição do cliente na discussão, adicioná-la ao `ProjectDataSeeder`.

### S2 — Verificação end-to-end (Playwright + API)

- [ ] **API:** login cliente → `GET /projects` = 1; `GET /projects/{2,3,4}` = 404; login consultor → `GET /projects` = 4.
- [ ] **UI (cliente):** home mostra só o projeto Athos; sem "Novo projeto"; abre o detalhe, **comenta** na conversa; não vê ações de staff; não consegue navegar a `/projects/2`.
- [ ] **UI (consultor):** jornada completa intacta — cadastra projeto (wizard), registra observação, consolida aprendizado.

### S3 — Abrir PR

- [ ] `bun run lint && bun run format` (frontend) limpos; `./mvnw test` verde.
- [ ] PR `feat/jornada-demoavel` → `dev`.

---

## Critérios de aceite (Fase 1)

- Cliente vê/acessa só o seu projeto (home, lista, detalhe, feed, comunidade do domínio); `GET /projects/{outro}` → 404; cliente comenta, sem ações de staff.
- Consultor/admin mantêm tudo, incluindo cadastro.
- Testes backend verdes; `tsc` 0 erros; seed cobre o roteiro de demo.
