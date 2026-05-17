package com.adp.hcm;

import com.adp.hcm.service.FeatureConfigService;
import com.adp.hcm.service.SuperAdminService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
@EnableScheduling
public class HcmBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HcmBackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner seedData(FeatureConfigService featureConfigService, SuperAdminService superAdminService) {
		return args -> {
			featureConfigService.seed();
			superAdminService.seedSystemConfig();
			superAdminService.seedLabels();
			System.out.println(">>> Feature flags, system config, and labels seeded.");
		};
	}

	@Bean
	public CommandLineRunner schemaUpdater(JdbcTemplate jdbcTemplate) {
		return args -> {
			System.out.println(">>> Starting Robust Schema Update Check...");
			jdbcTemplate.execute((java.sql.Connection conn) -> {
				java.sql.DatabaseMetaData metaData = conn.getMetaData();
				
				// 1. Check employee_category.sick_leave_allowance
				if (!columnExists(metaData, "employee_category", "sick_leave_allowance") && 
				    !columnExists(metaData, "EMPLOYEE_CATEGORY", "SICK_LEAVE_ALLOWANCE")) {
					System.out.println(">>> Adding column sick_leave_allowance to employee_category...");
					try (java.sql.Statement stmt = conn.createStatement()) {
						stmt.execute("ALTER TABLE employee_category ADD COLUMN sick_leave_allowance INT DEFAULT 0");
					}
				}
				// Always ensure no NULLs regardless of whether we just added it
				try (java.sql.Statement stmt = conn.createStatement()) {
					stmt.execute("UPDATE employee_category SET sick_leave_allowance = 0 WHERE sick_leave_allowance IS NULL");
				}

				// 2. Check employee.sick_leave_balance
				if (!columnExists(metaData, "employee", "sick_leave_balance") && 
				    !columnExists(metaData, "EMPLOYEE", "SICK_LEAVE_BALANCE")) {
					System.out.println(">>> Adding column sick_leave_balance to employee...");
					try (java.sql.Statement stmt = conn.createStatement()) {
						stmt.execute("ALTER TABLE employee ADD COLUMN sick_leave_balance DOUBLE DEFAULT 0.0");
					}
				}
				// Always ensure no NULLs
				try (java.sql.Statement stmt = conn.createStatement()) {
					stmt.execute("UPDATE employee SET sick_leave_balance = 0.0 WHERE sick_leave_balance IS NULL");
				}
				return null;
			});
			System.out.println(">>> Schema Update Check Completed.");
		};
	}

	private boolean columnExists(java.sql.DatabaseMetaData metaData, String table, String column) throws java.sql.SQLException {
		try (java.sql.ResultSet rs = metaData.getColumns(null, null, table, column)) {
			return rs.next();
		}
	}
}
