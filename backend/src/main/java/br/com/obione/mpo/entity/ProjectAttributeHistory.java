package br.com.obione.mpo.entity;

import br.com.obione.mpo.enums.ChangeSource;
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

import java.time.Instant;

@Entity
@Table(name = "project_attribute_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectAttributeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_attribute_value_id", nullable = false)
    private ProjectAttributeValue projectAttributeValue;

    @Column(length = 5000)
    private String previousValue;

    @Column(length = 5000)
    private String newValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChangeSource changeSource;

    @Column(name = "observation_id")
    private Long observationId;

    @Column(length = 200)
    private String changedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant changedAt;
}
