package br.com.obione.ai.service;

import br.com.obione.ai.LlmClient;
import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.discussions.dto.DiscussionContributionResponseDTO;
import br.com.obione.discussions.dto.DiscussionResponseDTO;
import br.com.obione.discussions.service.DiscussionService;
import br.com.obione.domains.dto.DomainResponseDTO;
import br.com.obione.domains.service.DomainService;
import br.com.obione.mpo.MpoCatalog;
import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.projects.dto.ProjectResponseDTO;
import br.com.obione.projects.service.ProjectService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Application use cases for the AI assistant. Gathers context from the domain
 * services and delegates to the {@link LlmClient} port. Returns suggestions only
 * — nothing is persisted until the consultant accepts via the existing endpoints.
 */
@Service
public class AiAssistantService {

    private final LlmClient llm;
    private final ProjectService projectService;
    private final DomainService domainService;
    private final DiscussionService discussionService;
    private final MpoCatalog catalog;

    public AiAssistantService(
            LlmClient llm,
            ProjectService projectService,
            DomainService domainService,
            DiscussionService discussionService,
            MpoCatalog catalog
    ) {
        this.llm = llm;
        this.projectService = projectService;
        this.domainService = domainService;
        this.discussionService = discussionService;
        this.catalog = catalog;
    }

    public DomainSuggestionDTO suggestDomain(Long projectId) {
        ProjectResponseDTO p = projectService.findById(projectId);
        List<String> slugs = domainService.findAll().stream().map(DomainResponseDTO::slug).toList();
        return llm.suggestDomain(p.summary(), p.observationObjective(), slugs);
    }

    public ObservationSuggestionsDTO suggestObservations(Long projectId) {
        ProjectResponseDTO p = projectService.findById(projectId);
        String lens = catalog.inScopeAttributes().stream()
                .map(this::lensLine)
                .collect(Collectors.joining("\n"));
        return llm.suggestObservations(p.summary(), p.observationObjective(), lens);
    }

    public KnowledgeDraftDTO suggestKnowledge(Long discussionId) {
        DiscussionResponseDTO d = discussionService.findById(discussionId);
        List<String> contributions = d.contributions().stream()
                .map(this::contributionLine)
                .toList();
        return llm.suggestKnowledge(d.title(), d.question(), contributions);
    }

    public DomainSynthesisDTO synthesize(Long domainId) {
        DomainResponseDTO domain = domainService.findById(domainId);
        List<String> summaries = projectService.findByDomainId(domainId).stream()
                .map(ProjectResponseDTO::summary)
                .toList();
        return llm.synthesize(domain.name(), summaries);
    }

    private String lensLine(MpoAttributeDTO a) {
        return a.key() + " — " + a.label() + " (" + a.categoryLabel() + ")";
    }

    private String contributionLine(DiscussionContributionResponseDTO c) {
        return c.userName() + " [" + c.type() + "]: " + c.text();
    }
}
