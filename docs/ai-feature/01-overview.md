# Step 1 — Overview: AI HR Report Generation

## What we're building

A button on the HR Admin dashboard ("System Overview" tab) labelled **"Generate AI HR Report"**.
When clicked, it:

1. Calls the backend (`POST /api/ai/hr-report`).
2. The backend gathers a fresh snapshot of live workforce data (headcount, leave
   approval rates, attendance, open positions, etc.).
3. The backend turns that snapshot into a written prompt and sends it to
   OpenAI's GPT model (`gpt-4o-mini`).
4. The AI returns a short executive summary (4-6 sentences) highlighting
   trends, risks, and one recommendation.
5. The frontend displays the summary, plus the raw stats used, in a card.

## Why this feature

- It turns numbers HR admins already see (KPIs, charts) into a **narrative**
  they can read in 10 seconds instead of interpreting several charts.
- It demonstrates a realistic, end-to-end integration of an LLM into an
  existing Spring Boot + Angular application — a common request in modern
  HR/SaaS products.

## Architecture / data flow

```
[Angular Dashboard]
   |  click "Generate AI HR Report"
   v
POST http://localhost:8085/api/ai/hr-report
   |
   v
[AiController]  ->  [AiReportService]
                        |
                        |-- collectWorkforceStats()   <- queries JPA repositories
                        |-- buildPrompt(stats)        <- formats stats into a prompt
                        |-- callOpenAi(prompt)         <- RestTemplate -> OpenAI API
                        |
                        v
                  { report, stats, generatedAt }
   |
   v
[Angular Dashboard] displays the report text + timestamp
```

## Pieces involved (one per following doc step)

| Step | File(s) | Purpose |
|------|---------|---------|
| 2 | `application.properties`, `AiConfig.java` | Configuration & shared `RestTemplate` bean |
| 3 | `AiReportService.collectWorkforceStats()` | Aggregate live HR data into a stats map |
| 4 | `AiReportService.buildPrompt()` | Turn stats into a natural-language prompt |
| 5 | `AiReportService.callOpenAi()`, `AiController` | Call OpenAI, expose the REST endpoint |
| 6 | `dashboard.component.ts` | Button, loading state, result panel |
| 7 | Manual testing & error handling | Verifying the whole flow, including failure cases |

Continue to [Step 2 — Configuration & Dependencies](02-config-and-dependencies.md).
