package br.com.obione.phenomena.controller;

import br.com.obione.phenomena.dto.CreatePhenomenonRequestDTO;
import br.com.obione.phenomena.dto.PhenomenonResponseDTO;
import br.com.obione.phenomena.dto.UpdatePhenomenonRequestDTO;
import br.com.obione.phenomena.service.PhenomenonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Phenomena", description = "Fenômenos observados no observatório")
public class PhenomenonController {

    private final PhenomenonService phenomenonService;

    public PhenomenonController(PhenomenonService phenomenonService) {
        this.phenomenonService = phenomenonService;
    }

    @GetMapping("/phenomena")
    @Operation(summary = "Listar todos os fenômenos")
    public List<PhenomenonResponseDTO> listPhenomena() {
        return phenomenonService.findAll();
    }

    @PostMapping("/phenomena")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar fenômeno")
    public PhenomenonResponseDTO createPhenomenon(@Valid @RequestBody CreatePhenomenonRequestDTO request) {
        return phenomenonService.create(request);
    }

    @GetMapping("/phenomena/{id}")
    @Operation(summary = "Buscar fenômeno por ID")
    public PhenomenonResponseDTO getPhenomenon(@PathVariable Long id) {
        return phenomenonService.findById(id);
    }

    @GetMapping("/projects/{projectId}/phenomena")
    @Operation(summary = "Listar fenômenos por projeto")
    public List<PhenomenonResponseDTO> listByProject(@PathVariable Long projectId) {
        return phenomenonService.findByProjectId(projectId);
    }

    @GetMapping("/domains/{domainId}/phenomena")
    @Operation(summary = "Listar fenômenos por domínio")
    public List<PhenomenonResponseDTO> listByDomain(@PathVariable Long domainId) {
        return phenomenonService.findByDomainId(domainId);
    }

    @PutMapping("/phenomena/{id}")
    @Operation(summary = "Atualizar fenômeno")
    public PhenomenonResponseDTO updatePhenomenon(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePhenomenonRequestDTO request
    ) {
        return phenomenonService.update(id, request);
    }
}
