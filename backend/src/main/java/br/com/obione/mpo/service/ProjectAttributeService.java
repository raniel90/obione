package br.com.obione.mpo.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.mpo.dto.ManageAttributesRequestDTO;
import br.com.obione.mpo.dto.ManageAttributesResponseDTO;
import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.mpo.dto.MpoCategoryDTO;
import br.com.obione.mpo.dto.ProjectAttributeValueDTO;
import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.mpo.entity.MpoCategory;
import br.com.obione.mpo.entity.ProjectAttributeHistory;
import br.com.obione.mpo.entity.ProjectAttributeValue;
import br.com.obione.mpo.enums.AttributePhase;
import br.com.obione.mpo.enums.AttributeStatus;
import br.com.obione.mpo.enums.ChangeSource;
import br.com.obione.mpo.repository.MpoAttributeRepository;
import br.com.obione.mpo.repository.MpoCategoryRepository;
import br.com.obione.mpo.repository.ProjectAttributeHistoryRepository;
import br.com.obione.mpo.repository.ProjectAttributeValueRepository;
import br.com.obione.observations.entity.Observation;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectAttributeService {

    private final ProjectAttributeValueRepository valueRepo;
    private final ProjectAttributeHistoryRepository historyRepo;
    private final MpoAttributeRepository mpoAttributeRepo;
    private final MpoCategoryRepository mpoCategoryRepo;
    private final ProjectRepository projectRepo;

    public ProjectAttributeService(
            ProjectAttributeValueRepository valueRepo,
            ProjectAttributeHistoryRepository historyRepo,
            MpoAttributeRepository mpoAttributeRepo,
            MpoCategoryRepository mpoCategoryRepo,
            ProjectRepository projectRepo
    ) {
        this.valueRepo = valueRepo;
        this.historyRepo = historyRepo;
        this.mpoAttributeRepo = mpoAttributeRepo;
        this.mpoCategoryRepo = mpoCategoryRepo;
        this.projectRepo = projectRepo;
    }

    /**
     * Retorna o mapa completo de cobertura MPO do projeto.
     * Para cada um dos 45 atributos, retorna o estado atual (NOT_OBSERVED se ainda não registrado).
     */
    @Transactional(readOnly = true)
    public List<ProjectAttributeValueDTO> getAttributeMap(Long projectId) {
        ensureProjectExists(projectId);

        List<MpoAttribute> allAttrs = mpoAttributeRepo.findAll();
        Map<String, ProjectAttributeValue> existing = valueRepo.findByProject_Id(projectId)
                .stream().collect(Collectors.toMap(v -> v.getMpoAttribute().getCode(), v -> v));

        return allAttrs.stream()
                .sorted(Comparator.comparingInt(a -> a.getCategory().getOrderIndex()))
                .map(attr -> {
                    ProjectAttributeValue value = existing.get(attr.getCode());
                    return toDTO(attr, value);
                })
                .toList();
    }

    /**
     * Chamado quando uma Observation é criada/atualizada com um MpoAttribute associado.
     * Cria ou atualiza o ProjectAttributeValue para PARTIAL e registra histórico.
     */
    @Transactional
    public void applyObservationEffect(Project project, MpoAttribute mpoAttribute, Observation observation) {
        if (mpoAttribute == null) return;

        Optional<ProjectAttributeValue> existing =
                valueRepo.findByProject_IdAndMpoAttribute_Code(project.getId(), mpoAttribute.getCode());

        ProjectAttributeValue pav;
        String previousValue;
        AttributeStatus previousStatus;

        if (existing.isPresent()) {
            pav = existing.get();
            previousValue = pav.getCurrentValue();
            previousStatus = pav.getStatus();
        } else {
            pav = ProjectAttributeValue.builder()
                    .project(project)
                    .mpoAttribute(mpoAttribute)
                    .build();
            previousValue = null;
            previousStatus = AttributeStatus.NOT_OBSERVED;
        }

        String newValue = pav.getCurrentValue() != null
                ? pav.getCurrentValue()
                : observation.getTitle();

        if (pav.getStatus() != AttributeStatus.FILLED) {
            pav.setStatus(AttributeStatus.PARTIAL);
        }
        pav.setLastObservationId(observation.getId());

        ProjectAttributeValue saved = valueRepo.save(pav);

        if (previousStatus != saved.getStatus() || !java.util.Objects.equals(previousValue, newValue)) {
            historyRepo.save(ProjectAttributeHistory.builder()
                    .projectAttributeValue(saved)
                    .previousValue(previousValue)
                    .newValue(newValue)
                    .changeSource(ChangeSource.OBSERVATION)
                    .observationId(observation.getId())
                    .changedBy(observation.getCreatedBy() != null ? observation.getCreatedBy().getName() : null)
                    .build());
        }
    }

    /**
     * Preenche diretamente um atributo MPO do projeto (ex: no cadastro ou edição).
     */
    @Transactional
    public ProjectAttributeValueDTO setDirectValue(Long projectId, String attributeCode,
                                                    String value, AttributeStatus status,
                                                    String updatedBy) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));
        MpoAttribute attr = mpoAttributeRepo.findByCode(attributeCode)
                .orElseThrow(() -> new ResourceNotFoundException("Atributo MPO não encontrado: " + attributeCode));

        Optional<ProjectAttributeValue> existing =
                valueRepo.findByProject_IdAndMpoAttribute_Code(projectId, attributeCode);

        ProjectAttributeValue pav;
        String previousValue;

        if (existing.isPresent()) {
            pav = existing.get();
            previousValue = pav.getCurrentValue();
        } else {
            pav = ProjectAttributeValue.builder()
                    .project(project)
                    .mpoAttribute(attr)
                    .build();
            previousValue = null;
        }

        pav.setCurrentValue(value);
        pav.setStatus(status != null ? status : AttributeStatus.FILLED);
        pav.setUpdatedBy(updatedBy);

        ProjectAttributeValue saved = valueRepo.save(pav);

        historyRepo.save(ProjectAttributeHistory.builder()
                .projectAttributeValue(saved)
                .previousValue(previousValue)
                .newValue(value)
                .changeSource(ChangeSource.DIRECT)
                .changedBy(updatedBy)
                .build());

        return toDTO(attr, saved);
    }

    /** Retorna atributos agrupados por categoria com seus valores de cobertura. */
    @Transactional(readOnly = true)
    public List<MpoCategoryDTO> getAttributeMapGrouped(Long projectId) {
        ensureProjectExists(projectId);
        List<ProjectAttributeValueDTO> flatMap = getAttributeMap(projectId);
        List<MpoCategory> categories = mpoCategoryRepo.findAllByOrderByOrderIndexAsc();

        Map<String, List<ProjectAttributeValueDTO>> byCategory = flatMap.stream()
                .collect(Collectors.groupingBy(ProjectAttributeValueDTO::categoryCode));

        return categories.stream()
                .map(cat -> {
                    List<MpoAttributeDTO> attrs = mpoAttributeRepo
                            .findByCategory_CodeOrderByCodeAsc(cat.getCode())
                            .stream().map(this::toAttributeDTO).toList();
                    return new MpoCategoryDTO(cat.getId(), cat.getCode(), cat.getName(),
                            cat.getOrderIndex(), attrs);
                }).toList();
    }

    /**
     * Adiciona e remove atributos MPO associados a um projeto.
     * Atributos com dados (valor preenchido ou observação vinculada) só são removidos se force=true.
     */
    @Transactional
    public ManageAttributesResponseDTO manageAttributes(Long projectId, ManageAttributesRequestDTO request) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));

        List<String> addCodes    = request.add()    != null ? request.add()    : List.of();
        List<String> removeCodes = request.remove() != null ? request.remove() : List.of();

        List<String> added   = new ArrayList<>();
        List<String> removed = new ArrayList<>();
        List<String> blocked = new ArrayList<>();

        // ── ADD ──
        for (String code : addCodes) {
            MpoAttribute attr = mpoAttributeRepo.findByCode(code)
                    .orElseThrow(() -> new ResourceNotFoundException("Atributo MPO não encontrado: " + code));

            boolean exists = valueRepo.findByProject_IdAndMpoAttribute_Code(projectId, code).isPresent();
            if (!exists) {
                valueRepo.save(ProjectAttributeValue.builder()
                        .project(project)
                        .mpoAttribute(attr)
                        .status(AttributeStatus.NOT_OBSERVED)
                        .build());
            }
            added.add(code);
        }

        // atualizar initialAttributeIds do projeto
        Set<String> currentIds = new java.util.LinkedHashSet<>(project.getInitialAttributeIds());
        currentIds.addAll(addCodes);

        // ── REMOVE ──
        for (String code : removeCodes) {
            Optional<ProjectAttributeValue> pavOpt =
                    valueRepo.findByProject_IdAndMpoAttribute_Code(projectId, code);

            if (pavOpt.isPresent()) {
                ProjectAttributeValue pav = pavOpt.get();
                boolean hasData = pav.getStatus() != AttributeStatus.NOT_OBSERVED
                        || pav.getLastObservationId() != null;

                if (hasData && !request.force()) {
                    blocked.add(code);
                    continue;
                }
                valueRepo.delete(pav);
            }
            currentIds.remove(code);
            removed.add(code);
        }

        project.setInitialAttributeIds(new ArrayList<>(currentIds));
        projectRepo.save(project);

        return new ManageAttributesResponseDTO(added, removed, blocked);
    }

    // ── mappers internos ────────────────────────────────────────────────────

    private ProjectAttributeValueDTO toDTO(MpoAttribute attr, ProjectAttributeValue value) {
        return new ProjectAttributeValueDTO(
                value != null ? value.getId() : null,
                attr.getCode(),
                attr.getName(),
                attr.getDescription(),
                attr.getPhase(),
                attr.getCategory().getCode(),
                attr.getCategory().getName(),
                value != null ? value.getCurrentValue() : null,
                value != null ? value.getStatus() : AttributeStatus.NOT_OBSERVED,
                value != null ? value.getLastObservationId() : null,
                value != null ? value.getUpdatedBy() : null,
                value != null ? value.getUpdatedAt() : null
        );
    }

    private MpoAttributeDTO toAttributeDTO(MpoAttribute attr) {
        return new MpoAttributeDTO(
                attr.getId(), attr.getCode(), attr.getName(),
                attr.getDescription(), attr.getPhase(), attr.getFillMode(),
                attr.getCategory().getCode(), attr.getCategory().getName()
        );
    }

    private void ensureProjectExists(Long projectId) {
        if (!projectRepo.existsById(projectId)) {
            throw new ResourceNotFoundException("Projeto não encontrado: " + projectId);
        }
    }
}
