package br.com.obione.ai.controller;

import br.com.obione.ai.dto.AiStatsDTO;
import br.com.obione.ai.dto.DomainSuggestionResponseDTO;
import br.com.obione.ai.dto.DomainSynthesisResponseDTO;
import br.com.obione.ai.dto.KnowledgeDraftResponseDTO;
import br.com.obione.ai.dto.ObservationSuggestionsResponseDTO;
import br.com.obione.ai.dto.ProjectSetupRequestDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionResponseDTO;
import br.com.obione.ai.dto.StructureObservationRequestDTO;
import br.com.obione.ai.dto.StructureObservationResponseDTO;
import br.com.obione.ai.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @GetMapping("/domains/{id}/ai/synthesize/latest")
    @Operation(summary = "Última síntese persistida do domínio (Conectora)")
    public DomainSynthesisResponseDTO latestSynthesis(@PathVariable Long id) {
        return ai.latestSynthesis(id);
    }

    @PostMapping("/domains/{id}/ai/synthesize")
    @Operation(summary = "IA: síntese cross-projeto do domínio (Conectora)")
    public DomainSynthesisResponseDTO synthesize(@PathVariable Long id) {
        return ai.synthesize(id);
    }

    @PostMapping("/ai/project-setup")
    @Operation(summary = "IA: sugerir setup inicial de um projeto em criação (domínio + atributos + fenômenos)")
    public ProjectSetupSuggestionResponseDTO suggestProjectSetup(
            @Valid @RequestBody ProjectSetupRequestDTO request) {
        return ai.suggestProjectSetup(request);
    }

    @PostMapping("/projects/{id}/ai/structure-observation")
    @Operation(summary = "IA: estruturar uma observação em texto livre (título + atributo MPO + interpretação)")
    public StructureObservationResponseDTO structureObservation(
            @PathVariable Long id,
            @Valid @RequestBody StructureObservationRequestDTO request) {
        return ai.structureObservation(id, request);
    }

    @GetMapping("/ai/stats")
    @Operation(summary = "IA: métricas de sugestão × aceite por papel (derivadas do log)")
    public AiStatsDTO stats() {
        return ai.stats();
    }
}
