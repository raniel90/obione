package br.com.obione.ai;

import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionDTO;

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

    ObservationSuggestionsDTO suggestObservations(String projectSummary, String objective, String mpoLens);

    KnowledgeDraftDTO suggestKnowledge(String discussionTitle, String question, List<String> contributions);

    DomainSynthesisDTO synthesize(String domainName, List<String> projectSummaries);

    ProjectSetupSuggestionDTO suggestProjectSetup(
            String name, String description, String objective,
            List<String> availableDomainSlugs, String mpoLens);
}
