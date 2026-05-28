package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

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

    @PrePersist
    protected void onCreate() {
        if (appliedDate == null) appliedDate = LocalDate.now();
    }
}
