package br.com.obione.observations.repository;

import br.com.obione.observations.entity.Observation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObservationRepository extends JpaRepository<Observation, Long> {

    List<Observation> findByProject_IdOrderByCreatedAtDesc(Long projectId);

    boolean existsByProject_Id(Long projectId);
}
