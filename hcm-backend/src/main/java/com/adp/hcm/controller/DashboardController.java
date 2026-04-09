package com.adp.hcm.controller;

import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;

    @GetMapping("/metrics")
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        long totalEmployees = employeeRepository.count();
        long activeProfiles = employeeRepository.findAll().stream()
            .filter(e -> "ACTIVE".equals(e.getStatus()))
            .count();
        long pendingSetups = employeeRepository.findAll().stream()
            .filter(e -> "PENDING_SETUP".equals(e.getStatus()))
            .count();
        long totalDepartments = departmentRepository.count();
        
        metrics.put("totalHeadcount", totalEmployees);
        metrics.put("activeProfiles", activeProfiles);
        metrics.put("pendingSetups", pendingSetups);
        metrics.put("totalDepartments", totalDepartments);
        
        return metrics;
    }
}
