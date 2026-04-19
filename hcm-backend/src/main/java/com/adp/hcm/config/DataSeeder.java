package com.adp.hcm.config;

import com.adp.hcm.entity.Department;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.repository.DepartmentRepository;
import com.adp.hcm.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(
            DepartmentRepository departmentRepository, 
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Ensure Departments exist
            Department hr = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equals("Human Resources"))
                .findFirst()
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Human Resources");
                    d.setDescription("Manages employee relations and benefits.");
                    return departmentRepository.save(d);
                });
            
            Department eng = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equals("Engineering"))
                .findFirst()
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Engineering");
                    d.setDescription("Develops core software and platform architecture.");
                    return departmentRepository.save(d);
                });

            Department mkt = departmentRepository.findAll().stream()
                .filter(d -> d.getName().equals("Marketing"))
                .findFirst()
                .orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Marketing");
                    d.setDescription("Handles public relations and media.");
                    return departmentRepository.save(d);
                });

            // 2. Ensure Master Admin exists
            if (!employeeRepository.existsByEmail("admin@adp.com")) {
                System.out.println("🌱 SEEDING MASTER ADMIN: admin@adp.com / admin123");
                Employee admin = new Employee();
                admin.setFirstName("ADP");
                admin.setLastName("Admin");
                admin.setEmail("admin@adp.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("HR_ADMIN");
                admin.setStatus("ACTIVE");
                admin.setDepartment(hr);
                employeeRepository.save(admin);
            }

            // 3. Ensure Manager exists
            Employee manager = employeeRepository.findByEmail("manager@adp.com").orElse(null);
            if (manager == null) {
                System.out.println("🌱 SEEDING MANAGER: manager@adp.com / manager123");
                manager = new Employee();
                manager.setFirstName("Sarah");
                manager.setLastName("Connor");
                manager.setEmail("manager@adp.com");
                manager.setPassword(passwordEncoder.encode("manager123"));
                manager.setRole("MANAGER");
                manager.setStatus("ACTIVE");
                manager.setDepartment(eng);
                manager = employeeRepository.save(manager);
            }

            // 4. Ensure Subordinate exists
            if (!employeeRepository.existsByEmail("john.smith@adp.com")) {
                System.out.println("🌱 SEEDING SUBORDINATE: john.smith@adp.com / setup required");
                Employee emp1 = new Employee();
                emp1.setFirstName("John");
                emp1.setLastName("Smith");
                emp1.setEmail("john.smith@adp.com");
                emp1.setRole("EMPLOYEE");
                emp1.setStatus("ACTIVE");
                emp1.setDepartment(eng);
                emp1.setManager(manager); // Linking to manager Sarah
                employeeRepository.save(emp1);
            }

            System.out.println("✅ DATABASE SYNCHRONIZED SUCESSFULLY!");
        };
    }
}
