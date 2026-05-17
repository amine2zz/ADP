package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "application")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_offer_id", nullable = false)
    @JsonIgnoreProperties({"pipelineSteps", "description"})
    private JobOffer jobOffer;

    @Column(name = "applicant_name", nullable = false)
    private String applicantName;

    @Column(name = "applicant_email", nullable = false)
    private String applicantEmail;

    @Column(name = "applicant_phone")
    private String applicantPhone;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "cv_filename")
    private String cvFilename;

    // Tracking token sent by email (no auth required)
    @Column(name = "tracking_token", unique = true)
    private String trackingToken;

    // PENDING, IN_PROGRESS, HIRED, REJECTED
    private String status = "PENDING";

    // Index of the current pipeline step (0-based)
    @Column(name = "current_step_index")
    private Integer currentStepIndex = 0;

    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApplicationStepResult> stepResults;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
