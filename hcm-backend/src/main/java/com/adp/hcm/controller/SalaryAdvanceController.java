package com.adp.hcm.controller;

import com.adp.hcm.entity.SalaryAdvance;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.SalaryAdvanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/advances")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
               RequestMethod.DELETE, RequestMethod.OPTIONS})
public class SalaryAdvanceController {

    @Autowired private SalaryAdvanceRepository advanceRepo;
    @Autowired private EmployeeRepository employeeRepo;

    /** Employee submits a salary advance request */
    @PostMapping
    public ResponseEntity<?> request(@RequestBody Map<String, Object> body) {
        Long employeeId = Long.valueOf(body.get("employeeId").toString());
        Double amount   = Double.valueOf(body.get("amount").toString());
        String reason   = body.getOrDefault("reason", "").toString();

        return employeeRepo.findById(employeeId).map(emp -> {
            SalaryAdvance adv = new SalaryAdvance();
            adv.setEmployee(emp);
            adv.setAmount(amount);
            adv.setReason(reason);
            adv.setStatus("PENDING");
            return ResponseEntity.ok(advanceRepo.save(adv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Employee views their own advance history */
    @GetMapping("/employee/{employeeId}")
    public List<SalaryAdvance> byEmployee(@PathVariable Long employeeId) {
        return advanceRepo.findByEmployeeIdOrderByRequestDateDesc(employeeId);
    }

    /** HR/Manager views all pending advances */
    @GetMapping("/pending")
    public List<SalaryAdvance> pending() {
        return advanceRepo.findByStatusOrderByRequestDateDesc("PENDING");
    }

    /** HR/Manager views all advances */
    @GetMapping("/all")
    public List<SalaryAdvance> all() {
        return advanceRepo.findAllByOrderByRequestDateDesc();
    }

    /** Summary counts for dashboard widgets */
    @GetMapping("/summary")
    public Map<String, Long> summary() {
        return Map.of(
            "pending",  advanceRepo.countByStatus("PENDING"),
            "approved", advanceRepo.countByStatus("APPROVED"),
            "rejected", advanceRepo.countByStatus("REJECTED"),
            "total",    advanceRepo.count()
        );
    }

    /** HR approves an advance */
    @PutMapping("/{id}/approve")
    public ResponseEntity<SalaryAdvance> approve(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        return advanceRepo.findById(id).map(adv -> {
            adv.setStatus("APPROVED");
            adv.setReviewDate(LocalDate.now());
            adv.setReviewNotes(body.getOrDefault("notes", "").toString());
            String email = body.getOrDefault("reviewerEmail", "").toString();
            if (!email.isEmpty()) {
                employeeRepo.findByEmail(email).ifPresent(adv::setReviewedBy);
            }
            return ResponseEntity.ok(advanceRepo.save(adv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** HR rejects an advance */
    @PutMapping("/{id}/reject")
    public ResponseEntity<SalaryAdvance> reject(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        return advanceRepo.findById(id).map(adv -> {
            adv.setStatus("REJECTED");
            adv.setReviewDate(LocalDate.now());
            adv.setReviewNotes(body.getOrDefault("notes", "Rejected by HR").toString());
            String email = body.getOrDefault("reviewerEmail", "").toString();
            if (!email.isEmpty()) {
                employeeRepo.findByEmail(email).ifPresent(adv::setReviewedBy);
            }
            return ResponseEntity.ok(advanceRepo.save(adv));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Employee cancels their own PENDING request */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        return advanceRepo.findById(id).map(adv -> {
            if (!"PENDING".equals(adv.getStatus())) {
                return ResponseEntity.status(403).<Void>build();
            }
            advanceRepo.deleteById(id);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
