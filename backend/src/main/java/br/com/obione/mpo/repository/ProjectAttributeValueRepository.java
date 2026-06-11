package br.com.obione.mpo.repository;

import br.com.obione.mpo.entity.ProjectAttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectAttributeValueRepository extends JpaRepository<ProjectAttributeValue, Long> {
    List<ProjectAttributeValue> findByProject_Id(Long projectId);
    Optional<ProjectAttributeValue> findByProject_IdAndMpoAttribute_Code(Long projectId, String attributeCode);
}
