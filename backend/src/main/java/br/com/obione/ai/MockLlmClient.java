package br.com.obione.ai;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionDTO;
import br.com.obione.ai.dto.StructureObservationDTO;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
            String projectSummary, String objective, String mpoLens,
            List<String> priorityAttributeIds, List<String> alreadyObserved) {
        String excerpt = excerptOf(projectSummary);
        // Deterministic priority: suggest on the attributes the consultant declared,
        // skipping the ones that already have observations (mirrors the real prompt rule).
        Set<String> covered = alreadyObserved == null ? Set.of()
                : alreadyObserved.stream()
                        .map(line -> line.split(" — ", 2)[0].trim())
                        .collect(Collectors.toSet());
        List<String> pool = new ArrayList<>();
        if (priorityAttributeIds != null) {
            pool.addAll(priorityAttributeIds);
        }
        pool.addAll(List.of("riscos_identificados", "escopo_planejado"));
        List<String> free = pool.stream().distinct().filter(a -> !covered.contains(a)).toList();
        String firstAttr = free.isEmpty() ? "riscos_identificados" : free.get(0);
        String secondAttr = free.size() > 1 ? free.get(1) : "escopo_planejado";
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

    @Override
    public StructureObservationDTO structureObservation(String description, String mpoLens) {
        // Deterministic title: first 8 words of the description (trimmed to ~60 chars).
        String title = titleOf(description);
        // Deterministic attributeId: first key from the lens string (format: "key — label (cat)").
        String attributeId = firstKeyOf(mpoLens);
        String interpretation = "Observação registrada sugere impacto direto no projeto. "
                + "Ative obione.llm.provider=openai para interpretação por IA real.";
        return new StructureObservationDTO(title, attributeId, interpretation);
    }

    /** Extracts a short title from the description (first ~8 words, max 60 chars). */
    private String titleOf(String description) {
        if (description == null || description.isBlank()) {
            return "Observação sem título";
        }
        String[] words = description.strip().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(8, words.length); i++) {
            if (i > 0) sb.append(' ');
            sb.append(words[i]);
        }
        String title = sb.toString();
        if (title.length() > 60) {
            title = title.substring(0, 57) + "...";
        }
        return title;
    }

    /** Extracts the first attribute key from a lens string ("key — label (cat)\n..."). */
    private String firstKeyOf(String mpoLens) {
        if (mpoLens == null || mpoLens.isBlank()) {
            return "";
        }
        String firstLine = mpoLens.strip().split("\n")[0];
        int sep = firstLine.indexOf(" — ");
        return sep > 0 ? firstLine.substring(0, sep).strip() : "";
    }
}
