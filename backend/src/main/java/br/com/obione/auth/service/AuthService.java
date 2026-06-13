package br.com.obione.auth.service;

import br.com.obione.auth.MockTokenConstants;
import br.com.obione.auth.dto.CurrentUserDTO;
import br.com.obione.auth.dto.LoginRequestDTO;
import br.com.obione.auth.dto.LoginResponseDTO;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.exception.UnauthorizedException;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import br.com.obione.users.mapper.UserMapper;
import br.com.obione.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock-token authentication (no JWT). Each login issues a random opaque token
 * mapped to the user in memory — concurrent users/tabs never clobber each
 * other's session. Restarting the backend invalidates every session.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ConcurrentHashMap<String, Long> sessionStore = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new UnauthorizedException("E-mail ou senha incorretos"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Usuário inativo ou pendente de ativação");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("E-mail ou senha incorretos");
        }

        String token = UUID.randomUUID().toString();
        sessionStore.put(token, user.getId());

        CurrentUserDTO currentUser = UserMapper.toCurrentUserDTO(user);
        return new LoginResponseDTO(
                token,
                MockTokenConstants.TOKEN_TYPE,
                currentUser
        );
    }

    /** Invalidates the session for this token. Unknown tokens are a no-op. */
    public void logout(String authorizationHeader) {
        sessionStore.remove(extractBearerToken(authorizationHeader));
    }

    @Transactional(readOnly = true)
    public CurrentUserDTO getCurrentUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        Long userId = sessionStore.get(token);

        if (userId == null) {
            throw new UnauthorizedException("Sessão inválida ou expirada");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));

        return UserMapper.toCurrentUserDTO(user);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new UnauthorizedException("Token de autenticação não informado");
        }

        if (!authorizationHeader.startsWith(MockTokenConstants.TOKEN_TYPE + " ")) {
            throw new UnauthorizedException("Formato de token inválido");
        }

        String token = authorizationHeader.substring((MockTokenConstants.TOKEN_TYPE + " ").length()).trim();

        if (token.isEmpty()) {
            throw new UnauthorizedException("Token inválido");
        }

        return token;
    }
}
