package br.com.obione.ai.entity;

import br.com.obione.ai.enums.AiSuggestionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Audit log of every AI suggestion (RNF04 — scientific reproducibility).
 * Target ids are plain values (no FK) so the log never couples the AI context
 * to the domain contexts it assists. {@code payload} is the suggestion as JSON.
 */
@Entity
@Table(name = "ai_suggestion_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSuggestionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AiSuggestionType type;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "discussion_id")
    private Long discussionId;

    @Column(name = "domain_id")
    private Long domainId;

    @Lob
    @Column(nullable = false)
    private String payload;

    @Builder.Default
    @Column(nullable = false)
    private boolean accepted = false;

    private Instant acceptedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
