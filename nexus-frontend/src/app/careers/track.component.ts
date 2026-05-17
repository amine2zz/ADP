import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../services/api.service';

interface StepResult {
  stepIndex: number;
  stepLabel: string;
  result: string;
  notes: string;
}

interface Application {
  id: number;
  applicantName: string;
  applicantEmail: string;
  status: string;
  currentStepIndex: number;
  submittedAt: string;
  stepResults: StepResult[];
  jobOffer: { title: string; department: string };
}

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="track-page">
      <header class="track-header">
        <div class="brand">
          <span class="adp-badge">ADP</span>
          <span class="brand-name">Nexus HCM · Application Tracker</span>
        </div>
        <a href="/careers" class="back-link">← Browse positions</a>
      </header>

      <div class="track-container">
        <div *ngIf="!application && !error" class="token-form">
          <h2>Track your application</h2>
          <p>Enter the tracking token that was sent to your email after you applied.</p>
          <div class="input-row">
            <input [(ngModel)]="tokenInput" placeholder="Paste your tracking token here…" (keyup.enter)="lookup()" />
            <button class="btn-lookup" (click)="lookup()" [disabled]="loading">
              {{ loading ? 'Looking up…' : 'Track' }}
            </button>
          </div>
          <div *ngIf="error" class="error-msg">{{ error }}</div>
        </div>

        <div *ngIf="application" class="app-view">
          <div class="app-hero">
            <div class="status-icon" [class]="'si-' + application.status.toLowerCase()">
              <span *ngIf="application.status === 'HIRED'">🎉</span>
              <span *ngIf="application.status === 'REJECTED'">✕</span>
              <span *ngIf="application.status === 'PENDING' || application.status === 'IN_PROGRESS'">⏳</span>
            </div>
            <div>
              <h2>{{ application.applicantName }}</h2>
              <p class="position">{{ application.jobOffer?.title }} · {{ application.jobOffer?.department }}</p>
              <span class="status-badge" [class]="'s-' + application.status.toLowerCase()">{{ application.status | titlecase }}</span>
            </div>
          </div>

          <div *ngIf="application.status === 'HIRED'" class="hired-banner">
            Congratulations! You have been hired. Your onboarding team will be in touch shortly.
          </div>
          <div *ngIf="application.status === 'REJECTED'" class="rejected-banner">
            We appreciate your interest. Unfortunately, your application was not selected at this time.
          </div>

          <div class="timeline">
            <h3>Pipeline Progress</h3>
            <div class="step-list">
              <div *ngFor="let r of application.stepResults; let i = index" class="step-item" [class]="'step-' + r.result.toLowerCase()">
                <div class="step-dot"></div>
                <div class="step-body">
                  <div class="step-name">{{ r.stepLabel }}</div>
                  <div class="step-result">{{ r.result | titlecase }}</div>
                  <div *ngIf="r.notes" class="step-notes">{{ r.notes }}</div>
                </div>
              </div>
              <div *ngIf="!application.stepResults?.length" class="no-steps">
                Your application is under review. No steps have been evaluated yet.
              </div>
            </div>
          </div>

          <button class="btn-new" (click)="reset()">Track a different application</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .track-page { min-height: 100vh; background: #f8fafc; }
    .track-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white; border-bottom: 1px solid #e2e8f0; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .adp-badge { background: #cc0000; color: white; font-weight: 900; padding: 0.25rem 0.5rem; border-radius: 5px; }
    .brand-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .back-link { color: #cc0000; font-size: 0.85rem; font-weight: 600; text-decoration: none; }

    .track-container { max-width: 640px; margin: 0 auto; padding: 4rem 1.5rem; }

    .token-form { background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
    .token-form h2 { margin: 0 0 0.5rem; font-size: 1.4rem; color: #1e293b; }
    .token-form p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .input-row { display: flex; gap: 0.5rem; }
    .input-row input { flex: 1; padding: 0.6rem 0.875rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.875rem; }
    .input-row input:focus { outline: none; border-color: #cc0000; }
    .btn-lookup { background: #cc0000; color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-lookup:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-msg { color: #dc2626; font-size: 0.82rem; margin-top: 0.75rem; }

    .app-view { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 1px 8px rgba(0,0,0,0.08); }
    .app-hero { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; }
    .status-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .si-hired { background: #dcfce7; }
    .si-rejected { background: #fee2e2; }
    .si-pending, .si-in_progress { background: #fef3c7; }
    .app-hero h2 { margin: 0 0 0.2rem; font-size: 1.15rem; color: #1e293b; }
    .position { margin: 0 0 0.4rem; font-size: 0.82rem; color: #64748b; }

    .status-badge { padding: 0.2rem 0.65rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .s-pending { background: #fef9c3; color: #a16207; }
    .s-in_progress { background: #dbeafe; color: #1d4ed8; }
    .s-hired { background: #dcfce7; color: #15803d; }
    .s-rejected { background: #fee2e2; color: #dc2626; }

    .hired-banner { background: #dcfce7; border: 1px solid #bbf7d0; color: #15803d; border-radius: 8px; padding: 0.875rem 1rem; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.25rem; }
    .rejected-banner { background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; border-radius: 8px; padding: 0.875rem 1rem; font-size: 0.875rem; margin-bottom: 1.25rem; }

    .timeline h3 { font-size: 0.9rem; font-weight: 700; color: #374151; margin-bottom: 1rem; }
    .step-list { display: flex; flex-direction: column; gap: 0; padding-left: 1rem; border-left: 2px solid #e2e8f0; }
    .step-item { position: relative; padding: 0 0 1.25rem 1.25rem; }
    .step-dot { position: absolute; left: -9px; top: 3px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; }
    .step-pass .step-dot { background: #15803d; }
    .step-fail .step-dot { background: #dc2626; }
    .step-pending .step-dot { background: #d1d5db; }
    .step-name { font-weight: 600; font-size: 0.875rem; color: #1e293b; }
    .step-result { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.15rem; }
    .step-pass .step-result { color: #15803d; }
    .step-fail .step-result { color: #dc2626; }
    .step-pending .step-result { color: #64748b; }
    .step-notes { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }
    .no-steps { font-size: 0.875rem; color: #94a3b8; font-style: italic; }

    .btn-new { margin-top: 1.5rem; background: none; border: 1px solid #e2e8f0; color: #64748b; padding: 0.5rem 1rem; border-radius: 7px; font-size: 0.82rem; cursor: pointer; }
  `]
})
export class TrackComponent implements OnInit {
  tokenInput = '';
  loading = false;
  error = '';
  application: Application | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) { this.tokenInput = token; this.lookup(); }
  }

  lookup() {
    if (!this.tokenInput.trim()) { this.error = 'Please enter your tracking token.'; return; }
    this.loading = true;
    this.error = '';
    this.http.get<Application>(`${API_BASE}/careers/track?token=${encodeURIComponent(this.tokenInput.trim())}`).subscribe({
      next: (app) => { this.application = app; this.loading = false; },
      error: () => { this.error = 'No application found for this token. Please check and try again.'; this.loading = false; }
    });
  }

  reset() {
    this.application = null;
    this.tokenInput = '';
    this.error = '';
  }
}
