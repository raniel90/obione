package br.com.obione.observations.service;

import br.com.obione.ai.service.AiSuggestionAcceptanceService;
import br.com.obione.common.exception.BadRequestException;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.observations.dto.CreateObservationRequestDTO;
import br.com.obione.observations.dto.ObservationResponseDTO;
import br.com.obione.observations.dto.UpdateObservationRequestDTO;
import br.com.obione.observations.entity.Observation;
import br.com.obione.observations.enums.ObservationImpact;
import br.com.obione.observations.enums.ObservationOrigin;
import br.com.obione.observations.enums.ObservationStatus;
import br.com.obione.observations.mapper.ObservationMapper;
import br.com.obione.observations.repository.ObservationRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.RiskLevel;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.users.entity.User;
import br.com.obione.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ObservationService {

    private final ObservationRepository observationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AiSuggestionAcceptanceService acceptanceService;

    public ObservationService(
            ObservationRepository observationRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            AiSuggestionAcceptanceService acceptanceService
    ) {
        this.observationRepository = observationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.acceptanceService = acceptanceService;
    }

    @Transactional(readOnly = true)
    public List<ObservationResponseDTO> findByProjectId(Long projectId) {
        ensureProjectExists(projectId);
        return observationRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(ObservationMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ObservationResponseDTO findById(Long id) {
        return observationRepository.findById(id)
                .map(ObservationMapper::toResponseDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Observação não encontrada: " + id));
    }

    @Transactional
    public ObservationResponseDTO create(Long projectId, CreateObservationRequestDTO request) {
        Project project = loadProject(projectId);

        if (project.getStatus() == ProjectStatus.CLOSED) {
            throw new BadRequestException("Não é possível registrar observação em projeto encerrado");
        }

        // An observation born from an accepted AI suggestion is always AI_SUGGESTED.
        ObservationOrigin origin = request.suggestionId() != null
                ? ObservationOrigin.AI_SUGGESTED
                : (request.origin() != null ? request.origin() : ObservationOrigin.MANUAL);

        Observation observation = Observation.builder()
                .project(project)
                .title(request.title().trim())
                .description(request.description().trim())
                .attributeId(request.attributeId())
                .phenomenonId(request.phenomenonId())
                .impact(request.impact() != null ? request.impact() : ObservationImpact.MEDIUM)
                .risk(request.risk() != null ? request.risk() : RiskLevel.MODERATE)
                .interpretation(request.interpretation())
                .status(request.status() != null ? request.status() : ObservationStatus.REGISTERED)
                .origin(origin)
                .sourceExcerpt(request.sourceExcerpt())
                .suggestionId(request.suggestionId())
                .createdBy(resolveCreatedBy(request.createdById()))
                .build();

        Observation saved = observationRepository.save(observation);
        acceptanceService.markAccepted(request.suggestionId());
        ProjectObservationEffects.apply(project, saved.getRisk());
        projectRepository.save(project);

        return ObservationMapper.toResponseDTO(saved);
    }

    @Transactional
    public ObservationResponseDTO update(Long id, UpdateObservationRequestDTO request) {
        Observation observation = loadObservation(id);
        Project project = observation.getProject();

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new BadRequestException("Título não pode ser vazio");
            }
            observation.setTitle(request.title().trim());
        }

        if (request.description() != null) {
            if (request.description().isBlank()) {
                throw new BadRequestException("Descrição não pode ser vazia");
            }
            observation.setDescription(request.description().trim());
        }

        if (request.attributeId() != null) {
            observation.setAttributeId(request.attributeId());
        }

        if (request.phenomenonId() != null) {
            observation.setPhenomenonId(request.phenomenonId());
        }

        if (request.impact() != null) {
            observation.setImpact(request.impact());
        }

        boolean riskChanged = false;
        if (request.risk() != null) {
            observation.setRisk(request.risk());
            riskChanged = true;
        }

        if (request.interpretation() != null) {
            observation.setInterpretation(request.interpretation());
        }

        if (request.status() != null) {
            observation.setStatus(request.status());
        }

        if (request.createdById() != null) {
            observation.setCreatedBy(resolveCreatedBy(request.createdById()));
        }

        Observation saved = observationRepository.save(observation);

        if (riskChanged) {
            ProjectObservationEffects.apply(project, saved.getRisk());
        } else {
            project.setUpdatedAt(Instant.now());
        }
        projectRepository.save(project);

        return ObservationMapper.toResponseDTO(saved);
    }

    @Transactional
    public ObservationResponseDTO markAsAnalyzed(Long id) {
        Observation observation = loadObservation(id);
        Project project = observation.getProject();

        observation.setStatus(ObservationStatus.IN_ANALYSIS);
        Observation saved = observationRepository.save(observation);

        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);

        return ObservationMapper.toResponseDTO(saved);
    }

    private void ensureProjectExists(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Projeto não encontrado: " + projectId);
        }
    }

    private Project loadProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));
    }

    private Observation loadObservation(Long id) {
        return observationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Observação não encontrada: " + id));
    }

    private User resolveCreatedBy(Long createdById) {
        if (createdById == null) {
            return null;
        }
        return userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + createdById));
    }
}
