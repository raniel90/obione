package br.com.obione.profiles.repository;

import br.com.obione.profiles.entity.Profile;
import br.com.obione.profiles.enums.ProfileCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    Optional<Profile> findByCode(ProfileCode code);
}
