package br.com.obione.mpo.entity;

import br.com.obione.mpo.enums.AttributeStatus;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "project_attribute_values",
    uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "mpo_attribute_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectAttributeValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mpo_attribute_id", nullable = false)
    private MpoAttribute mpoAttribute;

    @Column(length = 5000)
    private String currentValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AttributeStatus status = AttributeStatus.NOT_OBSERVED;

    @Column(name = "last_observation_id")
    private Long lastObservationId;

    @Column(length = 200)
    private String updatedBy;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
