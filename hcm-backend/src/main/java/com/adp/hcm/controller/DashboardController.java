package com.adp.hcm.controller;

import com.adp.hcm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private EmployeeCategoryRepository categoryRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;

    @GetMapping("/metrics")
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        var allEmployees = employeeRepository.findAll();

        metrics.put("totalHeadcount", allEmployees.size());
        metrics.put("activeProfiles", allEmployees.stream().filter(e -> "ACTIVE".equals(e.getStatus())).count());
        metrics.put("pendingSetups", allEmployees.stream().filter(e -> "PENDING_SETUP".equals(e.getStatus())).count());
        metrics.put("totalDepartments", departmentRepository.count());
        metrics.put("totalPolicies", categoryRepository.count());
        metrics.put("totalLeaveDays", allEmployees.stream().mapToDouble(e -> e.getLeaveBalance() != null ? e.getLeaveBalance() : 0.0).sum());
        metrics.put("totalSickDays", allEmployees.stream().mapToDouble(e -> e.getSickLeaveBalance() != null ? e.getSickLeaveBalance() : 0.0).sum());

        Map<String, Long> deptDistribution = allEmployees.stream()
            .filter(e -> e.getDepartment() != null)
            .collect(Collectors.groupingBy(e -> e.getDepartment().getName(), Collectors.counting()));
        metrics.put("deptDistribution", deptDistribution);

        Map<String, Long> leaveTypeDistribution = leaveRequestRepository.findAll().stream()
            .collect(Collectors.groupingBy(l -> l.getType(), Collectors.counting()));
        metrics.put("leaveTypeDistribution", leaveTypeDistribution);

        return metrics;
    }
}
