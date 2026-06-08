package br.com.obione.discussions.service;

import br.com.obione.common.exception.BadRequestException;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.discussions.dto.CreateDiscussionContributionRequestDTO;
import br.com.obione.discussions.dto.CreateDiscussionRequestDTO;
import br.com.obione.discussions.dto.DiscussionContributionResponseDTO;
import br.com.obione.discussions.dto.DiscussionResponseDTO;
import br.com.obione.discussions.dto.UpdateDiscussionStatusRequestDTO;
import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.entity.DiscussionContribution;
import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.enums.DiscussionVisibility;
import br.com.obione.discussions.mapper.DiscussionMapper;
import br.com.obione.discussions.repository.DiscussionContributionRepository;
import br.com.obione.discussions.repository.DiscussionRepository;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.observations.repository.ObservationRepository;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionContributionRepository contributionRepository;
    private final DomainRepository domainRepository;
    private final ProjectRepository projectRepository;
    private final PhenomenonRepository phenomenonRepository;
    private final ObservationRepository observationRepository;
    private final UserRepository userRepository;

    public DiscussionService(
            DiscussionRepository discussionRepository,
            DiscussionContributionRepository contributionRepository,
            DomainRepository domainRepository,
            ProjectRepository projectRepository,
            PhenomenonRepository phenomenonRepository,
            ObservationRepository observationRepository,
            UserRepository userRepository
    ) {
        this.discussionRepository = discussionRepository;
        this.contributionRepository = contributionRepository;
        this.domainRepository = domainRepository;
        this.projectRepository = projectRepository;
        this.phenomenonRepository = phenomenonRepository;
        this.observationRepository = observationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<DiscussionResponseDTO> findAll() {
        return discussionRepository.findAll().stream()
                .map(this::toResponseWithContributions)
                .toList();
    }

    @Transactional(readOnly = true)
    public DiscussionResponseDTO findById(Long id) {
        Discussion discussion = loadDiscussion(id);
        return toResponseWithContributions(discussion);
    }

    @Transactional(readOnly = true)
    public List<DiscussionResponseDTO> findByDomainId(Long domainId) {
        ensureDomainExists(domainId);
        return discussionRepository.findByDomain_IdOrderByCreatedAtDesc(domainId).stream()
                .map(this::toResponseWithContributions)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiscussionResponseDTO> findByProjectId(Long projectId) {
        ensureProjectExists(projectId);
        return discussionRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toResponseWithContributions)
                .toList();
    }

    @Transactional
    public DiscussionResponseDTO create(CreateDiscussionRequestDTO request) {
        Domain domain = resolveDomain(request.domainId());
        Project project = resolveProject(request.projectId());
        Phenomenon phenomenon = resolvePhenomenon(request.phenomenonId());
        validateObservationId(request.observationId());

        validateRelationships(domain, project, phenomenon, request.observationId());

        Discussion discussion = Discussion.builder()
                .domain(domain)
                .project(project)
                .phenomenon(phenomenon)
                .observationId(request.observationId())
                .title(request.title().trim())
                .question(request.question().trim())
                .status(request.status() != null ? request.status() : DiscussionStatus.OPEN)
                .visibility(request.visibility() != null ? request.visibility() : DiscussionVisibility.DOMAIN)
                .createdBy(resolveUser(request.createdById()))
                .build();

        Discussion saved = discussionRepository.save(discussion);
        return DiscussionMapper.toResponseDTO(saved, List.of());
    }

    @Transactional
    public DiscussionResponseDTO updateStatus(Long id, UpdateDiscussionStatusRequestDTO request) {
        Discussion discussion = loadDiscussion(id);
        discussion.setStatus(request.status());
        Discussion saved = discussionRepository.save(discussion);
        return toResponseWithContributions(saved);
    }

    @Transactional
    public DiscussionResponseDTO archive(Long id) {
        Discussion discussion = loadDiscussion(id);
        discussion.setStatus(DiscussionStatus.ARCHIVED);
        Discussion saved = discussionRepository.save(discussion);
        return toResponseWithContributions(saved);
    }

    @Transactional
    public DiscussionContributionResponseDTO addContribution(
            Long discussionId,
            CreateDiscussionContributionRequestDTO request
    ) {
        Discussion discussion = loadDiscussion(discussionId);

        if (discussion.getStatus() == DiscussionStatus.ARCHIVED) {
            throw new BadRequestException("Não é possível adicionar contribuição em discussão arquivada");
        }

        DiscussionContribution contribution = DiscussionContribution.builder()
                .discussion(discussion)
                .user(resolveUser(request.userId()))
                .type(request.type())
                .text(request.text().trim())
                .build();

        DiscussionContribution saved = contributionRepository.save(contribution);
        discussion.setUpdatedAt(Instant.now());
        discussionRepository.save(discussion);

        return DiscussionMapper.toContributionResponseDTO(saved);
    }

    private DiscussionResponseDTO toResponseWithContributions(Discussion discussion) {
        List<DiscussionContribution> contributions =
                contributionRepository.findByDiscussion_IdOrderByCreatedAtAsc(discussion.getId());
        return DiscussionMapper.toResponseDTO(discussion, contributions);
    }

    private Discussion loadDiscussion(Long id) {
        return discussionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussão não encontrada: " + id));
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

    private Phenomenon resolvePhenomenon(Long phenomenonId) {
        if (phenomenonId == null) {
            return null;
        }
        return phenomenonRepository.findById(phenomenonId)
                .orElseThrow(() -> new ResourceNotFoundException("Fenômeno não encontrado: " + phenomenonId));
    }

    private void validateObservationId(Long observationId) {
        if (observationId == null) {
            return;
        }
        if (!observationRepository.existsById(observationId)) {
            throw new ResourceNotFoundException("Observação não encontrada: " + observationId);
        }
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + userId));
    }

    private void validateRelationships(
            Domain domain,
            Project project,
            Phenomenon phenomenon,
            Long observationId
    ) {
        if (project != null && !project.getDomain().getId().equals(domain.getId())) {
            throw new BadRequestException("O projeto informado não pertence ao domínio selecionado");
        }

        if (phenomenon != null && !phenomenon.getDomain().getId().equals(domain.getId())) {
            throw new BadRequestException("O fenômeno informado não pertence ao domínio selecionado");
        }

        if (observationId != null) {
            observationRepository.findById(observationId).ifPresent(observation -> {
                if (!observation.getProject().getDomain().getId().equals(domain.getId())) {
                    throw new BadRequestException("A observação informada não pertence ao domínio selecionado");
                }
            });
        }
    }
}
