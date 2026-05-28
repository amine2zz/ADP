package com.adp.hcm.config;

import com.adp.hcm.entity.Department;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.EmployeeCategory;
import com.adp.hcm.entity.PerformanceQuestion;
import com.adp.hcm.entity.SystemConfig;
import com.adp.hcm.repository.DepartmentRepository;
import com.adp.hcm.repository.EmployeeCategoryRepository;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.PerformanceQuestionRepository;
import com.adp.hcm.repository.SystemConfigRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(
            DepartmentRepository deptRepo,
            EmployeeRepository empRepo,
            EmployeeCategoryRepository catRepo,
            PerformanceQuestionRepository questionRepo,
            SystemConfigRepository configRepo,
            PasswordEncoder passwordEncoder) {
        return args -> {

            // Seed departments
            Department hr = deptRepo.findAll().stream()
                .filter(d -> d.getName().equals("Human Resources")).findFirst()
                .orElseGet(() -> { Department d = new Department(); d.setName("Human Resources"); d.setDescription("Manages employee relations and benefits."); return deptRepo.save(d); });

            Department eng = deptRepo.findAll().stream()
                .filter(d -> d.getName().equals("Engineering")).findFirst()
                .orElseGet(() -> { Department d = new Department(); d.setName("Engineering"); d.setDescription("Develops core software and platform."); return deptRepo.save(d); });

            deptRepo.findAll().stream()
                .filter(d -> d.getName().equals("Marketing")).findFirst()
                .orElseGet(() -> { Department d = new Department(); d.setName("Marketing"); d.setDescription("Handles public relations and campaigns."); return deptRepo.save(d); });

            // Seed leave categories
            if (catRepo.count() == 0) {
                EmployeeCategory cat1 = new EmployeeCategory(); cat1.setName("Category 1"); cat1.setAnnualLeaveAllowance(20); cat1.setMonthlyIncrement(1.67); cat1.setSickLeaveAllowance(10); cat1.setDescription("Standard staff - 20 days/year");
                EmployeeCategory cat2 = new EmployeeCategory(); cat2.setName("Category 2"); cat2.setAnnualLeaveAllowance(25); cat2.setMonthlyIncrement(2.08); cat2.setSickLeaveAllowance(12); cat2.setDescription("Senior staff - 25 days/year");
                EmployeeCategory cat3 = new EmployeeCategory(); cat3.setName("Category 3"); cat3.setAnnualLeaveAllowance(30); cat3.setMonthlyIncrement(2.5); cat3.setSickLeaveAllowance(15); cat3.setDescription("Management - 30 days/year");
                catRepo.saveAll(List.of(cat1, cat2, cat3));
            }

            // Seed performance questions
            if (questionRepo.count() == 0) {
                List<String> questionTexts = List.of(
                    "The employee consistently meets deadlines and deliverables.",
                    "The employee demonstrates strong teamwork and collaboration.",
                    "The employee takes initiative and shows leadership potential.",
                    "The employee communicates clearly and professionally.",
                    "The employee continuously improves their skills and knowledge."
                );
                questionTexts.forEach(text -> {
                    PerformanceQuestion q = new PerformanceQuestion();
                    q.setText(text);
                    q.setActive(true);
                    questionRepo.save(q);
                });
            }

            // Seed admin account
            if (!empRepo.existsByEmail("admin@adp.com")) {
                System.out.println(">>> SEEDING: admin@adp.com / admin123");
                Employee admin = new Employee();
                admin.setFirstName("ADP"); admin.setLastName("Admin");
                admin.setEmail("admin@adp.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("HR_ADMIN"); admin.setStatus("ACTIVE");
                admin.setDepartment(hr);
                empRepo.save(admin);
            }

            // Seed manager
            Employee manager = empRepo.findByEmail("manager@adp.com").orElse(null);
            if (manager == null) {
                System.out.println(">>> SEEDING: manager@adp.com / manager123");
                manager = new Employee();
                manager.setFirstName("Sarah"); manager.setLastName("Connor");
                manager.setEmail("manager@adp.com");
                manager.setPassword(passwordEncoder.encode("manager123"));
                manager.setRole("MANAGER"); manager.setStatus("ACTIVE");
                manager.setDepartment(eng);
                manager = empRepo.save(manager);
            }

            // Seed sample employee
            if (!empRepo.existsByEmail("john.smith@adp.com")) {
                System.out.println(">>> SEEDING: john.smith@adp.com (ACTIVE, no password)");
                Employee emp = new Employee();
                emp.setFirstName("John"); emp.setLastName("Smith");
                emp.setEmail("john.smith@adp.com");
                emp.setPassword(passwordEncoder.encode("password123"));
                emp.setRole("EMPLOYEE"); emp.setStatus("ACTIVE");
                emp.setDepartment(eng);
                emp.setManager(manager);
                empRepo.save(emp);
            }

            // ── Seed superuser ─────────────────────────────────────────
            if (!empRepo.existsByEmail("superuser")) {
                System.out.println(">>> SEEDING: superuser / superuser");
                Employee su = new Employee();
                su.setFirstName("Super"); su.setLastName("User");
                su.setEmail("superuser");
                su.setPassword(passwordEncoder.encode("superuser"));
                su.setRole("SUPERUSER"); su.setStatus("ACTIVE");
                empRepo.save(su);
            }

            // ── Seed system config ──────────────────────────────────────
            seedCfg(configRepo, "general.company_name",  "Nexus HCM",  "GENERAL", "Company Name",         "Displayed in header and footer",                   true,  "TEXT");
            seedCfg(configRepo, "general.app_subtitle",  "HCM Platform","GENERAL","App Subtitle",          "Short tagline shown below the company name",       true,  "TEXT");
            seedCfg(configRepo, "theme.primary_color",   "#D0271D",     "THEME",  "Primary Color",         "Main accent color (buttons, links, active states)", true,  "COLOR");
            seedCfg(configRepo, "theme.primary_light",   "#fff1f2",     "THEME",  "Primary Light",         "Light tint of the primary color for hover states",  true,  "COLOR");
            seedCfg(configRepo, "theme.logo_text",       "ADP",         "THEME",  "Logo Badge Text",        "Short text shown in the logo badge (max 4 chars)", true,  "TEXT");
            seedCfg(configRepo, "theme.logo_bg",         "#D0271D",     "THEME",  "Logo Badge Color",       "Background color of the logo badge",               true,  "COLOR");
            seedCfg(configRepo, "theme.header_bg",       "#ffffff",     "THEME",  "Header Background",      "Top navigation bar background color",              true,  "COLOR");
            seedCfg(configRepo, "theme.logo_image_url",  "",            "THEME",  "Logo Image URL",         "Optional image URL (replaces badge when set)",     true,  "URL");
            // Optional features
            seedCfg(configRepo, "feature.performance",   "true",  "FEATURE", "Performance Module",   "Evaluation surveys, ratings & analytics",           true,  "BOOLEAN");
            seedCfg(configRepo, "feature.attendance",    "true",  "FEATURE", "Attendance Tracking",  "Daily punch-in / punch-out recording",              true,  "BOOLEAN");
            seedCfg(configRepo, "feature.leaves",        "true",  "FEATURE", "Leave Management",     "Leave requests, approvals, and balance tracking",   true,  "BOOLEAN");
            seedCfg(configRepo, "feature.org_chart",     "true",  "FEATURE", "Organisation Chart",   "Hierarchy tree and manager assignment page",        true,  "BOOLEAN");
            seedCfg(configRepo, "feature.employee_mgmt", "true",  "FEATURE", "Employee Management",  "HR admin provisioning and profile editing",         true,  "BOOLEAN");
            seedCfg(configRepo, "feature.quick_setup",   "true",  "FEATURE", "Quick Setup Page",     "Dev bootstrap page for creating test accounts",     true,  "BOOLEAN");
            // Core / non-optional
            seedCfg(configRepo, "feature.dashboard",     "true",  "FEATURE", "Dashboard",            "Core dashboards — always enabled",                  false, "BOOLEAN");
            seedCfg(configRepo, "feature.auth",          "true",  "FEATURE", "Authentication",       "Login & security — cannot be disabled",             false, "BOOLEAN");
            seedCfg(configRepo, "feature.superuser",     "true",  "FEATURE", "Superuser Panel",      "System control panel — cannot be disabled",         false, "BOOLEAN");

            System.out.println("✅ DATABASE SYNCHRONIZED SUCCESSFULLY!");
        };
    }

    private void seedCfg(SystemConfigRepository repo, String key, String value,
                         String category, String label, String description,
                         boolean optional, String inputType) {
        if (!repo.existsById(key)) {
            SystemConfig c = new SystemConfig();
            c.setConfigKey(key);
            c.setConfigValue(value);
            c.setCategory(category);
            c.setLabel(label);
            c.setDescription(description);
            c.setOptional(optional);
            c.setInputType(inputType);
            repo.save(c);
        }
    }
}
