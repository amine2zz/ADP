package com.adp.hcm.controller;

import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.DepartmentRepository;
import com.adp.hcm.repository.EmployeeCategoryRepository;
import com.adp.hcm.entity.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import com.adp.hcm.repository.LeaveRequestRepository;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private EmployeeCategoryRepository categoryRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

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
        long totalPolicies = categoryRepository.count();
        
        double totalLeaveDays = employeeRepository.findAll().stream()
            .mapToDouble(e -> e.getLeaveBalance() != null ? e.getLeaveBalance() : 0.0)
            .sum();
            
        double totalSickDays = employeeRepository.findAll().stream()
            .mapToDouble(e -> e.getSickLeaveBalance() != null ? e.getSickLeaveBalance() : 0.0)
            .sum();

        metrics.put("totalHeadcount", totalEmployees);
        metrics.put("activeProfiles", activeProfiles);
        metrics.put("pendingSetups", pendingSetups);
        metrics.put("totalDepartments", totalDepartments);
        metrics.put("totalPolicies", totalPolicies);
        metrics.put("totalLeaveDays", totalLeaveDays);
        metrics.put("totalSickDays", totalSickDays);
        
        // Data for Charts
        Map<String, Long> deptDistribution = employeeRepository.findAll().stream()
            .filter(e -> e.getDepartment() != null)
            .collect(Collectors.groupingBy(e -> e.getDepartment().getName(), Collectors.counting()));
        metrics.put("deptDistribution", deptDistribution);

        Map<String, Long> leaveTypeDistribution = leaveRequestRepository.findAll().stream()
            .collect(Collectors.groupingBy(l -> l.getType().toString(), Collectors.counting()));
        metrics.put("leaveTypeDistribution", leaveTypeDistribution);
        
        return metrics;
    }
}
