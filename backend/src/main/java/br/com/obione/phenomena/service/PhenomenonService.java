package br.com.obione.phenomena.service;

import br.com.obione.common.exception.BadRequestException;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.phenomena.dto.CreatePhenomenonRequestDTO;
import br.com.obione.phenomena.dto.PhenomenonResponseDTO;
import br.com.obione.phenomena.dto.UpdatePhenomenonRequestDTO;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;
import br.com.obione.phenomena.mapper.PhenomenonMapper;
import br.com.obione.observations.repository.ObservationRepository;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.projects.service.ProjectAccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PhenomenonService {

    private final PhenomenonRepository phenomenonRepository;
    private final DomainRepository domainRepository;
    private final ProjectRepository projectRepository;
    private final ObservationRepository observationRepository;
    private final CurrentUser currentUser;
    private final ProjectAccessGuard guard;

    public PhenomenonService(
            PhenomenonRepository phenomenonRepository,
            DomainRepository domainRepository,
            ProjectRepository projectRepository,
            ObservationRepository observationRepository,
            CurrentUser currentUser,
            ProjectAccessGuard guard
    ) {
        this.phenomenonRepository = phenomenonRepository;
        this.domainRepository = domainRepository;
        this.projectRepository = projectRepository;
        this.observationRepository = observationRepository;
        this.currentUser = currentUser;
        this.guard = guard;
    }

    /** Evidence is what the observatory actually registered: observations linked to the phenomenon. */
    private PhenomenonResponseDTO toDto(Phenomenon phenomenon) {
        int evidence = (int) observationRepository.countByPhenomenonId(String.valueOf(phenomenon.getId()));
        return PhenomenonMapper.toResponseDTO(phenomenon, evidence);
    }

    @Transactional(readOnly = true)
    public List<PhenomenonResponseDTO> findAll() {
        List<Phenomenon> all = phenomenonRepository.findAll();
        if (currentUser.isClient()) {
            // A CLIENT sees only phenomena that are not tied to any project (domain-level)
            // or that belong to one of their own projects.
            Set<Long> myProjectIds = clientProjectIds();
            all = all.stream()
                    .filter(p -> p.getProject() == null
                            || myProjectIds.contains(p.getProject().getId()))
                    .collect(Collectors.toList());
        }
        return all.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PhenomenonResponseDTO findById(Long id) {
        Phenomenon phenomenon = phenomenonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fenômeno não encontrado: " + id));
        if (phenomenon.getProject() != null) {
            guard.assertCanRead(phenomenon.getProject().getId());
        }
        return toDto(phenomenon);
    }

    @Transactional(readOnly = true)
    public List<PhenomenonResponseDTO> findByProjectId(Long projectId) {
        guard.assertCanRead(projectId);
        ensureProjectExists(projectId);
        return phenomenonRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PhenomenonResponseDTO> findByDomainId(Long domainId) {
        ensureDomainExists(domainId);
        return phenomenonRepository.findByDomain_IdOrderByCreatedAtDesc(domainId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PhenomenonResponseDTO create(CreatePhenomenonRequestDTO request) {
        Domain domain = resolveDomain(request.domainId());
        Project project = resolveProject(request.projectId());

        if (project != null && !project.getDomain().getId().equals(domain.getId())) {
            throw new BadRequestException("O projeto informado não pertence ao domínio selecionado");
        }

        int evidenceCount = request.evidenceCount() != null ? request.evidenceCount() : 0;
        validateEvidenceCount(evidenceCount);

        Phenomenon phenomenon = Phenomenon.builder()
                .domain(domain)
                .project(project)
                .name(request.name().trim())
                .description(request.description())
                .evidenceCount(evidenceCount)
                .relatedAttributeIds(PhenomenonMapper.joinRelatedAttributeIds(
                        PhenomenonMapper.copyList(request.relatedAttributeIds())
                ))
                .impact(request.impact() != null ? request.impact() : PhenomenonImpact.MEDIUM)
                .trend(request.trend() != null ? request.trend() : PhenomenonTrend.STABLE)
                .status(request.status() != null ? request.status() : PhenomenonStatus.OBSERVED)
                .build();

        return toDto(phenomenonRepository.save(phenomenon));
    }

    @Transactional
    public PhenomenonResponseDTO update(Long id, UpdatePhenomenonRequestDTO request) {
        Phenomenon phenomenon = loadPhenomenon(id);

        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw new BadRequestException("Nome não pode ser vazio");
            }
            phenomenon.setName(request.name().trim());
        }

        if (request.domainId() != null) {
            phenomenon.setDomain(resolveDomain(request.domainId()));
        }

        if (request.projectId() != null) {
            phenomenon.setProject(resolveProject(request.projectId()));
        }

        if (phenomenon.getProject() != null
                && !phenomenon.getProject().getDomain().getId().equals(phenomenon.getDomain().getId())) {
            throw new BadRequestException("O projeto informado não pertence ao domínio do fenômeno");
        }

        if (request.description() != null) {
            phenomenon.setDescription(request.description());
        }

        if (request.evidenceCount() != null) {
            validateEvidenceCount(request.evidenceCount());
            phenomenon.setEvidenceCount(request.evidenceCount());
        }

        if (request.relatedAttributeIds() != null) {
            phenomenon.setRelatedAttributeIds(
                    PhenomenonMapper.joinRelatedAttributeIds(request.relatedAttributeIds())
            );
        }

        if (request.impact() != null) {
            phenomenon.setImpact(request.impact());
        }

        if (request.trend() != null) {
            phenomenon.setTrend(request.trend());
        }

        if (request.status() != null) {
            phenomenon.setStatus(request.status());
        }

        return toDto(phenomenonRepository.save(phenomenon));
    }

    private Phenomenon loadPhenomenon(Long id) {
        return phenomenonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fenômeno não encontrado: " + id));
    }

    private void ensureDomainExists(Long domainId) {
        if (!domainRepository.existsById(domainId)) {
            throw new ResourceNotFoundException("Domínio não encontrado: " + domainId);
        }
    }

    private void ensureProjectExists(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Projeto não encontrado: " + projectId);
        }
    }

    private Domain resolveDomain(Long domainId) {
        return domainRepository.findById(domainId)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + domainId));
    }

    private Project resolveProject(Long projectId) {
        if (projectId == null) {
            return null;
        }
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));
    }

    private void validateEvidenceCount(int evidenceCount) {
        if (evidenceCount < 0) {
            throw new BadRequestException("A contagem de evidências não pode ser negativa");
        }
    }

    /** Returns the set of project IDs owned by the currently authenticated CLIENT. */
    private Set<Long> clientProjectIds() {
        return projectRepository.findByClient_Id(currentUser.id()).stream()
                .map(Project::getId)
                .collect(Collectors.toSet());
    }
}
