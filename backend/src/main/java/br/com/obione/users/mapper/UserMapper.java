package br.com.obione.users.mapper;

import br.com.obione.auth.dto.CurrentUserDTO;
import br.com.obione.users.dto.UserResponseDTO;
import br.com.obione.users.entity.User;

import java.util.ArrayList;
import java.util.List;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponseDTO toResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfile().getCode(),
                user.getStatus(),
                copyList(user.getDomainIds()),
                copyList(user.getProjectIds()),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public static CurrentUserDTO toCurrentUserDTO(User user) {
        return new CurrentUserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfile().getCode(),
                user.getStatus()
        );
    }

    public static List<String> copyList(List<String> source) {
        return source == null ? new ArrayList<>() : new ArrayList<>(source);
    }
}
