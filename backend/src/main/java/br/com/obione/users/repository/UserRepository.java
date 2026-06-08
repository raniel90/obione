package br.com.obione.users.repository;

import br.com.obione.profiles.enums.ProfileCode;
import br.com.obione.users.entity.User;
import br.com.obione.users.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByProfile_Code(ProfileCode code);

    long countByStatus(UserStatus status);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
}
