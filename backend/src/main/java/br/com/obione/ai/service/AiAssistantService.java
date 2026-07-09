package br.com.obione.ai.service;

import br.com.obione.ai.LlmClient;
import br.com.obione.ai.dto.AiStatsDTO;
import br.com.obione.ai.dto.DomainSuggestionDTO;
import br.com.obione.ai.dto.DomainSuggestionResponseDTO;
import br.com.obione.ai.dto.DomainSynthesisDTO;
import br.com.obione.ai.dto.DomainSynthesisResponseDTO;
import br.com.obione.ai.dto.KnowledgeDraftDTO;
import br.com.obione.ai.dto.KnowledgeDraftResponseDTO;
import br.com.obione.ai.dto.ObservationSuggestionsDTO;
import br.com.obione.ai.dto.ObservationSuggestionsResponseDTO;
import br.com.obione.ai.dto.ProjectSetupRequestDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionDTO;
import br.com.obione.ai.dto.ProjectSetupSuggestionResponseDTO;
import br.com.obione.ai.dto.StructureObservationDTO;
import br.com.obione.ai.dto.StructureObservationRequestDTO;
import br.com.obione.ai.dto.StructureObservationResponseDTO;
import br.com.obione.ai.entity.AiSuggestionLog;
import br.com.obione.ai.enums.AiSuggestionType;
import br.com.obione.ai.repository.AiSuggestionLogRepository;
import br.com.obione.discussions.dto.DiscussionContributionResponseDTO;
import br.com.obione.discussions.dto.DiscussionResponseDTO;
import br.com.obione.discussions.service.DiscussionService;
import br.com.obione.domains.dto.DomainResponseDTO;
import br.com.obione.domains.service.DomainService;
import br.com.obione.mpo.MpoCatalog;
import br.com.obione.mpo.dto.MpoAttributeDTO;
import br.com.obione.projects.dto.ProjectResponseDTO;
import br.com.obione.projects.service.ProjectService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Application use cases for the AI assistant. Gathers context from the domain
 * services and delegates to the {@link LlmClient} port. Returns suggestions only
 * — nothing is persisted until the consultant accepts via the existing endpoints.
 * Every suggestion is journaled in {@code ai_suggestion_logs} with provider/model/
 * timestamp (RNF04) so the DSR evaluation can trace and measure acceptance.
 */
@Service
public class AiAssistantService {

    private final LlmClient llm;
    private final ProjectService projectService;
    private final DomainService domainService;
    private final DiscussionService discussionService;
    private final MpoCatalog catalog;
    private final AiSuggestionLogRepository logRepository;
    private final ObjectMapper objectMapper;

    public AiAssistantService(
            LlmClient llm,
            ProjectService projectService,
            DomainService domainService,
            DiscussionService discussionService,
            MpoCatalog catalog,
            AiSuggestionLogRepository logRepository,
            ObjectMapper objectMapper
    ) {
        this.llm = llm;
        this.projectService = projectService;
        this.domainService = domainService;
        this.discussionService = discussionService;
        this.catalog = catalog;
        this.logRepository = logRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DomainSuggestionResponseDTO suggestDomain(Long projectId) {
        ProjectResponseDTO p = projectService.findById(projectId);
        List<String> slugs = domainService.findAll().stream().map(DomainResponseDTO::slug).toList();
        DomainSuggestionDTO suggestion = llm.suggestDomain(p.summary(), p.observationObjective(), slugs);
        AiSuggestionLog log = journal(AiSuggestionType.DOMAIN, suggestion, projectId, null, null);
        return DomainSuggestionResponseDTO.of(suggestion, log.getId(), llm.provider(), llm.model(), log.getCreatedAt());
    }

    @Transactional
    public ObservationSuggestionsResponseDTO suggestObservations(Long projectId) {
        ProjectResponseDTO p = projectService.findById(projectId);
        String lens = catalog.inScopeAttributes().stream()
                .map(this::lensLine)
                .collect(Collectors.joining("\n"));
        ObservationSuggestionsDTO suggestions =
                llm.suggestObservations(p.summary(), p.observationObjective(), lens, p.initialAttributeIds());
        AiSuggestionLog log = journal(AiSuggestionType.OBSERVATIONS, suggestions, projectId, null, null);
        return ObservationSuggestionsResponseDTO.of(suggestions, log.getId(), llm.provider(), llm.model(), log.getCreatedAt());
    }

    @Transactional
    public KnowledgeDraftResponseDTO suggestKnowledge(Long discussionId) {
        DiscussionResponseDTO d = discussionService.findById(discussionId);
        List<String> contributions = d.contributions().stream()
                .map(this::contributionLine)
                .toList();
        KnowledgeDraftDTO draft = llm.suggestKnowledge(d.title(), d.question(), contributions);
        AiSuggestionLog log = journal(AiSuggestionType.KNOWLEDGE, draft, null, discussionId, null);
        return KnowledgeDraftResponseDTO.of(draft, log.getId(), llm.provider(), llm.model(), log.getCreatedAt());
    }

    @Transactional
    public DomainSynthesisResponseDTO synthesize(Long domainId) {
        DomainResponseDTO domain = domainService.findById(domainId);
        List<String> summaries = projectService.findByDomainId(domainId).stream()
                .map(ProjectResponseDTO::summary)
                .toList();
        DomainSynthesisDTO synthesis = llm.synthesize(domain.name(), summaries);
        AiSuggestionLog log = journal(AiSuggestionType.SYNTHESIS, synthesis, null, null, domainId);
        return DomainSynthesisResponseDTO.of(synthesis, log.getId(), llm.provider(), llm.model(), log.getCreatedAt());
    }

    /**
     * Suggests the initial setup of a project being created (wizard step 2):
     * domain + MPO attributes + expected phenomena from the description alone.
     * Hallucinated domain slugs / attribute ids are dropped before returning.
     */
    @Transactional
    public ProjectSetupSuggestionResponseDTO suggestProjectSetup(ProjectSetupRequestDTO request) {
        List<DomainResponseDTO> domains = domainService.findAll();
        List<String> slugs = domains.stream().map(DomainResponseDTO::slug).toList();
        String lens = catalog.inScopeAttributes().stream()
                .map(this::lensLine)
                .collect(Collectors.joining("\n"));

        ProjectSetupSuggestionDTO raw = llm.suggestProjectSetup(
                request.name(), request.description(), request.observationObjective(), slugs, lens);

        var validKeys = catalog.inScopeAttributes().stream().map(MpoAttributeDTO::key).collect(Collectors.toSet());
        List<String> attributeIds = raw.attributeIds() == null ? List.of()
                : raw.attributeIds().stream().filter(validKeys::contains).distinct().toList();
        Long domainId = domains.stream()
                .filter(d -> d.slug().equals(raw.suggestedDomainSlug()))
                .map(DomainResponseDTO::id)
                .findFirst()
                .orElse(null);
        ProjectSetupSuggestionDTO validated = new ProjectSetupSuggestionDTO(
                domainId != null ? raw.suggestedDomainSlug() : null,
                raw.confidence(),
                attributeIds,
                raw.expectedPhenomena() == null ? List.of() : raw.expectedPhenomena(),
                raw.rationale());

        AiSuggestionLog log = journal(AiSuggestionType.PROJECT_SETUP, validated, null, null, domainId);
        return ProjectSetupSuggestionResponseDTO.of(
                validated, domainId, log.getId(), llm.provider(), llm.model(), log.getCreatedAt());
    }

    /**
     * Structures a free-text observation: suggests a title, best-matching MPO attribute
     * and an initial interpretation from the consultant's plain-language description.
     * The returned attributeId is validated against the catalog — hallucinated ids are
     * replaced with null before returning (human-in-the-loop check preserved).
     */
    @Transactional
    public StructureObservationResponseDTO structureObservation(
            Long projectId, StructureObservationRequestDTO request) {
        // Verify project exists (throws ResourceNotFoundException if not).
        projectService.findById(projectId);

        String lens = catalog.inScopeAttributes().stream()
                .map(this::lensLine)
                .collect(Collectors.joining("\n"));

        StructureObservationDTO raw = llm.structureObservation(request.description(), lens);

        // Validate attributeId — drop if not a real catalog key (avoids hallucinations).
        var validKeys = catalog.inScopeAttributes().stream()
                .map(MpoAttributeDTO::key)
                .collect(Collectors.toSet());
        String safeAttributeId = (raw.attributeId() != null && validKeys.contains(raw.attributeId()))
                ? raw.attributeId() : null;
        StructureObservationDTO validated = new StructureObservationDTO(
                raw.title(), safeAttributeId, raw.interpretation());

        AiSuggestionLog log = journal(AiSuggestionType.OBSERVATIONS, validated, projectId, null, null);
        return StructureObservationResponseDTO.of(
                validated, log.getId(), llm.provider(), llm.model(), log.getCreatedAt());
    }

    /** Acceptance metrics per assistant role, derived on the fly from the log. */
    @Transactional(readOnly = true)
    public AiStatsDTO stats() {
        List<AiStatsDTO.AiTypeStatsDTO> byType = java.util.Arrays.stream(AiSuggestionType.values())
                .map(type -> {
                    long total = logRepository.countByType(type);
                    long accepted = logRepository.countByTypeAndAcceptedTrue(type);
                    int rate = total == 0 ? 0 : (int) Math.round(accepted * 100.0 / total);
                    return new AiStatsDTO.AiTypeStatsDTO(type, total, accepted, rate);
                })
                .toList();
        long total = byType.stream().mapToLong(AiStatsDTO.AiTypeStatsDTO::total).sum();
        long accepted = byType.stream().mapToLong(AiStatsDTO.AiTypeStatsDTO::accepted).sum();
        return new AiStatsDTO(total, accepted, byType);
    }

    private AiSuggestionLog journal(
            AiSuggestionType type, Object suggestion, Long projectId, Long discussionId, Long domainId) {
        return logRepository.save(AiSuggestionLog.builder()
                .type(type)
                .provider(llm.provider())
                .model(llm.model())
                .projectId(projectId)
                .discussionId(discussionId)
                .domainId(domainId)
                .payload(toJson(suggestion))
                .build());
    }

    private String toJson(Object suggestion) {
        try {
            return objectMapper.writeValueAsString(suggestion);
        } catch (JsonProcessingException e) {
            // The log must never break the suggestion flow.
            return "{\"serializationError\":\"" + e.getOriginalMessage() + "\"}";
        }
    }

    private String lensLine(MpoAttributeDTO a) {
        return a.key() + " — " + a.label() + " (" + a.categoryLabel() + ")";
    }

    private String contributionLine(DiscussionContributionResponseDTO c) {
        return c.userName() + " [" + c.type() + "]: " + c.text();
    }
}
