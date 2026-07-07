package br.com.obione.isolation;

import br.com.obione.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests that lock client data isolation (B6 — "acesso semi-aberto").
 *
 * <p>Invariant: a CLIENT sees and accesses <em>only</em> projects where
 * {@code client_id == their userId}; staff (CONSULTANT/ADMIN) see everything.
 * The same filter propagates to sub-resources: observations, coverage, feed
 * events, discussions, and knowledge are all scoped to the client's projects.
 *
 * <p><strong>Seeded reality</strong> (confirmed from
 * {@link br.com.obione.projects.seed.ProjectDataSeeder} and
 * {@link br.com.obione.users.seed.UserDataSeeder}):
 * <ul>
 *   <li>"Reposicionamento Athos Capital" — client = {@code cliente@obione.dev}
 *       (the seeded CLIENT user in {@link ApiTestSupport#CLIENT_EMAIL})</li>
 *   <li>"Identidade Visual Norvik"       — client = {@code norvik@cliente.dev}</li>
 *   <li>"Panorama Setor SaaS LATAM"      — client = {@code latam@cliente.dev}</li>
 *   <li>"Campanha Lançamento Orion"      — client = {@code null} (no client)</li>
 * </ul>
 *
 * <p>Project IDs are resolved dynamically via the consultant's unfiltered list so
 * the tests remain robust regardless of H2 auto-increment behaviour.
 *
 * <p><strong>Assertion style</strong>:
 * <ul>
 *   <li>200 list responses  → {@link #getList} (body is a JSON array)</li>
 *   <li>200 object responses and ALL error responses → {@link #get}
 *       (error body is always {@code {"message":"..."}} — a JSON object —
 *       which Jackson happily maps to {@code Map})</li>
 * </ul>
 */
@SuppressWarnings({"rawtypes", "unchecked"})
class ClientIsolationTest extends ApiTestSupport {

    private Session client;
    private Session consultant;

    /** The client's own project — "Reposicionamento Athos Capital". */
    private Long athosId;
    /** Another client's project — "Identidade Visual Norvik". */
    private Long norvikId;
    /** Another client's project — "Panorama Setor SaaS LATAM". */
    private Long latamId;
    /** Project with no client assigned — "Campanha Lançamento Orion". */
    private Long orionId;

    @BeforeEach
    void resolveIds() {
        client     = login(CLIENT_EMAIL, CLIENT_PASSWORD);
        consultant = login(CONSULTANT_EMAIL, CONSULTANT_PASSWORD);

        // Staff sees all 4 projects; use their list to resolve IDs by name so
        // we are not sensitive to H2 identity sequences.
        List<Map<String, Object>> all = getList("/projects", consultant.token()).getBody();
        assertThat(all).as("sanity: staff sees all 4 seeded projects").hasSize(4);

        athosId  = idByName(all, "Reposicionamento Athos Capital");
        norvikId = idByName(all, "Identidade Visual Norvik");
        latamId  = idByName(all, "Panorama Setor SaaS LATAM");
        orionId  = idByName(all, "Campanha Lançamento Orion");
    }

    // ── /projects — list ─────────────────────────────────────────────────────

    /**
     * Client list returns exactly the one project they own (Athos Capital).
     * The other three — Norvik, LATAM, and Orion (no client) — must be absent.
     */
    @Test
    void clientListProjectsReturnsExactlyOneOwnedProject() {
        ResponseEntity<List<Map<String, Object>>> res = getList("/projects", client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> projects = res.getBody();
        assertThat(projects).hasSize(1);
        assertThat(((Number) projects.get(0).get("id")).longValue()).isEqualTo(athosId);
    }

    @Test
    void clientListProjectsDoesNotLeakOtherClientsOrOrphanProjects() {
        List<Long> ids = getList("/projects", client.token()).getBody().stream()
                .map(p -> ((Number) p.get("id")).longValue())
                .toList();

        assertThat(ids).doesNotContain(norvikId, latamId, orionId);
    }

    /** Consultant (staff) receives all 4 projects — no filter applied. */
    @Test
    void consultantListProjectsReturnsAllFour() {
        ResponseEntity<List<Map<String, Object>>> res = getList("/projects", consultant.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(4);
    }

    // ── /projects/{id} — single project ──────────────────────────────────────

    @Test
    void clientGetTheirOwnProjectByIdSucceeds() {
        ResponseEntity<Map> res = get("/projects/" + athosId, client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Number) res.getBody().get("id")).longValue()).isEqualTo(athosId);
    }

    /**
     * Projects owned by another client must be invisible to this client.
     * The response is indistinguishable from a not-found — the isolation
     * boundary deliberately does not leak information about other projects'
     * existence (see {@link br.com.obione.projects.service.ProjectAccessGuard}).
     */
    @Test
    void clientGetAnotherClientsProjectByIdIsNotFound() {
        assertThat(get("/projects/" + norvikId, client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(get("/projects/" + latamId, client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    /** A project with no client set is not visible to any client user. */
    @Test
    void clientGetProjectWithNoClientIsNotFound() {
        assertThat(get("/projects/" + orionId, client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── /projects/{id}/observations ───────────────────────────────────────────

    @Test
    void clientListObservationsOnTheirProjectSucceeds() {
        ResponseEntity<List<Map<String, Object>>> res =
                getList("/projects/" + athosId + "/observations", client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        // The seeder adds exactly 2 observations to "Reposicionamento Athos Capital".
        assertThat(res.getBody()).hasSize(2);
    }

    @Test
    void clientListObservationsOnAnotherClientsProjectIsNotFound() {
        // Use get() for 404 checks — error body is {"message":"..."} (a Map),
        // not a JSON array, so getList() would fail to deserialize it.
        assertThat(get("/projects/" + norvikId + "/observations", client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(get("/projects/" + latamId + "/observations", client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── /projects/{id}/coverage ───────────────────────────────────────────────

    @Test
    void clientGetCoverageOnTheirProjectSucceeds() {
        ResponseEntity<Map> res = get("/projects/" + athosId + "/coverage", client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Spot-check the response shape; correctness of values tested in
        // ObservatoryLoopIntegrationTest.
        assertThat(res.getBody()).containsKey("totalInScope");
        assertThat(res.getBody()).containsKey("covered");
        assertThat(res.getBody()).containsKey("percentage");
    }

    @Test
    void clientGetCoverageOnAnotherClientsProjectIsNotFound() {
        assertThat(get("/projects/" + norvikId + "/coverage", client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(get("/projects/" + latamId + "/coverage", client.token()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── /feed ─────────────────────────────────────────────────────────────────

    /**
     * Every event in the client's feed must belong to their own project.
     * Events with a null {@code projectId} (domain-level items) are excluded
     * by the client isolation filter in {@link br.com.obione.feed.service.FeedService}.
     *
     * <p>Seeded feed events visible to the Athos client:
     * 2 observations + 1 discussion + 1 knowledge = 4 events, all on Athos.
     */
    @Test
    void clientFeedContainsOnlyEventsFromTheirOwnProject() {
        ResponseEntity<List<Map<String, Object>>> res = getList("/feed", client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> events = res.getBody();
        assertThat(events).isNotEmpty();

        for (Map<String, Object> event : events) {
            Object projectIdRaw = event.get("projectId");
            assertThat(projectIdRaw)
                    .as("Feed event '%s' must carry a projectId (null-project items are excluded for clients)",
                            event.get("title"))
                    .isNotNull();
            assertThat(((Number) projectIdRaw).longValue())
                    .as("Feed event '%s' must be from the client's own project (athosId=%d)",
                            event.get("title"), athosId)
                    .isEqualTo(athosId);
        }
    }

    @Test
    void clientFeedDoesNotContainEventsFromOtherProjects() {
        List<Long> projectIds = getList("/feed", client.token()).getBody().stream()
                .filter(e -> e.get("projectId") != null)
                .map(e -> ((Number) e.get("projectId")).longValue())
                .toList();

        assertThat(projectIds).doesNotContain(norvikId, latamId, orionId);
    }

    // ── /discussions ──────────────────────────────────────────────────────────

    /**
     * All 4 seeded discussions are tied to a project (non-null). The client
     * sees only the one linked to their project (d2 —
     * "Baixa participação do cliente e atrasos estratégicos").
     */
    @Test
    void clientListDiscussionsReturnsOnlyTheirProjectDiscussion() {
        ResponseEntity<List<Map<String, Object>>> res = getList("/discussions", client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> discussions = res.getBody();
        assertThat(discussions).hasSize(1);
        assertThat(((Number) discussions.get(0).get("projectId")).longValue())
                .isEqualTo(athosId);
    }

    @Test
    void clientListDiscussionsExcludesOtherClientsDiscussions() {
        List<Long> projectIds = getList("/discussions", client.token()).getBody().stream()
                .filter(d -> d.get("projectId") != null)
                .map(d -> ((Number) d.get("projectId")).longValue())
                .toList();

        assertThat(projectIds).doesNotContain(norvikId, latamId, orionId);
    }

    // ── /knowledge ────────────────────────────────────────────────────────────

    /**
     * The client sees their own project's knowledge plus domain-level
     * (project==null) consolidated learnings of their domain (reusable wisdom),
     * but never another client's project-linked knowledge.
     */
    @Test
    void clientListKnowledgeReturnsOwnProjectAndDomainLevel() {
        ResponseEntity<List<Map<String, Object>>> res = getList("/knowledge", client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Long> projectIds = res.getBody().stream()
                .map(k -> k.get("projectId"))
                .filter(java.util.Objects::nonNull)
                .map(p -> ((Number) p).longValue())
                .toList();
        // Own project's knowledge is present; no other client's leaks (domain-level
        // items carry a null projectId and are filtered out above).
        assertThat(projectIds).containsOnly(athosId);
    }

    @Test
    void clientListKnowledgeExcludesOtherClientsKnowledge() {
        List<Long> projectIds = getList("/knowledge", client.token()).getBody().stream()
                .filter(k -> k.get("projectId") != null)
                .map(k -> ((Number) k.get("projectId")).longValue())
                .toList();

        assertThat(projectIds).doesNotContain(norvikId, latamId, orionId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Long idByName(List<Map<String, Object>> projects, String name) {
        return projects.stream()
                .filter(p -> name.equals(p.get("name")))
                .map(p -> ((Number) p.get("id")).longValue())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Projeto não encontrado pelo nome no setup dos testes: " + name));
    }
}
