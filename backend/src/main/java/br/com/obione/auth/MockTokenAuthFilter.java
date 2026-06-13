package br.com.obione.auth;

import br.com.obione.auth.dto.CurrentUserDTO;
import br.com.obione.auth.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Resolves the mock Bearer token (via {@link AuthService}) to the authenticated
 * user and grants a role authority {@code ROLE_<profileCode>}, so SecurityConfig
 * can enforce role-based authorization. An invalid/absent token leaves the request
 * unauthenticated; the security rules then decide (401/403).
 */
@Component
public class MockTokenAuthFilter extends OncePerRequestFilter {

    private final AuthService authService;

    public MockTokenAuthFilter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                CurrentUserDTO user = authService.getCurrentUser(header);
                var authentication = new UsernamePasswordAuthenticationToken(
                        user.id(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.profileCode().name())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException ignored) {
                // invalid/expired token → stays unauthenticated.
            }
        }
        filterChain.doFilter(request, response);
    }
}
