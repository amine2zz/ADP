package com.adp.hcm.controller;

import com.adp.hcm.entity.EmployeeCategory;
import com.adp.hcm.repository.EmployeeCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/categories")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*")
public class CategoryController {

    @Autowired private EmployeeCategoryRepository categoryRepository;

    @GetMapping
    public List<EmployeeCategory> getAll() { return categoryRepository.findAll(); }

    @PostMapping
    public EmployeeCategory create(@RequestBody EmployeeCategory category) {
        if (category.getMonthlyIncrement() == 0 && category.getAnnualLeaveAllowance() != null && category.getAnnualLeaveAllowance() > 0) {
            category.setMonthlyIncrement((double) category.getAnnualLeaveAllowance() / 12.0);
        }
        return categoryRepository.save(category);
    }

    @PutMapping("/{id}")
    public EmployeeCategory update(@PathVariable Long id, @RequestBody EmployeeCategory updates) {
        EmployeeCategory category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
        category.setName(updates.getName());
        category.setAnnualLeaveAllowance(updates.getAnnualLeaveAllowance());
        category.setSickLeaveAllowance(updates.getSickLeaveAllowance());
        category.setDescription(updates.getDescription());
        category.setMonthlyIncrement(updates.getMonthlyIncrement() > 0 ? updates.getMonthlyIncrement() : (double) updates.getAnnualLeaveAllowance() / 12.0);
        return categoryRepository.save(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
