package br.com.obione.observations.entity;

import br.com.obione.mpo.entity.MpoAttribute;
import br.com.obione.observations.enums.ObservationImpact;
import br.com.obione.observations.enums.ObservationStatus;
import br.com.obione.projects.entity.Project;
import br.com.obione.projects.enums.RiskLevel;
import br.com.obione.users.entity.User;
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
@Table(name = "observations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Observation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 5000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mpo_attribute_id")
    private MpoAttribute mpoAttribute;

    /** @deprecated Use mpoAttribute (FK). Mantido para compatibilidade com dados legados. */
    @Deprecated
    @Column(length = 100)
    private String attributeId;

    @Column(length = 100)
    private String phenomenonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ObservationImpact impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RiskLevel risk;

    @Column(length = 5000)
    private String interpretation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ObservationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
