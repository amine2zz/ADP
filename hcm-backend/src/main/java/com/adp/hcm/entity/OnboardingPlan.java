package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "onboarding_plans")
public class OnboardingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Lob
    @Column(name = "plan_text", columnDefinition = "TEXT")
    private String planText;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt = LocalDateTime.now();
}
