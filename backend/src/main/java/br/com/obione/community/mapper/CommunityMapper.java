package br.com.obione.community.mapper;

import br.com.obione.community.dto.CommunityDiscussionDTO;
import br.com.obione.community.dto.CommunityKnowledgeDTO;
import br.com.obione.community.dto.CommunityParticipantDTO;
import br.com.obione.community.dto.CommunityPhenomenonDTO;
import br.com.obione.community.dto.CommunityProjectDTO;
import br.com.obione.discussions.entity.Discussion;
import br.com.obione.knowledge.entity.Knowledge;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.projects.entity.Project;
import br.com.obione.users.entity.User;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class CommunityMapper {

    private CommunityMapper() {
    }

    public static CommunityParticipantDTO toParticipantDTO(User user) {
        String roleDescription = user.getProfile().getDescription();
        if (roleDescription == null || roleDescription.isBlank()) {
            roleDescription = user.getProfile().getName();
        }

        return new CommunityParticipantDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfile().getCode(),
                roleDescription,
                copyList(user.getDomainIds()),
                copyList(user.getProjectIds())
        );
    }

    public static CommunityProjectDTO toProjectDTO(Project project) {
        return new CommunityProjectDTO(
                project.getId(),
                project.getName(),
                project.getStatus(),
                project.getRiskLevel(),
                project.getProgress(),
                project.getClient() != null ? project.getClient().getName() : null,
                project.getConsultant() != null ? project.getConsultant().getName() : null
        );
    }

    public static CommunityDiscussionDTO toDiscussionDTO(
            Discussion discussion,
            Map<Long, Integer> contributionCounts
    ) {
        Project project = discussion.getProject();
        Phenomenon phenomenon = discussion.getPhenomenon();
        int contributionsCount = contributionCounts.getOrDefault(discussion.getId(), 0);

        return new CommunityDiscussionDTO(
                discussion.getId(),
                discussion.getDomain().getId(),
                discussion.getDomain().getSlug(),
                discussion.getDomain().getName(),
                discussion.getTitle(),
                discussion.getQuestion(),
                discussion.getStatus(),
                discussion.getVisibility(),
                project != null ? project.getId() : null,
                project != null ? project.getName() : null,
                phenomenon != null ? phenomenon.getId() : null,
                phenomenon != null ? phenomenon.getName() : null,
                contributionsCount,
                discussion.getCreatedAt()
        );
    }

    public static CommunityKnowledgeDTO toKnowledgeDTO(Knowledge knowledge) {
        Project project = knowledge.getProject();
        Phenomenon phenomenon = knowledge.getPhenomenon();

        return new CommunityKnowledgeDTO(
                knowledge.getId(),
                knowledge.getDomain().getId(),
                knowledge.getDomain().getSlug(),
                knowledge.getDomain().getName(),
                knowledge.getTitle(),
                knowledge.getSummary(),
                knowledge.getRecommendation(),
                knowledge.getConfidence(),
                knowledge.getStatus(),
                project != null ? project.getId() : null,
                project != null ? project.getName() : null,
                phenomenon != null ? phenomenon.getId() : null,
                phenomenon != null ? phenomenon.getName() : null,
                knowledge.getCreatedAt()
        );
    }

    public static CommunityPhenomenonDTO toPhenomenonDTO(Phenomenon phenomenon) {
        return new CommunityPhenomenonDTO(
                phenomenon.getId(),
                phenomenon.getName(),
                phenomenon.getDescription(),
                phenomenon.getStatus(),
                phenomenon.getTrend(),
                phenomenon.getImpact(),
                phenomenon.getEvidenceCount()
        );
    }

    private static List<String> copyList(List<String> source) {
        return source == null ? List.of() : new ArrayList<>(source);
    }
}
