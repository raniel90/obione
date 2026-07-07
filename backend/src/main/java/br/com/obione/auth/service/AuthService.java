package br.com.obione.auth.service;

import br.com.obione.auth.MockTokenConstants;
import br.com.obione.auth.dto.CurrentUserDTO;
import br.com.obione.auth.dto.LoginRequestDTO;
import br.com.obione.auth.dto.LoginResponseDTO;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.exception.UnauthorizedException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import br.com.obione.users.mapper.UserMapper;
import br.com.obione.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Stateless JWT authentication. Each login mints a signed HS256 JWT that the
 * client stores and sends as a Bearer token. Tokens survive backend restarts
 * because no server-side session map is involved — verification is pure
 * signature + expiry check.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final CurrentUser userContext;
    private final long ttlHours;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            CurrentUser userContext,
            @Value("${obione.auth.jwt-ttl-hours:12}") long ttlHours) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.userContext = userContext;
        this.ttlHours = ttlHours;
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

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiresAt(now.plus(ttlHours, ChronoUnit.HOURS))
                .claim("role", user.getProfile().getCode().name())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

        CurrentUserDTO currentUserDTO = UserMapper.toCurrentUserDTO(user);
        return new LoginResponseDTO(token, MockTokenConstants.TOKEN_TYPE, currentUserDTO);
    }

    /** Returns the current authenticated user by reading the JWT subject from the SecurityContext. */
    @Transactional(readOnly = true)
    public CurrentUserDTO currentUser() {
        Long id = userContext.id();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
        return UserMapper.toCurrentUserDTO(user);
    }

    /**
     * No-op: stateless JWT — logout is handled client-side by discarding the token.
     * Kept so the controller compiles and the endpoint remains backwards compatible.
     */
    public void logout() {
        // Stateless — nothing to invalidate server-side.
    }
}
