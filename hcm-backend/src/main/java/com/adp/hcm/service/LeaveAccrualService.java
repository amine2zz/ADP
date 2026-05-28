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

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private HRManagementService hrService;

    @Scheduled(cron = "0 0 0 1 * *")
    @Transactional
    public void performMonthlyAccrual() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            if (emp.getCategory() != null) {
                double currentBalance = emp.getLeaveBalance() != null ? emp.getLeaveBalance() : 0.0;
                emp.setLeaveBalance(currentBalance + emp.getCategory().getMonthlyIncrement());
                double currentSick = emp.getSickLeaveBalance() != null ? emp.getSickLeaveBalance() : 0.0;
                emp.setSickLeaveBalance(currentSick + 0.5);
            }
        }
        employeeRepository.saveAll(employees);
        hrService.logOperation("SYSTEM", "LEAVE_ACCRUAL", "ALL", "Monthly leave balance auto-increment executed");
    }
}
