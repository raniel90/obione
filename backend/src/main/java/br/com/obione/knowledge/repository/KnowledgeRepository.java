package br.com.obione.knowledge.repository;

import br.com.obione.knowledge.entity.Knowledge;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeRepository extends JpaRepository<Knowledge, Long> {

    List<Knowledge> findByDomain_IdOrderByCreatedAtDesc(Long domainId);

    List<Knowledge> findByProject_IdOrderByCreatedAtDesc(Long projectId);

    List<Knowledge> findByDiscussion_IdOrderByCreatedAtDesc(Long discussionId);

    long countByDomain_Id(Long domainId);

    List<Knowledge> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
