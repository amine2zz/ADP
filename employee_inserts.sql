-- SQL Inserts for Employee Table
-- Generated on: 2026-05-02
-- Password Hash used for all accounts: $2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G

SET FOREIGN_KEY_CHECKS = 0;

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(2, '2026-04-09 12:39:53.000000', NULL, 'gharianiamine21@gmail.com', 'amine', 'amine', 'EMPLOYEE', NULL, 'address', '2000-04-13', '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', 'ACTIVE', NULL, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(5, '2026-04-09 13:01:01.000000', NULL, 'admin@adp.com', 'admin', 'admin', 'HR_ADMIN', NULL, 'admin', '2000-04-13', '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(6, '2026-04-09 13:02:19.000000', NULL, 'amine22@gmail.com', 'amine2', 'amine2', 'EMPLOYEE', NULL, 'address2', '2000-04-13', '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', 'ACTIVE', 1, 11, '11954918', NULL, NULL, 'Male', NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(7, '2026-04-09 13:13:36.000000', NULL, 'ad@ad.com', 'ad', 'ad', 'MANAGER', NULL, 'address', '2000-04-13', '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', 'ACTIVE', 1, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(8, '2026-04-09 13:28:32.000000', NULL, 'manager@adp.com', 'Sarah', 'Connor', 'MANAGER', NULL, NULL, NULL, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', NULL, 'ACTIVE', 3, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(9, '2026-04-09 13:28:32.000000', NULL, 'john.smith@adp.com', 'John', 'Smith', 'EMPLOYEE', NULL, NULL, NULL, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', NULL, 'ACTIVE', 3, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(11, '2026-04-09 13:38:24.000000', NULL, 'm@gmail.com', 'manager', 'manager2', 'MANAGER', NULL, '123456 address', '2000-04-13', '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', 'ACTIVE', 1, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(12, NULL, NULL, 'a@g.com', 'M', 'G', 'MANAGER', NULL, NULL, NULL, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

REPLACE INTO `employee` (`id`, `created_at`, `department`, `email`, `first_name`, `last_name`, `role`, `activation_token`, `address`, `date_of_birth`, `password`, `phone_number`, `status`, `department_id`, `manager_id`, `cin`, `emergency_contact`, `employee_code`, `gender`, `job_title`, `joining_date`, `marital_status`, `nationality`, `situation`) VALUES
(13, '2026-05-02 13:04:03.000000', NULL, 'AG@gmail.com', 'A', 'G', 'MANAGER', NULL, 'my home', '2000-04-13', '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G', '99712634', 'PENDING_SETUP', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- New Employees
REPLACE INTO `employee` (`id`, `email`, `first_name`, `last_name`, `role`, `status`, `department_id`, `manager_id`, `password`) VALUES
(14, 'm.brown@adp.com', 'Michael', 'Brown', 'EMPLOYEE', 'ACTIVE', 2, 7, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(15, 'e.davis@adp.com', 'Emily', 'Davis', 'EMPLOYEE', 'ACTIVE', 2, 11, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(16, 'd.wilson@adp.com', 'David', 'Wilson', 'EMPLOYEE', 'ACTIVE', 1, 5, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(17, 'j.taylor@adp.com', 'Jessica', 'Taylor', 'EMPLOYEE', 'ACTIVE', 3, 8, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(18, 'r.garcia@adp.com', 'Robert', 'Garcia', 'EMPLOYEE', 'ACTIVE', 2, 7, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(19, 'l.martinez@adp.com', 'Linda', 'Martinez', 'EMPLOYEE', 'ACTIVE', 1, 5, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(20, 'w.anderson@adp.com', 'William', 'Anderson', 'EMPLOYEE', 'ACTIVE', 3, 8, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(21, 'm.hernandez@adp.com', 'Maria', 'Hernandez', 'EMPLOYEE', 'ACTIVE', 2, 13, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(22, 'j.moore@adp.com', 'James', 'Moore', 'EMPLOYEE', 'ACTIVE', 1, 5, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G'),
(23, 'b.jackson@adp.com', 'Barbara', 'Jackson', 'EMPLOYEE', 'ACTIVE', 3, 8, '$2a$10$cjCWZpmk44Pj6YkVfMrcuOYPNXix/EkbmZerXiA655bs1gzHy6J2G');

SET FOREIGN_KEY_CHECKS = 1;
