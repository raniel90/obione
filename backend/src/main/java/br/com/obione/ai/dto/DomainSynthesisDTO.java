package br.com.obione.ai.dto;

import java.util.List;

/** AI cross-project synthesis for a domain (the "Conectora"). */
public record DomainSynthesisDTO(
        String summary,
        List<String> patterns,
        List<String> lessons
) {
}
