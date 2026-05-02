package com.adp.hcm.service;

import com.adp.hcm.entity.Employee;
import com.adp.hcm.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeaveAccrualService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private HRManagementService hrService;

    /**
     * Runs on the 1st of every month at midnight to increment leave balances.
     * Cron expression: "0 0 0 1 * *"
     */
    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void performMonthlyAccrual() {
        List<Employee> employees = employeeRepository.findAll();
        
        for (Employee emp : employees) {
            if (emp.getCategory() != null) {
                double increment = emp.getCategory().getMonthlyIncrement();
                double currentBalance = emp.getLeaveBalance() != null ? emp.getLeaveBalance() : 0.0;
                emp.setLeaveBalance(currentBalance + increment);
                
                // Also add a fixed amount for sick leave (example: 0.5 days per month)
                double sickIncrement = 0.5;
                double newSickBalance = emp.getSickLeaveBalance() != null ? emp.getSickLeaveBalance() + sickIncrement : sickIncrement;
                emp.setSickLeaveBalance(newSickBalance);
            }
        }
        
        employeeRepository.saveAll(employees);
        hrService.logOperation("SYSTEM", "LEAVE_ACCRUAL", "ALL", "Executed monthly leave balance auto-increment for all employees");
    }
}
