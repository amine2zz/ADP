package com.adp.hcm.controller;

import com.adp.hcm.entity.*;
import com.adp.hcm.service.RecruitmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recruitment")
public class RecruitmentController {

    @Autowired
    private RecruitmentService service;

    // ── Job Offers ──────────────────────────────────────────────────────────────

    @GetMapping("/offers")
    public ResponseEntity<List<JobOffer>> getAllOffers() {
        return ResponseEntity.ok(service.getAllOffers());
    }

    @PostMapping("/offers")
    public ResponseEntity<?> createOffer(@RequestBody JobOffer offer) {
        return ResponseEntity.ok(service.createOffer(offer));
    }

    @PutMapping("/offers/{id}")
    public ResponseEntity<?> updateOffer(@PathVariable Long id, @RequestBody JobOffer offer) {
        try {
            return ResponseEntity.ok(service.updateOffer(id, offer));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "NOT_FOUND", "details", e.getMessage()));
        }
    }

    @PostMapping("/offers/{id}/publish")
    public ResponseEntity<?> publishOffer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.publishOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "PUBLISH_FAILED", "details", e.getMessage()));
        }
    }

    @PostMapping("/offers/{id}/close")
    public ResponseEntity<?> closeOffer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.closeOffer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "CLOSE_FAILED", "details", e.getMessage()));
        }
    }

    // ── Pipeline ────────────────────────────────────────────────────────────────

    @GetMapping("/offers/{id}/pipeline")
    public ResponseEntity<List<PipelineStep>> getPipeline(@PathVariable Long id) {
        return ResponseEntity.ok(service.getPipelineSteps(id));
    }

    @PostMapping("/offers/{id}/pipeline")
    public ResponseEntity<?> addStep(@PathVariable Long id, @RequestBody PipelineStep step) {
        try {
            return ResponseEntity.ok(service.addPipelineStep(id, step));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "STEP_FAILED", "details", e.getMessage()));
        }
    }

    @DeleteMapping("/pipeline/{stepId}")
    public ResponseEntity<?> deleteStep(@PathVariable Long stepId) {
        service.deletePipelineStep(stepId);
        return ResponseEntity.ok(Map.of("message", "Step deleted"));
    }

    // ── Applications ────────────────────────────────────────────────────────────

    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getAllApplications() {
        return ResponseEntity.ok(service.getAllApplications());
    }

    @GetMapping("/offers/{id}/applications")
    public ResponseEntity<List<Application>> getApplicationsForOffer(@PathVariable Long id) {
        return ResponseEntity.ok(service.getApplicationsForOffer(id));
    }

    @PostMapping("/applications/{id}/advance")
    public ResponseEntity<?> advanceStep(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(service.advanceStep(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "ADVANCE_FAILED", "details", e.getMessage()));
        }
    }

    @PostMapping("/applications/{id}/hire")
    public ResponseEntity<?> hireApplicant(@PathVariable Long id, @RequestBody Employee employeeData) {
        try {
            return ResponseEntity.ok(service.hireApplicant(id, employeeData));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "HIRE_FAILED", "details", e.getMessage()));
        }
    }
}
