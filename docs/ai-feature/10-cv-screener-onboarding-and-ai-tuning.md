# Step 10 — CV Screener, Onboarding Plan Generator & AI Tuning

This step implements three of the ideas from [Step 9](09-future-ai-ideas-and-finetuning.md):

1. **AI Resume / CV Screener** — scores an applicant's uploaded CV against
   the job's description and requirements.
2. **AI Onboarding Plan Generator** — generates a personalized 30/60/90-day
   onboarding plan for an employee.
3. **AI Tuning** — a superuser-configurable "fine tuning" of every AI
   feature's behavior (temperature, tone, custom instructions), since real
   model fine-tuning isn't possible with Groq (see Step 9, Section 2).

## 1. AI Tuning — the practical "fine tuning" layer

Three new `SystemConfig` rows, category `AI_TUNING`, seeded in `DataSeeder`:

| Key | Default | Purpose |
|---|---|---|
| `ai.temperature` | `0.4` | Model temperature (0 = focused, 1 = creative) |
| `ai.tone` | `professional, concise, and data-driven` | Tone/persona appended to the system prompt |
| `ai.custom_instructions` | *(empty)* | Free-text instructions appended to every AI prompt |

`AiReportService.callOpenAi()` was refactored from
`callOpenAi(String prompt)` to `callOpenAi(String systemPrompt, String userPrompt)`.
It now reads these three configs via `SystemConfigRepository` on every call,
appends the tone and custom instructions to the system prompt, and uses the
configured temperature instead of a hardcoded `0.4`. This applies uniformly
to the HR report, manager report, CV screening, and onboarding plan features.

A new **AI Tuning** tab in the Superuser dashboard
(`superuser-dashboard.component.ts`) lets admins edit these three values and
save them via the existing `PUT /api/config/bulk` endpoint.

## 2. AI Resume / CV Screener

**Entity changes** (`JobApplication`): new fields `aiScore` (Integer),
`aiSummary`, `aiStrengths`, `aiMissingSkills` (TEXT), `aiScreenedAt`
(LocalDateTime) — populated by screening, `null` until screened.

**Service** — `AiReportService.screenCv(Long applicationId)`:
1. Loads the `JobApplication` and its `cvData` (base64).
2. Extracts text via `extractCvText()` — PDFBox (`Loader.loadPDF` +
   `PDFTextStripper`) for `.pdf` files, raw UTF-8 decode otherwise, truncated
   to ~6000 chars.
3. Builds a prompt with the job title/description/requirements + CV text,
   asking for strict JSON: `{score, summary, strengths[], missingSkills[]}`.
4. Calls `callOpenAi()` with a recruiter system prompt, parses the JSON
   response, and saves the results back onto the `JobApplication`.

**Endpoint**: `POST /api/ai/cv-screen/{applicationId}`, gated by
`feature.ai_cv_screening`.

**Frontend** (`job-board.component.ts`, Applications tab): a new "AI
Screening" column. Applications with an uploaded CV show an "✨ AI Screen"
button; once screened, a color-coded score badge (green/yellow/red) with a
"Details" toggle showing the summary, strengths, and skill gaps, plus a
re-screen (↻) button.

## 3. AI Onboarding Plan Generator

**New entity**: `OnboardingPlan` (`onboarding_plans` table) — `employeeId`,
`employeeName`, `planText` (TEXT), `generatedAt`. New
`OnboardingPlanRepository` with `findByEmployeeIdOrderByGeneratedAtDesc`.

**Service** — `AiReportService.generateOnboardingPlan(Long employeeId)`:
builds a prompt from the employee's name, job title, department and role,
asks for a plan structured around "Days 1-30", "Days 31-60", "Days 61-90",
and persists the result.

**Endpoints**, gated by `feature.ai_onboarding`:
- `POST /api/ai/onboarding-plan/{employeeId}` — generates a new plan
- `GET /api/ai/onboarding-plan/{employeeId}/history` — past plans, newest first

**Frontend** (`employee-dashboard.component.ts`): a new "🚀 My Onboarding"
section tab with a "Generate My Onboarding Plan" button, the latest plan
rendered as formatted text, and a scrollable history of all previously
generated plans.

## 4. Feature flags

Both features are toggleable from the Superuser → Features tab (added to
`DataSeeder`, both default `true`):

- `feature.ai_cv_screening` — "AI CV Screener"
- `feature.ai_onboarding` — "AI Onboarding Plans"

## 5. New dependency

`pom.xml` gained `org.apache.pdfbox:pdfbox:3.0.3` for PDF text extraction
(PDFBox 3.x API: `Loader.loadPDF(byte[])` + `PDFTextStripper().getText(doc)`).
