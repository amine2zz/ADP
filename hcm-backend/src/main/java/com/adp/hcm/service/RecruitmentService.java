package com.adp.hcm.service;

import com.adp.hcm.entity.*;
import com.adp.hcm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RecruitmentService {

    @Autowired
    private JobOfferRepository jobOfferRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationStepResultRepository stepResultRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private EmailService emailService;

    // ── Job Offers ──────────────────────────────────────────────────────────────

    public List<JobOffer> getAllOffers() {
        return jobOfferRepository.findAll();
    }

    public List<JobOffer> getPublishedOffers() {
        return jobOfferRepository.findByStatus("PUBLISHED");
    }

    public JobOffer createOffer(JobOffer offer) {
        offer.setStatus("DRAFT");
        return jobOfferRepository.save(offer);
    }

    public JobOffer updateOffer(Long id, JobOffer updates) {
        JobOffer existing = jobOfferRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Job offer not found"));
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getDepartment() != null) existing.setDepartment(updates.getDepartment());
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        return jobOfferRepository.save(existing);
    }

    public JobOffer publishOffer(Long id) {
        JobOffer offer = jobOfferRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Job offer not found"));
        offer.setStatus("PUBLISHED");
        offer.setPublishedAt(LocalDateTime.now());
        return jobOfferRepository.save(offer);
    }

    public JobOffer closeOffer(Long id) {
        JobOffer offer = jobOfferRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Job offer not found"));
        offer.setStatus("CLOSED");
        return jobOfferRepository.save(offer);
    }

    // ── Pipeline Steps ──────────────────────────────────────────────────────────

    public List<PipelineStep> getPipelineSteps(Long offerId) {
        return pipelineStepRepository.findByJobOfferIdOrderByStepOrder(offerId);
    }

    public PipelineStep addPipelineStep(Long offerId, PipelineStep step) {
        JobOffer offer = jobOfferRepository.findById(offerId)
            .orElseThrow(() -> new RuntimeException("Job offer not found"));
        step.setJobOffer(offer);
        return pipelineStepRepository.save(step);
    }

    public void deletePipelineStep(Long stepId) {
        pipelineStepRepository.deleteById(stepId);
    }

    // ── Applications ────────────────────────────────────────────────────────────

    public List<Application> getApplicationsForOffer(Long offerId) {
        return applicationRepository.findByJobOfferId(offerId);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Application submitApplication(Long offerId, Application application) {
        JobOffer offer = jobOfferRepository.findById(offerId)
            .orElseThrow(() -> new RuntimeException("Job offer not found: " + offerId));
        if (!"PUBLISHED".equals(offer.getStatus())) {
            throw new RuntimeException("This position is no longer accepting applications.");
        }

        application.setJobOffer(offer);
        application.setTrackingToken(UUID.randomUUID().toString());
        application.setStatus("PENDING");
        application.setCurrentStepIndex(0);

        Application saved = applicationRepository.save(application);

        // Send tracking token by email
        emailService.sendApplicationConfirmation(saved.getApplicantEmail(), saved.getTrackingToken());

        return saved;
    }

    public Application getApplicationByToken(String token) {
        return applicationRepository.findByTrackingToken(token)
            .orElseThrow(() -> new RuntimeException("Application not found."));
    }

    public Application advanceStep(Long applicationId, Map<String, String> body) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        List<PipelineStep> steps = pipelineStepRepository
            .findByJobOfferIdOrderByStepOrder(app.getJobOffer().getId());

        String result = body.get("result"); // PASS or FAIL
        String notes = body.get("notes");
        int currentIndex = app.getCurrentStepIndex();

        // Record the result for the current step
        ApplicationStepResult stepResult = new ApplicationStepResult();
        stepResult.setApplication(app);
        stepResult.setStepIndex(currentIndex);
        stepResult.setStepLabel(currentIndex < steps.size() ? steps.get(currentIndex).getStepLabel() : "Step " + currentIndex);
        stepResult.setResult(result);
        stepResult.setNotes(notes);
        stepResult.setEvaluatedAt(LocalDateTime.now());
        stepResultRepository.save(stepResult);

        if ("FAIL".equals(result)) {
            app.setStatus("REJECTED");
        } else if (currentIndex + 1 >= steps.size()) {
            // Last step passed → mark IN_PROGRESS (awaiting hire decision)
            app.setStatus("IN_PROGRESS");
            app.setCurrentStepIndex(currentIndex + 1);
        } else {
            app.setCurrentStepIndex(currentIndex + 1);
            app.setStatus("IN_PROGRESS");
        }

        return applicationRepository.save(app);
    }

    public Employee hireApplicant(Long applicationId, Employee employeeData) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        // Pre-fill employee from application data
        String[] nameParts = app.getApplicantName().split(" ", 2);
        employeeData.setFirstName(nameParts[0]);
        employeeData.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        employeeData.setEmail(app.getApplicantEmail());
        employeeData.setPhoneNumber(app.getApplicantPhone());

        Employee created = employeeService.createEmployee(employeeData);

        app.setStatus("HIRED");
        applicationRepository.save(app);

        return created;
    }
}
