package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "job_applications")
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "position_id", nullable = false)
    @JsonIgnoreProperties({"description", "requirements", "hiringManager"})
    private JobPosition position;

    @Column(name = "applicant_name", nullable = false)
    private String applicantName;

    @Column(name = "applicant_email", nullable = false)
    private String applicantEmail;

    private String phone;

    @Column(length = 4000)
    private String coverLetter;

    /** NEW | REVIEWING | INTERVIEW | REJECTED | ACCEPTED */
    @Column(nullable = false)
    private String status = "NEW";

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    @Column(length = 500)
    private String notes;

    @Column(name = "cv_file_name")
    private String cvFileName;

    @Column(name = "cv_data", columnDefinition = "LONGTEXT")
    private String cvData;

    /** AI CV screening results — populated by AiReportService.screenCv() */
    @Column(name = "ai_score")
    private Integer aiScore;

    @Lob
    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Lob
    @Column(name = "ai_strengths", columnDefinition = "TEXT")
    private String aiStrengths;

    @Lob
    @Column(name = "ai_missing_skills", columnDefinition = "TEXT")
    private String aiMissingSkills;

    @Column(name = "ai_screened_at")
    private LocalDateTime aiScreenedAt;

    @PrePersist
    protected void onCreate() {
        if (appliedDate == null) appliedDate = LocalDate.now();
    }
}
