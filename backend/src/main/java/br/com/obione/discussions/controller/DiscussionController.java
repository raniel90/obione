package br.com.obione.discussions.controller;

import br.com.obione.discussions.dto.CreateDiscussionContributionRequestDTO;
import br.com.obione.discussions.dto.CreateDiscussionRequestDTO;
import br.com.obione.discussions.dto.DiscussionContributionResponseDTO;
import br.com.obione.discussions.dto.DiscussionResponseDTO;
import br.com.obione.discussions.dto.UpdateDiscussionStatusRequestDTO;
import br.com.obione.discussions.service.DiscussionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Tag(name = "Discussions", description = "Discussões observacionais do observatório")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @GetMapping("/discussions")
    @Operation(summary = "Listar todas as discussões")
    public List<DiscussionResponseDTO> listDiscussions() {
        return discussionService.findAll();
    }

    @PostMapping("/discussions")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar discussão observacional")
    public DiscussionResponseDTO createDiscussion(@Valid @RequestBody CreateDiscussionRequestDTO request) {
        return discussionService.create(request);
    }

    @GetMapping("/discussions/{id}")
    @Operation(summary = "Buscar discussão por ID")
    public DiscussionResponseDTO getDiscussion(@PathVariable Long id) {
        return discussionService.findById(id);
    }

    @GetMapping("/domains/{domainId}/discussions")
    @Operation(summary = "Listar discussões por domínio")
    public List<DiscussionResponseDTO> listByDomain(@PathVariable Long domainId) {
        return discussionService.findByDomainId(domainId);
    }

    @GetMapping("/projects/{projectId}/discussions")
    @Operation(summary = "Listar discussões por projeto")
    public List<DiscussionResponseDTO> listByProject(@PathVariable Long projectId) {
        return discussionService.findByProjectId(projectId);
    }

    @PostMapping("/discussions/{id}/contributions")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Adicionar contribuição à discussão")
    public DiscussionContributionResponseDTO addContribution(
            @PathVariable Long id,
            @Valid @RequestBody CreateDiscussionContributionRequestDTO request
    ) {
        return discussionService.addContribution(id, request);
    }

    @PatchMapping("/discussions/{id}/status")
    @Operation(summary = "Atualizar status da discussão")
    public DiscussionResponseDTO updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiscussionStatusRequestDTO request
    ) {
        return discussionService.updateStatus(id, request);
    }

    @PostMapping("/discussions/{id}/archive")
    @Operation(summary = "Arquivar discussão")
    public DiscussionResponseDTO archiveDiscussion(@PathVariable Long id) {
        return discussionService.archive(id);
    }
}
