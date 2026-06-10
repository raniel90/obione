package br.com.obione.ai;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Deterministic adapter (default). No network/LLM — keeps CI and the demo working
 * without Ollama. Suggested observations reference real MPO attribute keys so the
 * consultant can accept them straight into the lens.
 */
@Component
@ConditionalOnProperty(name = "obione.llm.provider", havingValue = "mock", matchIfMissing = true)
public class MockLlmClient implements LlmClient {

    @Override
    public String provider() {
        return "mock";
    }

    @Override
    public String model() {
        return "deterministic-v1";
    }

    @Override
    public DomainSuggestionDTO suggestDomain(String projectSummary, String objective, List<String> availableDomainSlugs) {
        String slug = availableDomainSlugs.isEmpty() ? "outros" : availableDomainSlugs.get(0);
        return new DomainSuggestionDTO(slug, 0.72,
                "Sugestão determinística (mock) a partir do resumo do projeto. "
                        + "Ative obione.llm.provider=ollama para classificação por IA real.");
    }

    @Override
    public ObservationSuggestionsDTO suggestObservations(String projectSummary, String objective, String mpoLens) {
        String excerpt = excerptOf(projectSummary);
        return new ObservationSuggestionsDTO(List.of(
                new ObservationSuggestionDTO(
                        "Possível risco de prazo a observar",
                        "O resumo sugere pressão de cronograma que merece registro observacional.",
                        "riscos_identificados", "MEDIUM", excerpt),
                new ObservationSuggestionDTO(
                        "Escopo planejado a confirmar",
                        "Há indícios de escopo amplo; vale registrar o escopo planejado observado.",
                        "escopo_planejado", "LOW", excerpt)
        ));
    }

    /** Deterministic stand-in for the literal source passage a real LLM would cite. */
    private String excerptOf(String projectSummary) {
        if (projectSummary == null || projectSummary.isBlank()) {
            return "";
        }
        String trimmed = projectSummary.strip();
        return trimmed.length() <= 120 ? trimmed : trimmed.substring(0, 117) + "...";
    }

    @Override
    public KnowledgeDraftDTO suggestKnowledge(String discussionTitle, String question, List<String> contributions) {
        return new KnowledgeDraftDTO(
                "Síntese: " + discussionTitle,
                "Consolidação determinística (mock) de " + contributions.size()
                        + " contribuição(ões) da discussão.",
                "Baseado nas contribuições registradas na discussão.",
                "Documentar o aprendizado e acompanhar em projetos similares.",
                "MEDIUM");
    }

    @Override
    public DomainSynthesisDTO synthesize(String domainName, List<String> projectSummaries) {
        return new DomainSynthesisDTO(
                "Síntese determinística (mock) do domínio " + domainName + " sobre "
                        + projectSummaries.size() + " projeto(s).",
                List.of("Padrão recorrente de mudanças de escopo", "Validações tardias do cliente"),
                List.of("Alinhar critérios de aceite no início", "Reforçar rituais de validação"));
    }
}
