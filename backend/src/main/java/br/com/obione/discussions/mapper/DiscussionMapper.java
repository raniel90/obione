package br.com.obione.discussions.mapper;

import br.com.obione.discussions.dto.DiscussionContributionResponseDTO;
import br.com.obione.discussions.dto.DiscussionResponseDTO;
import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.entity.DiscussionContribution;

import java.util.ArrayList;
import java.util.List;

public final class DiscussionMapper {

    private DiscussionMapper() {
    }

    public static DiscussionResponseDTO toResponseDTO(
            Discussion discussion,
            List<DiscussionContribution> contributions
    ) {
        return new DiscussionResponseDTO(
                discussion.getId(),
                discussion.getDomain().getId(),
                discussion.getProject() != null ? discussion.getProject().getId() : null,
                discussion.getPhenomenon() != null ? discussion.getPhenomenon().getId() : null,
                discussion.getObservationId(),
                discussion.getTitle(),
                discussion.getQuestion(),
                discussion.getStatus(),
                discussion.getVisibility(),
                discussion.getCreatedBy() != null ? discussion.getCreatedBy().getId() : null,
                discussion.getCreatedBy() != null ? discussion.getCreatedBy().getName() : null,
                discussion.getCreatedAt(),
                discussion.getUpdatedAt(),
                contributions == null
                        ? new ArrayList<>()
                        : contributions.stream().map(DiscussionMapper::toContributionResponseDTO).toList()
        );
    }

    public static DiscussionContributionResponseDTO toContributionResponseDTO(
            DiscussionContribution contribution
    ) {
        return new DiscussionContributionResponseDTO(
                contribution.getId(),
                contribution.getDiscussion().getId(),
                contribution.getUser() != null ? contribution.getUser().getId() : null,
                contribution.getUser() != null ? contribution.getUser().getName() : null,
                contribution.getType(),
                contribution.getText(),
                contribution.getCreatedAt()
        );
    }
}
