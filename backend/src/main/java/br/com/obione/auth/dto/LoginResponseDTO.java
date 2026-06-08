package br.com.obione.auth.dto;

public record LoginResponseDTO(
        String accessToken,
        String tokenType,
        CurrentUserDTO user
) {
}
