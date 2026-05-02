-- 1. Create the Database if it doesn't exist
CREATE DATABASE IF NOT EXISTS adp_hcm;

-- 2. Use the database
USE adp_hcm;

-- 3. Create Department table
CREATE TABLE IF NOT EXISTS department (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    location VARCHAR(200),
    budget_code VARCHAR(50),
    manager_id BIGINT
);

-- 3.5 Create Employee Category table
CREATE TABLE IF NOT EXISTS employee_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    annual_leave_allowance INT,
    monthly_increment DOUBLE,
    description VARCHAR(255)
);

INSERT INTO employee_category (name, annual_leave_allowance, monthly_increment, description) VALUES
('Category 1', 20, 1.66, 'Standard staff - 20 days per year'),
('Category 2', 25, 2.08, 'Senior staff - 25 days per year'),
('Category 3', 30, 2.5, 'Management - 30 days per year');

-- 4. Create the Employee table
CREATE TABLE IF NOT EXISTS employee (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department_id BIGINT,
    role VARCHAR(50) DEFAULT 'EMPLOYEE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cin VARCHAR(50) UNIQUE,
    employee_code VARCHAR(50) UNIQUE,
    gender VARCHAR(10),
    marital_status VARCHAR(50),
    nationality VARCHAR(100),
    situation VARCHAR(100),
    emergency_contact VARCHAR(150),
    joining_date VARCHAR(50),
    job_title VARCHAR(150),
    category_id BIGINT,
    leave_balance DOUBLE DEFAULT 0.0,
    sick_leave_balance DOUBLE DEFAULT 0.0,
    FOREIGN KEY (department_id) REFERENCES department(id),
    FOREIGN KEY (category_id) REFERENCES employee_category(id)
);

-- 5. Insert placeholder/dummy data
INSERT INTO department (department_name, description) VALUES 
('Human Resources', 'Handles employee relations and benefits.'),
('Engineering', 'Develops core software and solutions.'),
('Marketing', 'Manages public relations and campaigns.');

INSERT INTO employee (first_name, last_name, email, department_id, role) 
VALUES 
('Alice', 'Johnson', 'alice.johnson@adp.com', 1, 'HR_ADMIN'),
('Bob', 'Smith', 'bob.smith@adp.com', 2, 'MANAGER'),
('Charlie', 'Davis', 'charlie.davis@adp.com', 2, 'EMPLOYEE'),
('Diana', 'Miller', 'diana.miller@adp.com', 3, 'EMPLOYEE');
