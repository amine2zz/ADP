package com.adp.hcm.controller;

import com.adp.hcm.repository.SystemConfigRepository;
import com.adp.hcm.service.AiReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:4200")
public class AiController {

    @Autowired private AiReportService aiReportService;
    @Autowired private SystemConfigRepository configRepository;

    private boolean isFeatureEnabled(String key) {
        return configRepository.findById(key)
            .map(cfg -> "true".equals(cfg.getConfigValue()))
            .orElse(true);
    }

    @SuppressWarnings("unchecked")
    private List<String> extractSections(Map<String, Object> body) {
        if (body == null || body.get("sections") == null) return null;
        return (List<String>) body.get("sections");
    }

    /**
     * HR Admin dashboard action: builds a fresh workforce snapshot and asks
     * the AI model for an executive summary.
     */
    @PostMapping("/hr-report")
    public ResponseEntity<?> generateHrReport(@RequestBody(required = false) Map<String, Object> body) {
        if (!isFeatureEnabled("feature.ai_hr_report")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "The AI HR Report feature has been disabled by the administrator."));
        }
        try {
            return ResponseEntity.ok(aiReportService.generateHrReport(extractSections(body)));
        } catch (IllegalStateException ex) {
            // AI not configured (no API key) - not a server error, just unavailable.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", ex.getMessage()));
        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Returns previously generated HR-wide reports, most recent first.
     */
    @GetMapping("/hr-report/history")
    public ResponseEntity<?> getHrReportHistory() {
        return ResponseEntity.ok(aiReportService.getHrHistory());
    }

    /**
     * Manager dashboard action: builds a snapshot of the manager's direct
     * reports (attendance, leave requests, performance ratings) and asks the
     * AI model for an executive team summary.
     */
    @PostMapping("/manager-report/{managerId}")
    public ResponseEntity<?> generateManagerReport(@PathVariable Long managerId, @RequestBody(required = false) Map<String, Object> body) {
        if (!isFeatureEnabled("feature.ai_manager_report")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "The AI Manager Team Report feature has been disabled by the administrator."));
        }
        try {
            return ResponseEntity.ok(aiReportService.generateManagerReport(managerId, extractSections(body)));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Returns previously generated reports for a manager's team, most recent first.
     */
    @GetMapping("/manager-report/{managerId}/history")
    public ResponseEntity<?> getManagerReportHistory(@PathVariable Long managerId) {
        return ResponseEntity.ok(aiReportService.getManagerHistory(managerId));
    }
}
