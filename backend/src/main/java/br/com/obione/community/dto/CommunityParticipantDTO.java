package br.com.obione.community.dto;

import br.com.obione.profiles.enums.ProfileCode;

import java.util.List;

public record CommunityParticipantDTO(
        Long id,
        String name,
        String email,
        ProfileCode profileCode,
        String roleDescription,
        List<String> domainIds,
        List<String> projectIds
) {
}
