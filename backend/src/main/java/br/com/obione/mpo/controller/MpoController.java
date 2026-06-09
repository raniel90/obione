package br.com.obione.mpo.controller;

import br.com.obione.mpo.MpoCatalog;
import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.mpo.dto.MpoCategoryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/mpo")
@Tag(name = "MPO", description = "Catálogo canônico do Quadro 37 — a lente de observação (8 categorias, 44 atributos)")
public class MpoController {

    private final MpoCatalog catalog;

    public MpoController(MpoCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/categories")
    @Operation(summary = "Listar as 8 categorias do MPO com seus atributos")
    public List<MpoCategoryDTO> categories() {
        return catalog.categories();
    }

    @GetMapping("/attributes")
    @Operation(summary = "Listar os 44 atributos do MPO (flat)")
    public List<MpoAttributeDTO> attributes() {
        return catalog.attributes();
    }
}
