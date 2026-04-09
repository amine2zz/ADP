package com.adp.hcm.controller;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.service.EmployeeService;
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
}
