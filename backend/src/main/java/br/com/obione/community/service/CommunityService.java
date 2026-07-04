package br.com.obione.community.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.community.dto.CommunityDiscussionDTO;
import br.com.obione.community.dto.CommunityKnowledgeDTO;
import br.com.obione.community.dto.CommunityOverviewDTO;
import br.com.obione.community.dto.CommunityParticipantDTO;
import br.com.obione.community.dto.CommunityPhenomenonDTO;
import br.com.obione.community.dto.CommunityProjectDTO;
import br.com.obione.community.dto.DomainCommunityDTO;
import br.com.obione.community.mapper.CommunityMapper;
import br.com.obione.community.util.UserAffiliationHelper;
import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.repository.DiscussionContributionRepository;
import br.com.obione.discussions.repository.DiscussionRepository;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.knowledge.entity.Knowledge;
import br.com.obione.knowledge.repository.KnowledgeRepository;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.projects.service.ProjectAccessGuard;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import br.com.obione.users.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Aggregated community view of the observatory.
 *
 * <p><strong>Client isolation (B7):</strong>
 * <ul>
 *   <li><em>Overview ({@code GET /community})</em>: a CLIENT sees only the
 *       domain(s) that contain their project(s). Recent discussions and knowledge
 *       are filtered to their domain(s)/project(s).</li>
 *   <li><em>Domain detail ({@code GET /community/domains/…})</em>: a CLIENT sees
 *       only their project(s) in that domain. Discussions, knowledge and phenomena
 *       are filtered to domain-level items ({@code project == null} — semi-open
 *       community) plus items belonging to the client's own project(s). Hard 404
 *       is NOT raised for foreign domains — the response is filtered in place
 *       (prefer filtering over denial for a semi-open observatory).</li>
 * </ul>
 * Staff (CONSULTANT/ADMIN) are unaffected.
 */
@Service
public class CommunityService {

    private static final int RECENT_LIMIT = 10;
    // Over-fetch factor used when filtering recent items for clients to ensure
    // we collect enough items after the client-scoping filter is applied.
    private static final int CLIENT_OVERFETCH = 5;
    private static final int TOP_PHENOMENA_LIMIT = 6;

    private final DomainRepository domainRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final DiscussionRepository discussionRepository;
    private final DiscussionContributionRepository contributionRepository;
    private final KnowledgeRepository knowledgeRepository;
    private final PhenomenonRepository phenomenonRepository;
    private final CurrentUser currentUser;
    private final ProjectAccessGuard guard;

    public CommunityService(
            DomainRepository domainRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            DiscussionRepository discussionRepository,
            DiscussionContributionRepository contributionRepository,
            KnowledgeRepository knowledgeRepository,
            PhenomenonRepository phenomenonRepository,
            CurrentUser currentUser,
            ProjectAccessGuard guard
    ) {
        this.domainRepository = domainRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.discussionRepository = discussionRepository;
        this.contributionRepository = contributionRepository;
        this.knowledgeRepository = knowledgeRepository;
        this.phenomenonRepository = phenomenonRepository;
        this.currentUser = currentUser;
        this.guard = guard;
    }

    @Transactional(readOnly = true)
    public CommunityOverviewDTO getOverview() {
        List<Domain> domains = domainRepository.findAll();
        List<User> users = userRepository.findAll();

        // B7.1 — compute client scope once; null means no restriction (staff).
        Set<Long> myProjectIds = null;
        Set<Long> myDomainIds = null;
        if (currentUser.isClient()) {
            List<Project> clientProjects = projectRepository.findByClient_Id(currentUser.id());
            myProjectIds = clientProjects.stream()
                    .map(Project::getId)
                    .collect(Collectors.toUnmodifiableSet());
            myDomainIds = clientProjects.stream()
                    .filter(p -> p.getDomain() != null)
                    .map(p -> p.getDomain().getId())
                    .collect(Collectors.toUnmodifiableSet());
            final Set<Long> visibleDomainIds = myDomainIds;
            domains = domains.stream()
                    .filter(d -> visibleDomainIds.contains(d.getId()))
                    .toList();
        }

        long totalDomains = domains.size();
        long totalParticipants = userRepository.countByStatus(UserStatus.ACTIVE);

        // Aggregate counts — scoped to the client's visible domains when applicable.
        long totalDiscussions;
        long totalKnowledge;
        long totalContributions;
        if (currentUser.isClient()) {
            final Set<Long> visibleDomainIds = myDomainIds;
            totalDiscussions = visibleDomainIds.stream()
                    .mapToLong(did -> discussionRepository.countByDomain_IdAndStatusNot(did, DiscussionStatus.ARCHIVED))
                    .sum();
            totalKnowledge = visibleDomainIds.stream()
                    .mapToLong(knowledgeRepository::countByDomain_Id)
                    .sum();
            totalContributions = visibleDomainIds.stream()
                    .mapToLong(contributionRepository::countByDiscussionDomainId)
                    .sum();
        } else {
            totalDiscussions = discussionRepository.countByStatusNot(DiscussionStatus.ARCHIVED);
            totalKnowledge = knowledgeRepository.count();
            totalContributions = contributionRepository.count();
        }

        List<DomainCommunityDTO> domainCommunities = domains.stream()
                .map(domain -> buildDomainSummary(domain, users))
                .toList();

        long activeCommunities = domainCommunities.stream()
                .filter(summary -> summary.projectCount() > 0 || summary.discussionCount() > 0)
                .count();

        // Recent discussions — over-fetch then filter for clients.
        int discussionFetchSize = currentUser.isClient() ? RECENT_LIMIT * CLIENT_OVERFETCH : RECENT_LIMIT;
        List<Discussion> recentDiscussionEntities = discussionRepository.findByStatusNotOrderByUpdatedAtDesc(
                DiscussionStatus.ARCHIVED,
                PageRequest.of(0, discussionFetchSize)
        );
        if (currentUser.isClient()) {
            final Set<Long> finalMyProjectIds = myProjectIds;
            final Set<Long> finalMyDomainIds = myDomainIds;
            recentDiscussionEntities = recentDiscussionEntities.stream()
                    .filter(d -> clientVisible(
                            d.getProject() != null ? d.getProject().getId() : null,
                            d.getDomain().getId(),
                            finalMyProjectIds,
                            finalMyDomainIds))
                    .limit(RECENT_LIMIT)
                    .toList();
        }
        Map<Long, Integer> recentContributionCounts = buildContributionCounts(recentDiscussionEntities);
        List<CommunityDiscussionDTO> recentDiscussions = recentDiscussionEntities.stream()
                .map(discussion -> CommunityMapper.toDiscussionDTO(discussion, recentContributionCounts))
                .toList();

        // Recent knowledge — over-fetch then filter for clients.
        int knowledgeFetchSize = currentUser.isClient() ? RECENT_LIMIT * CLIENT_OVERFETCH : RECENT_LIMIT;
        List<Knowledge> knowledgePage = knowledgeRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, knowledgeFetchSize));
        if (currentUser.isClient()) {
            final Set<Long> finalMyProjectIds = myProjectIds;
            final Set<Long> finalMyDomainIds = myDomainIds;
            knowledgePage = knowledgePage.stream()
                    .filter(k -> clientVisible(
                            k.getProject() != null ? k.getProject().getId() : null,
                            k.getDomain().getId(),
                            finalMyProjectIds,
                            finalMyDomainIds))
                    .limit(RECENT_LIMIT)
                    .toList();
        }
        List<CommunityKnowledgeDTO> recentKnowledge = knowledgePage.stream()
                .map(CommunityMapper::toKnowledgeDTO)
                .toList();

        return new CommunityOverviewDTO(
                totalDomains,
                totalParticipants,
                totalDiscussions,
                totalKnowledge,
                totalContributions,
                activeCommunities,
                domainCommunities,
                recentDiscussions,
                recentKnowledge
        );
    }

    @Transactional(readOnly = true)
    public DomainCommunityDTO getByDomainId(Long domainId) {
        Domain domain = domainRepository.findById(domainId)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + domainId));
        Set<Long> myProjectIds = currentUser.isClient() ? guard.clientProjectIds() : null;
        return buildDomainCommunity(domain, myProjectIds);
    }

    @Transactional(readOnly = true)
    public DomainCommunityDTO getByDomainSlug(String slug) {
        Domain domain = domainRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado para slug: " + slug));
        Set<Long> myProjectIds = currentUser.isClient() ? guard.clientProjectIds() : null;
        return buildDomainCommunity(domain, myProjectIds);
    }

    private DomainCommunityDTO buildDomainSummary(Domain domain, List<User> allUsers) {
        Long domainId = domain.getId();
        List<Project> projects = projectRepository.findByDomain_Id(domainId);

        List<CommunityParticipantDTO> participants = allUsers.stream()
                .filter(user -> UserAffiliationHelper.isParticipantForDomain(user, domainId, projects))
                .map(CommunityMapper::toParticipantDTO)
                .toList();

        long projectCount = projects.size();
        long discussionCount = discussionRepository.countByDomain_IdAndStatusNot(
                domainId,
                DiscussionStatus.ARCHIVED
        );
        long knowledgeCount = knowledgeRepository.countByDomain_Id(domainId);
        long phenomenonCount = phenomenonRepository.findByDomain_IdOrderByCreatedAtDesc(domainId).size();
        long contributionCount = contributionRepository.countByDiscussionDomainId(domainId);

        return new DomainCommunityDTO(
                domainId,
                domain.getSlug(),
                domain.getName(),
                domain.getDescription(),
                domain.getStatus(),
                participants.size(),
                (int) projectCount,
                (int) discussionCount,
                (int) knowledgeCount,
                (int) phenomenonCount,
                (int) contributionCount,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );
    }

    /**
     * Builds the full domain community detail.
     *
     * @param myProjectIds when non-null (CLIENT caller), restricts projects, discussions,
     *                     knowledge and phenomena to the client's own project(s).
     *                     Domain-level items ({@code project == null}) remain visible as
     *                     part of the semi-open community.  Participants are always shown
     *                     as they are community-level metadata.
     */
    private DomainCommunityDTO buildDomainCommunity(Domain domain, Set<Long> myProjectIds) {
        Long domainId = domain.getId();
        List<User> allUsers = userRepository.findAll();
        List<Project> projects = projectRepository.findByDomain_Id(domainId);

        // B7.3: filter projects for a CLIENT
        if (myProjectIds != null) {
            final Set<Long> visible = myProjectIds;
            projects = projects.stream()
                    .filter(p -> visible.contains(p.getId()))
                    .toList();
        }

        // Capture effectively-final alias after the conditional reassignment above.
        final List<Project> visibleProjects = projects;
        List<CommunityParticipantDTO> participants = allUsers.stream()
                .filter(user -> UserAffiliationHelper.isParticipantForDomain(user, domainId, visibleProjects))
                .map(CommunityMapper::toParticipantDTO)
                .toList();

        List<CommunityProjectDTO> projectDtos = visibleProjects.stream()
                .map(CommunityMapper::toProjectDTO)
                .toList();

        List<Discussion> discussions = discussionRepository.findByDomain_IdAndStatusNotOrderByUpdatedAtDesc(
                domainId,
                DiscussionStatus.ARCHIVED
        );
        // B7.3: domain-level discussions (project==null) stay visible; project-tied ones
        // are restricted to the client's projects.
        if (myProjectIds != null) {
            final Set<Long> visible = myProjectIds;
            discussions = discussions.stream()
                    .filter(d -> d.getProject() == null || visible.contains(d.getProject().getId()))
                    .toList();
        }
        Map<Long, Integer> contributionCounts = buildContributionCounts(discussions);

        List<CommunityDiscussionDTO> discussionDtos = discussions.stream()
                .map(discussion -> CommunityMapper.toDiscussionDTO(discussion, contributionCounts))
                .toList();

        List<Knowledge> knowledgeEntities = knowledgeRepository
                .findByDomain_IdOrderByCreatedAtDesc(domainId);
        if (myProjectIds != null) {
            final Set<Long> visible = myProjectIds;
            knowledgeEntities = knowledgeEntities.stream()
                    .filter(k -> k.getProject() == null || visible.contains(k.getProject().getId()))
                    .toList();
        }
        List<CommunityKnowledgeDTO> knowledgeDtos = knowledgeEntities.stream()
                .map(CommunityMapper::toKnowledgeDTO)
                .toList();

        List<Phenomenon> domainPhenomena = phenomenonRepository.findByDomain_IdOrderByCreatedAtDesc(domainId);
        if (myProjectIds != null) {
            final Set<Long> visible = myProjectIds;
            domainPhenomena = domainPhenomena.stream()
                    .filter(p -> p.getProject() == null || visible.contains(p.getProject().getId()))
                    .toList();
        }

        List<CommunityPhenomenonDTO> topPhenomena = domainPhenomena.stream()
                .sorted(Comparator.comparingInt(Phenomenon::getEvidenceCount).reversed())
                .limit(TOP_PHENOMENA_LIMIT)
                .map(CommunityMapper::toPhenomenonDTO)
                .toList();

        long contributionCount = contributionRepository.countByDiscussionDomainId(domainId);

        return new DomainCommunityDTO(
                domainId,
                domain.getSlug(),
                domain.getName(),
                domain.getDescription(),
                domain.getStatus(),
                participants.size(),
                projectDtos.size(),
                discussionDtos.size(),
                knowledgeDtos.size(),
                domainPhenomena.size(),
                (int) contributionCount,
                participants,
                projectDtos,
                discussionDtos,
                knowledgeDtos,
                topPhenomena
        );
    }

    /**
     * Whether an item is visible to the currently authenticated CLIENT.
     * An item is visible when:
     * <ul>
     *   <li>it is domain-level ({@code itemProjectId == null}) <em>and</em> belongs to
     *       one of the client's domains (semi-open community rule), or</li>
     *   <li>it is tied to one of the client's own projects.</li>
     * </ul>
     */
    private boolean clientVisible(Long itemProjectId, Long itemDomainId,
                                   Set<Long> myProjectIds, Set<Long> myDomainIds) {
        if (itemProjectId == null) {
            return myDomainIds.contains(itemDomainId);
        }
        return myProjectIds.contains(itemProjectId);
    }

    private Map<Long, Integer> buildContributionCounts(List<Discussion> discussions) {
        Map<Long, Integer> counts = new HashMap<>();
        for (Discussion discussion : discussions) {
            counts.put(discussion.getId(), (int) contributionRepository.countByDiscussion_Id(discussion.getId()));
        }
        return counts;
    }
}
