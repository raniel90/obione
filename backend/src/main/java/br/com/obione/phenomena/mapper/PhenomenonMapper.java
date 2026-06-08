package br.com.obione.phenomena.mapper;

import br.com.obione.phenomena.dto.PhenomenonResponseDTO;
import br.com.obione.phenomena.entity.Phenomenon;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class PhenomenonMapper {

    private PhenomenonMapper() {
    }

    public static PhenomenonResponseDTO toResponseDTO(Phenomenon phenomenon) {
        return new PhenomenonResponseDTO(
                phenomenon.getId(),
                phenomenon.getDomain().getId(),
                phenomenon.getProject() != null ? phenomenon.getProject().getId() : null,
                phenomenon.getName(),
                phenomenon.getDescription(),
                phenomenon.getEvidenceCount(),
                splitRelatedAttributeIds(phenomenon.getRelatedAttributeIds()),
                phenomenon.getImpact(),
                phenomenon.getTrend(),
                phenomenon.getStatus(),
                phenomenon.getCreatedAt(),
                phenomenon.getUpdatedAt()
        );
    }

    public static String joinRelatedAttributeIds(List<String> attributeIds) {
        if (attributeIds == null || attributeIds.isEmpty()) {
            return null;
        }
        return String.join(",", attributeIds);
    }

    public static List<String> splitRelatedAttributeIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    public static List<String> copyList(List<String> source) {
        return source == null ? new ArrayList<>() : new ArrayList<>(source);
    }
}
