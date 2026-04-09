package com.adp.hcm.controller;

import com.adp.hcm.entity.Department;
import com.adp.hcm.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "http://localhost:4200")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public List<Department> retrieveAllDepartments() {
        return departmentService.retrieveAllDepartments();
    }

    @PostMapping
    public ResponseEntity<Department> saveNewDepartment(@RequestBody Department department) {
        Department savedDepartment = departmentService.saveNewDepartment(department);
        return ResponseEntity.ok(savedDepartment);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Department> retrieveDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.findDepartmentById(id));
    }
}
