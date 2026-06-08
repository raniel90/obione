package br.com.obione.community.service;

import br.com.obione.common.exception.ResourceNotFoundException;
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

@Service
public class CommunityService {

    private static final int RECENT_LIMIT = 10;
    private static final int TOP_PHENOMENA_LIMIT = 6;

    private final DomainRepository domainRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final DiscussionRepository discussionRepository;
    private final DiscussionContributionRepository contributionRepository;
    private final KnowledgeRepository knowledgeRepository;
    private final PhenomenonRepository phenomenonRepository;

    public CommunityService(
            DomainRepository domainRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            DiscussionRepository discussionRepository,
            DiscussionContributionRepository contributionRepository,
            KnowledgeRepository knowledgeRepository,
            PhenomenonRepository phenomenonRepository
    ) {
        this.domainRepository = domainRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.discussionRepository = discussionRepository;
        this.contributionRepository = contributionRepository;
        this.knowledgeRepository = knowledgeRepository;
        this.phenomenonRepository = phenomenonRepository;
    }

    @Transactional(readOnly = true)
    public CommunityOverviewDTO getOverview() {
        List<Domain> domains = domainRepository.findAll();
        List<User> users = userRepository.findAll();

        long totalDomains = domains.size();
        long totalParticipants = userRepository.countByStatus(UserStatus.ACTIVE);
        long totalDiscussions = discussionRepository.countByStatusNot(DiscussionStatus.ARCHIVED);
        long totalKnowledge = knowledgeRepository.count();
        long totalContributions = contributionRepository.count();

        List<DomainCommunityDTO> domainCommunities = domains.stream()
                .map(domain -> buildDomainSummary(domain, users))
                .toList();

        long activeCommunities = domainCommunities.stream()
                .filter(summary -> summary.projectCount() > 0 || summary.discussionCount() > 0)
                .count();

        List<Discussion> recentDiscussionEntities = discussionRepository.findByStatusNotOrderByUpdatedAtDesc(
                DiscussionStatus.ARCHIVED,
                PageRequest.of(0, RECENT_LIMIT)
        );
        Map<Long, Integer> recentContributionCounts = buildContributionCounts(recentDiscussionEntities);

        List<CommunityDiscussionDTO> recentDiscussions = recentDiscussionEntities.stream()
                .map(discussion -> CommunityMapper.toDiscussionDTO(discussion, recentContributionCounts))
                .toList();

        List<CommunityKnowledgeDTO> recentKnowledge = knowledgeRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_LIMIT))
                .stream()
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
        return buildDomainCommunity(domain);
    }

    @Transactional(readOnly = true)
    public DomainCommunityDTO getByDomainSlug(String slug) {
        Domain domain = domainRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado para slug: " + slug));
        return buildDomainCommunity(domain);
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

    private DomainCommunityDTO buildDomainCommunity(Domain domain) {
        Long domainId = domain.getId();
        List<User> allUsers = userRepository.findAll();
        List<Project> projects = projectRepository.findByDomain_Id(domainId);

        List<CommunityParticipantDTO> participants = allUsers.stream()
                .filter(user -> UserAffiliationHelper.isParticipantForDomain(user, domainId, projects))
                .map(CommunityMapper::toParticipantDTO)
                .toList();

        List<CommunityProjectDTO> projectDtos = projects.stream()
                .map(CommunityMapper::toProjectDTO)
                .toList();

        List<Discussion> discussions = discussionRepository.findByDomain_IdAndStatusNotOrderByUpdatedAtDesc(
                domainId,
                DiscussionStatus.ARCHIVED
        );
        Map<Long, Integer> contributionCounts = buildContributionCounts(discussions);

        List<CommunityDiscussionDTO> discussionDtos = discussions.stream()
                .map(discussion -> CommunityMapper.toDiscussionDTO(discussion, contributionCounts))
                .toList();

        List<CommunityKnowledgeDTO> knowledgeDtos = knowledgeRepository
                .findByDomain_IdOrderByCreatedAtDesc(domainId)
                .stream()
                .map(CommunityMapper::toKnowledgeDTO)
                .toList();

        List<Phenomenon> domainPhenomena = phenomenonRepository.findByDomain_IdOrderByCreatedAtDesc(domainId);

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

    private Map<Long, Integer> buildContributionCounts(List<Discussion> discussions) {
        Map<Long, Integer> counts = new HashMap<>();
        for (Discussion discussion : discussions) {
            counts.put(discussion.getId(), (int) contributionRepository.countByDiscussion_Id(discussion.getId()));
        }
        return counts;
    }
}
