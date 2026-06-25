package br.com.obione.observatory;

import br.com.obione.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The central thesis loop: a consistent MPO lens, an AI that suggests
 * observations mapped to that lens with a source excerpt (RNF05), a
 * human-in-the-loop acceptance that creates a traceable observation, and a
 * coverage instrument ("Avaliar") that rises as the lens gets filled.
 */
@SuppressWarnings("rawtypes")
class ObservatoryLoopIntegrationTest extends ApiTestSupport {

    @Test
    void mpoLensExposesFortyFourAttributes() {
        Session staff = login(CONSULTANT_EMAIL, CONSULTANT_PASSWORD);
        ResponseEntity<List<Map<String, Object>>> res = getList("/mpo/attributes", staff.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(44);
    }

    @Test
    void coverageInstrumentCountsTheInScopeLens() {
        Session staff = login(CONSULTANT_EMAIL, CONSULTANT_PASSWORD);
        Long projectId = anyProjectId(staff.token());

        ResponseEntity<Map> res = get("/projects/" + projectId + "/coverage", staff.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = res.getBody();
        assertThat(body).isNotNull();
        // The lens counts 43 in-scope attributes (44 minus the one fora_de_escopo).
        assertThat(((Number) body.get("totalInScope")).intValue()).isEqualTo(43);
        int percentage = ((Number) body.get("percentage")).intValue();
        assertThat(percentage).isBetween(0, 100);
        assertThat((List<?>) body.get("categories")).isNotEmpty();
    }

    @Test
    void observadoraSuggestsObservationsMappedToTheLensWithSource() {
        Session staff = login(CONSULTANT_EMAIL, CONSULTANT_PASSWORD);
        Long projectId = anyProjectId(staff.token());

        ResponseEntity<Map> res = post(
                "/projects/" + projectId + "/ai/suggest-observations", null, staff.token());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = res.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("provider")).isEqualTo("mock");
        assertThat(body.get("suggestionId")).isNotNull();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> suggestions = (List<Map<String, Object>>) body.get("suggestions");
        assertThat(suggestions).isNotEmpty();
        Map<String, Object> first = suggestions.get(0);
        assertThat((String) first.get("attributeId")).isNotBlank();
        assertThat((String) first.get("sourceExcerpt")).isNotBlank();
    }

    @Test
    void acceptingAiSuggestionCreatesTracedObservationAndRaisesCoverage() {
        Session staff = login(CONSULTANT_EMAIL, CONSULTANT_PASSWORD);
        // A project with no observations yet, so the coverage gain is unambiguous.
        Long projectId = projectWithoutCoverage(staff.token());

        int coveredBefore = coveredCount(projectId, staff.token());
        assertThat(coveredBefore).isZero();

        ResponseEntity<Map> suggestRes = post(
                "/projects/" + projectId + "/ai/suggest-observations", null, staff.token());
        Map<String, Object> suggestBody = suggestRes.getBody();
        Long suggestionId = ((Number) suggestBody.get("suggestionId")).longValue();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> suggestions = (List<Map<String, Object>>) suggestBody.get("suggestions");
        Map<String, Object> chosen = suggestions.get(0);

        Map<String, Object> obs = new HashMap<>();
        obs.put("title", chosen.get("title"));
        obs.put("description", chosen.get("description"));
        obs.put("attributeId", chosen.get("attributeId"));
        obs.put("impact", "MEDIUM");
        obs.put("status", "REGISTERED");
        obs.put("origin", "AI_SUGGESTED");
        obs.put("sourceExcerpt", chosen.get("sourceExcerpt"));
        obs.put("suggestionId", suggestionId);
        obs.put("createdById", staff.userId());

        ResponseEntity<Map> created = post(
                "/projects/" + projectId + "/observations", obs, staff.token());

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody().get("origin")).isEqualTo("AI_SUGGESTED");

        int coveredAfter = coveredCount(projectId, staff.token());
        assertThat(coveredAfter).isGreaterThan(coveredBefore);
    }

    // --- helpers ---

    private Long anyProjectId(String token) {
        ResponseEntity<List<Map<String, Object>>> res = getList("/projects", token);
        assertThat(res.getBody()).isNotEmpty();
        return ((Number) res.getBody().get(0).get("id")).longValue();
    }

    private Long projectWithoutCoverage(String token) {
        ResponseEntity<List<Map<String, Object>>> res = getList("/projects", token);
        for (Map<String, Object> project : res.getBody()) {
            Long id = ((Number) project.get("id")).longValue();
            if (coveredCount(id, token) == 0) {
                return id;
            }
        }
        throw new IllegalStateException("Nenhum projeto sem cobertura disponível para o teste");
    }

    private int coveredCount(Long projectId, String token) {
        ResponseEntity<Map> res = get("/projects/" + projectId + "/coverage", token);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        return ((Number) res.getBody().get("covered")).intValue();
    }
}
