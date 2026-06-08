package br.com.obione.community.controller;

import br.com.obione.community.dto.CommunityOverviewDTO;
import br.com.obione.community.dto.DomainCommunityDTO;
import br.com.obione.community.service.CommunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Community", description = "Visão agregada da comunidade observacional")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/community")
    @Operation(summary = "Visão geral da comunidade observacional")
    public CommunityOverviewDTO getOverview() {
        return communityService.getOverview();
    }

    @GetMapping("/community/domains/{domainId}")
    @Operation(summary = "Comunidade observacional por domínio")
    public DomainCommunityDTO getByDomainId(@PathVariable Long domainId) {
        return communityService.getByDomainId(domainId);
    }

    @GetMapping("/community/domains/slug/{slug}")
    @Operation(summary = "Comunidade observacional por slug do domínio")
    public DomainCommunityDTO getByDomainSlug(@PathVariable String slug) {
        return communityService.getByDomainSlug(slug);
    }
}
