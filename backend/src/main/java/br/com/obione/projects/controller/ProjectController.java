package br.com.obione.projects.controller;

import br.com.obione.projects.dto.CloseProjectObservationRequestDTO;
import br.com.obione.projects.dto.CreateProjectRequestDTO;
import br.com.obione.projects.dto.ProjectCoverageDTO;
import br.com.obione.projects.dto.ProjectResponseDTO;
import br.com.obione.projects.dto.UpdateProjectRequestDTO;
import br.com.obione.projects.dto.UpdateProjectStatusRequestDTO;
import br.com.obione.projects.service.ProjectCoverageService;
import br.com.obione.projects.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/projects")
@Tag(name = "Projects", description = "Gestão de projetos do observatório")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectCoverageService coverageService;

    public ProjectController(ProjectService projectService, ProjectCoverageService coverageService) {
        this.projectService = projectService;
        this.coverageService = coverageService;
    }

    @GetMapping
    @Operation(summary = "Listar todos os projetos")
    public List<ProjectResponseDTO> listProjects() {
        return projectService.findAll();
    }

    @GetMapping("/domain/{domainId}")
    @Operation(summary = "Listar projetos por domínio")
    public List<ProjectResponseDTO> listProjectsByDomain(@PathVariable Long domainId) {
        return projectService.findByDomainId(domainId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar projeto por ID")
    public ProjectResponseDTO getProject(@PathVariable Long id) {
        return projectService.findById(id);
    }

    @GetMapping("/{id}/coverage")
    @Operation(summary = "Cobertura do MPO do projeto (atributos com ≥1 observação)")
    public ProjectCoverageDTO getCoverage(@PathVariable Long id) {
        return coverageService.coverage(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar projeto")
    public ProjectResponseDTO createProject(@Valid @RequestBody CreateProjectRequestDTO request) {
        return projectService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar projeto")
    public ProjectResponseDTO updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequestDTO request
    ) {
        return projectService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do projeto")
    public ProjectResponseDTO updateProjectStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectStatusRequestDTO request
    ) {
        return projectService.updateStatus(id, request);
    }

    @PostMapping("/{id}/close-observation")
    @Operation(summary = "Encerrar observação do projeto")
    public ProjectResponseDTO closeProjectObservation(
            @PathVariable Long id,
            @Valid @RequestBody CloseProjectObservationRequestDTO request
    ) {
        return projectService.closeObservation(id, request);
    }
}
