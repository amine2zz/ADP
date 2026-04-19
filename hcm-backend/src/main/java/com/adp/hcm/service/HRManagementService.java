package com.adp.hcm.service;

import com.adp.hcm.entity.Attendance;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.OperationHistory;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.repository.OperationHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HRManagementService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private OperationHistoryRepository historyRepository;

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

    public LeaveRequest updateLeaveStatus(Long leaveId, String status, String managerEmail) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(status);
        
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

    public LeaveRequest submitLeaveRequest(Employee employee, LeaveRequest request) {
        request.setEmployee(employee);
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        logOperation(employee.getEmail(), "LEAVE_REQUESTED", "HR_ADMIN", "Requested " + request.getType() + " leave");
        return leaveRequestRepository.save(request);
    }

    public Attendance logAttendance(Employee employee, boolean clockIn) {
        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        if (clockIn) {
            attendance.setCheckIn(LocalDateTime.now());
            attendance.setStatus("ACTIVE_SHIFT");
            logOperation(employee.getEmail(), "CHECK_IN", "SYSTEM", "Clocked in securely");
        } else {
            attendance.setCheckOut(LocalDateTime.now());
            attendance.setStatus("COMPLETED_SHIFT");
            logOperation(employee.getEmail(), "CHECK_OUT", "SYSTEM", "Clocked out successfully");
        }
        return attendanceRepository.save(attendance);
    }
}
