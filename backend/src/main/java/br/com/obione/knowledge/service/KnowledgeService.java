package br.com.obione.knowledge.service;

import br.com.obione.common.exception.BadRequestException;
import br.com.obione.common.exception.ResourceNotFoundException;
import br.com.obione.common.security.CurrentUser;
import br.com.obione.discussions.entity.Discussion;
import br.com.obione.discussions.enums.DiscussionStatus;
import br.com.obione.discussions.repository.DiscussionRepository;
import br.com.obione.domains.entity.Domain;
import br.com.obione.domains.repository.DomainRepository;
import br.com.obione.knowledge.dto.ConsolidateKnowledgeRequestDTO;
import br.com.obione.knowledge.dto.CreateKnowledgeRequestDTO;
import br.com.obione.knowledge.dto.KnowledgeResponseDTO;
import br.com.obione.knowledge.dto.UpdateKnowledgeRequestDTO;
import br.com.obione.knowledge.entity.Knowledge;
import br.com.obione.knowledge.enums.KnowledgeConfidence;
import br.com.obione.knowledge.enums.KnowledgeStatus;
import br.com.obione.knowledge.mapper.KnowledgeMapper;
import br.com.obione.knowledge.repository.KnowledgeRepository;
import br.com.obione.phenomena.entity.Phenomenon;
import br.com.obione.phenomena.repository.PhenomenonRepository;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.repository.ProjectRepository;
import br.com.obione.projects.service.ProjectAccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class KnowledgeService {

    private final KnowledgeRepository knowledgeRepository;
    private final DomainRepository domainRepository;
    private final ProjectRepository projectRepository;
    private final DiscussionRepository discussionRepository;
    private final PhenomenonRepository phenomenonRepository;
    private final CurrentUser currentUser;
    private final ProjectAccessGuard guard;

    public KnowledgeService(
            KnowledgeRepository knowledgeRepository,
            DomainRepository domainRepository,
            ProjectRepository projectRepository,
            DiscussionRepository discussionRepository,
            PhenomenonRepository phenomenonRepository,
            CurrentUser currentUser,
            ProjectAccessGuard guard
    ) {
        this.knowledgeRepository = knowledgeRepository;
        this.domainRepository = domainRepository;
        this.projectRepository = projectRepository;
        this.discussionRepository = discussionRepository;
        this.phenomenonRepository = phenomenonRepository;
        this.currentUser = currentUser;
        this.guard = guard;
    }

    @Transactional(readOnly = true)
    public List<KnowledgeResponseDTO> findAll() {
        List<Knowledge> all = knowledgeRepository.findAll();
        if (currentUser.isClient()) {
            // A CLIENT sees knowledge tied to their own projects, OR domain-level knowledge
            // (project == null) that belongs to one of their own domains.
            Set<Long> myProjectIds = guard.clientProjectIds();
            Set<Long> myDomainIds = guard.clientDomainIds();
            all = all.stream()
                    .filter(k -> k.getProject() != null
                            ? myProjectIds.contains(k.getProject().getId())
                            : myDomainIds.contains(k.getDomain().getId()))
                    .collect(Collectors.toList());
        }
        return all.stream()
                .map(KnowledgeMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public KnowledgeResponseDTO findById(Long id) {
        Knowledge knowledge = knowledgeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conhecimento não encontrado: " + id));
        if (knowledge.getProject() != null) {
            guard.assertCanRead(knowledge.getProject().getId());
        }
        return KnowledgeMapper.toResponseDTO(knowledge);
    }

    @Transactional(readOnly = true)
    public List<KnowledgeResponseDTO> findByDomainId(Long domainId) {
        ensureDomainExists(domainId);
        List<Knowledge> all = knowledgeRepository.findByDomain_IdOrderByCreatedAtDesc(domainId);
        if (currentUser.isClient()) {
            // B7: for a CLIENT, show only knowledge belonging to their own projects, OR
            // domain-level knowledge (project == null) from this domain — but only if the
            // queried domain is one of the client's own domains.
            Set<Long> myProjectIds = guard.clientProjectIds();
            boolean domainVisible = guard.clientDomainIds().contains(domainId);
            all = all.stream()
                    .filter(k -> k.getProject() != null
                            ? myProjectIds.contains(k.getProject().getId())
                            : domainVisible)
                    .collect(Collectors.toList());
        }
        return all.stream()
                .map(KnowledgeMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<KnowledgeResponseDTO> findByProjectId(Long projectId) {
        guard.assertCanRead(projectId);
        if (!currentUser.isClient()) {
            ensureProjectExists(projectId);
        }
        return knowledgeRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(KnowledgeMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<KnowledgeResponseDTO> findByDiscussionId(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussão não encontrada: " + discussionId));
        if (discussion.getProject() != null) {
            guard.assertCanRead(discussion.getProject().getId());
        }
        return knowledgeRepository.findByDiscussion_IdOrderByCreatedAtDesc(discussionId).stream()
                .map(KnowledgeMapper::toResponseDTO)
                .toList();
    }

    @Transactional
    public KnowledgeResponseDTO create(CreateKnowledgeRequestDTO request) {
        Domain domain = resolveDomain(request.domainId());
        Project project = resolveProject(request.projectId());
        Discussion discussion = resolveDiscussion(request.discussionId());
        Phenomenon phenomenon = resolvePhenomenon(request.phenomenonId());

        validateRelationships(domain, project, discussion, phenomenon);

        Knowledge knowledge = Knowledge.builder()
                .domain(domain)
                .project(project)
                .discussion(discussion)
                .phenomenon(phenomenon)
                .title(request.title().trim())
                .summary(request.summary().trim())
                .evidence(request.evidence())
                .recommendation(request.recommendation())
                .confidence(request.confidence() != null ? request.confidence() : KnowledgeConfidence.MEDIUM)
                .status(request.status() != null ? request.status() : KnowledgeStatus.PROPOSED)
                .build();

        return KnowledgeMapper.toResponseDTO(knowledgeRepository.save(knowledge));
    }

    @Transactional
    public KnowledgeResponseDTO consolidate(Long discussionId, ConsolidateKnowledgeRequestDTO request) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussão não encontrada: " + discussionId));

        Knowledge knowledge = Knowledge.builder()
                .domain(discussion.getDomain())
                .project(discussion.getProject())
                .discussion(discussion)
                .phenomenon(discussion.getPhenomenon())
                .title(request.title().trim())
                .summary(request.summary().trim())
                .evidence(request.evidence())
                .recommendation(request.recommendation())
                .confidence(request.confidence() != null ? request.confidence() : KnowledgeConfidence.MEDIUM)
                .status(KnowledgeStatus.CONSOLIDATED)
                .build();

        Knowledge saved = knowledgeRepository.save(knowledge);

        discussion.setStatus(DiscussionStatus.CONSOLIDATED);
        discussionRepository.save(discussion);

        return KnowledgeMapper.toResponseDTO(saved);
    }

    @Transactional
    public KnowledgeResponseDTO update(Long id, UpdateKnowledgeRequestDTO request) {
        Knowledge knowledge = loadKnowledge(id);

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new BadRequestException("Título não pode ser vazio");
            }
            knowledge.setTitle(request.title().trim());
        }

        if (request.summary() != null) {
            if (request.summary().isBlank()) {
                throw new BadRequestException("Resumo não pode ser vazio");
            }
            knowledge.setSummary(request.summary().trim());
        }

        if (request.domainId() != null) {
            knowledge.setDomain(resolveDomain(request.domainId()));
        }

        if (request.projectId() != null) {
            knowledge.setProject(resolveProject(request.projectId()));
        }

        if (request.discussionId() != null) {
            knowledge.setDiscussion(resolveDiscussion(request.discussionId()));
        }

        if (request.phenomenonId() != null) {
            knowledge.setPhenomenon(resolvePhenomenon(request.phenomenonId()));
        }

        validateRelationships(
                knowledge.getDomain(),
                knowledge.getProject(),
                knowledge.getDiscussion(),
                knowledge.getPhenomenon()
        );

        if (request.evidence() != null) {
            knowledge.setEvidence(request.evidence());
        }

        if (request.recommendation() != null) {
            knowledge.setRecommendation(request.recommendation());
        }

        if (request.confidence() != null) {
            knowledge.setConfidence(request.confidence());
        }

        if (request.status() != null) {
            knowledge.setStatus(request.status());
        }

        return KnowledgeMapper.toResponseDTO(knowledgeRepository.save(knowledge));
    }

    private Knowledge loadKnowledge(Long id) {
        return knowledgeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conhecimento não encontrado: " + id));
    }

    private void ensureDomainExists(Long domainId) {
        if (!domainRepository.existsById(domainId)) {
            throw new ResourceNotFoundException("Domínio não encontrado: " + domainId);
        }
    }

    private void ensureProjectExists(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Projeto não encontrado: " + projectId);
        }
    }

    private Domain resolveDomain(Long domainId) {
        return domainRepository.findById(domainId)
                .orElseThrow(() -> new ResourceNotFoundException("Domínio não encontrado: " + domainId));
    }

    private Project resolveProject(Long projectId) {
        if (projectId == null) {
            return null;
        }
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado: " + projectId));
    }

    private Discussion resolveDiscussion(Long discussionId) {
        if (discussionId == null) {
            return null;
        }
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussão não encontrada: " + discussionId));
    }

    private Phenomenon resolvePhenomenon(Long phenomenonId) {
        if (phenomenonId == null) {
            return null;
        }
        return phenomenonRepository.findById(phenomenonId)
                .orElseThrow(() -> new ResourceNotFoundException("Fenômeno não encontrado: " + phenomenonId));
    }

    private void validateRelationships(
            Domain domain,
            Project project,
            Discussion discussion,
            Phenomenon phenomenon
    ) {
        if (project != null && !project.getDomain().getId().equals(domain.getId())) {
            throw new BadRequestException("O projeto informado não pertence ao domínio selecionado");
        }

        if (discussion != null && !discussion.getDomain().getId().equals(domain.getId())) {
            throw new BadRequestException("A discussão informada não pertence ao domínio selecionado");
        }

        if (phenomenon != null && !phenomenon.getDomain().getId().equals(domain.getId())) {
            throw new BadRequestException("O fenômeno informado não pertence ao domínio selecionado");
        }
    }

}
