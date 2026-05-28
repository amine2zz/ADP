package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@Table(name = "job_positions")
public class JobPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    @Column(length = 4000)
    private String requirements;

    private String department;
    private String location;

    /** FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP */
    @Column(name = "job_type")
    private String jobType = "FULL_TIME";

    /** DRAFT | OPEN | CLOSED */
    @Column(nullable = false)
    private String status = "DRAFT";

    @Column(name = "salary_min")
    private Double salaryMin;

    @Column(name = "salary_max")
    private Double salaryMax;

    @Column(name = "posted_date")
    private LocalDate postedDate;

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hiring_manager_id")
    @JsonIgnoreProperties({"password", "activationToken", "manager", "category", "department"})
    private Employee hiringManager;

    @Column(name = "applicants_count")
    private int applicantsCount = 0;

    @PrePersist
    protected void onCreate() {
        if ("OPEN".equals(status) && postedDate == null) {
            postedDate = LocalDate.now();
        }
    }
}
