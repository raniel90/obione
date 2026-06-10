package br.com.obione.ai.controller;

import br.com.obione.ai.dto.AiStatsDTO;
import br.com.obione.ai.dto.DomainSuggestionResponseDTO;
import br.com.obione.ai.dto.DomainSynthesisResponseDTO;
import br.com.obione.ai.dto.KnowledgeDraftResponseDTO;
import br.com.obione.ai.dto.ObservationSuggestionsResponseDTO;
import br.com.obione.ai.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI assistant — suggestions over the observation → discussion → knowledge
 * pipeline, on the MPO grammar. Every endpoint returns a suggestion; the
 * consultant reviews and accepts via the existing create endpoints (human-in-the-loop).
 * Responses carry the suggestion-log id and provider/model/timestamp (RNF04).
 */
@RestController
@Tag(name = "AI", description = "Camada assistiva de IA (sugestões human-in-the-loop) na gramática do MPO")
public class AiController {

    private final AiAssistantService ai;

    public AiController(AiAssistantService ai) {
        this.ai = ai;
    }

    @PostMapping("/projects/{id}/ai/suggest-domain")
    @Operation(summary = "IA: sugerir domínio/temática do projeto (categorizadora)")
    public DomainSuggestionResponseDTO suggestDomain(@PathVariable Long id) {
        return ai.suggestDomain(id);
    }

    @PostMapping("/projects/{id}/ai/suggest-observations")
    @Operation(summary = "IA: sugerir observações mapeadas ao MPO (observadora assistida)")
    public ObservationSuggestionsResponseDTO suggestObservations(@PathVariable Long id) {
        return ai.suggestObservations(id);
    }

    @PostMapping("/discussions/{id}/ai/suggest-knowledge")
    @Operation(summary = "IA: rascunho de conhecimento a partir da discussão (sintetizadora)")
    public KnowledgeDraftResponseDTO suggestKnowledge(@PathVariable Long id) {
        return ai.suggestKnowledge(id);
    }

    @PostMapping("/domains/{id}/ai/synthesize")
    @Operation(summary = "IA: síntese cross-projeto do domínio (Conectora)")
    public DomainSynthesisResponseDTO synthesize(@PathVariable Long id) {
        return ai.synthesize(id);
    }

    @GetMapping("/ai/stats")
    @Operation(summary = "IA: métricas de sugestão × aceite por papel (derivadas do log)")
    public AiStatsDTO stats() {
        return ai.stats();
    }
}
