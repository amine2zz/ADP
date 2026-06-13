# Step 8 — Manager Team Reports & Report History

This step extends the original "AI HR Report" feature in two directions:

1. **Manager-scoped reports** — a manager can generate an AI summary of
   *their own team's* attendance, leave requests, and performance ratings
   (instead of the company-wide HR report).
2. **Report history** — every generated report (HR-wide or per-manager) is
   persisted, so admins/managers can revisit previous reports instead of
   losing them after the page reloads.

## 1. New entity: `AiReportHistory`

`hcm-backend/src/main/java/com/adp/hcm/entity/AiReportHistory.java`:

```java
@Entity
@Data
@Table(name = "ai_report_history")
public class AiReportHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reportType;   // "HR" or "MANAGER"
    private Long managerId;       // null for HR-wide reports
    private String managerName;

    @Lob @Column(columnDefinition = "TEXT")
    private String reportText;

    @Lob @Column(columnDefinition = "TEXT")
    private String statsJson;     // the raw stats, serialized, for later reference

    private LocalDateTime generatedAt = LocalDateTime.now();
}
```

With `spring.jpa.hibernate.ddl-auto=update`, Hibernate creates the
`ai_report_history` table automatically on next startup — no manual
migration needed.

`AiReportHistoryRepository` adds two lookups:

```java
List<AiReportHistory> findByReportTypeOrderByGeneratedAtDesc(String reportType);
List<AiReportHistory> findByReportTypeAndManagerIdOrderByGeneratedAtDesc(String reportType, Long managerId);
```

## 2. Saving history — `saveHistory()`

Both `generateHrReport()` and the new `generateManagerReport()` end by
calling a shared helper:

```java
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
```

The `try/catch` is deliberate: if serialization or saving fails for any
reason, the user still gets their freshly generated report — history is
"best effort" and never blocks the main feature.

> **Jackson note**: Spring Boot 4 ships Jackson 3, whose `ObjectMapper` moved
> to the `tools.jackson.databind` package (not the classic
> `com.fasterxml.jackson.databind`). The import in `AiReportService` is
> `import tools.jackson.databind.ObjectMapper;`.

## 3. Manager team stats — `collectManagerTeamStats()`

Mirrors `collectWorkforceStats()` (Step 3) but scoped to one manager's
direct reports (`employeeRepository.findByManagerId(managerId)`):

| Metric | Source |
|--------|--------|
| `teamSize` | number of direct reports |
| `presentToday` | reports with an attendance record today that has a morning clock-in |
| `pendingLeavesTotal` | sum of each report's `PENDING` leave requests |
| `avgTeamRating` | average of all `COMPLETED` performance evaluation ratings (1-5), across the whole team |
| `employees[]` | per-employee breakdown: name, job title, present today, pending leaves, average rating, evaluations completed |

## 4. Manager prompt — `buildManagerPrompt()`

Same philosophy as Step 4, but tailored to a manager's perspective:

```
Here is the current snapshot of the team managed by <Manager Name>:

Team size: 4
Present today: 3 / 4
Total pending leave requests: 1
Average performance rating (1-5 scale): 4.2

Per-employee details:
  - Jane Doe (Software Engineer): present today = true, pending leave requests = 0, avg rating = 4.5 (2 evaluation(s) completed)
  - John Smith (QA Engineer): present today = false, pending leave requests = 1, avg rating = N/A (0 evaluation(s) completed)
  ...

Write a short executive team summary (4-6 sentences, plain text, no markdown headings)
for this manager. Highlight attendance issues, leave requests needing attention,
performance trends (high and low performers), and one actionable recommendation
for managing the team.
```

## 5. New endpoints

`AiController`:

| Method & Path | Purpose |
|----------------|---------|
| `POST /api/ai/hr-report` | (existing) generate + save an HR-wide report |
| `GET /api/ai/hr-report/history` | list past HR-wide reports, most recent first |
| `POST /api/ai/manager-report/{managerId}` | generate + save a team report for this manager |
| `GET /api/ai/manager-report/{managerId}/history` | list past reports for this manager's team |

`generateManagerReport` adds a third error case versus the HR endpoint:
`IllegalArgumentException` (unknown `managerId`) → `404 Not Found`.

## 6. Frontend changes

**HR dashboard** (`dashboard.component.ts`, System Overview tab):
- Added `aiReportHistory: any[]`, fetched on `ngOnInit()` via
  `fetchAiReportHistory()` and refreshed after each new report.
- A collapsible "Previous Reports" list (`<details>`/`<summary>`) renders
  below the current report, showing the timestamp and full text of each
  past report.

**Manager dashboard** (`manager-dashboard.component.ts`):
- New tab **"🤖 AI Team Report"**, alongside Leave Requests / My Team /
  Attendance.
- Same generate-button / loading / error / result pattern as the HR card,
  but calls `POST /api/ai/manager-report/{userId}` (the logged-in manager's
  own id from `localStorage`).
- Same "Previous Reports" history list, fetched from
  `GET /api/ai/manager-report/{userId}/history`.

## Testing

1. Log in as a manager who has direct reports (`employeeRepository.findByManagerId` returns non-empty).
2. Go to the **AI Team Report** tab and click **Generate AI Team Report**.
3. Confirm the summary mentions attendance/leave/rating details consistent
   with "My Team" and "Attendance" tabs.
4. Refresh the page and revisit the tab — the report you generated should
   now appear under **Previous Reports**.
5. Repeat steps 2-4 as the HR Admin on the System Overview tab to confirm
   the HR-wide history works the same way.

## 7. Report section filters

Both report cards now show **"Include in report"** checkboxes:

- HR report: Workforce & Departments, Leave Requests, Attendance, Recruitment
- Manager report: Attendance, Leave Requests, Performance Ratings

The selected keys are sent as `{ "sections": [...] }` in the POST body to
`/api/ai/hr-report` and `/api/ai/manager-report/{managerId}`. On the backend,
`buildPrompt()` / `buildManagerPrompt()` only include the corresponding blocks
in the AI prompt — unselected sections are omitted from what the model is
asked to summarize (an empty/missing `sections` array means "include
everything", preserving old behavior). The "Generate" button is disabled if
no section is selected.

## 8. AI feature toggles (Superuser)

Two new `FEATURE`-category `SystemConfig` entries are seeded by `DataSeeder`:

- `feature.ai_hr_report` — "AI HR Report"
- `feature.ai_manager_report` — "AI Manager Team Report"

Both are `optional=true`, so they show up automatically in the existing
**Superuser → Features** tab with the same on/off toggle UI as other
feature flags — no new frontend code was needed there.

`AiController` checks these flags before generating a report
(`isFeatureEnabled("feature.ai_hr_report")` /
`isFeatureEnabled("feature.ai_manager_report")`, via `SystemConfigRepository`).
If a flag is set to `"false"`, the endpoint returns `503 Service Unavailable`
with a message explaining the feature was disabled by the administrator,
which surfaces in the dashboard's error banner.
