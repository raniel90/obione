package br.com.obione.phenomena.entity;

import br.com.obione.domains.entity.Domain;
import br.com.obione.phenomena.enums.PhenomenonImpact;
import br.com.obione.phenomena.enums.PhenomenonStatus;
import br.com.obione.phenomena.enums.PhenomenonTrend;
import br.com.obione.projects.entity.Project;
import jakarta.persistence.Column;
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

@Entity
@Table(name = "phenomena")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Phenomenon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "domain_id", nullable = false)
    private Domain domain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(length = 5000)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private int evidenceCount = 0;

    @Column(length = 2000)
    private String relatedAttributeIds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PhenomenonImpact impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PhenomenonTrend trend;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PhenomenonStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
