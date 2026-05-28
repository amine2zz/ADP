package com.adp.hcm.service;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.repository.DepartmentRepository;
import com.adp.hcm.repository.EmployeeCategoryRepository;
import com.adp.hcm.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmployeeService {

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private HRManagementService hrService;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private EmployeeCategoryRepository categoryRepository;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public List<Employee> getManagers() {
        // Returns all employees who have MANAGER or HR_ADMIN role,
        // plus any employee who already has people reporting to them
        List<Employee> all = employeeRepository.findAll();
        java.util.Set<Long> hasReports = all.stream()
            .filter(e -> e.getManager() != null)
            .map(e -> e.getManager().getId())
            .collect(java.util.stream.Collectors.toSet());
        return all.stream()
            .filter(e -> "MANAGER".equals(e.getRole())
                      || "HR_ADMIN".equals(e.getRole())
                      || hasReports.contains(e.getId()))
            .toList();
    }

    public Employee createEmployee(Employee employee) {
        String token = UUID.randomUUID().toString();
        employee.setActivationToken(token);
        employee.setStatus("PENDING_SETUP");
        if (employee.getCategory() != null) {
            employee.setLeaveBalance((double) employee.getCategory().getAnnualLeaveAllowance());
            employee.setSickLeaveBalance((double) employee.getCategory().getSickLeaveAllowance());
        }
        Employee saved = employeeRepository.save(employee);
        hrService.logOperation("SYSTEM", "CREATE_EMPLOYEE", saved.getEmail(), "HR Admin provisioned a new account");
        emailService.sendSetupEmail(saved.getEmail(), token);
        return saved;
    }

    public Employee quickCreateEmployee(Employee employee, String rawPassword) {
        employee.setPassword(passwordEncoder.encode(rawPassword));
        employee.setStatus("ACTIVE");
        employee.setActivationToken(null);
        if (employee.getCategory() != null) {
            employee.setLeaveBalance((double) employee.getCategory().getAnnualLeaveAllowance());
            employee.setSickLeaveBalance((double) employee.getCategory().getSickLeaveAllowance());
        }
        Employee saved = employeeRepository.save(employee);
        hrService.logOperation("SYSTEM", "QUICK_CREATE", saved.getEmail(), "Account created via Quick Setup with immediate activation");
        return saved;
    }

    public Employee setupAccount(String token, String newPassword, String address, String phoneNumber, String dateOfBirth) {
        Employee employee = employeeRepository.findByActivationToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid or expired activation token."));
        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setAddress(address);
        employee.setPhoneNumber(phoneNumber);
        employee.setDateOfBirth(dateOfBirth);
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
        Employee employee = employeeRepository.findById(empId).orElseThrow(() -> new RuntimeException("Employee not found"));
        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElseThrow(() -> new RuntimeException("Manager not found"));
            employee.setManager(manager);
            hrService.logOperation("SYSTEM", "ASSIGN_MANAGER", employee.getEmail(), "Assigned to manager: " + manager.getEmail());
        } else {
            employee.setManager(null);
            hrService.logOperation("SYSTEM", "UNASSIGN_MANAGER", employee.getEmail(), "Removed reporting manager");
        }
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee updatedData) {
        Employee existing = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
        if (updatedData.getFirstName() != null) existing.setFirstName(updatedData.getFirstName());
        if (updatedData.getLastName() != null) existing.setLastName(updatedData.getLastName());
        if (updatedData.getCin() != null) existing.setCin(updatedData.getCin());
        if (updatedData.getEmployeeCode() != null) existing.setEmployeeCode(updatedData.getEmployeeCode());
        if (updatedData.getGender() != null) existing.setGender(updatedData.getGender());
        if (updatedData.getMaritalStatus() != null) existing.setMaritalStatus(updatedData.getMaritalStatus());
        if (updatedData.getNationality() != null) existing.setNationality(updatedData.getNationality());
        if (updatedData.getSituation() != null) existing.setSituation(updatedData.getSituation());
        if (updatedData.getEmergencyContact() != null) existing.setEmergencyContact(updatedData.getEmergencyContact());
        if (updatedData.getJoiningDate() != null) existing.setJoiningDate(updatedData.getJoiningDate());
        if (updatedData.getJobTitle() != null) existing.setJobTitle(updatedData.getJobTitle());
        if (updatedData.getAddress() != null) existing.setAddress(updatedData.getAddress());
        if (updatedData.getPhoneNumber() != null) existing.setPhoneNumber(updatedData.getPhoneNumber());
        if (updatedData.getDateOfBirth() != null) existing.setDateOfBirth(updatedData.getDateOfBirth());
        if (updatedData.getRole() != null) existing.setRole(updatedData.getRole());
        if (updatedData.getDepartment() != null) existing.setDepartment(updatedData.getDepartment());
        if (updatedData.getStatus() != null) existing.setStatus(updatedData.getStatus());
        hrService.logOperation("SYSTEM", "PROFILE_UPDATE", existing.getEmail(), "Profile updated");
        return employeeRepository.save(existing);
    }

    @SuppressWarnings("unchecked")
    public Employee updateEmployeeFromMap(Long id, Map<String, Object> updates) {
        Employee existing = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));

        if (updates.containsKey("firstName")) existing.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName")) existing.setLastName((String) updates.get("lastName"));

        String cin = (String) updates.get("cin");
        existing.setCin((cin == null || cin.trim().isEmpty()) ? null : cin);

        String empCode = (String) updates.get("employeeCode");
        existing.setEmployeeCode((empCode == null || empCode.trim().isEmpty()) ? null : empCode);

        if (updates.containsKey("gender")) existing.setGender((String) updates.get("gender"));
        if (updates.containsKey("maritalStatus")) existing.setMaritalStatus((String) updates.get("maritalStatus"));
        if (updates.containsKey("nationality")) existing.setNationality((String) updates.get("nationality"));
        if (updates.containsKey("emergencyContact")) existing.setEmergencyContact((String) updates.get("emergencyContact"));
        if (updates.containsKey("jobTitle")) existing.setJobTitle((String) updates.get("jobTitle"));
        if (updates.containsKey("joiningDate")) existing.setJoiningDate((String) updates.get("joiningDate"));
        if (updates.containsKey("address")) existing.setAddress((String) updates.get("address"));
        if (updates.containsKey("phoneNumber")) existing.setPhoneNumber((String) updates.get("phoneNumber"));
        if (updates.containsKey("dateOfBirth")) existing.setDateOfBirth((String) updates.get("dateOfBirth"));
        if (updates.containsKey("role")) existing.setRole((String) updates.get("role"));
        if (updates.containsKey("status")) existing.setStatus((String) updates.get("status"));
        if (updates.containsKey("leaveBalance")) existing.setLeaveBalance(Double.valueOf(updates.get("leaveBalance").toString()));
        if (updates.containsKey("sickLeaveBalance")) existing.setSickLeaveBalance(Double.valueOf(updates.get("sickLeaveBalance").toString()));

        if (updates.containsKey("categoryId")) {
            Object catIdObj = updates.get("categoryId");
            if (catIdObj != null && !catIdObj.toString().isEmpty()) {
                Long catId = Long.valueOf(catIdObj.toString());
                categoryRepository.findById(catId).ifPresent(cat -> {
                    existing.setCategory(cat);
                    if (existing.getLeaveBalance() == null || existing.getLeaveBalance() == 0.0)
                        existing.setLeaveBalance((double) cat.getAnnualLeaveAllowance());
                    if (existing.getSickLeaveBalance() == null || existing.getSickLeaveBalance() == 0.0)
                        existing.setSickLeaveBalance((double) cat.getSickLeaveAllowance());
                });
            } else {
                existing.setCategory(null);
            }
        }

        if (updates.containsKey("syncWithPolicy") && Boolean.TRUE.equals(updates.get("syncWithPolicy"))) {
            if (existing.getCategory() != null) {
                existing.setLeaveBalance((double) existing.getCategory().getAnnualLeaveAllowance());
                existing.setSickLeaveBalance((double) existing.getCategory().getSickLeaveAllowance());
            }
        }

        if (updates.containsKey("department")) {
            Map<String, Object> deptMap = (Map<String, Object>) updates.get("department");
            if (deptMap != null && deptMap.get("id") != null) {
                Long deptId = ((Number) deptMap.get("id")).longValue();
                departmentRepository.findById(deptId).ifPresent(existing::setDepartment);
            } else {
                existing.setDepartment(null);
            }
        }

        if (updates.containsKey("manager")) {
            Map<String, Object> managerMap = (Map<String, Object>) updates.get("manager");
            if (managerMap != null && managerMap.get("id") != null) {
                Long managerId = ((Number) managerMap.get("id")).longValue();
                employeeRepository.findById(managerId).ifPresent(existing::setManager);
            } else {
                existing.setManager(null);
            }
        }

        hrService.logOperation("SYSTEM", "PROFILE_UPDATE", existing.getEmail(), "Profile updated via HR Admin");
        return employeeRepository.save(existing);
    }
}
