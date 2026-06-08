package br.com.obione.knowledge.controller;

import br.com.obione.knowledge.dto.ConsolidateKnowledgeRequestDTO;
import br.com.obione.knowledge.dto.CreateKnowledgeRequestDTO;
import br.com.obione.knowledge.dto.KnowledgeResponseDTO;
import br.com.obione.knowledge.service.KnowledgeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Knowledge", description = "Conhecimento produzido pela comunidade observacional")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @GetMapping("/knowledge")
    @Operation(summary = "Listar todo o conhecimento")
    public List<KnowledgeResponseDTO> listKnowledge() {
        return knowledgeService.findAll();
    }

    @PostMapping("/knowledge")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar conhecimento proposto")
    public KnowledgeResponseDTO createKnowledge(@Valid @RequestBody CreateKnowledgeRequestDTO request) {
        return knowledgeService.create(request);
    }

    @GetMapping("/knowledge/{id}")
    @Operation(summary = "Buscar conhecimento por ID")
    public KnowledgeResponseDTO getKnowledge(@PathVariable Long id) {
        return knowledgeService.findById(id);
    }

    @GetMapping("/domains/{domainId}/knowledge")
    @Operation(summary = "Listar conhecimento por domínio")
    public List<KnowledgeResponseDTO> listByDomain(@PathVariable Long domainId) {
        return knowledgeService.findByDomainId(domainId);
    }

    @GetMapping("/projects/{projectId}/knowledge")
    @Operation(summary = "Listar conhecimento por projeto")
    public List<KnowledgeResponseDTO> listByProject(@PathVariable Long projectId) {
        return knowledgeService.findByProjectId(projectId);
    }

    @GetMapping("/discussions/{discussionId}/knowledge")
    @Operation(summary = "Listar conhecimento por discussão")
    public List<KnowledgeResponseDTO> listByDiscussion(@PathVariable Long discussionId) {
        return knowledgeService.findByDiscussionId(discussionId);
    }

    @PostMapping("/discussions/{discussionId}/consolidate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Consolidar conhecimento a partir de uma discussão")
    public KnowledgeResponseDTO consolidateKnowledge(
            @PathVariable Long discussionId,
            @Valid @RequestBody ConsolidateKnowledgeRequestDTO request
    ) {
        return knowledgeService.consolidate(discussionId, request);
    }
}
