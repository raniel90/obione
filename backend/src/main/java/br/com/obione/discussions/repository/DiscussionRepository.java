package br.com.obione.discussions.repository;

import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.enums.DiscussionStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    List<Discussion> findByDomain_IdOrderByCreatedAtDesc(Long domainId);

    List<Discussion> findByProject_IdOrderByCreatedAtDesc(Long projectId);

    Optional<Discussion> findByTitle(String title);

    long countByStatusNot(DiscussionStatus status);

    long countByDomain_Id(Long domainId);

    long countByDomain_IdAndStatusNot(Long domainId, DiscussionStatus status);

    List<Discussion> findByDomain_IdAndStatusNotOrderByUpdatedAtDesc(
            Long domainId,
            DiscussionStatus status
    );

    List<Discussion> findByStatusNotOrderByUpdatedAtDesc(DiscussionStatus status, Pageable pageable);

    boolean existsByObservationId(Long observationId);
}
