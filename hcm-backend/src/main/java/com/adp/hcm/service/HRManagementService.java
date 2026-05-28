package com.adp.hcm.service;

import com.adp.hcm.entity.Attendance;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.OperationHistory;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.repository.OperationHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class HRManagementService {

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private OperationHistoryRepository historyRepository;
    @Autowired private EmployeeRepository employeeRepository;

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

    public List<LeaveRequest> getAllLeaves() {
        return leaveRequestRepository.findAll();
    }

    public List<LeaveRequest> getTeamLeaves(Long managerId) {
        return leaveRequestRepository.findByEmployeeManagerId(managerId);
    }

    @Transactional
    public LeaveRequest updateLeaveStatus(Long leaveId, String status, String managerEmail) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        String oldStatus = request.getStatus();
        request.setStatus(status);

        if ("APPROVED".equals(status) && !"APPROVED".equals(oldStatus)) {
            Employee emp = employeeRepository.findById(request.getEmployee().getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

            long days = 0;
            LocalDate current = request.getStartDate();
            while (!current.isAfter(request.getEndDate())) {
                if (current.getDayOfWeek().getValue() < 6) days++;
                current = current.plusDays(1);
            }

            if ("SICK".equalsIgnoreCase(request.getType())) {
                emp.setSickLeaveBalance((emp.getSickLeaveBalance() != null ? emp.getSickLeaveBalance() : 0.0) - days);
            } else if ("ANNUAL".equalsIgnoreCase(request.getType())) {
                emp.setLeaveBalance((emp.getLeaveBalance() != null ? emp.getLeaveBalance() : 0.0) - (double) days);
            }
            employeeRepository.save(emp);
            request.setEmployee(emp);
        }

        logOperation(managerEmail, "LEAVE_" + status, request.getEmployee().getEmail(), "Updated leave status to " + status);
        return leaveRequestRepository.save(request);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public List<Attendance> getTeamAttendance(Long managerId) {
        return attendanceRepository.findByEmployeeManagerId(managerId);
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
        Attendance attendance = attendanceRepository.findByEmployeeIdAndWorkDate(employee.getId(), today)
            .orElseGet(() -> {
                Attendance a = new Attendance();
                a.setEmployee(employee);
                a.setWorkDate(today);
                return a;
            });

        switch (punchType) {
            case "MORNING_IN" -> { attendance.setMorningIn(LocalDateTime.now()); attendance.setStatus("MORNING_IN"); logOperation(employee.getEmail(), "MORNING_IN", "SYSTEM", "Clocked in"); }
            case "LUNCH_OUT" -> { attendance.setLunchOut(LocalDateTime.now()); attendance.setStatus("LUNCH_OUT"); logOperation(employee.getEmail(), "LUNCH_OUT", "SYSTEM", "Out for lunch"); }
            case "AFTERNOON_IN" -> { attendance.setAfternoonIn(LocalDateTime.now()); attendance.setStatus("AFTERNOON_IN"); logOperation(employee.getEmail(), "AFTERNOON_IN", "SYSTEM", "Back from lunch"); }
            case "EVENING_OUT" -> { attendance.setEveningOut(LocalDateTime.now()); attendance.setStatus("COMPLETED"); logOperation(employee.getEmail(), "EVENING_OUT", "SYSTEM", "Clocked out"); }
        }
        return attendanceRepository.save(attendance);
    }

    public Attendance getTodayAttendance(Long employeeId) {
        return attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.now()).orElse(null);
    }

    @Transactional
    public Attendance saveAttendance(Map<String, String> payload) {
        Attendance attendance = null;
        if (payload.get("id") != null) {
            attendance = attendanceRepository.findById(Long.parseLong(payload.get("id"))).orElse(null);
        }
        if (attendance == null) {
            Long employeeId = Long.parseLong(payload.get("employeeId"));
            Employee employee = employeeRepository.findById(employeeId).orElseThrow(() -> new RuntimeException("Employee not found"));
            LocalDate workDate = LocalDate.parse(payload.get("workDate"));
            attendance = attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, workDate).orElseGet(() -> {
                Attendance a = new Attendance();
                a.setEmployee(employee);
                a.setWorkDate(workDate);
                return a;
            });
        }
        if (payload.get("morningIn") != null) attendance.setMorningIn(LocalDateTime.parse(payload.get("morningIn")));
        if (payload.get("lunchOut") != null) attendance.setLunchOut(LocalDateTime.parse(payload.get("lunchOut")));
        if (payload.get("afternoonIn") != null) attendance.setAfternoonIn(LocalDateTime.parse(payload.get("afternoonIn")));
        if (payload.get("eveningOut") != null) attendance.setEveningOut(LocalDateTime.parse(payload.get("eveningOut")));
        if (payload.get("status") != null) attendance.setStatus(payload.get("status"));
        logOperation(payload.getOrDefault("updatedBy", "SYSTEM"), "ATTENDANCE_UPDATED", attendance.getEmployee().getEmail(), "Attendance updated for " + attendance.getWorkDate());
        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Attendance updateAttendance(Long attendanceId, Map<String, String> payload) {
        payload.put("id", String.valueOf(attendanceId));
        return saveAttendance(payload);
    }
}
