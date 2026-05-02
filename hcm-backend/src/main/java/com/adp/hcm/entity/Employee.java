package com.adp.hcm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "employee")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties("employees")
    private Department department;

    private String role = "EMPLOYEE"; // Roles: EMPLOYEE, MANAGER, HR_ADMIN

    // Additional fields to be filled by the employee later
    private String address;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Column(name = "date_of_birth")
    private String dateOfBirth;

    // Account Status & Activation
    private String status = "PENDING_SETUP"; // PENDING_SETUP, ACTIVE, INACTIVE

    @Column(name = "cin", unique = true)
    private String cin;

    @Column(name = "employee_code", unique = true)
    private String employeeCode;

    private String gender;

    @Column(name = "marital_status")
    private String maritalStatus;

    private String nationality;

    private String situation;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "joining_date")
    private String joiningDate;

    @Column(name = "job_title")
    private String jobTitle;
    
    @Column(name = "activation_token", unique = true)
    private String activationToken;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_id")
    @JsonIgnoreProperties({"department", "manager"})
    private Employee manager;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private EmployeeCategory category;

    @Column(name = "leave_balance")
    private Double leaveBalance = 0.0;

    @Column(name = "sick_leave_balance", columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double sickLeaveBalance = 0.0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
