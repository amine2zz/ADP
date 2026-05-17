package com.adp.hcm.controller;

import com.adp.hcm.entity.Application;
import com.adp.hcm.entity.JobOffer;
import com.adp.hcm.service.FeatureConfigService;
import com.adp.hcm.service.RecruitmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Public endpoints — no authentication required.
// All routes check the recruitment.public_landing feature flag.
@RestController
@RequestMapping("/api/careers")
public class CareersController {

    @Autowired
    private RecruitmentService recruitmentService;

    @Autowired
    private FeatureConfigService featureConfigService;

    @GetMapping("/offers")
    public ResponseEntity<?> getPublishedOffers() {
        if (!featureConfigService.isEnabled("recruitment.public_landing")) {
            return ResponseEntity.status(403).body(Map.of("error", "FEATURE_DISABLED", "details", "Public careers page is disabled."));
        }
        List<JobOffer> offers = recruitmentService.getPublishedOffers();
        return ResponseEntity.ok(offers);
    }

    @PostMapping("/offers/{id}/apply")
    public ResponseEntity<?> submitApplication(@PathVariable Long id, @RequestBody Application application) {
        if (!featureConfigService.isEnabled("recruitment.public_landing")) {
            return ResponseEntity.status(403).body(Map.of("error", "FEATURE_DISABLED", "details", "Applications are currently closed."));
        }
        try {
            Application saved = recruitmentService.submitApplication(id, application);
            return ResponseEntity.ok(Map.of(
                "message", "Application submitted successfully.",
                "trackingToken", saved.getTrackingToken(),
                "applicationId", saved.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "SUBMIT_FAILED", "details", e.getMessage()));
        }
    }

    @GetMapping("/track")
    public ResponseEntity<?> trackApplication(@RequestParam String token) {
        if (!featureConfigService.isEnabled("recruitment.public_landing")) {
            return ResponseEntity.status(403).body(Map.of("error", "FEATURE_DISABLED", "details", "Tracking is currently unavailable."));
        }
        try {
            Application app = recruitmentService.getApplicationByToken(token);
            return ResponseEntity.ok(app);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", "NOT_FOUND", "details", "No application found for this token."));
        }
    }
}
