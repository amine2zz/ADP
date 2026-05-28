package com.adp.hcm.controller;

import com.adp.hcm.controller.dto.LoginRequest;
import com.adp.hcm.controller.dto.SetupRequest;
import com.adp.hcm.entity.Attendance;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.service.EmployeeService;
import com.adp.hcm.service.HRManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*")
public class EmployeeController {

    @Autowired private EmployeeService employeeService;
    @Autowired private HRManagementService hrService;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private AttendanceRepository attendanceRepository;

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Employee> emp = employeeService.authenticate(request.getEmail(), request.getPassword());
        return emp.map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @GetMapping("/employees")
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/employees/managers")
    public List<Employee> getManagers() {
        return employeeService.getManagers();
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        return employeeRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/{id}/profile")
    public ResponseEntity<Employee> getEmployeeProfile(@PathVariable Long id) {
        return employeeRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.createEmployee(employee));
    }

    @PostMapping("/employees/quick")
    public ResponseEntity<Employee> quickCreateEmployee(@RequestBody Map<String, Object> payload) {
        Employee employee = new Employee();
        employee.setFirstName((String) payload.get("firstName"));
        employee.setLastName((String) payload.get("lastName"));
        employee.setEmail((String) payload.get("email"));
        employee.setRole((String) payload.get("role"));
        if (payload.get("departmentId") != null && !payload.get("departmentId").toString().isEmpty()) {
            com.adp.hcm.entity.Department dept = new com.adp.hcm.entity.Department();
            dept.setId(((Number) payload.get("departmentId")).longValue());
            employee.setDepartment(dept);
        }
        String rawPassword = (String) payload.get("password");
        if (rawPassword == null || rawPassword.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(employeeService.quickCreateEmployee(employee, rawPassword));
    }

    @PostMapping("/employees/setup")
    public ResponseEntity<Employee> setupAccount(@RequestBody SetupRequest request) {
        return ResponseEntity.ok(employeeService.setupAccount(request.getToken(), request.getNewPassword(), request.getAddress(), request.getPhoneNumber(), request.getDateOfBirth()));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(employeeService.updateEmployeeFromMap(id, payload));
    }

    @PatchMapping("/employees/{id}/manager")
    public ResponseEntity<Employee> updateManager(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        return ResponseEntity.ok(employeeService.updateManager(id, payload.get("managerId")));
    }

    @GetMapping("/manager/{id}/subordinates")
    public List<Employee> getSubordinates(@PathVariable Long id) {
        return employeeService.getSubordinates(id);
    }

    @PostMapping("/employees/{id}/leaves")
    public ResponseEntity<?> submitLeave(@PathVariable Long id, @RequestBody LeaveRequest leave) {
        Employee employee = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
        return ResponseEntity.ok(hrService.submitLeaveRequest(employee, leave));
    }

    @GetMapping("/employees/{id}/leaves-history")
    public List<LeaveRequest> getEmployeeLeaves(@PathVariable Long id) {
        return leaveRequestRepository.findByEmployeeId(id);
    }

    @PostMapping("/employees/{id}/attendance")
    public ResponseEntity<?> logAttendance(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Employee employee = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
        return ResponseEntity.ok(hrService.logAttendance(employee, payload.get("punchType")));
    }

    @GetMapping("/employees/{id}/attendance/today")
    public ResponseEntity<?> getTodayAttendance(@PathVariable Long id) {
        return ResponseEntity.ok(hrService.getTodayAttendance(id));
    }

    @GetMapping("/employees/{id}/attendance-history")
    public List<Attendance> getEmployeeAttendance(@PathVariable Long id) {
        return attendanceRepository.findByEmployeeId(id);
    }
}
