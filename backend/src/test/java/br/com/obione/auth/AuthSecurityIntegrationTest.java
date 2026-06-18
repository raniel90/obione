package br.com.obione.auth;

import br.com.obione.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Authentication and public self-registration (signup-with-approval, §6.3).
 * Locks the security guarantees of the {@code POST /auth/register} fix: the
 * server always provisions a PENDING CLIENT, the role can never be chosen by
 * the requester, and a PENDING account cannot log in until activated.
 */
@SuppressWarnings("rawtypes")
class AuthSecurityIntegrationTest extends ApiTestSupport {

    @Test
    void loginWithSeededConsultantReturnsToken() {
        ResponseEntity<Map> res = post("/auth/login",
                Map.of("email", CONSULTANT_EMAIL, "password", CONSULTANT_PASSWORD), null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().get("accessToken")).isNotNull();
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) res.getBody().get("user");
        assertThat(user.get("profileCode")).isEqualTo("CONSULTANT");
    }

    @Test
    void loginWithWrongPasswordIsUnauthorized() {
        ResponseEntity<Map> res = post("/auth/login",
                Map.of("email", CONSULTANT_EMAIL, "password", "senha-errada"), null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void publicSelfRegistrationCreatesPendingClient() {
        ResponseEntity<Map> res = post("/auth/register", Map.of(
                "name", "Novo Cliente",
                "email", "novo.cliente@signup.test",
                "password", "senha1234"), null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().get("profileCode")).isEqualTo("CLIENT");
        assertThat(res.getBody().get("status")).isEqualTo("PENDING");
    }

    @Test
    void registrationIgnoresClientSuppliedRoleAndStatus() {
        // Even when the payload tries to grant ADMIN/ACTIVE, the server forces
        // CLIENT/PENDING — no privilege escalation through self-registration.
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Tentativa Escalonamento");
        payload.put("email", "escalonamento@signup.test");
        payload.put("password", "senha1234");
        payload.put("profileCode", "ADMIN");
        payload.put("status", "ACTIVE");

        ResponseEntity<Map> res = post("/auth/register", payload, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody().get("profileCode")).isEqualTo("CLIENT");
        assertThat(res.getBody().get("status")).isEqualTo("PENDING");
    }

    @Test
    void pendingUserCannotLogInUntilActivated() {
        Map<String, Object> payload = Map.of(
                "name", "Pendente Login",
                "email", "pendente.login@signup.test",
                "password", "senha1234");
        assertThat(post("/auth/register", payload, null).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Map> loginRes = post("/auth/login",
                Map.of("email", "pendente.login@signup.test", "password", "senha1234"), null);

        assertThat(loginRes.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void duplicateEmailIsConflict() {
        Map<String, Object> payload = Map.of(
                "name", "Duplicado",
                "email", "duplicado@signup.test",
                "password", "senha1234");

        assertThat(post("/auth/register", payload, null).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        assertThat(post("/auth/register", payload, null).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void shortPasswordIsRejected() {
        ResponseEntity<Map> res = post("/auth/register", Map.of(
                "name", "Senha Curta",
                "email", "senha.curta@signup.test",
                "password", "123"), null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
