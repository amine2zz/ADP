package com.adp.hcm.service;

import com.adp.hcm.entity.Attendance;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.OperationHistory;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.repository.OperationHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class HRManagementService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private OperationHistoryRepository historyRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public void logOperation(String actor, String operation, String target, String description) {
        OperationHistory history = new OperationHistory();
        history.setActor(actor);
        history.setOperation(operation);
        history.setTarget(target);
        history.setDescription(description);
        historyRepository.save(history);
    }

    public List<OperationHistory> getHistory() {
        return historyRepository.findAll();
    }

    // Leave Management
    public List<LeaveRequest> getTeamLeaves(Long managerId) {
        return leaveRequestRepository.findByEmployeeManagerId(managerId);
    }
    
    public List<LeaveRequest> getAllLeaves() {
        return leaveRequestRepository.findAll();
    }

    @Transactional
    public LeaveRequest updateLeaveStatus(Long leaveId, String status, String managerEmail) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
        
        String oldStatus = request.getStatus();
        request.setStatus(status);
        
        // If the leave was just approved, deduct from the employee's balance
        if ("APPROVED".equals(status) && !"APPROVED".equals(oldStatus)) {
            // Fetch fresh employee to avoid stale data
            Employee emp = employeeRepository.findById(request.getEmployee().getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
            
            long days = 0;
            LocalDate current = request.getStartDate();
            while (!current.isAfter(request.getEndDate())) {
                if (current.getDayOfWeek().getValue() < 6) { // Monday (1) to Friday (5)
                    days++;
                }
                current = current.plusDays(1);
            }
            
            if ("SICK".equalsIgnoreCase(request.getType())) {
                double currentSick = emp.getSickLeaveBalance() != null ? emp.getSickLeaveBalance() : 0.0;
                emp.setSickLeaveBalance(currentSick - days);
            } else if ("ANNUAL".equalsIgnoreCase(request.getType())) {
                double currentAnnual = emp.getLeaveBalance() != null ? emp.getLeaveBalance() : 0.0;
                emp.setLeaveBalance(currentAnnual - (double)days);
            }
            
            employeeRepository.save(emp);
            // Refresh employee in request object for logging
            request.setEmployee(emp);
        }
        
        logOperation(managerEmail, "LEAVE_" + status, request.getEmployee().getEmail(), "Manager updated leave status to " + status);
        
        return leaveRequestRepository.save(request);
    }

    // Attendance Management
    public List<Attendance> getTeamAttendance(Long managerId) {
        return attendanceRepository.findByEmployeeManagerId(managerId);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    @Transactional
    public Attendance saveAttendance(Map<String, String> payload) {
        Attendance attendance = null;

        if (payload.get("id") != null) {
            attendance = attendanceRepository.findById(Long.parseLong(payload.get("id")))
                    .orElseThrow(() -> new RuntimeException("Attendance not found"));
        }

        if (attendance == null) {
            if (payload.get("employeeId") == null || payload.get("workDate") == null) {
                throw new RuntimeException("Insufficient data to create attendance record");
            }

            Long employeeId = Long.parseLong(payload.get("employeeId"));
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            LocalDate workDate = LocalDate.parse(payload.get("workDate"));
            attendance = attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, workDate)
                    .orElseGet(() -> {
                        Attendance a = new Attendance();
                        a.setEmployee(employee);
                        a.setWorkDate(workDate);
                        return a;
                    });
        }

        if (payload.get("morningIn") != null) {
            attendance.setMorningIn(LocalDateTime.parse(payload.get("morningIn")));
        }
        if (payload.get("lunchOut") != null) {
            attendance.setLunchOut(LocalDateTime.parse(payload.get("lunchOut")));
        }
        if (payload.get("afternoonIn") != null) {
            attendance.setAfternoonIn(LocalDateTime.parse(payload.get("afternoonIn")));
        }
        if (payload.get("eveningOut") != null) {
            attendance.setEveningOut(LocalDateTime.parse(payload.get("eveningOut")));
        }
        if (payload.get("status") != null) {
            attendance.setStatus(payload.get("status"));
        }

        String updater = payload.getOrDefault("updatedBy", "SYSTEM");
        logOperation(updater, "ATTENDANCE_UPDATED", attendance.getEmployee().getEmail(), "Attendance updated for " + attendance.getWorkDate());
        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Attendance updateAttendance(Long attendanceId, Map<String, String> payload) {
        payload.put("id", String.valueOf(attendanceId));
        return saveAttendance(payload);
    }

    public LeaveRequest submitLeaveRequest(Employee employee, LeaveRequest request) {
        request.setEmployee(employee);
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        logOperation(employee.getEmail(), "LEAVE_REQUESTED", "HR_ADMIN", "Requested " + request.getType() + " leave");
        return leaveRequestRepository.save(request);
    }

    public Attendance logAttendance(Employee employee, String punchType) {
        LocalDate today = LocalDate.now();

        // Find today's record or create a new one
        Attendance attendance = attendanceRepository
            .findByEmployeeIdAndWorkDate(employee.getId(), today)
            .orElseGet(() -> {
                Attendance a = new Attendance();
                a.setEmployee(employee);
                a.setWorkDate(today);
                return a;
            });

        switch (punchType) {
            case "MORNING_IN" -> {
                attendance.setMorningIn(LocalDateTime.now());
                attendance.setStatus("MORNING_IN");
                logOperation(employee.getEmail(), "MORNING_IN", "SYSTEM", "Clocked in for work");
            }
            case "LUNCH_OUT" -> {
                attendance.setLunchOut(LocalDateTime.now());
                attendance.setStatus("LUNCH_OUT");
                logOperation(employee.getEmail(), "LUNCH_OUT", "SYSTEM", "Out for lunch");
            }
            case "AFTERNOON_IN" -> {
                attendance.setAfternoonIn(LocalDateTime.now());
                attendance.setStatus("AFTERNOON_IN");
                logOperation(employee.getEmail(), "AFTERNOON_IN", "SYSTEM", "Back from lunch");
            }
            case "EVENING_OUT" -> {
                attendance.setEveningOut(LocalDateTime.now());
                attendance.setStatus("COMPLETED");
                logOperation(employee.getEmail(), "EVENING_OUT", "SYSTEM", "Clocked out of work");
            }
        }
        return attendanceRepository.save(attendance);
    }

    public Attendance getTodayAttendance(Long employeeId) {
        return attendanceRepository
            .findByEmployeeIdAndWorkDate(employeeId, LocalDate.now())
            .orElse(null);
    }
}
