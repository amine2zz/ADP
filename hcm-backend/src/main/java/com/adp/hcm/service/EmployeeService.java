package com.adp.hcm.service;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private HRManagementService hrService;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public List<Employee> getManagers() {
        return employeeRepository.findAll().stream()
            .filter(e -> "MANAGER".equals(e.getRole()) || "HR_ADMIN".equals(e.getRole()))
            .toList();
    }

    public Employee createEmployee(Employee employee) {
        // HR Admin only provides basic fields.
        // System generates the activation token.
        String token = UUID.randomUUID().toString();
        employee.setActivationToken(token);
        employee.setStatus("PENDING_SETUP");
        
        Employee savedEmployee = employeeRepository.save(employee);
        
        hrService.logOperation("SYSTEM", "CREATE_EMPLOYEE", savedEmployee.getEmail(), "HR Admin provisioned a new account");
        
        // Dispatch account setup email safely
        emailService.sendSetupEmail(savedEmployee.getEmail(), token);
        
        return savedEmployee;
    }

    public Employee setupAccount(String token, String newPassword, String address, String phoneNumber, String dateOfBirth) {
        Employee employee = employeeRepository.findByActivationToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid or expired activation token."));

        // Mathematically hash the password securely
        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setAddress(address);
        employee.setPhoneNumber(phoneNumber);
        employee.setDateOfBirth(dateOfBirth);
        
        // Activate the account and destroy the token globally
        employee.setStatus("ACTIVE");
        employee.setActivationToken(null);
        
        return employeeRepository.save(employee);
    }
    
    public Optional<Employee> authenticate(String email, String rawPassword) {
        Optional<Employee> empOpt = employeeRepository.findByEmail(email);
        if (empOpt.isPresent() && empOpt.get().getPassword() != null) {
            if (passwordEncoder.matches(rawPassword, empOpt.get().getPassword())) {
                return empOpt;
            }
        }
        return Optional.empty();
    }

    public List<Employee> getSubordinates(Long managerId) {
        return employeeRepository.findByManagerId(managerId);
    }

    public Employee updateManager(Long empId, Long managerId) {
        Employee employee = employeeRepository.findById(empId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));
            
        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
            employee.setManager(manager);
            hrService.logOperation("SYSTEM", "ASSIGN_MANAGER", employee.getEmail(), "Assigned to manager: " + manager.getEmail());
        } else {
            employee.setManager(null);
            hrService.logOperation("SYSTEM", "UNASSIGN_MANAGER", employee.getEmail(), "Removed reporting manager");
        }
        
        return employeeRepository.save(employee);
    }
}
