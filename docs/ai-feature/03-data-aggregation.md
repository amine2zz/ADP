# Step 3 — Data Aggregation: `collectWorkforceStats()`

## Why this is its own step

Before we can ask an AI for a "summary of the company", we need to decide
**what data matters** and fetch it. Keeping this in its own method means:

- It can be unit-tested or called independently of the AI API.
- It mirrors the existing `DashboardController` pattern (same repositories,
  same `Map<String, Object>` shape), so it's easy to recognize and maintain.
- The prompt-building step (Step 4) stays focused purely on *formatting*,
  not on *querying*.

## The method

`hcm-backend/src/main/java/com/adp/hcm/service/AiReportService.java`:

```java
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
```

## What data is included, and why

| Metric | Source | Why it's useful to the AI |
|--------|--------|----------------------------|
| `totalHeadcount`, `activeProfiles`, `pendingSetups` | `EmployeeRepository` | Onboarding health — many pending setups is a risk signal |
| `deptDistribution` | grouped `Employee.department` | Lets the AI comment on team sizes/imbalance |
| `pendingLeaves`, `approvedLeaves`, `rejectedLeaves`, `leaveApprovalRatePct` | `LeaveRequestRepository` | Leave backlog / approval bottlenecks |
| `presentToday` | `AttendanceRepository` (records for today with a morning clock-in) | Daily attendance snapshot |
| `openPositions`, `totalApplicants` | `JobPositionRepository` | Recruitment pipeline health |

This is intentionally a **flat, simple map** — easy to both serialize to
JSON (for the frontend's "raw stats" view) and to format into a text prompt
(Step 4).

Continue to [Step 4 — Prompt Design](04-prompt-design.md).
