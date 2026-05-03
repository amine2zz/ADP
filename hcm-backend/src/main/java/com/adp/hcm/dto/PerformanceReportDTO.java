package com.adp.hcm.dto;

import com.adp.hcm.entity.PerformanceRating;
import lombok.Data;
import java.util.List;

@Data
public class PerformanceReportDTO {
    private Long evaluationId;
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private String period;
    private Double averageRating;
    private Double totalWorkedHours;
    private String status;
    private List<QuestionResponseDTO> responses;

    @Data
    public static class QuestionResponseDTO {
        private String questionText;
        private PerformanceRating rating;
        private Integer ratingValue;
    }
}
