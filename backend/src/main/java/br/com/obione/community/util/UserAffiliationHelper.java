package br.com.obione.community.util;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.projects.entity.Project;
import br.com.obione.users.entity.User;

import java.util.List;

public final class UserAffiliationHelper {

    private UserAffiliationHelper() {
    }

    public static boolean containsId(List<String> ids, Long targetId) {
        if (ids == null || ids.isEmpty() || targetId == null) {
            return false;
        }
        String target = String.valueOf(targetId);
        return ids.stream().anyMatch(id -> id != null && id.trim().equals(target));
    }

    public static boolean isParticipantForDomain(User user, Long domainId, List<Project> domainProjects) {
        if (user.getProfile().getCode() == ProfileCode.ADMIN) {
            return true;
        }

        if (containsId(user.getDomainIds(), domainId)) {
            return true;
        }

        return domainProjects.stream().anyMatch(project ->
                (project.getClient() != null && project.getClient().getId().equals(user.getId()))
                        || (project.getConsultant() != null && project.getConsultant().getId().equals(user.getId()))
        );
    }
}
