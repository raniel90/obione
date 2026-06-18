package br.com.obione.governance;

import br.com.obione.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Role-based governance — the "acesso semi-aberto" claim (§7.4). Reads require
 * authentication; mutations are staff-only (CONSULTANT/ADMIN); the single
 * exception is that clients may contribute to community discussions.
 */
@SuppressWarnings("rawtypes")
class GovernanceIntegrationTest extends ApiTestSupport {

    @Test
    void anonymousReadIsUnauthorized() {
        // Status-only check: use get() (Map) rather than getList(), since the
        // 401 error body is a JSON object, not the project array.
        ResponseEntity<Map> res = get("/projects", null);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void authenticatedClientCanRead() {
        Session client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
        ResponseEntity<List<Map<String, Object>>> res = getList("/projects", client.token());
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void clientCannotMutate() {
        Session client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
        // The client is authenticated (see clientCanContributeToDiscussion) but
        // lacks CONSULTANT/ADMIN, so a staff-only mutation is forbidden (403,
        // not 401 — the request is authorized-aware, just unauthorized).
        ResponseEntity<Map> res = post("/projects", Map.of(), client.token());
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void staffIsNotBlockedByGovernanceOnMutation() {
        Session consultant = login(CONSULTANT_EMAIL, CONSULTANT_PASSWORD);
        // An empty body fails @Valid (400), which proves the request got *past*
        // governance — staff is allowed through (not 401/403).
        ResponseEntity<Map> res = post("/projects", Map.of(), consultant.token());
        assertThat(res.getStatusCode())
                .isNotEqualTo(HttpStatus.UNAUTHORIZED)
                .isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void clientCanContributeToDiscussion() {
        Session client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
        Long discussionId = firstDiscussionId(client.token());

        ResponseEntity<Map> res = post(
                "/discussions/" + discussionId + "/contributions",
                Map.of("type", "INTERPRETATION",
                        "text", "Contribuição do cliente na conversa.",
                        "userId", client.userId()),
                client.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void anonymousCannotContributeToDiscussion() {
        Session client = login(CLIENT_EMAIL, CLIENT_PASSWORD);
        Long discussionId = firstDiscussionId(client.token());

        ResponseEntity<Map> res = post(
                "/discussions/" + discussionId + "/contributions",
                Map.of("type", "INTERPRETATION", "text", "anônimo"),
                null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private Long firstDiscussionId(String token) {
        ResponseEntity<List<Map<String, Object>>> res = getList("/discussions", token);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> body = res.getBody();
        assertThat(body).isNotEmpty();
        return ((Number) body.get(0).get("id")).longValue();
    }
}
