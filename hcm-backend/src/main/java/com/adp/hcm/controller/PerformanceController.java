package com.adp.hcm.controller;

import com.adp.hcm.dto.PerformanceReportDTO;
import com.adp.hcm.entity.EvaluationResponse;
import com.adp.hcm.entity.PerformanceEvaluation;
import com.adp.hcm.entity.PerformanceQuestion;
import com.adp.hcm.service.PerformanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class PerformanceController {

    @Autowired private PerformanceService performanceService;

    @GetMapping("/questions")
    public List<PerformanceQuestion> getQuestions() { return performanceService.getActiveQuestions(); }

    @GetMapping("/pending/{managerId}")
    public List<PerformanceEvaluation> getPending(@PathVariable Long managerId) { return performanceService.getPendingEvaluations(managerId); }

    @PostMapping("/launch")
    public List<PerformanceEvaluation> launch(@RequestParam String period) { return performanceService.launchMonthlyEvaluation(period); }

    @PostMapping("/submit/{evalId}")
    public PerformanceEvaluation submit(@PathVariable Long evalId, @RequestBody List<EvaluationResponse> responses, @RequestParam(defaultValue = "false") boolean isAdmin) {
        return performanceService.submitEvaluation(evalId, responses, isAdmin);
    }

    @GetMapping("/reports")
    public List<PerformanceReportDTO> getReports(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) Long managerId) {
        return performanceService.generateReports(deptId, period, managerId);
    }

    @GetMapping("/history/employee/{id}")
    public List<PerformanceReportDTO> getEmployeeHistory(@PathVariable Long id) { return performanceService.getEmployeeHistory(id); }

    @GetMapping("/history/team/{managerId}")
    public List<PerformanceReportDTO> getTeamHistory(@PathVariable Long managerId) { return performanceService.getTeamHistory(managerId); }
}
