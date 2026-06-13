# Step 2 — Configuration & Dependencies

## What we needed

To call OpenAI's Chat Completions API from Spring Boot, we need:

1. An HTTP client (`RestTemplate`).
2. Configuration values: the OpenAI API URL, model name, and an API key.
3. A safe way to provide the API key **without committing it to git**.

No new Maven dependencies were required — `spring-boot-starter-webmvc`
(already in `pom.xml`) provides `RestTemplate` and
`org.springframework.web.client.*`.

## 1. application.properties

We added a small block at the end of
`hcm-backend/src/main/resources/application.properties`:

```properties
# OpenAI integration (AI HR Report Generation)
# The key is read from the OPENAI_API_KEY environment variable and is never committed.
openai.api.key=${OPENAI_API_KEY:}
openai.api.url=https://api.openai.com/v1/chat/completions
openai.api.model=gpt-4o-mini
```

- `${OPENAI_API_KEY:}` means: "read the `OPENAI_API_KEY` environment
  variable; if it's not set, default to an empty string". This way the
  property file itself never contains a real secret.
- `.gitignore` already excludes `.env` files, so a local `.env` (loaded by
  your shell or IDE run configuration) is the recommended place to set
  `OPENAI_API_KEY` for development.

## 2. Setting the API key locally

**Windows PowerShell (current session only):**

```powershell
$env:OPENAI_API_KEY = "sk-...your-key..."
```

**Permanently (current user):**

```powershell
[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-...your-key...", "User")
```

Then restart the backend so Spring Boot picks up the new environment
variable.

If the key is missing, the feature does **not** crash the app — it returns a
friendly "AI not configured" error (see [Step 7](07-testing.md)).

## 3. AiConfig.java — the RestTemplate bean

`hcm-backend/src/main/java/com/adp/hcm/config/AiConfig.java`:

```java
package com.adp.hcm.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiConfig {

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        return new RestTemplate(factory);
    }
}
```

Why a dedicated config class?

- It registers `RestTemplate` as a Spring bean, so it can be `@Autowired`
  anywhere (here, into `AiReportService`).
- We set explicit connect/read timeouts (10s / 30s) — calling an external AI
  API can be slow, and we don't want a hanging request to block forever.

> **Note:** Spring Boot 4's auto-configured `RestTemplateBuilder` is not on
> the classpath with `spring-boot-starter-webmvc` in this project, so we
> build the `RestTemplate` directly with a `SimpleClientHttpRequestFactory`
> instead of `RestTemplateBuilder`.

Continue to [Step 3 — Data Aggregation](03-data-aggregation.md).
