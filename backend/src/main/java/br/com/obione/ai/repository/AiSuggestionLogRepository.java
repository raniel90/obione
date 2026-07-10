package br.com.obione.ai.repository;

import br.com.obione.ai.entity.AiSuggestionLog;
import br.com.obione.ai.enums.AiSuggestionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface AiSuggestionLogRepository extends JpaRepository<AiSuggestionLog, Long> {

    long countByType(AiSuggestionType type);

    long countByTypeAndAcceptedTrue(AiSuggestionType type);

    Optional<AiSuggestionLog> findFirstByTypeAndDomainIdOrderByCreatedAtDesc(
            AiSuggestionType type, Long domainId);
}
