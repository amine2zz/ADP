package com.adp.hcm.controller;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.Attendance;
import com.adp.hcm.service.EmployeeService;
import com.adp.hcm.service.HRManagementService;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.controller.dto.SetupRequest;
import com.adp.hcm.controller.dto.LoginRequest;
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

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private HRManagementService hrService;

    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private LeaveRequestRepository leaveRequestRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<Employee> emp = employeeService.authenticate(loginRequest.getEmail(), loginRequest.getPassword());
        if (emp.isPresent()) {
            return ResponseEntity.ok(emp.get());
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    @GetMapping("/manager/{id}/subordinates")
    public List<Employee> getSubordinates(@PathVariable("id") Long id) {
        return employeeService.getSubordinates(id);
    }

    @GetMapping("/employees/managers")
    public List<Employee> getManagers() {
        return employeeService.getManagers();
    }

    @GetMapping("/employees")
    public List<Employee> getAllEmployees() {
        return employeeService.getAllEmployees();
    }

    // Compatibility alias for Admin Dashboard
    @GetMapping("/employees/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable("id") Long id) {
        return getEmployeeProfile(id);
    }

    @GetMapping("/employees/{id}/profile")
    public ResponseEntity<Employee> getEmployeeProfile(@PathVariable("id") Long id) {
        return employeeRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/employees")
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        Employee savedEmployee = employeeService.createEmployee(employee);
        return ResponseEntity.ok(savedEmployee);
    }

    @PostMapping("/employees/setup")
    public ResponseEntity<Employee> setupAccount(@RequestBody SetupRequest request) {
        Employee activatedEmployee = employeeService.setupAccount(
            request.getToken(), 
            request.getNewPassword(), 
            request.getAddress(), 
            request.getPhoneNumber(), 
            request.getDateOfBirth()
        );
        return ResponseEntity.ok(activatedEmployee);
    }

    @PatchMapping("/employees/{id}/manager")
    public ResponseEntity<Employee> updateManager(@PathVariable("id") Long id, @RequestBody Map<String, Long> payload) {
        Employee updated = employeeService.updateManager(id, payload.get("managerId"));
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/employees/{id}/leaves")
    public ResponseEntity<?> submitLeave(@PathVariable("id") Long id, @RequestBody LeaveRequest leave) {
        Employee employee = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
        return ResponseEntity.ok(hrService.submitLeaveRequest(employee, leave));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(employeeService.updateEmployeeFromMap(id, payload));
    }

    @PostMapping("/employees/{id}/attendance")
    public ResponseEntity<?> logAttendance(@PathVariable("id") Long id, @RequestBody Map<String, String> payload) {
        Employee employee = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee not found"));
        return ResponseEntity.ok(hrService.logAttendance(employee, payload.get("punchType")));
    }

    @GetMapping("/employees/{id}/attendance/today")
    public ResponseEntity<?> getTodayAttendance(@PathVariable("id") Long id) {
        return ResponseEntity.ok(hrService.getTodayAttendance(id));
    }

    @GetMapping("/employees/{id}/leaves-history")
    public List<LeaveRequest> getEmployeeLeaves(@PathVariable("id") Long id) {
        return leaveRequestRepository.findByEmployeeId(id);
    }

    @GetMapping("/employees/{id}/attendance-history")
    public List<Attendance> getEmployeeAttendance(@PathVariable("id") Long id) {
        return attendanceRepository.findByEmployeeId(id);
    }
}
