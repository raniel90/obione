package br.com.obione.observations.controller;

import br.com.obione.observations.dto.CreateObservationRequestDTO;
import br.com.obione.observations.dto.ObservationResponseDTO;
import br.com.obione.observations.dto.UpdateObservationRequestDTO;
import br.com.obione.observations.service.ObservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Observations", description = "Registro de evidências observacionais dos projetos")
public class ObservationController {

    private final ObservationService observationService;

    public ObservationController(ObservationService observationService) {
        this.observationService = observationService;
    }

    @GetMapping("/projects/{projectId}/observations")
    @Operation(summary = "Listar observações de um projeto")
    public List<ObservationResponseDTO> listByProject(@PathVariable Long projectId) {
        return observationService.findByProjectId(projectId);
    }

    @PostMapping("/projects/{projectId}/observations")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar observação em um projeto")
    public ObservationResponseDTO create(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateObservationRequestDTO request
    ) {
        return observationService.create(projectId, request);
    }

    @GetMapping("/observations/{id}")
    @Operation(summary = "Buscar observação por ID")
    public ObservationResponseDTO getById(@PathVariable Long id) {
        return observationService.findById(id);
    }

    @PutMapping("/observations/{id}")
    @Operation(summary = "Atualizar observação")
    public ObservationResponseDTO update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateObservationRequestDTO request
    ) {
        return observationService.update(id, request);
    }

    @PatchMapping("/observations/{id}/analyze")
    @Operation(summary = "Marcar observação como em análise")
    public ObservationResponseDTO markAsAnalyzed(@PathVariable Long id) {
        return observationService.markAsAnalyzed(id);
    }

    @DeleteMapping("/observations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Excluir observação (sem conversa vinculada)")
    public void delete(@PathVariable Long id) {
        observationService.delete(id);
    }
}
