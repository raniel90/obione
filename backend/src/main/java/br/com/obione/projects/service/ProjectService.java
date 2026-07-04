package br.com.obione.projects.service;

import br.com.obione.ai.service.AiSuggestionAcceptanceService;
import br.com.obione.common.exception.BadRequestException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.projects.dto.CloseProjectObservationRequestDTO;
import br.com.obione.projects.dto.CreateProjectRequestDTO;
import br.com.obione.projects.dto.ProjectResponseDTO;
import br.com.obione.projects.dto.UpdateProjectRequestDTO;
import br.com.obione.projects.dto.UpdateProjectStatusRequestDTO;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.enums.ClientEngagement;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.RiskLevel;
import br.com.obione.projects.mapper.ProjectMapper;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final DomainRepository domainRepository;
    private final UserRepository userRepository;
    private final AiSuggestionAcceptanceService acceptanceService;
    private final PhenomenonRepository phenomenonRepository;
    private final CurrentUser currentUser;

    public ProjectService(
            ProjectRepository projectRepository,
            DomainRepository domainRepository,
            UserRepository userRepository,
            AiSuggestionAcceptanceService acceptanceService,
            PhenomenonRepository phenomenonRepository,
            CurrentUser currentUser
    ) {
        this.projectRepository = projectRepository;
        this.domainRepository = domainRepository;
        this.userRepository = userRepository;
        this.acceptanceService = acceptanceService;
        this.phenomenonRepository = phenomenonRepository;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> findAll() {
        List<Project> projects = currentUser.isClient()
                ? projectRepository.findByClient_Id(currentUser.id())
                : projectRepository.findAll();
        return projects.stream()
                .map(ProjectMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponseDTO findById(Long id) {
        Project project = currentUser.isClient()
                ? projectRepository.findByIdAndClient_Id(id, currentUser.id())
                        .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + id))
                : projectRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + id));
        return ProjectMapper.toResponseDTO(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDTO> findByDomainId(Long domainId) {
        if (!domainRepository.existsById(domainId)) {
            throw new ResourceNotFoundException("Domínio não encontrado: " + domainId);
        }
        List<Project> projects = currentUser.isClient()
                ? projectRepository.findByDomain_IdAndClient_Id(domainId, currentUser.id())
                : projectRepository.findByDomain_Id(domainId);
        return projects.stream()
                .map(ProjectMapper::toResponseDTO)
                .toList();
    }

    @Transactional
    public ProjectResponseDTO create(CreateProjectRequestDTO request) {
        int progress = request.progress() != null ? request.progress() : 0;
        validateProgress(progress);

        Domain domain = resolveDomain(request.domainId());

        Project project = Project.builder()
                .name(request.name().trim())
                .domain(domain)
                .client(resolveClient(request.clientId()))
                .consultant(resolveConsultant(request.consultantId()))
                .type(request.type())
                .status(request.status() != null ? request.status() : ProjectStatus.OBSERVATION)
                .summary(request.summary())
                .observationObjective(request.observationObjective())
                .initialAttributeIds(ProjectMapper.copyList(request.initialAttributeIds()))
                .expectedPhenomena(ProjectMapper.copyList(request.expectedPhenomena()))
                .progress(progress)
                .riskLevel(request.riskLevel() != null ? request.riskLevel() : RiskLevel.LOW)
                .clientEngagement(request.clientEngagement() != null ? request.clientEngagement() : ClientEngagement.MEDIUM)
                .startDate(request.startDate())
                .expectedEndDate(request.expectedEndDate())
                .build();

        Project saved = projectRepository.save(project);
        acceptanceService.markAccepted(request.suggestionId());
        seedExpectedPhenomena(saved);
        return ProjectMapper.toResponseDTO(saved);
    }

    /**
     * Expected phenomena declared at creation become real Phenomenon entities
     * (hypotheses under observation, zero evidence) so the observatory can
     * confirm or discard them as observations accumulate.
     */
    private void seedExpectedPhenomena(Project project) {
        if (project.getExpectedPhenomena() == null) {
            return;
        }
        project.getExpectedPhenomena().stream()
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .distinct()
                .forEach(name -> phenomenonRepository.save(Phenomenon.builder()
                        .domain(project.getDomain())
                        .project(project)
                        .name(name)
                        .description("Hipótese declarada no cadastro do projeto, aguardando evidências.")
                        .impact(PhenomenonImpact.MEDIUM)
                        .trend(PhenomenonTrend.STABLE)
                        .status(PhenomenonStatus.OBSERVED)
                        .build()));
    }

    @Transactional
    public ProjectResponseDTO update(Long id, UpdateProjectRequestDTO request) {
        Project project = loadProject(id);

        if (request.name() != null && !request.name().isBlank()) {
            project.setName(request.name().trim());
        }

        if (request.domainId() != null) {
            project.setDomain(resolveDomain(request.domainId()));
        }

        if (request.clientId() != null) {
            project.setClient(resolveClient(request.clientId()));
        }

        if (request.consultantId() != null) {
            project.setConsultant(resolveConsultant(request.consultantId()));
        }

        if (request.type() != null) {
            project.setType(request.type());
        }

        if (request.status() != null) {
            project.setStatus(request.status());
        }

        if (request.summary() != null) {
            project.setSummary(request.summary());
        }

        if (request.observationObjective() != null) {
            project.setObservationObjective(request.observationObjective());
        }

        if (request.initialAttributeIds() != null) {
            project.setInitialAttributeIds(ProjectMapper.copyList(request.initialAttributeIds()));
        }

        if (request.expectedPhenomena() != null) {
            project.setExpectedPhenomena(ProjectMapper.copyList(request.expectedPhenomena()));
        }

        if (request.progress() != null) {
            validateProgress(request.progress());
            project.setProgress(request.progress());
        }

        if (request.riskLevel() != null) {
            project.setRiskLevel(request.riskLevel());
        }

        if (request.clientEngagement() != null) {
            project.setClientEngagement(request.clientEngagement());
        }

        if (request.startDate() != null) {
            project.setStartDate(request.startDate());
        }

        if (request.expectedEndDate() != null) {
            project.setExpectedEndDate(request.expectedEndDate());
        }

        return ProjectMapper.toResponseDTO(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponseDTO updateStatus(Long id, UpdateProjectStatusRequestDTO request) {
        Project project = loadProject(id);
        project.setStatus(request.status());
        return ProjectMapper.toResponseDTO(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponseDTO closeObservation(Long id, CloseProjectObservationRequestDTO request) {
        Project project = loadProject(id);
        project.setStatus(ProjectStatus.CLOSED);
        project.setProgress(100);

        if (request.closureSummary() != null) {
            project.setClosureSummary(request.closureSummary());
        }
        if (request.lessonsLearned() != null) {
            project.setLessonsLearned(request.lessonsLearned());
        }
        if (request.identifiedPatterns() != null) {
            project.setIdentifiedPatterns(request.identifiedPatterns());
        }
        if (request.futureRecommendation() != null) {
            project.setFutureRecommendation(request.futureRecommendation());
        }

        return ProjectMapper.toResponseDTO(projectRepository.save(project));
    }

    /**
     * Staff-only load (no client isolation). Only call from write operations already guarded by
     * {@code hasAnyRole("CONSULTANT","ADMIN")} in {@code SecurityConfig}.
     */
    private Project loadProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + id));
    }

    private Domain resolveDomain(Long domainId) {
        return domainRepository.findById(domainId)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + domainId));
    }

    private User resolveClient(Long clientId) {
        if (clientId == null) {
            return null;
        }
        return userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado: " + clientId));
    }

    private User resolveConsultant(Long consultantId) {
        if (consultantId == null) {
            return null;
        }
        return userRepository.findById(consultantId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultor não encontrado: " + consultantId));
    }

    private void validateProgress(int progress) {
        if (progress < 0 || progress > 100) {
            throw new BadRequestException("Progresso deve estar entre 0 e 100");
        }
    }
}
