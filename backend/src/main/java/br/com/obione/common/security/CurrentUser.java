package br.com.obione.common.security;

import br.com.obione.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Spring-managed helper that exposes the authenticated user's identity and role
 * from the SecurityContext without coupling callers to Spring Security types.
 * The principal is a {@code Long} userId set by {@link br.com.obione.auth.MockTokenAuthFilter}.
 */
@Component
public class CurrentUser {

    /**
     * Returns the authenticated user's id.
     *
     * @throws UnauthorizedException if there is no valid authenticated principal.
     */
    public Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Long)) {
            throw new UnauthorizedException("Usuário não autenticado.");
        }
        return (Long) auth.getPrincipal();
    }

    /**
     * Returns {@code true} if the current principal holds the authority {@code ROLE_<role>}.
     */
    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    /** Returns {@code true} if the current user has the CLIENT role. */
    public boolean isClient() {
        return hasRole("CLIENT");
    }

    /** Returns {@code true} if the current user has the CONSULTANT or ADMIN role. */
    public boolean isStaff() {
        return hasRole("CONSULTANT") || hasRole("ADMIN");
    }
}
