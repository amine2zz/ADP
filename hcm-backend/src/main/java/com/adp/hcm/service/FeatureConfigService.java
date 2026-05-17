package com.adp.hcm.service;

import com.adp.hcm.entity.FeatureConfig;
import com.adp.hcm.repository.FeatureConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FeatureConfigService {

    @Autowired
    private FeatureConfigRepository repository;

    public List<FeatureConfig> getAllFeatures() {
        return repository.findAll();
    }

    public Map<String, Boolean> getFeatureMap() {
        return repository.findAll().stream()
            .collect(Collectors.toMap(FeatureConfig::getFeatureKey, f -> Boolean.TRUE.equals(f.getIsEnabled())));
    }

    public boolean isEnabled(String featureKey) {
        return repository.findByFeatureKey(featureKey)
            .map(f -> Boolean.TRUE.equals(f.getIsEnabled()))
            .orElse(false);
    }

    public FeatureConfig toggle(String featureKey, boolean enabled) {
        FeatureConfig feature = repository.findByFeatureKey(featureKey)
            .orElseThrow(() -> new RuntimeException("Feature not found: " + featureKey));

        if (Boolean.TRUE.equals(feature.getIsCore())) {
            throw new RuntimeException("Core features cannot be toggled.");
        }

        feature.setIsEnabled(enabled);

        // Disabling a parent disables all children
        if (!enabled) {
            List<FeatureConfig> children = repository.findAll().stream()
                .filter(f -> featureKey.equals(f.getParentFeatureKey()))
                .toList();
            for (FeatureConfig child : children) {
                child.setIsEnabled(false);
                repository.save(child);
            }
        }

        return repository.save(feature);
    }

    public void seed() {
        seedIfMissing("employees", "Employee Profiles", true, true, null);
        seedIfMissing("attendance", "Attendance", true, true, null);
        seedIfMissing("leave", "Leave Management", true, true, null);
        seedIfMissing("org_chart", "Org Chart", true, true, null);
        seedIfMissing("performance", "Performance Evaluations", true, false, null);
        seedIfMissing("evaluation", "Evaluation Questions", true, false, "performance");
        seedIfMissing("reports", "Reports", true, false, null);
        seedIfMissing("leave.advanced", "Advanced Leave Policies", true, false, "leave");
        seedIfMissing("recruitment", "Recruitment", true, false, null);
        seedIfMissing("recruitment.manager_interviews", "Manager Interviews", true, false, "recruitment");
        seedIfMissing("recruitment.public_landing", "Public Careers Page", true, false, "recruitment");
        seedIfMissing("payroll", "Payroll", true, false, null);
        seedIfMissing("training", "Training", true, false, null);
        seedIfMissing("offboarding", "Offboarding", true, false, null);
    }

    private void seedIfMissing(String key, String label, boolean enabled, boolean core, String parent) {
        if (repository.findByFeatureKey(key).isEmpty()) {
            FeatureConfig f = new FeatureConfig();
            f.setFeatureKey(key);
            f.setFeatureLabel(label);
            f.setIsEnabled(enabled);
            f.setIsCore(core);
            f.setParentFeatureKey(parent);
            repository.save(f);
        }
    }
}
