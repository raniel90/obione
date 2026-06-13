package br.com.obione.ai.dto;

/** AI draft of consolidated knowledge from a discussion (the "sintetizadora"). */
public record KnowledgeDraftDTO(
        String title,
        String summary,
        String evidence,
        String recommendation,
        String confidence
) {
}
