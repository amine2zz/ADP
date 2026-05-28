package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@Table(name = "salary_advances")
public class SalaryAdvance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"password", "activationToken", "manager", "category"})
    private Employee employee;

    @Column(nullable = false)
    private Double amount;

    @Column(length = 1000)
    private String reason;

    /** PENDING | APPROVED | REJECTED */
    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "review_date")
    private LocalDate reviewDate;

    @Column(name = "review_notes", length = 500)
    private String reviewNotes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewed_by")
    @JsonIgnoreProperties({"password", "activationToken", "manager", "category", "department"})
    private Employee reviewedBy;

    @PrePersist
    protected void onCreate() {
        if (requestDate == null) requestDate = LocalDate.now();
    }
}
