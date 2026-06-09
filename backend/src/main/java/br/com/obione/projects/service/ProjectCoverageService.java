package br.com.obione.projects.service;

import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.mpo.MpoCatalog;
import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.observations.entity.Observation;
import br.com.obione.observations.repository.ObservationRepository;
import br.com.obione.projects.dto.CategoryCoverageDTO;
import br.com.obione.projects.dto.ProjectCoverageDTO;
import br.com.obione.projects.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Computes MPO coverage for a project: per category, how many in-scope attributes
 * (from {@link MpoCatalog}) have at least one observation referencing them.
 */
@Service
public class ProjectCoverageService {

    private static final String FORA_DE_ESCOPO = "fora_de_escopo";

    private final MpoCatalog catalog;
    private final ObservationRepository observationRepository;
    private final ProjectRepository projectRepository;

    public ProjectCoverageService(
            MpoCatalog catalog,
            ObservationRepository observationRepository,
            ProjectRepository projectRepository
    ) {
        this.catalog = catalog;
        this.observationRepository = observationRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public ProjectCoverageDTO coverage(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Projeto não encontrado: " + projectId);
        }

        Set<String> observed = observationRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(Observation::getAttributeId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());

        List<CategoryCoverageDTO> categories = catalog.categories().stream().map(cat -> {
            List<MpoAttributeDTO> inScope = cat.attributes().stream()
                    .filter(a -> !FORA_DE_ESCOPO.equals(a.type()))
                    .toList();
            int total = inScope.size();
            int covered = (int) inScope.stream().filter(a -> observed.contains(a.key())).count();
            return new CategoryCoverageDTO(cat.key(), cat.label(), total, covered, percentage(covered, total));
        }).toList();

        int totalInScope = categories.stream().mapToInt(CategoryCoverageDTO::total).sum();
        int coveredTotal = categories.stream().mapToInt(CategoryCoverageDTO::covered).sum();
        return new ProjectCoverageDTO(totalInScope, coveredTotal, percentage(coveredTotal, totalInScope), categories);
    }

    private static int percentage(int covered, int total) {
        return total == 0 ? 0 : Math.round((covered * 100f) / total);
    }
}
