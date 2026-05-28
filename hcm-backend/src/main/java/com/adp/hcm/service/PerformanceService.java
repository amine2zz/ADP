package com.adp.hcm.service;

import com.adp.hcm.dto.PerformanceReportDTO;
import com.adp.hcm.entity.*;
import com.adp.hcm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PerformanceService {

    @Autowired private PerformanceEvaluationRepository evaluationRepository;
    @Autowired private PerformanceQuestionRepository questionRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private AttendanceRepository attendanceRepository;

    public List<PerformanceQuestion> getActiveQuestions() {
        return questionRepository.findByActiveTrue();
    }

    public List<PerformanceEvaluation> getPendingEvaluations(Long managerId) {
        return evaluationRepository.findByEvaluator(employeeRepository.findById(managerId).orElse(null))
            .stream().filter(e -> "PENDING".equals(e.getStatus())).collect(Collectors.toList());
    }

    public List<PerformanceEvaluation> launchMonthlyEvaluation(String period) {
        List<PerformanceEvaluation> created = new ArrayList<>();
        for (Employee emp : employeeRepository.findAll()) {
            if (emp.getManager() != null && evaluationRepository.findByEmployeeAndPeriod(emp, period).isEmpty()) {
                PerformanceEvaluation eval = new PerformanceEvaluation();
                eval.setEmployee(emp);
                eval.setEvaluator(emp.getManager());
                eval.setPeriod(period);
                eval.setStatus("PENDING");
                created.add(evaluationRepository.save(eval));
            }
        }
        return created;
    }

    public PerformanceEvaluation submitEvaluation(Long evalId, List<EvaluationResponse> responses, boolean isAdmin) {
        PerformanceEvaluation eval = evaluationRepository.findById(evalId)
            .orElseThrow(() -> new RuntimeException("Evaluation not found"));
        if (!isAdmin && "COMPLETED".equals(eval.getStatus())) {
            throw new RuntimeException("Evaluation already completed.");
        }
        eval.getResponses().clear();
        for (EvaluationResponse res : responses) {
            res.setEvaluation(eval);
            eval.getResponses().add(res);
        }
        eval.setStatus("COMPLETED");
        eval.setEvaluationDate(LocalDateTime.now());
        return evaluationRepository.save(eval);
    }

    public List<PerformanceReportDTO> getEmployeeHistory(Long employeeId) {
        Employee emp = employeeRepository.findById(employeeId).orElseThrow(() -> new RuntimeException("Employee not found"));
        return evaluationRepository.findByEmployee(emp).stream()
            .map(this::mapToDTO)
            .sorted(Comparator.comparing(PerformanceReportDTO::getPeriod))
            .collect(Collectors.toList());
    }

    public List<PerformanceReportDTO> getTeamHistory(Long managerId) {
        List<PerformanceReportDTO> reports = new ArrayList<>();
        for (Employee emp : employeeRepository.findByManagerId(managerId)) {
            evaluationRepository.findByEmployee(emp).stream().map(this::mapToDTO).forEach(reports::add);
        }
        return reports;
    }

    public List<PerformanceReportDTO> generateReports(Long deptId, String period, Long managerId) {
        List<Employee> employees = managerId != null ? employeeRepository.findByManagerId(managerId) : employeeRepository.findAll();
        if (deptId != null) {
            employees = employees.stream()
                .filter(e -> e.getDepartment() != null && e.getDepartment().getId().equals(deptId))
                .collect(Collectors.toList());
        }

        Map<Long, PerformanceEvaluation> evalMap = new HashMap<>();
        boolean periodLaunched = false;
        if (period != null) {
            List<PerformanceEvaluation> periodEvals = evaluationRepository.findByPeriodWithDetails(period);
            if (!periodEvals.isEmpty()) {
                periodLaunched = true;
                periodEvals.forEach(e -> evalMap.put(e.getEmployee().getId(), e));
            }
        }

        List<PerformanceReportDTO> reports = new ArrayList<>();
        for (Employee emp : employees) {
            if (emp.getManager() == null && "HR_ADMIN".equals(emp.getRole())) continue;
            PerformanceEvaluation eval = evalMap.get(emp.getId());
            if (eval != null) {
                reports.add(mapToDTO(eval));
            } else if (period != null) {
                PerformanceReportDTO dto = new PerformanceReportDTO();
                dto.setEmployeeId(emp.getId());
                dto.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
                dto.setDepartmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : "N/A");
                dto.setPeriod(period);
                dto.setStatus(periodLaunched ? "PENDING" : "NOT_LAUNCHED");
                dto.setTotalWorkedHours(calculateWorkedHours(emp, period));
                dto.setResponses(new ArrayList<>());
                reports.add(dto);
            }
        }
        return reports;
    }

    public PerformanceReportDTO mapToDTO(PerformanceEvaluation eval) {
        PerformanceReportDTO dto = new PerformanceReportDTO();
        dto.setEvaluationId(eval.getId());
        dto.setEmployeeId(eval.getEmployee().getId());
        dto.setEmployeeName(eval.getEmployee().getFirstName() + " " + eval.getEmployee().getLastName());
        dto.setDepartmentName(eval.getEmployee().getDepartment() != null ? eval.getEmployee().getDepartment().getName() : "N/A");
        dto.setPeriod(eval.getPeriod());
        dto.setStatus(eval.getStatus());
        if (!eval.getResponses().isEmpty()) {
            dto.setAverageRating(eval.getResponses().stream().mapToInt(r -> r.getRating().getValue()).average().orElse(0.0));
        }
        dto.setTotalWorkedHours(calculateWorkedHours(eval.getEmployee(), eval.getPeriod()));
        dto.setResponses(eval.getResponses().stream().map(r -> {
            PerformanceReportDTO.QuestionResponseDTO qDTO = new PerformanceReportDTO.QuestionResponseDTO();
            if (r.getQuestion() != null) qDTO.setQuestionText(r.getQuestion().getText());
            if (r.getRating() != null) { qDTO.setRating(r.getRating()); qDTO.setRatingValue(r.getRating().getValue()); }
            return qDTO;
        }).collect(Collectors.toList()));
        return dto;
    }

    private Double calculateWorkedHours(Employee emp, String period) {
        try {
            YearMonth yearMonth = YearMonth.parse(period);
            List<Attendance> attendances = attendanceRepository.findByEmployeeAndWorkDateBetween(emp, yearMonth.atDay(1), yearMonth.atEndOfMonth());
            double totalHours = 0.0;
            for (Attendance a : attendances) {
                if (a.getMorningIn() != null && a.getEveningOut() != null) {
                    long totalMins;
                    if (a.getLunchOut() != null && a.getAfternoonIn() != null) {
                        totalMins = Duration.between(a.getMorningIn(), a.getLunchOut()).toMinutes()
                            + Duration.between(a.getAfternoonIn(), a.getEveningOut()).toMinutes();
                    } else {
                        totalMins = Duration.between(a.getMorningIn(), a.getEveningOut()).toMinutes();
                    }
                    totalHours += totalMins / 60.0;
                }
            }
            return Math.round(totalHours * 100.0) / 100.0;
        } catch (Exception e) {
            return 0.0;
        }
    }
}
