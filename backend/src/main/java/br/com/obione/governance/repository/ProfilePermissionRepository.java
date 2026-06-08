package br.com.obione.governance.repository;

import br.com.obione.governance.entity.ProfilePermission;
import br.com.obione.profiles.enums.ProfileCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfilePermissionRepository extends JpaRepository<ProfilePermission, Long> {

    Optional<ProfilePermission> findByProfile_CodeAndPermission_Code(ProfileCode profileCode, String permissionCode);
}
