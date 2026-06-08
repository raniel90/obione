package br.com.obione.domains.controller;

import br.com.obione.domains.dto.CreateDomainRequestDTO;
import br.com.obione.domains.dto.DomainResponseDTO;
import br.com.obione.domains.dto.UpdateDomainRequestDTO;
import br.com.obione.domains.service.DomainService;
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
@RequestMapping("/domains")
@Tag(name = "Domains", description = "Gestão de domínios do observatório")
public class DomainController {

    private final DomainService domainService;

    public DomainController(DomainService domainService) {
        this.domainService = domainService;
    }

    @GetMapping
    @Operation(summary = "Listar todos os domínios")
    public List<DomainResponseDTO> listDomains() {
        return domainService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar domínio")
    public DomainResponseDTO createDomain(@Valid @RequestBody CreateDomainRequestDTO request) {
        return domainService.create(request);
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Buscar domínio por slug")
    public DomainResponseDTO getDomainBySlug(@PathVariable String slug) {
        return domainService.findBySlug(slug);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar domínio por ID")
    public DomainResponseDTO getDomain(@PathVariable Long id) {
        return domainService.findById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar domínio")
    public DomainResponseDTO updateDomain(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDomainRequestDTO request
    ) {
        return domainService.update(id, request);
    }
}
