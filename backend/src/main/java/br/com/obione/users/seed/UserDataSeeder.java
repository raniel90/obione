package br.com.obione.users.seed;

import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.profiles.repository.ProfileRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import br.com.obione.users.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@Order(2)
public class UserDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDataSeeder(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        List<User> users = List.of(
                buildUser(
                        "Administrador ObiOne",
                        "admin@obione.dev",
                        "admin123",
                        ProfileCode.ADMIN
                ),
                buildUser(
                        "Lucas Martins",
                        "consultor@obione.dev",
                        "consultor123",
                        ProfileCode.CONSULTANT
                ),
                buildUser(
                        "Cliente Athos Capital",
                        "cliente@obione.dev",
                        "cliente123",
                        ProfileCode.CLIENT
                )
        );

        userRepository.saveAll(users);
    }

    private User buildUser(String name, String email, String rawPassword, ProfileCode profileCode) {
        Profile profile = profileRepository.findByCode(profileCode)
                .orElseThrow(() -> new IllegalStateException("Perfil não encontrado para seed: " + profileCode));

        return User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .profile(profile)
                .status(UserStatus.ACTIVE)
                .domainIds(new ArrayList<>())
                .projectIds(new ArrayList<>())
                .build();
    }
}
