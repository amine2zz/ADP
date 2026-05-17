package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "application_step_result")
public class ApplicationStepResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnoreProperties("stepResults")
    private Application application;

    @Column(name = "step_index")
    private Integer stepIndex;

    @Column(name = "step_label")
    private String stepLabel;

    // PENDING, PASS, FAIL
    private String result = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;
}
