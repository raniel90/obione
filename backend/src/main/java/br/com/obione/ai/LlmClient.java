package br.com.obione.ai;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionDTO;
import br.com.obione.ai.dto.StructureObservationDTO;

import java.util.List;

/**
 * Port for the generative-AI assistant. Two adapters: {@code MockLlmClient}
 * (default, deterministic) and {@code OpenAiLlmClient} (real LLM), selected by
 * {@code obione.llm.provider}. All outputs are suggestions — human-in-the-loop.
 */
public interface LlmClient {

    /** Provider name recorded on every suggestion log (RNF04), e.g. "mock". */
    String provider();

    /** Model identifier recorded on every suggestion log (RNF04). */
    String model();

    DomainSuggestionDTO suggestDomain(String projectSummary, String objective, List<String> availableDomainSlugs);

    /**
     * {@code priorityAttributeIds}: attributes the consultant declared at project creation — prioritize them.
     * {@code alreadyObserved}: lines "attributeId — título" of the project's existing observations —
     * these aspects must not be suggested again.
     */
    ObservationSuggestionsDTO suggestObservations(
            String projectSummary, String objective, String mpoLens,
            List<String> priorityAttributeIds, List<String> alreadyObserved);

    KnowledgeDraftDTO suggestKnowledge(String discussionTitle, String question, List<String> contributions);

    DomainSynthesisDTO synthesize(String domainName, List<String> projectSummaries);

    ProjectSetupSuggestionDTO suggestProjectSetup(
            String name, String description, String objective,
            List<String> availableDomainSlugs, String mpoLens);

    /**
     * Structures a free-text observation into a title, best-matching MPO attribute id,
     * and an initial interpretation. {@code mpoLens} is the in-scope attribute list in
     * "attributeId — label (categoria)" format, one per line.
     */
    StructureObservationDTO structureObservation(String description, String mpoLens);
}
