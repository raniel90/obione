package br.com.obione.projects.entity;

import br.com.obione.domains.entity.Domain;
import br.com.obione.projects.enums.ClientEngagement;
import br.com.obione.projects.enums.ProjectStatus;
import br.com.obione.projects.enums.ProjectType;
import br.com.obione.projects.enums.RiskLevel;
import br.com.obione.users.entity.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "domain_id", nullable = false)
    private Domain domain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id")
    private User consultant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProjectType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProjectStatus status;

    @Column(length = 50000)
    private String summary;

    @Column(length = 2000)
    private String observationObjective;

    @ElementCollection
    @CollectionTable(name = "project_initial_attributes", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "attribute_id", length = 100)
    @Builder.Default
    private List<String> initialAttributeIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "project_expected_phenomena", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "phenomenon", length = 500)
    @Builder.Default
    private List<String> expectedPhenomena = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private int progress = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ClientEngagement clientEngagement;

    private LocalDate startDate;

    private LocalDate expectedEndDate;

    @Column(length = 5000)
    private String closureSummary;

    @Column(length = 5000)
    private String lessonsLearned;

    @Column(length = 5000)
    private String identifiedPatterns;

    @Column(length = 5000)
    private String futureRecommendation;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
