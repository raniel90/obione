package br.com.obione.discussions.repository;

import br.com.obione.discussions.entity.DiscussionContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscussionContributionRepository extends JpaRepository<DiscussionContribution, Long> {

    List<DiscussionContribution> findByDiscussion_IdOrderByCreatedAtAsc(Long discussionId);

    long countByDiscussion_Id(Long discussionId);

    @Query("""
            SELECT COUNT(c)
            FROM DiscussionContribution c
            WHERE c.discussion.domain.id = :domainId
            """)
    long countByDiscussionDomainId(@Param("domainId") Long domainId);
}
