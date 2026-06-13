package com.adp.hcm.service;

import com.adp.hcm.entity.AiReportHistory;
import com.adp.hcm.entity.Employee;
import com.adp.hcm.entity.LeaveRequest;
import com.adp.hcm.entity.PerformanceEvaluation;
import com.adp.hcm.repository.AiReportHistoryRepository;
import com.adp.hcm.repository.AttendanceRepository;
import com.adp.hcm.repository.DepartmentRepository;
import com.adp.hcm.repository.EmployeeRepository;
import com.adp.hcm.repository.JobPositionRepository;
import com.adp.hcm.repository.LeaveRequestRepository;
import com.adp.hcm.repository.PerformanceEvaluationRepository;
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
        String reportText = callOpenAi(prompt);

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
        String reportText = callOpenAi(prompt);

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
    String buildPrompt(Map<String, Object> stats) {
        @SuppressWarnings("unchecked")
        Map<String, Long> deptDistribution = (Map<String, Long>) stats.get("deptDistribution");
        String deptLines = deptDistribution.entrySet().stream()
            .map(e -> "  - " + e.getKey() + ": " + e.getValue() + " employees")
            .collect(Collectors.joining("\n"));

        StringBuilder sb = new StringBuilder();
        sb.append("Here is the current snapshot of the company's HR data:\n\n");
        sb.append("Workforce:\n");
        sb.append("  - Total headcount: ").append(stats.get("totalHeadcount")).append("\n");
        sb.append("  - Active profiles: ").append(stats.get("activeProfiles")).append("\n");
        sb.append("  - Pending account setups: ").append(stats.get("pendingSetups")).append("\n");
        sb.append("  - Departments: ").append(stats.get("totalDepartments")).append("\n");
        sb.append(deptLines).append("\n\n");
        sb.append("Leave requests:\n");
        sb.append("  - Pending: ").append(stats.get("pendingLeaves")).append("\n");
        sb.append("  - Approved: ").append(stats.get("approvedLeaves")).append("\n");
        sb.append("  - Rejected: ").append(stats.get("rejectedLeaves")).append("\n");
        sb.append("  - Approval rate (of decided requests): ").append(stats.get("leaveApprovalRatePct")).append("%\n\n");
        sb.append("Attendance:\n");
        sb.append("  - Employees clocked in today: ").append(stats.get("presentToday")).append("\n\n");
        sb.append("Recruitment:\n");
        sb.append("  - Open job positions: ").append(stats.get("openPositions")).append("\n");
        sb.append("  - Total applicants across all positions: ").append(stats.get("totalApplicants")).append("\n\n");
        sb.append("Write a short executive HR summary (4-6 sentences, plain text, no markdown headings) ");
        sb.append("for the HR Administrator. Highlight notable trends, risks (e.g. low approval rates, ");
        sb.append("many pending setups, low attendance) and one actionable recommendation.");
        return sb.toString();
    }

    /**
     * Step 3: call the OpenAI Chat Completions API and extract the generated text.
     */
    String callOpenAi(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", 0.4);
        body.put("messages", List.of(
            Map.of("role", "system", "content",
                "You are an HR analytics assistant for Nexus HCM. You write concise, factual executive summaries from workforce statistics."),
            Map.of("role", "user", "content", prompt)
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
    String buildManagerPrompt(Map<String, Object> stats) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> employees = (List<Map<String, Object>>) stats.get("employees");

        StringBuilder sb = new StringBuilder();
        sb.append("Here is the current snapshot of the team managed by ").append(stats.get("managerName")).append(":\n\n");
        sb.append("Team size: ").append(stats.get("teamSize")).append("\n");
        sb.append("Present today: ").append(stats.get("presentToday")).append(" / ").append(stats.get("teamSize")).append("\n");
        sb.append("Total pending leave requests: ").append(stats.get("pendingLeavesTotal")).append("\n");
        Object avgRating = stats.get("avgTeamRating");
        sb.append("Average performance rating (1-5 scale): ").append(avgRating != null ? avgRating : "no completed evaluations yet").append("\n\n");

        sb.append("Per-employee details:\n");
        for (Map<String, Object> emp : employees) {
            sb.append("  - ").append(emp.get("name"));
            if (emp.get("jobTitle") != null) {
                sb.append(" (").append(emp.get("jobTitle")).append(")");
            }
            sb.append(": present today = ").append(emp.get("presentToday"));
            sb.append(", pending leave requests = ").append(emp.get("pendingLeaves"));
            sb.append(", avg rating = ").append(emp.get("averageRating") != null ? emp.get("averageRating") : "N/A");
            sb.append(" (").append(emp.get("evaluationsCompleted")).append(" evaluation(s) completed)");
            sb.append("\n");
        }

        sb.append("\nWrite a short executive team summary (4-6 sentences, plain text, no markdown headings) ");
        sb.append("for this manager. Highlight attendance issues, leave requests needing attention, ");
        sb.append("performance trends (high and low performers), and one actionable recommendation for managing the team.");
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
}
