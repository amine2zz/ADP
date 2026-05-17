package com.adp.hcm.controller;

import com.adp.hcm.entity.FeatureConfig;
import com.adp.hcm.service.FeatureConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/features")
public class FeatureConfigController {

    @Autowired
    private FeatureConfigService service;

    @GetMapping
    public ResponseEntity<List<FeatureConfig>> getAllFeatures() {
        return ResponseEntity.ok(service.getAllFeatures());
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, Boolean>> getFeatureMap() {
        return ResponseEntity.ok(service.getFeatureMap());
    }

    @PatchMapping("/{key}/toggle")
    public ResponseEntity<?> toggle(@PathVariable String key, @RequestBody Map<String, Boolean> body) {
        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_FIELD", "details", "'enabled' is required"));
        }
        try {
            FeatureConfig updated = service.toggle(key, enabled);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "TOGGLE_FAILED", "details", e.getMessage()));
        }
    }
}
