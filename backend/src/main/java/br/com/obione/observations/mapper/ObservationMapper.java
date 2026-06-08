package br.com.obione.observations.mapper;

import br.com.obione.observations.dto.ObservationResponseDTO;
import br.com.obione.observations.entity.Observation;

public final class ObservationMapper {

    private ObservationMapper() {
    }

    public static ObservationResponseDTO toResponseDTO(Observation observation) {
        return new ObservationResponseDTO(
                observation.getId(),
                observation.getProject().getId(),
                observation.getTitle(),
                observation.getDescription(),
                observation.getAttributeId(),
                observation.getPhenomenonId(),
                observation.getImpact(),
                observation.getRisk(),
                observation.getInterpretation(),
                observation.getStatus(),
                observation.getCreatedBy() != null ? observation.getCreatedBy().getId() : null,
                observation.getCreatedBy() != null ? observation.getCreatedBy().getName() : null,
                observation.getCreatedAt(),
                observation.getUpdatedAt()
        );
    }
}
