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

    public Department updateDepartment(Long id, Department updatedData) {
        Department existing = findDepartmentById(id);
        if (updatedData.getName() != null) existing.setName(updatedData.getName());
        if (updatedData.getDescription() != null) existing.setDescription(updatedData.getDescription());
        if (updatedData.getLocation() != null) existing.setLocation(updatedData.getLocation());
        if (updatedData.getBudgetCode() != null) existing.setBudgetCode(updatedData.getBudgetCode());
        if (updatedData.getManagerId() != null) existing.setManagerId(updatedData.getManagerId());
        return departmentRepository.save(existing);
    }
}
