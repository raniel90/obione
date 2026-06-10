package br.com.obione.ai.dto;

import java.util.List;

/**
 * AI-suggested initial setup for a project being created (the wizard's step 2):
 * domain, MPO attributes to watch and expected phenomena, inferred from the
 * project description. Structured-output record — only LLM-generated content.
 */
public record ProjectSetupSuggestionDTO(
        String suggestedDomainSlug,
        double confidence,
        List<String> attributeIds,
        List<String> expectedPhenomena,
        String rationale
) {
}
