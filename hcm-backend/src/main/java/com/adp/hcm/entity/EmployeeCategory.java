package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "employee_category")
public class EmployeeCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "Category 1", "Senior Staff"

    private Integer annualLeaveAllowance; // Days per year
    
    private double monthlyIncrement; // How many days added per month (e.g. 20/12 = 1.66)

    @Column(name = "sick_leave_allowance", columnDefinition = "INT DEFAULT 0")
    private Integer sickLeaveAllowance = 0; // Days per year

    private String description;
}
