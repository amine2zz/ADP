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
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class PerformanceController {

    @Autowired
    private PerformanceService performanceService;

    @GetMapping("/questions")
    public List<PerformanceQuestion> getQuestions() {
        return performanceService.getActiveQuestions();
    }

    @GetMapping("/pending/{managerId}")
    public List<PerformanceEvaluation> getPending(@PathVariable("managerId") Long managerId) {
        return performanceService.getPendingEvaluations(managerId);
    }

    @PostMapping("/submit/{evalId}")
    public PerformanceEvaluation submit(
            @PathVariable("evalId") Long evalId, 
            @RequestBody List<EvaluationResponse> responses,
            @RequestParam(value = "isAdmin", defaultValue = "false") boolean isAdmin) {
        return performanceService.submitEvaluation(evalId, responses, isAdmin);
    }

    @PostMapping("/launch")
    public List<PerformanceEvaluation> launch(@RequestParam("period") String period) {
        return performanceService.launchMonthlyEvaluation(period);
    }

    @GetMapping("/reports")
    public List<PerformanceReportDTO> getReports(
            @RequestParam(value = "deptId", required = false) Long deptId,
            @RequestParam(value = "period", required = false) String period,
            @RequestParam(value = "managerId", required = false) Long managerId) {
        return performanceService.generateReports(deptId, period, managerId);
    }
}
