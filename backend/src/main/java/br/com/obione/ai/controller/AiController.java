package br.com.obione.ai.controller;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI assistant — suggestions over the observation → discussion → knowledge
 * pipeline, on the MPO grammar. Every endpoint returns a suggestion; the
 * consultant reviews and accepts via the existing create endpoints (human-in-the-loop).
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
    public DomainSuggestionDTO suggestDomain(@PathVariable Long id) {
        return ai.suggestDomain(id);
    }

    @PostMapping("/projects/{id}/ai/suggest-observations")
    @Operation(summary = "IA: sugerir observações mapeadas ao MPO (observadora assistida)")
    public ObservationSuggestionsDTO suggestObservations(@PathVariable Long id) {
        return ai.suggestObservations(id);
    }

    @PostMapping("/discussions/{id}/ai/suggest-knowledge")
    @Operation(summary = "IA: rascunho de conhecimento a partir da discussão (sintetizadora)")
    public KnowledgeDraftDTO suggestKnowledge(@PathVariable Long id) {
        return ai.suggestKnowledge(id);
    }

    @PostMapping("/domains/{id}/ai/synthesize")
    @Operation(summary = "IA: síntese cross-projeto do domínio (Conectora)")
    public DomainSynthesisDTO synthesize(@PathVariable Long id) {
        return ai.synthesize(id);
    }
}
