# Step 9 — Where to Take the AI Feature Next

This step is a roadmap, not an implementation: a menu of AI features that can
reuse the same `OPENAI_API_KEY` / Groq setup from Steps 1-8, plus an honest
explanation of fine-tuning and other "AI development" concepts and how (or
whether) they apply to this project.

## 1. More AI features you can build with the same API key

All of these reuse `AiConfig` (the shared `RestTemplate`), the
`openai.api.*` properties, and the same "collect stats → build prompt → call
`callOpenAi()`" pattern from `AiReportService`. Roughly ordered from
easiest to most involved.

### A. HR Assistant chatbot
A floating chat widget (any dashboard) backed by `POST /api/ai/chat`.
- Collects a small context snapshot (the logged-in employee's leave balance,
  attendance, team size if a manager, etc.) and the user's question.
- System prompt: "You are an HR assistant for Nexus HCM. Answer using only
  the data provided. If you don't know, say so."
- Good first feature because it reuses 100% of the existing plumbing —
  just a new prompt builder and a chat-style UI component.

### B. AI Job Description Generator
On the **Job Positions** / recruitment screen, a "Generate with AI" button
next to the description field.
- Input: job title, department, seniority, a few bullet keywords.
- Output: a full job description + responsibilities + requirements,
  editable before saving.
- Very visible "wow" feature for demos — pure text generation, no DB writes
  needed beyond the existing job position fields.

### C. AI Resume / CV Screener
You already added CV upload on the careers page (per the latest commit).
- Extract text from the uploaded CV (Apache PDFBox or similar for PDFs).
- Send the CV text + job description to the AI, ask for a 0-100 match score
  plus a short rationale and a list of missing skills.
- Store the score on the application record so HR can sort candidates by
  fit.

### D. AI Performance Review Assistant
On the **Performance** module:
- "Draft my self-review" for employees: AI turns a few short notes/bullets
  into a polished self-assessment paragraph.
- "Summarize this employee's year" for managers: feed in all
  `PerformanceEvaluation` responses for the period and ask for a narrative
  summary + suggested rating + development goals.

### E. AI Leave Request Helper
- When an employee writes a leave reason, AI can suggest a more complete
  message (e.g. turning "sick" into a properly formatted request).
- For managers/HR: an "explain this leave pattern" button that summarizes a
  given employee's leave history (frequency, days of week, trends) — useful
  for spotting attendance issues without manually reading every record.

### F. AI Org Chart / Workforce Planning Advisor
- Feed the AI the department sizes, manager-to-report ratios, and open
  positions (similar data to `collectWorkforceStats()`).
- Ask for observations: departments that are top-heavy, managers with too
  many direct reports, hiring priorities.
- Pairs naturally with the existing collapsible org tree.

### G. AI Onboarding Plan Generator
- For a newly created employee (role + department + job title), generate a
  personalized first-30-days onboarding checklist (training, intros,
  setup tasks).
- Could be shown on the employee's dashboard on their first login.

### H. AI Attendance Anomaly Narrator
- Reuse `AttendanceRepository` data: for a given employee/team, detect
  patterns (late arrivals trending up, repeated Friday absences, etc.) in
  Java code, then ask the AI to phrase the findings as a short, neutral
  note for the manager — keeps the *detection* deterministic and the AI's
  job limited to *explaining*, which is safer and cheaper.

### I. Natural-language search over employees
- `POST /api/ai/search` takes a question like *"who are the engineers with
  no completed evaluations this year?"*.
- Backend translates this into filters over `EmployeeRepository` /
  `PerformanceEvaluationRepository` results (either via a small rules
  engine, or by asking the AI to extract structured filters as JSON, then
  running the query yourself — **never** let the AI run raw SQL).

### J. Multi-language translation
- Translate report text, job descriptions, or notifications into another
  language on demand — one extra `callOpenAi()` call with a "translate the
  following text to French" prompt. Useful if Nexus HCM ever serves
  non-English-speaking staff.

> **Suggested next step**: (A) HR Assistant chatbot or (B) Job Description
> Generator — both are small, high-impact, and reuse everything already
> built. Tell me which one and we can do it the same step-by-step way as
> Steps 1-8.

## 2. Fine-tuning — does it apply here?

**Short answer: not with Groq, and probably not worth it for this project.**

- **Groq is an inference provider, not a fine-tuning platform.** It serves
  fixed, pre-trained open-weight models (e.g. `llama-3.3-70b-versatile`) at
  very high speed/low cost. There is currently no way to upload training
  data and get a custom fine-tuned model back from Groq.
- **Where real fine-tuning *is* available**:
  - **OpenAI fine-tuning API** — upload JSONL examples of
    prompt/response pairs, fine-tune models like `gpt-4o-mini`. Paid, and
    the resulting model is hosted by OpenAI.
  - **Open-weight fine-tuning (LoRA/QLoRA)** — tools like
    [Unsloth](https://github.com/unslothai/unsloth) or Hugging Face
    `peft` let you fine-tune Llama/Mistral models on your own GPU (or a
    rented one). You'd then need your own hosting (e.g. vLLM) — Groq
    can't serve a custom checkpoint.
  - **Together.ai / Fireworks.ai** — other inference providers that *do*
    offer hosted fine-tuning on open models, with an OpenAI-compatible API
    similar to Groq's, so the same `AiConfig`/`AiReportService` code would
    work with only a URL/model change.

- **Why it's probably unnecessary for Nexus HCM**: every feature above is a
  "summarize/generate from structured data" task. General-purpose models
  (Llama 3.3 70B, GPT-4o-mini, etc.) are already very good at this with
  good *prompting* — the same technique used in `buildPrompt()` /
  `buildManagerPrompt()`. Fine-tuning helps when you need a model to learn a
  very specific *style*, *format*, or *domain vocabulary* across thousands
  of examples — that's a later optimization, not a prerequisite.

## 3. Other "AI development" concepts worth knowing (and their relevance here)

| Concept | What it means | Relevant to Nexus HCM? |
|---|---|---|
| **Prompt engineering** | Carefully wording the system/user prompts (what we did in Steps 4 & 8) | ✅ Already in use — the main lever for quality |
| **RAG (Retrieval-Augmented Generation)** | Look up relevant documents (e.g. HR policy PDFs) and inject them into the prompt before asking the AI | ✅ Great fit for an "Ask HR Policy" feature — no fine-tuning needed |
| **Embeddings / vector search** | Convert text to numeric vectors for semantic search (e.g. "find similar job descriptions") | Possible future use for idea (I) or policy search, needs a vector store (pgvector, etc.) |
| **Function calling / structured output** | Ask the model to return strict JSON matching a schema, which your code then parses | Useful for idea (I) — "extract filters as JSON" — and for CV scoring (C) |
| **Fine-tuning** | Retraining model weights on custom examples | Not needed yet — see above |
| **Guardrails / prompt injection defense** | Validating/sanitizing AI output before using it (especially if it ever influences DB writes or UI rendering) | Important once AI output starts being *used* (not just displayed), e.g. CV scores or structured search filters |
| **Cost/rate-limit management** | Caching results, debouncing "Generate" buttons, tracking usage | Already partly handled (history table avoids re-generating; buttons disable while loading) |

## 4. Suggested roadmap order

1. **HR Assistant chatbot** (A) — reuses everything, highest visibility.
2. **AI Job Description Generator** (B) — quick, isolated, great demo.
3. **AI Resume/CV Screener** (C) — builds on the careers/CV upload feature
   already shipped.
4. **AI Performance Review Assistant** (D) — deepens the Performance module.
5. Everything else, as needed.

Fine-tuning and RAG/embeddings can be revisited once one or two of the above
are live and you have a concrete case where prompting alone isn't enough.
