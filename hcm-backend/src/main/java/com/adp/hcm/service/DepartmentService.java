package com.adp.hcm.service;

import com.adp.hcm.entity.Department;
import com.adp.hcm.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> retrieveAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department saveNewDepartment(Department department) {
        return departmentRepository.save(department);
    }
    
    public Department findDepartmentById(Long id) {
        return departmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Department not found"));
    }
}
