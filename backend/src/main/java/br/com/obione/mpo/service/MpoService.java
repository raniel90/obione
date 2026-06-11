package br.com.obione.mpo.service;

import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.mpo.dto.MpoCategoryDTO;
import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.mpo.enums.AttributePhase;
import br.com.obione.mpo.repository.MpoAttributeRepository;
import br.com.obione.mpo.repository.MpoCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MpoService {

    private final MpoCategoryRepository categoryRepo;
    private final MpoAttributeRepository attributeRepo;

    public MpoService(MpoCategoryRepository categoryRepo, MpoAttributeRepository attributeRepo) {
        this.categoryRepo = categoryRepo;
        this.attributeRepo = attributeRepo;
    }

    @Transactional(readOnly = true)
    public List<MpoCategoryDTO> getCategories() {
        return categoryRepo.findAllByOrderByOrderIndexAsc().stream()
                .map(cat -> new MpoCategoryDTO(
                        cat.getId(), cat.getCode(), cat.getName(), cat.getOrderIndex(),
                        attributeRepo.findByCategory_CodeOrderByCodeAsc(cat.getCode())
                                .stream().map(this::toAttributeDTO).toList()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MpoAttributeDTO> getAttributes(AttributePhase phase) {
        List<MpoAttribute> attrs = phase != null
                ? attributeRepo.findByPhase(phase)
                : attributeRepo.findAll();
        return attrs.stream().map(this::toAttributeDTO).toList();
    }

    private MpoAttributeDTO toAttributeDTO(MpoAttribute attr) {
        return new MpoAttributeDTO(
                attr.getId(), attr.getCode(), attr.getName(),
                attr.getDescription(), attr.getPhase(), attr.getFillMode(),
                attr.getCategory().getCode(), attr.getCategory().getName()
        );
    }
}
