package com.adp.hcm.controller;

import com.adp.hcm.entity.SystemConfig;
import com.adp.hcm.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*")
public class SystemConfigController {

    @Autowired
    private SystemConfigRepository configRepo;

    /** Public — used by Angular on every load to apply theme / feature flags */
    @GetMapping("/public")
    public List<SystemConfig> getPublicConfig() {
        return configRepo.findAll();
    }

    /** Full list — for superuser dashboard */
    @GetMapping
    public List<SystemConfig> getAllConfig() {
        return configRepo.findAll();
    }

    /** Update one config entry (superuser only — guarded by role on FE) */
    @PutMapping("/{key}")
    public ResponseEntity<SystemConfig> updateConfig(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {

        return configRepo.findById(key).map(cfg -> {
            if (!cfg.isOptional()) {
                return ResponseEntity.status(403).<SystemConfig>build();
            }
            cfg.setConfigValue(body.get("value"));
            return ResponseEntity.ok(configRepo.save(cfg));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Bulk update — saves all changed values in one request */
    @PutMapping("/bulk")
    public ResponseEntity<List<SystemConfig>> bulkUpdate(
            @RequestBody List<Map<String, String>> updates) {

        updates.forEach(u -> {
            String k = u.get("key");
            String v = u.get("value");
            configRepo.findById(k).ifPresent(cfg -> {
                if (cfg.isOptional()) {
                    cfg.setConfigValue(v);
                    configRepo.save(cfg);
                }
            });
        });
        return ResponseEntity.ok(configRepo.findAll());
    }

    /** Create a new custom config variable (superuser only) */
    @PostMapping
    public ResponseEntity<?> createConfig(@RequestBody SystemConfig cfg) {
        if (configRepo.existsById(cfg.getConfigKey())) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Key already exists: " + cfg.getConfigKey()));
        }
        cfg.setOptional(true); // user-created variables are always removable
        if (cfg.getCategory() == null) cfg.setCategory("CUSTOM");
        if (cfg.getInputType() == null) cfg.setInputType("TEXT");
        return ResponseEntity.ok(configRepo.save(cfg));
    }

    /** Delete a config variable — only optional (non-core) entries can be removed */
    @DeleteMapping("/{key}")
    public ResponseEntity<Void> deleteConfig(@PathVariable String key) {
        return configRepo.findById(key)
                .map(cfg -> {
                    if (!cfg.isOptional()) {
                        return ResponseEntity.status(403).<Void>build();
                    }
                    configRepo.deleteById(key);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
