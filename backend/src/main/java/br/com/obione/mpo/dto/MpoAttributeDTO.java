package br.com.obione.mpo.dto;

/**
 * One MPO attribute from the Quadro 37 (Vieira, 2022). {@code type} is one of
 * {@code estruturado}, {@code texto_livre} or {@code fora_de_escopo}.
 */
public record MpoAttributeDTO(
        String key,
        String label,
        String category,
        String categoryLabel,
        String type
) {
}
