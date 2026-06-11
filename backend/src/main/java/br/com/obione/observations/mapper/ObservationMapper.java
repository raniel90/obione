package br.com.obione.observations.mapper;

import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.observations.dto.ObservationResponseDTO;
import br.com.obione.observations.entity.Observation;

public final class ObservationMapper {

    private ObservationMapper() {
    }

    public static ObservationResponseDTO toResponseDTO(Observation observation) {
        MpoAttribute mpoAttr = observation.getMpoAttribute();
        return new ObservationResponseDTO(
                observation.getId(),
                observation.getProject().getId(),
                observation.getTitle(),
                observation.getDescription(),
                observation.getAttributeId(),
                mpoAttr != null ? mpoAttr.getId() : null,
                mpoAttr != null ? mpoAttr.getCode() : null,
                mpoAttr != null ? mpoAttr.getName() : null,
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
