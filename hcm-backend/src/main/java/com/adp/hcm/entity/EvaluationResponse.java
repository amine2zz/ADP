package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "evaluation_response")
public class EvaluationResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "evaluation_id", nullable = false)
    @JsonIgnore
    private PerformanceEvaluation evaluation;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private PerformanceQuestion question;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PerformanceRating rating;
}
