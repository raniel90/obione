package br.com.obione.projects.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.projects.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Reusable guard that enforces per-project read access for CLIENT users.
 * Staff (CONSULTANT/ADMIN) always pass.  Inject into controllers or services
 * that expose per-project endpoints that require client isolation.
 *
 * <p>Wire-in deferred to later tasks — this component is created here to be
 * available when needed.
 */
@Component
@RequiredArgsConstructor
public class ProjectAccessGuard {

    private final CurrentUser currentUser;
    private final ProjectRepository projectRepository;

    /**
     * Asserts the current user may read the given project.
     * No-op for staff.  For a CLIENT, throws {@link ResourceNotFoundException}
     * if the project does not exist or its {@code client_id} does not match
     * the caller's userId (intentionally indistinguishable from not-found).
     *
     * @param projectId the project to check
     * @throws ResourceNotFoundException if the client cannot see this project
     */
    public void assertCanRead(Long projectId) {
        if (!currentUser.isClient()) return;
        projectRepository.findByIdAndClient_Id(projectId, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));
    }
}
