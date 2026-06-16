package br.com.obione.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public self-registration payload. Intentionally carries no profile/status:
 * the server always provisions a PENDING CLIENT (semi-open community,
 * approval-gated), so the role can never be chosen by the requester.
 */
public record RegisterRequestDTO(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres") String password
) {
}
