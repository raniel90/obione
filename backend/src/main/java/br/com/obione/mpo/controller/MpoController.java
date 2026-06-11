package br.com.obione.mpo.controller;

import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.mpo.dto.MpoCategoryDTO;
import br.com.obione.mpo.enums.AttributePhase;
import br.com.obione.mpo.service.MpoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/mpo")
@Tag(name = "MPO Catalog", description = "Catálogo oficial de atributos do Modelo de Observatório de Projetos (Vieira, 2022)")
public class MpoController {

    private final MpoService mpoService;

    public MpoController(MpoService mpoService) {
        this.mpoService = mpoService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Lista as 8 categorias MPO com seus atributos")
    public List<MpoCategoryDTO> getCategories() {
        return mpoService.getCategories();
    }

    @GetMapping("/attributes")
    @Operation(summary = "Lista os atributos MPO, com filtro opcional por fase do ciclo de vida")
    public List<MpoAttributeDTO> getAttributes(
            @RequestParam(required = false) AttributePhase phase) {
        return mpoService.getAttributes(phase);
    }
}
