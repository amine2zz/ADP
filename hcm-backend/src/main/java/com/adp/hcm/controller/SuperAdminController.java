package com.adp.hcm.controller;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.LabelOverride;
import com.adp.hcm.entity.SystemConfig;
import com.adp.hcm.service.SuperAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    @Autowired
    private SuperAdminService service;

    // ── System Config ──────────────────────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<List<SystemConfig>> getConfigs() {
        return ResponseEntity.ok(service.getAllConfigs());
    }

    @PutMapping("/config/{key}")
    public ResponseEntity<?> updateConfig(@PathVariable String key, @RequestBody Map<String, String> body) {
        String value = body.get("value");
        if (value == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_FIELD", "details", "'value' is required"));
        }
        return ResponseEntity.ok(service.upsertConfig(key, value));
    }

    @GetMapping("/config/map")
    public ResponseEntity<Map<String, String>> getConfigMap() {
        return ResponseEntity.ok(service.getConfigMap());
    }

    // ── Label Overrides ─────────────────────────────────────────────────────────

    @GetMapping("/labels")
    public ResponseEntity<List<LabelOverride>> getLabels() {
        return ResponseEntity.ok(service.getAllLabels());
    }

    @PutMapping("/labels/{key}")
    public ResponseEntity<?> updateLabel(@PathVariable String key, @RequestBody Map<String, String> body) {
        String customValue = body.get("customValue");
        if (customValue == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_FIELD", "details", "'customValue' is required"));
        }
        try {
            return ResponseEntity.ok(service.upsertLabel(key, customValue));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "NOT_FOUND", "details", e.getMessage()));
        }
    }

    // ── User Management ─────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<Employee>> getUsers() {
        return ResponseEntity.ok(service.getAllUsers());
    }

    @PatchMapping("/users/{id}/promote")
    public ResponseEntity<?> promote(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.promoteToSuperAdmin(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "PROMOTE_FAILED", "details", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/demote")
    public ResponseEntity<?> demote(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.demoteFromSuperAdmin(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "DEMOTE_FAILED", "details", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.deactivateUser(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "DEACTIVATE_FAILED", "details", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/force-reset")
    public ResponseEntity<?> forceReset(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.forcePasswordReset(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "RESET_FAILED", "details", e.getMessage()));
        }
    }
}
