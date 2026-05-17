package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pipeline_step")
public class PipelineStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_offer_id", nullable = false)
    @JsonIgnoreProperties({"pipelineSteps", "description"})
    private JobOffer jobOffer;

    // hr_interview, manager_interview, technical_test, document_review, custom
    @Column(name = "step_type", nullable = false)
    private String stepType;

    @Column(name = "step_label")
    private String stepLabel;

    @Column(name = "step_order")
    private Integer stepOrder;

    // Assigned manager (optional)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_manager_id")
    @JsonIgnoreProperties({"department", "manager", "category"})
    private Employee assignedManager;
}
