package br.com.obione.domains.entity;

import br.com.obione.domains.enums.DomainStatus;
import br.com.obione.domains.enums.DomainType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "domains")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Domain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DomainType type;

    @Column(length = 1000)
    private String observationObjective;

    @ElementCollection
    @CollectionTable(name = "domain_priority_indicators", joinColumns = @JoinColumn(name = "domain_id"))
    @Column(name = "indicator", length = 200)
    @Builder.Default
    private List<String> priorityIndicators = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "domain_expected_phenomena", joinColumns = @JoinColumn(name = "domain_id"))
    @Column(name = "phenomenon", length = 500)
    @Builder.Default
    private List<String> expectedPhenomena = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DomainStatus status;

    @Column(nullable = false)
    @Builder.Default
    private int projectCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int participantCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int discussionCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int knowledgeCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int phenomenonCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private double engagementRate = 0.0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
