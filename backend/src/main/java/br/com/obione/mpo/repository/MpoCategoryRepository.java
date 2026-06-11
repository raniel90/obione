package br.com.obione.mpo.repository;

import br.com.obione.mpo.entity.MpoCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MpoCategoryRepository extends JpaRepository<MpoCategory, Long> {
    List<MpoCategory> findAllByOrderByOrderIndexAsc();
    Optional<MpoCategory> findByCode(String code);
}
