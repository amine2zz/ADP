# Step 7 — Testing & Error Handling

## 1. Verify the backend compiles and starts

```bash
cd hcm-backend
./mvnw -q compile      # confirm no compile errors
./mvnw spring-boot:run # start the backend on port 8085
```

## 2. Test without an API key (expected failure path)

With `OPENAI_API_KEY` unset, click **"Generate AI HR Report"** on the
dashboard, or call the endpoint directly:

```bash
curl -X POST http://localhost:8085/api/ai/hr-report
```

Expected response: **HTTP 503**

```json
{ "error": "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable and restart the backend." }
```

On the dashboard, this message appears in the red error banner. This
confirms the feature **fails gracefully** instead of crashing or hanging
when not configured — important since the key is a secret that won't exist
in every environment (e.g. a teammate's machine, CI).

## 3. Test with a valid API key (happy path)

```powershell
$env:OPENAI_API_KEY = "sk-...your-real-key..."
```

Restart the backend, then click **"Generate AI HR Report"**. Expected:

- Button shows "Generating..." and is disabled during the call.
- A card appears with a 4-6 sentence executive summary referencing real
  numbers from your database (headcount, leave approval rate, etc.).
- A "Generated <date/time>" timestamp appears below the text.

## 4. Test the OpenAI failure path

To simulate an OpenAI-side failure (invalid key, rate limit, network issue),
temporarily set `OPENAI_API_KEY` to an invalid value (e.g. `sk-invalid`) and
click the button again.

Expected response: **HTTP 502**

```json
{ "error": "Failed to reach OpenAI API: 401 Unauthorized: ..." }
```

The dashboard shows this in the error banner rather than a blank/broken UI.

## 5. Sanity-check the data being sent

Because `collectWorkforceStats()` is a separate method, you can temporarily
log its output (or call it from a test) to confirm the numbers match what's
shown elsewhere on the dashboard (KPI cards, department composition chart)
before trusting the AI's interpretation of them.

## Error-handling summary

| Scenario | HTTP status | User sees |
|----------|-------------|-----------|
| `OPENAI_API_KEY` not set | 503 Service Unavailable | "OpenAI API key is not configured..." |
| OpenAI API call fails (bad key, network, rate limit) | 502 Bad Gateway | "Failed to reach OpenAI API: ..." |
| Success | 200 OK | Executive summary + stats + timestamp |

## Security considerations

- The API key **never** appears in source code, `application.properties`
  (only the placeholder `${OPENAI_API_KEY:}`), git history, or the frontend
  — it only exists as a local environment variable on the machine running
  the backend.
- The backend, not the frontend, calls OpenAI — the browser never sees the
  API key.
- No employee PII (names, emails, etc.) is sent to OpenAI — only aggregated
  counts and percentages (see [Step 3](03-data-aggregation.md)).

## Recap of all steps

1. [Overview](01-overview.md) — goal & architecture
2. [Configuration & Dependencies](02-config-and-dependencies.md) — API key, `RestTemplate` bean
3. [Data Aggregation](03-data-aggregation.md) — `collectWorkforceStats()`
4. [Prompt Design](04-prompt-design.md) — `buildPrompt()`
5. [Backend Service & Controller](05-backend-service.md) — `callOpenAi()`, `AiController`
6. [Frontend Integration](06-frontend-integration.md) — Angular button + result card
7. **Testing & Error Handling** (this file)
