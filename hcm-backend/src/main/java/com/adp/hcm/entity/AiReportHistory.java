package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "ai_report_history")
public class AiReportHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_type", nullable = false)
    private String reportType;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "manager_name")
    private String managerName;

    @Lob
    @Column(name = "report_text", columnDefinition = "TEXT")
    private String reportText;

    @Lob
    @Column(name = "stats_json", columnDefinition = "TEXT")
    private String statsJson;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt = LocalDateTime.now();
}
