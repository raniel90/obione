package br.com.obione.mpo.repository;

import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.mpo.enums.AttributePhase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MpoAttributeRepository extends JpaRepository<MpoAttribute, Long> {
    Optional<MpoAttribute> findByCode(String code);
    List<MpoAttribute> findByPhase(AttributePhase phase);
    List<MpoAttribute> findByCategory_CodeOrderByCodeAsc(String categoryCode);
}
