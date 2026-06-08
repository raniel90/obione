package br.com.obione.domains.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.domains.dto.CreateDomainRequestDTO;
import br.com.obione.domains.dto.DomainResponseDTO;
import br.com.obione.domains.dto.UpdateDomainRequestDTO;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.enums.DomainStatus;
import br.com.obione.domains.mapper.DomainMapper;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.domains.util.SlugUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DomainService {

    private final DomainRepository domainRepository;

    public DomainService(DomainRepository domainRepository) {
        this.domainRepository = domainRepository;
    }

    @Transactional(readOnly = true)
    public List<DomainResponseDTO> findAll() {
        return domainRepository.findAll().stream()
                .map(DomainMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DomainResponseDTO findById(Long id) {
        return domainRepository.findById(id)
                .map(DomainMapper::toResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public DomainResponseDTO findBySlug(String slug) {
        return domainRepository.findBySlug(slug)
                .map(DomainMapper::toResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + slug));
    }

    @Transactional
    public DomainResponseDTO create(CreateDomainRequestDTO request) {
        String name = request.name().trim();
        String slug = resolveUniqueSlug(SlugUtils.generate(name), null);

        Domain domain = Domain.builder()
                .slug(slug)
                .name(name)
                .description(request.description())
                .type(request.type())
                .observationObjective(request.observationObjective())
                .priorityIndicators(DomainMapper.copyList(request.priorityIndicators()))
                .expectedPhenomena(DomainMapper.copyList(request.expectedPhenomena()))
                .status(request.status() != null ? request.status() : DomainStatus.ACTIVE)
                .projectCount(request.projectCount() != null ? request.projectCount() : 0)
                .participantCount(request.participantCount() != null ? request.participantCount() : 0)
                .discussionCount(request.discussionCount() != null ? request.discussionCount() : 0)
                .knowledgeCount(request.knowledgeCount() != null ? request.knowledgeCount() : 0)
                .phenomenonCount(request.phenomenonCount() != null ? request.phenomenonCount() : 0)
                .engagementRate(request.engagementRate() != null ? request.engagementRate() : 0.0)
                .build();

        return DomainMapper.toResponseDTO(domainRepository.save(domain));
    }

    @Transactional
    public DomainResponseDTO update(Long id, UpdateDomainRequestDTO request) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            String name = request.name().trim();
            domain.setName(name);
            domain.setSlug(resolveUniqueSlug(SlugUtils.generate(name), id));
        }

        if (request.description() != null) {
            domain.setDescription(request.description());
        }

        if (request.type() != null) {
            domain.setType(request.type());
        }

        if (request.observationObjective() != null) {
            domain.setObservationObjective(request.observationObjective());
        }

        if (request.priorityIndicators() != null) {
            domain.setPriorityIndicators(DomainMapper.copyList(request.priorityIndicators()));
        }

        if (request.expectedPhenomena() != null) {
            domain.setExpectedPhenomena(DomainMapper.copyList(request.expectedPhenomena()));
        }

        if (request.status() != null) {
            domain.setStatus(request.status());
        }

        if (request.projectCount() != null) {
            domain.setProjectCount(request.projectCount());
        }

        if (request.participantCount() != null) {
            domain.setParticipantCount(request.participantCount());
        }

        if (request.discussionCount() != null) {
            domain.setDiscussionCount(request.discussionCount());
        }

        if (request.knowledgeCount() != null) {
            domain.setKnowledgeCount(request.knowledgeCount());
        }

        if (request.phenomenonCount() != null) {
            domain.setPhenomenonCount(request.phenomenonCount());
        }

        if (request.engagementRate() != null) {
            domain.setEngagementRate(request.engagementRate());
        }

        return DomainMapper.toResponseDTO(domainRepository.save(domain));
    }

    private String resolveUniqueSlug(String baseSlug, Long excludeId) {
        String candidate = baseSlug.isBlank() ? "domain" : baseSlug;
        String slug = candidate;
        int suffix = 2;

        while (isSlugTaken(slug, excludeId)) {
            slug = candidate + "-" + suffix++;
        }

        return slug;
    }

    private boolean isSlugTaken(String slug, Long excludeId) {
        if (excludeId == null) {
            return domainRepository.existsBySlug(slug);
        }
        return domainRepository.existsBySlugAndIdNot(slug, excludeId);
    }
}
