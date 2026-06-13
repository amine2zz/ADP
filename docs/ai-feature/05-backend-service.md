# Step 5 — Backend Service & Controller

## `callOpenAi()` — calling the OpenAI Chat Completions API

`hcm-backend/src/main/java/com/adp/hcm/service/AiReportService.java`:

```java
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
```

Key points:

- **`temperature: 0.4`** — moderately low, so reports are factual and
  consistent rather than creative/random each time.
- **System message** sets the AI's role once: "HR analytics assistant ...
  concise, factual executive summaries". Combined with the per-request user
  prompt (Step 4), this keeps responses on-topic.
- **`headers.setBearerAuth(apiKey)`** — OpenAI authenticates via
  `Authorization: Bearer <key>`.
- Errors from the HTTP call are wrapped in a `RestClientException` with
  context, so the controller (below) can turn them into a clean HTTP 502.

## `generateHrReport()` — orchestrating the three steps

```java
public Map<String, Object> generateHrReport() {
    if (apiKey == null || apiKey.isBlank()) {
        throw new IllegalStateException(
            "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable and restart the backend.");
    }

    Map<String, Object> stats = collectWorkforceStats();
    String prompt = buildPrompt(stats);
    String reportText = callOpenAi(prompt);

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("report", reportText);
    result.put("stats", stats);
    result.put("generatedAt", LocalDateTime.now().toString());
    return result;
}
```

This is the single public entry point: aggregate → format → call AI →
return everything the frontend needs (the report text, the raw stats it was
based on, and a timestamp).

## `AiController` — the REST endpoint

`hcm-backend/src/main/java/com/adp/hcm/controller/AiController.java`:

```java
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:4200")
public class AiController {

    @Autowired private AiReportService aiReportService;

    @PostMapping("/hr-report")
    public ResponseEntity<?> generateHrReport() {
        try {
            return ResponseEntity.ok(aiReportService.generateHrReport());
        } catch (IllegalStateException ex) {
            // AI not configured (no API key) - not a server error, just unavailable.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", ex.getMessage()));
        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", ex.getMessage()));
        }
    }
}
```

- **`POST /api/ai/hr-report`** — a POST because it triggers an action
  (an external API call with a cost), not a cacheable GET.
- **`@CrossOrigin(origins = "http://localhost:4200")`** — matches the
  pattern used by other controllers (e.g. `HRController`) for the Angular
  dev server.
- **Two distinct error responses**:
  - `503 Service Unavailable` — the feature isn't configured (no API key).
    This is an expected, recoverable state, not a bug.
  - `502 Bad Gateway` — the call to OpenAI itself failed (network issue,
    rate limit, invalid key, etc.).

Continue to [Step 6 — Frontend Integration](06-frontend-integration.md).
