package br.com.obione.phenomena.repository;

import br.com.obione.phenomena.entity.Phenomenon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PhenomenonRepository extends JpaRepository<Phenomenon, Long> {

    List<Phenomenon> findByProject_IdOrderByCreatedAtDesc(Long projectId);

    List<Phenomenon> findByDomain_IdOrderByCreatedAtDesc(Long domainId);

    Optional<Phenomenon> findByDomain_IdAndName(Long domainId, String name);
}
