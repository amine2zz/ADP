package com.adp.hcm.controller;

import com.adp.hcm.entity.Attendance;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.OperationHistory;
import com.adp.hcm.service.HRManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class HRController {

    @Autowired
    private HRManagementService hrService;

    @GetMapping("/history")
    public List<OperationHistory> getHistory() {
        return hrService.getHistory();
    }

    @GetMapping("/all-leaves")
    public List<LeaveRequest> getAllLeaves() {
        return hrService.getAllLeaves();
    }

    @GetMapping("/all-attendance")
    public List<Attendance> getAllAttendance() {
        return hrService.getAllAttendance();
    }

    @GetMapping("/manager/{id}/leaves")
    public List<LeaveRequest> getTeamLeaves(@PathVariable("id") Long id) {
        return hrService.getTeamLeaves(id);
    }

    @PostMapping("/leaves/{id}/approve")
    public LeaveRequest approveLeave(@PathVariable("id") Long id, @RequestBody Map<String, String> payload) {
        return hrService.updateLeaveStatus(id, "APPROVED", payload.get("managerEmail"));
    }

    @PostMapping("/leaves/{id}/reject")
    public LeaveRequest rejectLeave(@PathVariable("id") Long id, @RequestBody Map<String, String> payload) {
        return hrService.updateLeaveStatus(id, "REJECTED", payload.get("managerEmail"));
    }

    @GetMapping("/manager/{id}/attendance")
    public List<Attendance> getTeamAttendance(@PathVariable("id") Long id) {
        return hrService.getTeamAttendance(id);
    }

    @PostMapping("/attendance")
    public Attendance saveAttendance(@RequestBody Map<String, String> payload) {
        return hrService.saveAttendance(payload);
    }

    @PutMapping("/attendance/{id}")
    public Attendance updateAttendance(@PathVariable("id") Long id, @RequestBody Map<String, String> payload) {
        return hrService.updateAttendance(id, payload);
    }
}
