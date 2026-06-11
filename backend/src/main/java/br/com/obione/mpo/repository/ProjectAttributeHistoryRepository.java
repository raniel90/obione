package br.com.obione.mpo.repository;

import br.com.obione.mpo.entity.ProjectAttributeHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectAttributeHistoryRepository extends JpaRepository<ProjectAttributeHistory, Long> {
    List<ProjectAttributeHistory> findByProjectAttributeValue_IdOrderByChangedAtDesc(Long projectAttributeValueId);
}
