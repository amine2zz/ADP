package com.adp.hcm.service;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.LabelOverride;
import com.adp.hcm.entity.SystemConfig;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.LabelOverrideRepository;
import com.adp.hcm.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SuperAdminService {

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private LabelOverrideRepository labelOverrideRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ── System Config ──────────────────────────────────────────────────────────

    public List<SystemConfig> getAllConfigs() {
        return systemConfigRepository.findAll();
    }

    public SystemConfig upsertConfig(String key, String value) {
        SystemConfig cfg = systemConfigRepository.findByConfigKey(key)
            .orElseGet(() -> {
                SystemConfig c = new SystemConfig();
                c.setConfigKey(key);
                return c;
            });
        cfg.setConfigValue(value);
        return systemConfigRepository.save(cfg);
    }

    public Map<String, String> getConfigMap() {
        return systemConfigRepository.findAll().stream()
            .collect(Collectors.toMap(SystemConfig::getConfigKey, c -> c.getConfigValue() != null ? c.getConfigValue() : ""));
    }

    public void seedSystemConfig() {
        seedConfigIfMissing("company_name", "ADP ES Tunisie", "Company Name");
        seedConfigIfMissing("primary_color", "#cc0000", "Primary Colour");
        seedConfigIfMissing("timezone", "Africa/Tunis", "Timezone");
        seedConfigIfMissing("logo_url", "", "Logo URL");
        seedConfigIfMissing("smtp_host", "", "SMTP Host");
        seedConfigIfMissing("smtp_port", "587", "SMTP Port");
        seedConfigIfMissing("smtp_user", "", "SMTP User");
        seedConfigIfMissing("smtp_pass", "", "SMTP Password");
    }

    private void seedConfigIfMissing(String key, String defaultValue, String label) {
        if (systemConfigRepository.findByConfigKey(key).isEmpty()) {
            SystemConfig c = new SystemConfig();
            c.setConfigKey(key);
            c.setConfigValue(defaultValue);
            c.setConfigLabel(label);
            systemConfigRepository.save(c);
        }
    }

    // ── Label Overrides ─────────────────────────────────────────────────────────

    public List<LabelOverride> getAllLabels() {
        return labelOverrideRepository.findAll();
    }

    public LabelOverride upsertLabel(String key, String customValue) {
        LabelOverride label = labelOverrideRepository.findByLabelKey(key)
            .orElseThrow(() -> new RuntimeException("Label key not found: " + key));
        label.setCustomValue(customValue);
        return labelOverrideRepository.save(label);
    }

    public void seedLabels() {
        seedLabelIfMissing("nav.leave", "Leave Request");
        seedLabelIfMissing("nav.employees", "Employees");
        seedLabelIfMissing("nav.performance", "Performance");
        seedLabelIfMissing("nav.recruitment", "Recruitment");
        seedLabelIfMissing("nav.reports", "Reports");
        seedLabelIfMissing("nav.payroll", "Payroll");
        seedLabelIfMissing("nav.training", "Training");
        seedLabelIfMissing("section.leave_request", "Leave Request");
        seedLabelIfMissing("section.attendance", "Attendance");
    }

    private void seedLabelIfMissing(String key, String defaultValue) {
        if (labelOverrideRepository.findByLabelKey(key).isEmpty()) {
            LabelOverride l = new LabelOverride();
            l.setLabelKey(key);
            l.setDefaultValue(defaultValue);
            l.setCustomValue(null);
            labelOverrideRepository.save(l);
        }
    }

    // ── User Management ─────────────────────────────────────────────────────────

    public List<Employee> getAllUsers() {
        return employeeRepository.findAll();
    }

    public Employee promoteToSuperAdmin(Long userId) {
        Employee e = employeeRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        e.setRole("SUPERADMIN");
        return employeeRepository.save(e);
    }

    public Employee demoteFromSuperAdmin(Long userId) {
        Employee e = employeeRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        e.setRole("EMPLOYEE");
        return employeeRepository.save(e);
    }

    public Employee deactivateUser(Long userId) {
        Employee e = employeeRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        e.setStatus("INACTIVE");
        return employeeRepository.save(e);
    }

    public Employee forcePasswordReset(Long userId) {
        Employee e = employeeRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        String tempToken = java.util.UUID.randomUUID().toString();
        e.setActivationToken(tempToken);
        e.setStatus("PENDING_SETUP");
        return employeeRepository.save(e);
    }
}
