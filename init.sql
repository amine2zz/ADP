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
    FOREIGN KEY (department_id) REFERENCES department(id)
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
