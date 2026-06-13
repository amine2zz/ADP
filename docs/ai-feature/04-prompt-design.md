# Step 4 — Prompt Design: `buildPrompt()`

## The goal of prompt engineering here

An LLM doesn't know anything about *our* company — it only knows what we put
in the prompt. Good prompt design means:

1. **Give it structured, labeled facts** (not a raw JSON dump — plain
   sentences/lists are easier for the model to reason about and cheaper in
   tokens).
2. **Tell it exactly what to produce** — format, length, tone, and what to
   focus on. Without this, responses are inconsistent (sometimes a bullet
   list, sometimes three paragraphs, sometimes including markdown headers
   that look odd in our UI).
3. **Ask for actionable output** — not just a restatement of numbers, but a
   recommendation, since this is for an HR Administrator who wants to *act*
   on it.

## The method

`hcm-backend/src/main/java/com/adp/hcm/service/AiReportService.java`:

```java
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
```

## Example prompt produced

```
Here is the current snapshot of the company's HR data:

Workforce:
  - Total headcount: 42
  - Active profiles: 38
  - Pending account setups: 4
  - Departments: 5
  - Engineering: 18 employees
  - Sales: 10 employees
  - HR: 4 employees
  - Finance: 6 employees
  - Operations: 4 employees

Leave requests:
  - Pending: 3
  - Approved: 21
  - Rejected: 2
  - Approval rate (of decided requests): 91.3%

Attendance:
  - Employees clocked in today: 35

Recruitment:
  - Open job positions: 2
  - Total applicants across all positions: 17

Write a short executive HR summary (4-6 sentences, plain text, no markdown headings)
for the HR Administrator. Highlight notable trends, risks (e.g. low approval
rates, many pending setups, low attendance) and one actionable recommendation.
```

## Design choices explained

- **System message** (set in Step 5) establishes the AI's persona/role once,
  so the user prompt can stay focused on data + instructions.
- **Plain-text output, no markdown headings** — the frontend renders the
  report inside a styled card with `white-space: pre-line`; markdown headers
  would look broken without a markdown renderer.
- **4-6 sentences** — long enough to be useful, short enough to read at a
  glance on a dashboard.
- **Explicit risk examples** ("low approval rates", "many pending setups",
  "low attendance") — guides the model toward the kind of analysis we want
  without forcing it into a rigid template.

Continue to [Step 5 — Backend Service & Controller](05-backend-service.md).
