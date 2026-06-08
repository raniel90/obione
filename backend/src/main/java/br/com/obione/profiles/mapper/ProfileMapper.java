package br.com.obione.profiles.mapper;

import br.com.obione.profiles.dto.ProfileResponse;
import br.com.obione.profiles.entity.Profile;

public final class ProfileMapper {

    private ProfileMapper() {
    }

    public static ProfileResponse toResponse(Profile profile) {
        return new ProfileResponse(
                profile.getId(),
                profile.getCode(),
                profile.getName(),
                profile.getDescription()
        );
    }
}
