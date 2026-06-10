package br.com.obione.ai.service;

import br.com.obione.ai.entity.AiSuggestionLog;
import br.com.obione.ai.repository.AiSuggestionLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Marks a suggestion log as accepted when the consultant turns it into a real
 * entity. The consultant's action always wins: an unknown id is logged and
 * ignored, never an error.
 */
@Slf4j
@Service
public class AiSuggestionAcceptanceService {

    private final AiSuggestionLogRepository repository;

    public AiSuggestionAcceptanceService(AiSuggestionLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void markAccepted(Long suggestionId) {
        if (suggestionId == null) {
            return;
        }
        repository.findById(suggestionId).ifPresentOrElse(
                this::accept,
                () -> log.warn("AI suggestion {} not found while marking acceptance — ignored", suggestionId));
    }

    private void accept(AiSuggestionLog suggestionLog) {
        if (suggestionLog.isAccepted()) {
            return;
        }
        suggestionLog.setAccepted(true);
        suggestionLog.setAcceptedAt(Instant.now());
        repository.save(suggestionLog);
    }
}
