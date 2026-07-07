package br.com.obione.feed.service;

import br.com.obione.common.security.CurrentUser;
import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.repository.DiscussionRepository;
import br.com.obione.feed.dto.FeedEventDTO;
import br.com.obione.knowledge.entity.Knowledge;
import br.com.obione.knowledge.repository.KnowledgeRepository;
import br.com.obione.observations.entity.Observation;
import br.com.obione.observations.repository.ObservationRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.service.ProjectAccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Real activity timeline of the observatory — aggregates observations,
 * discussions and knowledge by {@code createdAt} (the "Acompanhar" process).
 * Optionally scoped by domain or project.
 *
 * <p><strong>Client isolation (B6):</strong> when the caller is a CLIENT the feed
 * is restricted to events that belong to one of the client's own project(s).
 * Events whose {@code projectId} is {@code null} (domain-level discussions or
 * knowledge not tied to any specific project) are excluded for clients — they
 * cannot be mapped to a project and excluding them is the safer default.
 * Staff (CONSULTANT/ADMIN) see the full, unfiltered timeline.
 */
@Service
public class FeedService {

    private final ObservationRepository observations;
    private final DiscussionRepository discussions;
    private final KnowledgeRepository knowledge;
    private final CurrentUser currentUser;
    private final ProjectAccessGuard guard;

    public FeedService(
            ObservationRepository observations,
            DiscussionRepository discussions,
            KnowledgeRepository knowledge,
            CurrentUser currentUser,
            ProjectAccessGuard guard
    ) {
        this.observations = observations;
        this.discussions = discussions;
        this.knowledge = knowledge;
        this.currentUser = currentUser;
        this.guard = guard;
    }

    @Transactional(readOnly = true)
    public List<FeedEventDTO> feed(Long domainId, Long projectId, int limit) {
        // Determine client-project scope once; null means no restriction (staff).
        Set<Long> clientProjectIds = currentUser.isClient() ? guard.clientProjectIds() : null;

        List<FeedEventDTO> events = new ArrayList<>();

        for (Observation o : observations.findAll()) {
            Project p = o.getProject();
            events.add(new FeedEventDTO(
                    "observation", o.getId(), o.getTitle(),
                    p != null ? p.getId() : null,
                    p != null ? p.getName() : null,
                    p != null && p.getDomain() != null ? p.getDomain().getId() : null,
                    o.getCreatedBy() != null ? o.getCreatedBy().getName() : null,
                    o.getCreatedAt()));
        }

        for (Discussion d : discussions.findAll()) {
            events.add(new FeedEventDTO(
                    "discussion", d.getId(), d.getTitle(),
                    d.getProject() != null ? d.getProject().getId() : null,
                    d.getProject() != null ? d.getProject().getName() : null,
                    d.getDomain() != null ? d.getDomain().getId() : null,
                    d.getCreatedBy() != null ? d.getCreatedBy().getName() : null,
                    d.getCreatedAt()));
        }

        for (Knowledge k : knowledge.findAll()) {
            events.add(new FeedEventDTO(
                    "knowledge", k.getId(), k.getTitle(),
                    k.getProject() != null ? k.getProject().getId() : null,
                    k.getProject() != null ? k.getProject().getName() : null,
                    k.getDomain() != null ? k.getDomain().getId() : null,
                    null,
                    k.getCreatedAt()));
        }

        return events.stream()
                // B6: restrict to the client's own project(s); domain-level items
                // (projectId == null) are excluded for clients since they cannot be
                // attributed to a specific project.
                .filter(e -> clientProjectIds == null
                        || (e.projectId() != null && clientProjectIds.contains(e.projectId())))
                .filter(e -> domainId == null || domainId.equals(e.domainId()))
                .filter(e -> projectId == null || projectId.equals(e.projectId()))
                .filter(e -> e.createdAt() != null)
                .sorted(Comparator.comparing(FeedEventDTO::createdAt).reversed())
                .limit(limit > 0 ? limit : 50)
                .toList();
    }
}
