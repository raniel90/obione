package br.com.obione.ai;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionDTO;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Deterministic adapter (default). No network/LLM — keeps CI and the demo working
 * without an API key. Suggested observations reference real MPO attribute keys so
 * the consultant can accept them straight into the lens.
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
                        + "Ative obione.llm.provider=openai para classificação por IA real.");
    }

    @Override
    public ObservationSuggestionsDTO suggestObservations(
            String projectSummary, String objective, String mpoLens, List<String> priorityAttributeIds) {
        String excerpt = excerptOf(projectSummary);
        // Deterministic priority: suggest on the attributes the consultant declared, when present.
        String firstAttr = priorityAttributeIds != null && !priorityAttributeIds.isEmpty()
                ? priorityAttributeIds.get(0) : "riscos_identificados";
        String secondAttr = priorityAttributeIds != null && priorityAttributeIds.size() > 1
                ? priorityAttributeIds.get(1) : "escopo_planejado";
        return new ObservationSuggestionsDTO(List.of(
                new ObservationSuggestionDTO(
                        "Possível risco de prazo a observar",
                        "O resumo sugere pressão de cronograma que merece registro observacional.",
                        firstAttr, "MEDIUM", excerpt),
                new ObservationSuggestionDTO(
                        "Escopo planejado a confirmar",
                        "Há indícios de escopo amplo; vale registrar o escopo planejado observado.",
                        secondAttr, "LOW", excerpt)
        ));
    }

    @Override
    public ProjectSetupSuggestionDTO suggestProjectSetup(
            String name, String description, String objective,
            List<String> availableDomainSlugs, String mpoLens) {
        String slug = availableDomainSlugs.isEmpty() ? "outros" : availableDomainSlugs.get(0);
        return new ProjectSetupSuggestionDTO(
                slug, 0.7,
                List.of("objetivos", "escopo_planejado", "riscos_identificados", "data_inicio"),
                List.of("Risco de atraso", "Mudanças recorrentes de escopo"),
                "Setup determinístico (mock) a partir da descrição do projeto. "
                        + "Ative obione.llm.provider=openai para sugestão por IA real.");
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
