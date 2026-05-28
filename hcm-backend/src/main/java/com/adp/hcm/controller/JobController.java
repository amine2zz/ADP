package com.adp.hcm.controller;

import com.adp.hcm.entity.JobApplication;
import com.adp.hcm.entity.JobPosition;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.JobApplicationRepository;
import com.adp.hcm.repository.JobPositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
               RequestMethod.DELETE, RequestMethod.OPTIONS})
public class JobController {

    @Autowired private JobPositionRepository positionRepo;
    @Autowired private JobApplicationRepository applicationRepo;
    @Autowired private EmployeeRepository employeeRepo;

    // ── Positions ────────────────────────────────────────────────────────────

    /** All positions (HR admin view) */
    @GetMapping
    public List<JobPosition> all() {
        return positionRepo.findAllByOrderByPostedDateDesc();
    }

    /** Only OPEN positions — public/careers page */
    @GetMapping("/open")
    public List<JobPosition> open() {
        return positionRepo.findByStatusOrderByPostedDateDesc("OPEN");
    }

    /** Single position detail */
    @GetMapping("/{id}")
    public ResponseEntity<JobPosition> one(@PathVariable Long id) {
        return positionRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Summary counts */
    @GetMapping("/summary")
    public Map<String, Long> summary() {
        return Map.of(
            "open",   positionRepo.countByStatus("OPEN"),
            "draft",  positionRepo.countByStatus("DRAFT"),
            "closed", positionRepo.countByStatus("CLOSED"),
            "total",  positionRepo.count(),
            "newApplications", applicationRepo.countByStatus("NEW")
        );
    }

    /** Create a new position (HR admin) */
    @PostMapping
    public ResponseEntity<JobPosition> create(@RequestBody Map<String, Object> body) {
        JobPosition pos = new JobPosition();
        pos.setTitle(body.getOrDefault("title", "").toString());
        pos.setDescription(body.getOrDefault("description", "").toString());
        pos.setRequirements(body.getOrDefault("requirements", "").toString());
        pos.setDepartment(body.getOrDefault("department", "").toString());
        pos.setLocation(body.getOrDefault("location", "").toString());
        pos.setJobType(body.getOrDefault("jobType", "FULL_TIME").toString());
        pos.setStatus(body.getOrDefault("status", "DRAFT").toString());

        Object sMin = body.get("salaryMin");
        Object sMax = body.get("salaryMax");
        if (sMin != null && !sMin.toString().isBlank()) pos.setSalaryMin(Double.valueOf(sMin.toString()));
        if (sMax != null && !sMax.toString().isBlank()) pos.setSalaryMax(Double.valueOf(sMax.toString()));

        Object closingStr = body.get("closingDate");
        if (closingStr != null && !closingStr.toString().isBlank()) {
            pos.setClosingDate(LocalDate.parse(closingStr.toString()));
        }

        // Set hiring manager if provided
        Object mgr = body.get("hiringManagerId");
        if (mgr != null) {
            Long mgrId = Long.valueOf(mgr.toString());
            employeeRepo.findById(mgrId).ifPresent(pos::setHiringManager);
        }

        // Auto-set posted date when publishing
        if ("OPEN".equals(pos.getStatus())) pos.setPostedDate(LocalDate.now());

        return ResponseEntity.ok(positionRepo.save(pos));
    }

    /** Update an existing position */
    @PutMapping("/{id}")
    public ResponseEntity<JobPosition> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        return positionRepo.findById(id).map(pos -> {
            if (body.containsKey("title"))        pos.setTitle(body.get("title").toString());
            if (body.containsKey("description"))  pos.setDescription(body.get("description").toString());
            if (body.containsKey("requirements")) pos.setRequirements(body.get("requirements").toString());
            if (body.containsKey("department"))   pos.setDepartment(body.get("department").toString());
            if (body.containsKey("location"))     pos.setLocation(body.get("location").toString());
            if (body.containsKey("jobType"))      pos.setJobType(body.get("jobType").toString());
            if (body.containsKey("status")) {
                String newStatus = body.get("status").toString();
                if ("OPEN".equals(newStatus) && pos.getPostedDate() == null) pos.setPostedDate(LocalDate.now());
                pos.setStatus(newStatus);
            }
            Object sMin = body.get("salaryMin");
            Object sMax = body.get("salaryMax");
            if (sMin != null) pos.setSalaryMin(sMin.toString().isBlank() ? null : Double.valueOf(sMin.toString()));
            if (sMax != null) pos.setSalaryMax(sMax.toString().isBlank() ? null : Double.valueOf(sMax.toString()));

            Object closingStr = body.get("closingDate");
            if (closingStr != null) {
                pos.setClosingDate(closingStr.toString().isBlank() ? null : LocalDate.parse(closingStr.toString()));
            }
            Object mgr = body.get("hiringManagerId");
            if (mgr != null) {
                if (mgr.toString().isBlank()) {
                    pos.setHiringManager(null);
                } else {
                    employeeRepo.findById(Long.valueOf(mgr.toString())).ifPresent(pos::setHiringManager);
                }
            }
            return ResponseEntity.ok(positionRepo.save(pos));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Publish a position (DRAFT → OPEN) */
    @PutMapping("/{id}/publish")
    public ResponseEntity<JobPosition> publish(@PathVariable Long id) {
        return positionRepo.findById(id).map(pos -> {
            pos.setStatus("OPEN");
            if (pos.getPostedDate() == null) pos.setPostedDate(LocalDate.now());
            return ResponseEntity.ok(positionRepo.save(pos));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Close a position */
    @PutMapping("/{id}/close")
    public ResponseEntity<JobPosition> close(@PathVariable Long id) {
        return positionRepo.findById(id).map(pos -> {
            pos.setStatus("CLOSED");
            return ResponseEntity.ok(positionRepo.save(pos));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Delete a position */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!positionRepo.existsById(id)) return ResponseEntity.notFound().build();
        positionRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Applications ─────────────────────────────────────────────────────────

    /** Submit an application (public — no login required) */
    @PostMapping("/{id}/apply")
    public ResponseEntity<?> apply(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        return positionRepo.findById(id).map(pos -> {
            if (!"OPEN".equals(pos.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "This position is no longer accepting applications."));
            }
            JobApplication app = new JobApplication();
            app.setPosition(pos);
            app.setApplicantName(body.getOrDefault("applicantName", "").toString());
            app.setApplicantEmail(body.getOrDefault("applicantEmail", "").toString());
            app.setPhone(body.getOrDefault("phone", "").toString());
            app.setCoverLetter(body.getOrDefault("coverLetter", "").toString());

            // Increment counter on position
            pos.setApplicantsCount(pos.getApplicantsCount() + 1);
            positionRepo.save(pos);

            return ResponseEntity.ok(applicationRepo.save(app));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Applications for a specific position */
    @GetMapping("/{id}/applications")
    public List<JobApplication> applications(@PathVariable Long id) {
        return applicationRepo.findByPositionIdOrderByAppliedDateDesc(id);
    }

    /** All applications (HR admin) */
    @GetMapping("/applications/all")
    public List<JobApplication> allApplications() {
        return applicationRepo.findAllByOrderByAppliedDateDesc();
    }

    /** Update application status (HR review) */
    @PutMapping("/applications/{appId}/status")
    public ResponseEntity<JobApplication> updateAppStatus(
            @PathVariable Long appId,
            @RequestBody Map<String, Object> body) {

        return applicationRepo.findById(appId).map(app -> {
            if (body.containsKey("status")) app.setStatus(body.get("status").toString());
            if (body.containsKey("notes"))  app.setNotes(body.get("notes").toString());
            return ResponseEntity.ok(applicationRepo.save(app));
        }).orElse(ResponseEntity.notFound().build());
    }
}
