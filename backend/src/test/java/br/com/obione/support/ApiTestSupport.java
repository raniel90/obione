package br.com.obione.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

/**
 * Base for HTTP-level integration tests. Boots the real application on a random
 * port (full security filter chain + context-path {@code /api}) with the
 * deterministic mock LLM provider (see {@code src/test/resources/application.yml}),
 * so the thesis claims — role governance, signup security, and the
 * observation→coverage loop — are exercised end to end without network or keys.
 *
 * <p>Seed data is provisioned on startup by the {@code *DataSeeder}s, so the
 * demo logins below are available.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class ApiTestSupport {

    protected static final String ADMIN_EMAIL = "admin@obione.dev";
    protected static final String ADMIN_PASSWORD = "admin123";
    protected static final String CONSULTANT_EMAIL = "consultor@obione.dev";
    protected static final String CONSULTANT_PASSWORD = "consultor123";
    protected static final String CLIENT_EMAIL = "cliente@obione.dev";
    protected static final String CLIENT_PASSWORD = "cliente123";

    @Autowired
    protected TestRestTemplate rest;

    /** An authenticated session: the opaque mock token plus the user's id. */
    protected record Session(String token, Long userId) {}

    @SuppressWarnings("unchecked")
    protected Session login(String email, String password) {
        ResponseEntity<Map> res = post("/auth/login",
                Map.of("email", email, "password", password), null);
        Map<String, Object> body = res.getBody();
        if (body == null || body.get("accessToken") == null) {
            throw new IllegalStateException("Login falhou para " + email + ": " + res.getStatusCode());
        }
        Map<String, Object> user = (Map<String, Object>) body.get("user");
        Long userId = ((Number) user.get("id")).longValue();
        return new Session((String) body.get("accessToken"), userId);
    }

    protected HttpHeaders headers(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            h.setBearerAuth(token);
        }
        return h;
    }

    @SuppressWarnings("rawtypes")
    protected ResponseEntity<Map> post(String path, Object body, String token) {
        return rest.exchange(path, HttpMethod.POST, new HttpEntity<>(body, headers(token)), Map.class);
    }

    @SuppressWarnings("rawtypes")
    protected ResponseEntity<Map> get(String path, String token) {
        return rest.exchange(path, HttpMethod.GET, new HttpEntity<>(headers(token)), Map.class);
    }

    protected ResponseEntity<List<Map<String, Object>>> getList(String path, String token) {
        return rest.exchange(path, HttpMethod.GET, new HttpEntity<>(headers(token)),
                new ParameterizedTypeReference<List<Map<String, Object>>>() {});
    }
}
