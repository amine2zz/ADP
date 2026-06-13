# Step 6 — Frontend Integration

All changes are in
`nexus-frontend/src/app/dashboard/dashboard.component.ts` (this component
uses an inline template/styles, so both the HTML and the TypeScript logic
live in the same file).

## 1. New component state

```typescript
// AI HR Report
aiReport: any = null;
aiReportLoading = false;
aiReportError: string | null = null;
```

- `aiReport` — holds `{ report, stats, generatedAt }` once the API responds.
- `aiReportLoading` — drives the button's disabled state and label.
- `aiReportError` — holds a user-friendly error message if the call fails.

## 2. Calling the backend

```typescript
generateAiReport() {
  this.aiReportLoading = true;
  this.aiReportError = null;
  this.aiReport = null;
  this.http.post<any>('http://localhost:8085/api/ai/hr-report', {}).subscribe({
    next: (data) => {
      this.aiReport = data;
      this.aiReportLoading = false;
    },
    error: (err) => {
      this.aiReportError = err?.error?.error || 'Failed to generate the AI report. Please try again.';
      this.aiReportLoading = false;
    }
  });
}
```

- Follows the same `HttpClient` + `subscribe({ next, error })` pattern as
  `fetchMetrics()` elsewhere in the component.
- `err?.error?.error` reads the JSON body's `"error"` field that
  `AiController` returns on 503/502 responses (e.g. "OpenAI API key is not
  configured...") and shows it directly to the admin.

## 3. The UI card (added to the "System Overview" tab)

```html
<div class="card" style="margin-top: 2rem; padding: 1.5rem;">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
    <div>
      <h3 style="color: var(--adp-charcoal); margin: 0 0 0.25rem 0;">🤖 AI HR Report</h3>
      <p style="color: var(--adp-dark-gray); font-size: 0.85rem; margin: 0;">Generate an AI-written executive summary from the latest workforce data.</p>
    </div>
    <button class="btn-primary" [disabled]="aiReportLoading" (click)="generateAiReport()">
      {{ aiReportLoading ? 'Generating...' : 'Generate AI HR Report' }}
    </button>
  </div>

  <div *ngIf="aiReportError" style="margin-top: 1rem; padding: 0.75rem 1rem; background: #fdecea; border: 1px solid #f5c6cb; border-radius: 6px; color: #b71c1c; font-size: 0.85rem;">
    {{ aiReportError }}
  </div>

  <div *ngIf="aiReport" style="margin-top: 1rem; padding: 1rem 1.25rem; background: #f8f9fa; border-left: 4px solid var(--adp-red); border-radius: 6px;">
    <p style="white-space: pre-line; line-height: 1.6; margin: 0;">{{ aiReport.report }}</p>
    <p style="margin: 0.75rem 0 0 0; font-size: 0.7rem; color: var(--adp-dark-gray);">Generated {{ aiReport.generatedAt | date:'medium' }}</p>
  </div>
</div>
```

Placement: directly below the "Department Composition" / "Leave Request
Analysis" charts in the **System Overview** tab, so it reads naturally as
"here are the numbers, here's the AI's take on them".

Three states, one card:

1. **Idle** — just the button.
2. **Error** (`aiReportError`) — red banner with the backend's message
   (e.g. "AI not configured").
3. **Success** (`aiReport`) — the generated text plus a timestamp.

`white-space: pre-line` preserves the line breaks the model may produce
while still wrapping long lines — appropriate since we asked for plain text,
no markdown.

Continue to [Step 7 — Testing & Error Handling](07-testing.md).
