package com.adp.hcm.service;

import com.adp.hcm.entity.AiReportHistory;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.JobApplication;
import com.adp.hcm.entity.JobPosition;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.OnboardingPlan;
import com.adp.hcm.entity.PerformanceEvaluation;
import com.adp.hcm.repository.AiReportHistoryRepository;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.repository.DepartmentRepository;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.JobApplicationRepository;
import com.adp.hcm.repository.JobPositionRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.repository.OnboardingPlanRepository;
import com.adp.hcm.repository.PerformanceEvaluationRepository;
import com.adp.hcm.repository.SystemConfigRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Generates an executive HR summary by aggregating live workforce metrics
 * and asking the OpenAI Chat Completions API to turn them into a short,
 * readable report for the HR Admin dashboard.
 */
@Service
public class AiReportService {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.api.model}")
    private String model;

    @Autowired private RestTemplate restTemplate;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private JobPositionRepository jobPositionRepository;
    @Autowired private PerformanceEvaluationRepository performanceEvaluationRepository;
    @Autowired private AiReportHistoryRepository aiReportHistoryRepository;
    @Autowired private JobApplicationRepository jobApplicationRepository;
    @Autowired private OnboardingPlanRepository onboardingPlanRepository;
    @Autowired private SystemConfigRepository systemConfigRepository;
    @Autowired private ObjectMapper objectMapper;

    /**
     * Builds the workforce snapshot, sends it to the AI model, and returns
     * the generated report text together with the raw stats used to build it.
     */
    public Map<String, Object> generateHrReport(List<String> sections) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable and restart the backend.");
        }

        Map<String, Object> stats = collectWorkforceStats();
        String prompt = buildPrompt(stats, sections);
        String reportText = callOpenAi(
            "You are an HR analytics assistant for Nexus HCM. You write concise, factual executive summaries from workforce statistics.",
            prompt);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("report", reportText);
        result.put("stats", stats);
        result.put("generatedAt", LocalDateTime.now().toString());

        saveHistory("HR", null, "HR Admin", result);
        return result;
    }

    /**
     * Builds a snapshot of a manager's direct reports (attendance, leave
     * requests, performance ratings), sends it to the AI model, and returns
     * the generated team summary together with the raw stats used to build it.
     */
    public Map<String, Object> generateManagerReport(Long managerId, List<String> sections) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable and restart the backend.");
        }

        Map<String, Object> stats = collectManagerTeamStats(managerId);
        String prompt = buildManagerPrompt(stats, sections);
        String reportText = callOpenAi(
            "You are an HR analytics assistant for Nexus HCM. You write concise, factual executive summaries from workforce statistics.",
            prompt);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("report", reportText);
        result.put("stats", stats);
        result.put("generatedAt", LocalDateTime.now().toString());

        saveHistory("MANAGER", managerId, (String) stats.get("managerName"), result);
        return result;
    }

    /**
     * Step 1: aggregate the raw numbers the AI will reason about.
     * Kept separate from prompt formatting so the same data can also be
     * inspected/tested without calling the AI API.
     */
    Map<String, Object> collectWorkforceStats() {
        List<Employee> employees = employeeRepository.findAll();
        List<LeaveRequest> leaves = leaveRequestRepository.findAll();

        long totalHeadcount = employees.size();
        long activeProfiles = employees.stream().filter(e -> "ACTIVE".equals(e.getStatus())).count();
        long pendingSetups = employees.stream().filter(e -> "PENDING_SETUP".equals(e.getStatus())).count();

        Map<String, Long> deptDistribution = employees.stream()
            .filter(e -> e.getDepartment() != null)
            .collect(Collectors.groupingBy(e -> e.getDepartment().getName(), Collectors.counting()));

        long pendingLeaves = leaves.stream().filter(l -> "PENDING".equals(l.getStatus())).count();
        long approvedLeaves = leaves.stream().filter(l -> "APPROVED".equals(l.getStatus())).count();
        long rejectedLeaves = leaves.stream().filter(l -> "REJECTED".equals(l.getStatus())).count();
        long decidedLeaves = approvedLeaves + rejectedLeaves;
        double approvalRate = decidedLeaves == 0 ? 0.0 : (approvedLeaves * 100.0) / decidedLeaves;

        LocalDate today = LocalDate.now();
        long presentToday = attendanceRepository.findAll().stream()
            .filter(a -> today.equals(a.getWorkDate()) && a.getMorningIn() != null)
            .count();

        long openPositions = jobPositionRepository.countByStatus("OPEN");
        long totalApplicants = jobPositionRepository.findAll().stream()
            .mapToLong(p -> p.getApplicantsCount())
            .sum();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalHeadcount", totalHeadcount);
        stats.put("activeProfiles", activeProfiles);
        stats.put("pendingSetups", pendingSetups);
        stats.put("totalDepartments", departmentRepository.count());
        stats.put("deptDistribution", deptDistribution);
        stats.put("pendingLeaves", pendingLeaves);
        stats.put("approvedLeaves", approvedLeaves);
        stats.put("rejectedLeaves", rejectedLeaves);
        stats.put("leaveApprovalRatePct", Math.round(approvalRate * 10) / 10.0);
        stats.put("presentToday", presentToday);
        stats.put("openPositions", openPositions);
        stats.put("totalApplicants", totalApplicants);
        return stats;
    }

    /**
     * Step 2: turn the raw numbers into a compact, natural-language context
     * block and wrap it in instructions describing the report we want back.
     */
    String buildPrompt(Map<String, Object> stats, List<String> sections) {
        boolean includeAll = sections == null || sections.isEmpty();
        boolean includeWorkforce = includeAll || sections.contains("workforce");
        boolean includeLeaves = includeAll || sections.contains("leaves");
        boolean includeAttendance = includeAll || sections.contains("attendance");
        boolean includeRecruitment = includeAll || sections.contains("recruitment");

        StringBuilder sb = new StringBuilder();
        sb.append("Here is the current snapshot of the company's HR data:\n\n");

        if (includeWorkforce) {
            @SuppressWarnings("unchecked")
            Map<String, Long> deptDistribution = (Map<String, Long>) stats.get("deptDistribution");
            String deptLines = deptDistribution.entrySet().stream()
                .map(e -> "  - " + e.getKey() + ": " + e.getValue() + " employees")
                .collect(Collectors.joining("\n"));

            sb.append("Workforce:\n");
            sb.append("  - Total headcount: ").append(stats.get("totalHeadcount")).append("\n");
            sb.append("  - Active profiles: ").append(stats.get("activeProfiles")).append("\n");
            sb.append("  - Pending account setups: ").append(stats.get("pendingSetups")).append("\n");
            sb.append("  - Departments: ").append(stats.get("totalDepartments")).append("\n");
            sb.append(deptLines).append("\n\n");
        }

        if (includeLeaves) {
            sb.append("Leave requests:\n");
            sb.append("  - Pending: ").append(stats.get("pendingLeaves")).append("\n");
            sb.append("  - Approved: ").append(stats.get("approvedLeaves")).append("\n");
            sb.append("  - Rejected: ").append(stats.get("rejectedLeaves")).append("\n");
            sb.append("  - Approval rate (of decided requests): ").append(stats.get("leaveApprovalRatePct")).append("%\n\n");
        }

        if (includeAttendance) {
            sb.append("Attendance:\n");
            sb.append("  - Employees clocked in today: ").append(stats.get("presentToday")).append("\n\n");
        }

        if (includeRecruitment) {
            sb.append("Recruitment:\n");
            sb.append("  - Open job positions: ").append(stats.get("openPositions")).append("\n");
            sb.append("  - Total applicants across all positions: ").append(stats.get("totalApplicants")).append("\n\n");
        }

        sb.append("Write a short executive HR summary (4-6 sentences, plain text, no markdown headings) ");
        sb.append("for the HR Administrator, covering only the sections of data provided above. ");
        sb.append("Highlight notable trends, risks (e.g. low approval rates, ");
        sb.append("many pending setups, low attendance) and one actionable recommendation.");
        return sb.toString();
    }

    /**
     * Step 3: call the OpenAI Chat Completions API and extract the generated text.
     * Applies superuser-configurable AI tuning (temperature, tone, custom
     * instructions) from SystemConfig to every AI feature in the app.
     */
    String callOpenAi(String systemPrompt, String userPrompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        double temperature = 0.4;
        try {
            temperature = Double.parseDouble(getConfigValue("ai.temperature", "0.4").trim());
        } catch (NumberFormatException ignored) {
            // fall back to default temperature
        }

        String tone = getConfigValue("ai.tone", "professional, concise, and data-driven");
        String customInstructions = getConfigValue("ai.custom_instructions", "");

        StringBuilder system = new StringBuilder(systemPrompt);
        if (!tone.isBlank()) {
            system.append(" Always respond in a ").append(tone).append(" tone.");
        }
        if (!customInstructions.isBlank()) {
            system.append(" Additional instructions: ").append(customInstructions);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);
        body.put("messages", List.of(
            Map.of("role", "system", "content", system.toString()),
            Map.of("role", "user", "content", userPrompt)
        ));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response =
                (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(apiUrl, request, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RestClientException("Empty response from OpenAI API");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RestClientException("OpenAI API returned no choices");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return ((String) message.get("content")).trim();
        } catch (RestClientException ex) {
            throw new RestClientException("Failed to reach OpenAI API: " + ex.getMessage(), ex);
        }
    }

    /**
     * Aggregates attendance, leave and performance-rating data for the
     * employees that report to the given manager.
     */
    Map<String, Object> collectManagerTeamStats(Long managerId) {
        Employee manager = employeeRepository.findById(managerId)
            .orElseThrow(() -> new IllegalArgumentException("Manager not found with id " + managerId));
        List<Employee> team = employeeRepository.findByManagerId(managerId);

        LocalDate today = LocalDate.now();
        List<Map<String, Object>> employeeStats = new ArrayList<>();
        long presentToday = 0;
        long pendingLeavesTotal = 0;
        List<Double> ratings = new ArrayList<>();

        for (Employee emp : team) {
            List<LeaveRequest> empLeaves = leaveRequestRepository.findByEmployeeId(emp.getId());
            long pending = empLeaves.stream().filter(l -> "PENDING".equals(l.getStatus())).count();
            pendingLeavesTotal += pending;

            boolean presentTodayFlag = attendanceRepository.findByEmployeeIdAndWorkDate(emp.getId(), today)
                .map(a -> a.getMorningIn() != null)
                .orElse(false);
            if (presentTodayFlag) presentToday++;

            List<PerformanceEvaluation> completedEvals = performanceEvaluationRepository.findByEmployee(emp).stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) && !e.getResponses().isEmpty())
                .collect(Collectors.toList());

            Double avgRating = null;
            if (!completedEvals.isEmpty()) {
                double rawAvg = completedEvals.stream()
                    .flatMap(e -> e.getResponses().stream())
                    .mapToInt(r -> r.getRating().getValue())
                    .average()
                    .orElse(0.0);
                avgRating = Math.round(rawAvg * 10) / 10.0;
                ratings.add(avgRating);
            }

            Map<String, Object> empStat = new LinkedHashMap<>();
            empStat.put("name", emp.getFirstName() + " " + emp.getLastName());
            empStat.put("jobTitle", emp.getJobTitle());
            empStat.put("presentToday", presentTodayFlag);
            empStat.put("pendingLeaves", pending);
            empStat.put("evaluationsCompleted", completedEvals.size());
            empStat.put("averageRating", avgRating);
            employeeStats.add(empStat);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("managerName", manager.getFirstName() + " " + manager.getLastName());
        stats.put("teamSize", team.size());
        stats.put("presentToday", presentToday);
        stats.put("pendingLeavesTotal", pendingLeavesTotal);
        stats.put("avgTeamRating", ratings.isEmpty() ? null
            : Math.round(ratings.stream().mapToDouble(Double::doubleValue).average().orElse(0.0) * 10) / 10.0);
        stats.put("employees", employeeStats);
        return stats;
    }

    /**
     * Turns a manager's team snapshot into a prompt asking for an executive
     * summary focused on attendance, leave backlog and performance trends.
     */
    String buildManagerPrompt(Map<String, Object> stats, List<String> sections) {
        boolean includeAll = sections == null || sections.isEmpty();
        boolean includeAttendance = includeAll || sections.contains("attendance");
        boolean includeLeaves = includeAll || sections.contains("leaves");
        boolean includePerformance = includeAll || sections.contains("performance");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> employees = (List<Map<String, Object>>) stats.get("employees");

        StringBuilder sb = new StringBuilder();
        sb.append("Here is the current snapshot of the team managed by ").append(stats.get("managerName")).append(":\n\n");
        sb.append("Team size: ").append(stats.get("teamSize")).append("\n");
        if (includeAttendance) {
            sb.append("Present today: ").append(stats.get("presentToday")).append(" / ").append(stats.get("teamSize")).append("\n");
        }
        if (includeLeaves) {
            sb.append("Total pending leave requests: ").append(stats.get("pendingLeavesTotal")).append("\n");
        }
        if (includePerformance) {
            Object avgRating = stats.get("avgTeamRating");
            sb.append("Average performance rating (1-5 scale): ").append(avgRating != null ? avgRating : "no completed evaluations yet").append("\n");
        }
        sb.append("\n");

        sb.append("Per-employee details:\n");
        for (Map<String, Object> emp : employees) {
            sb.append("  - ").append(emp.get("name"));
            if (emp.get("jobTitle") != null) {
                sb.append(" (").append(emp.get("jobTitle")).append(")");
            }
            boolean first = true;
            if (includeAttendance) {
                sb.append(first ? ": " : ", ").append("present today = ").append(emp.get("presentToday"));
                first = false;
            }
            if (includeLeaves) {
                sb.append(first ? ": " : ", ").append("pending leave requests = ").append(emp.get("pendingLeaves"));
                first = false;
            }
            if (includePerformance) {
                sb.append(first ? ": " : ", ").append("avg rating = ").append(emp.get("averageRating") != null ? emp.get("averageRating") : "N/A");
                sb.append(" (").append(emp.get("evaluationsCompleted")).append(" evaluation(s) completed)");
                first = false;
            }
            sb.append("\n");
        }

        sb.append("\nWrite a short executive team summary (4-6 sentences, plain text, no markdown headings) ");
        sb.append("for this manager, covering only the data provided above. Highlight attendance issues, ");
        sb.append("leave requests needing attention, performance trends (high and low performers), ");
        sb.append("and one actionable recommendation for managing the team.");
        return sb.toString();
    }

    /**
     * Step 6 (cross-cutting): persist every generated report so it can be
     * shown again later in a "previous reports" history view.
     */
    private void saveHistory(String reportType, Long managerId, String managerName, Map<String, Object> result) {
        try {
            AiReportHistory history = new AiReportHistory();
            history.setReportType(reportType);
            history.setManagerId(managerId);
            history.setManagerName(managerName);
            history.setReportText((String) result.get("report"));
            history.setStatsJson(objectMapper.writeValueAsString(result.get("stats")));
            history.setGeneratedAt(LocalDateTime.now());
            aiReportHistoryRepository.save(history);
        } catch (Exception ex) {
            // History is a convenience feature - never fail the report generation because of it.
        }
    }

    /** Returns past HR-wide reports, most recent first. */
    public List<AiReportHistory> getHrHistory() {
        return aiReportHistoryRepository.findByReportTypeOrderByGeneratedAtDesc("HR");
    }

    /** Returns past reports generated for a manager's team, most recent first. */
    public List<AiReportHistory> getManagerHistory(Long managerId) {
        return aiReportHistoryRepository.findByReportTypeAndManagerIdOrderByGeneratedAtDesc("MANAGER", managerId);
    }

    private String getConfigValue(String key, String defaultValue) {
        return systemConfigRepository.findById(key)
            .map(c -> c.getConfigValue() == null ? defaultValue : c.getConfigValue())
            .orElse(defaultValue);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AI Resume / CV Screener
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Extracts the text of an applicant's uploaded CV and asks the AI model
     * to score it against the job's description/requirements, persisting the
     * result on the JobApplication entity.
     */
    public JobApplication screenCv(Long applicationId) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable and restart the backend.");
        }

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("Application not found with id " + applicationId));

        if (application.getCvData() == null || application.getCvData().isBlank()) {
            throw new IllegalStateException("This application has no CV uploaded.");
        }

        String cvText = extractCvText(application.getCvFileName(), application.getCvData());
        JobPosition position = application.getPosition();
        String prompt = buildCvScreeningPrompt(application, position, cvText);

        String aiResponse = callOpenAi(
            "You are an expert technical recruiter for Nexus HCM. You evaluate resumes against job requirements " +
            "and respond ONLY with strict JSON, no markdown, no commentary.",
            prompt);

        Map<String, Object> parsed = parseJsonResponse(aiResponse);

        Integer score = parsed.get("score") instanceof Number ? ((Number) parsed.get("score")).intValue() : null;
        application.setAiScore(score);
        application.setAiSummary((String) parsed.get("summary"));
        application.setAiStrengths(joinIfList(parsed.get("strengths")));
        application.setAiMissingSkills(joinIfList(parsed.get("missingSkills")));
        application.setAiScreenedAt(LocalDateTime.now());

        return jobApplicationRepository.save(application);
    }

    private String buildCvScreeningPrompt(JobApplication application, JobPosition position, String cvText) {
        StringBuilder sb = new StringBuilder();
        sb.append("Job title: ").append(position != null ? position.getTitle() : "Unknown").append("\n");
        if (position != null && position.getDescription() != null) {
            sb.append("Job description:\n").append(position.getDescription()).append("\n\n");
        }
        if (position != null && position.getRequirements() != null) {
            sb.append("Job requirements:\n").append(position.getRequirements()).append("\n\n");
        }
        sb.append("Applicant: ").append(application.getApplicantName()).append("\n\n");
        sb.append("Resume / CV text:\n").append(cvText).append("\n\n");
        sb.append("Score how well this CV matches the job (0-100), considering skills, experience and requirements. ");
        sb.append("Respond with ONLY a JSON object using exactly this shape: ");
        sb.append("{\"score\": <integer 0-100>, \"summary\": \"<2-3 sentence overall assessment>\", ");
        sb.append("\"strengths\": [\"<strength 1>\", \"<strength 2>\", ...], ");
        sb.append("\"missingSkills\": [\"<missing skill or gap 1>\", ...]}");
        return sb.toString();
    }

    /**
     * Extracts plain text from an uploaded CV. Supports PDFs via PDFBox;
     * falls back to decoding as UTF-8 text for other formats. Truncates to
     * a reasonable length to keep prompts within model limits.
     */
    private String extractCvText(String fileName, String base64Data) {
        byte[] bytes = Base64.getDecoder().decode(base64Data);
        String text;
        boolean isPdf = fileName != null && fileName.toLowerCase().endsWith(".pdf");

        if (isPdf) {
            try (PDDocument document = Loader.loadPDF(bytes)) {
                text = new PDFTextStripper().getText(document);
            } catch (Exception ex) {
                text = "";
            }
        } else {
            text = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        }

        if (text == null) text = "";
        if (text.length() > 6000) {
            text = text.substring(0, 6000);
        }
        return text.isBlank() ? "(Could not extract readable text from the uploaded CV file.)" : text;
    }

    /** Parses a JSON object response from the AI, tolerating stray markdown fences. */
    private Map<String, Object> parseJsonResponse(String aiResponse) {
        String json = aiResponse.trim();
        if (json.startsWith("```")) {
            json = json.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").trim();
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(json, Map.class);
            return parsed;
        } catch (Exception ex) {
            throw new RestClientException("Failed to parse AI response as JSON: " + ex.getMessage(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private String joinIfList(Object value) {
        if (value instanceof List) {
            return ((List<Object>) value).stream()
                .map(String::valueOf)
                .collect(Collectors.joining("\n"));
        }
        return value == null ? null : String.valueOf(value);
    }

    // ─────────────────────────────────────────────────────────────────────
    // AI Onboarding Plan Generator
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Generates a personalized 30/60/90-day onboarding plan for an employee
     * based on their role and department, and saves it to history.
     */
    public OnboardingPlan generateOnboardingPlan(Long employeeId) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable and restart the backend.");
        }

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new IllegalArgumentException("Employee not found with id " + employeeId));

        String prompt = buildOnboardingPrompt(employee);
        String planText = callOpenAi(
            "You are an HR onboarding specialist for Nexus HCM. You write clear, practical onboarding plans " +
            "structured around the first 30, 60, and 90 days.",
            prompt);

        OnboardingPlan plan = new OnboardingPlan();
        plan.setEmployeeId(employee.getId());
        plan.setEmployeeName(employee.getFirstName() + " " + employee.getLastName());
        plan.setPlanText(planText);
        plan.setGeneratedAt(LocalDateTime.now());
        return onboardingPlanRepository.save(plan);
    }

    private String buildOnboardingPrompt(Employee employee) {
        StringBuilder sb = new StringBuilder();
        sb.append("Create a personalized onboarding plan for a new employee with the following details:\n");
        sb.append("  - Name: ").append(employee.getFirstName()).append(" ").append(employee.getLastName()).append("\n");
        sb.append("  - Job title: ").append(employee.getJobTitle() != null ? employee.getJobTitle() : "Not specified").append("\n");
        sb.append("  - Department: ").append(employee.getDepartment() != null ? employee.getDepartment().getName() : "Not specified").append("\n");
        sb.append("  - Role: ").append(employee.getRole()).append("\n\n");
        sb.append("Write a structured onboarding plan covering the first 30, 60, and 90 days. ");
        sb.append("Use plain text with clear section headers \"Days 1-30\", \"Days 31-60\", and \"Days 61-90\", ");
        sb.append("each followed by a short list of concrete goals and activities relevant to this role and department. ");
        sb.append("Keep it practical and concise.");
        return sb.toString();
    }

    /** Returns past onboarding plans generated for an employee, most recent first. */
    public List<OnboardingPlan> getOnboardingHistory(Long employeeId) {
        return onboardingPlanRepository.findByEmployeeIdOrderByGeneratedAtDesc(employeeId);
    }
}
