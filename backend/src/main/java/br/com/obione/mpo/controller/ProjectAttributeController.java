package br.com.obione.mpo.controller;

import br.com.obione.mpo.dto.ProjectAttributeValueDTO;
import br.com.obione.mpo.dto.SetAttributeValueRequestDTO;
import br.com.obione.mpo.service.ProjectAttributeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/attributes")
@Tag(name = "Project MPO Attributes", description = "Mapa de cobertura MPO por projeto")
public class ProjectAttributeController {

    private final ProjectAttributeService attributeService;

    public ProjectAttributeController(ProjectAttributeService attributeService) {
        this.attributeService = attributeService;
    }

    @GetMapping
    @Operation(summary = "Retorna o mapa completo de cobertura MPO do projeto (todos os 45 atributos com status)")
    public List<ProjectAttributeValueDTO> getAttributeMap(@PathVariable Long projectId) {
        return attributeService.getAttributeMap(projectId);
    }

    @PutMapping("/{attributeCode}")
    @Operation(summary = "Preenche ou atualiza o valor de um atributo MPO do projeto diretamente")
    public ProjectAttributeValueDTO setAttributeValue(
            @PathVariable Long projectId,
            @PathVariable String attributeCode,
            @Valid @RequestBody SetAttributeValueRequestDTO request) {
        return attributeService.setDirectValue(
                projectId, attributeCode, request.value(), request.status(), request.updatedBy());
    }
}
