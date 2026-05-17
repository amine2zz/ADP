import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../services/api.service';

interface JobOffer {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  publishedAt: string;
}

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="careers-page">
      <header class="careers-header">
        <div class="brand">
          <span class="adp-badge">ADP</span>
          <span class="brand-name">Nexus HCM · Careers</span>
        </div>
        <a href="/careers/track" class="track-link">Track my application →</a>
      </header>

      <section class="hero">
        <h1>Join our team</h1>
        <p>Explore open positions and apply directly. We'll keep you updated every step of the way.</p>
      </section>

      <div *ngIf="disabled" class="disabled-msg">
        <p>Our careers page is currently unavailable. Please check back later.</p>
      </div>

      <div *ngIf="!disabled && loading" class="loading">Loading positions…</div>

      <div *ngIf="!disabled && !loading" class="offers-container">
        <div *ngIf="offers.length === 0" class="no-offers">No open positions at the moment. Check back soon!</div>

        <div class="offers-grid">
          <div *ngFor="let o of offers" class="offer-card" (click)="openOffer(o)" [class.selected]="selectedOffer?.id === o.id">
            <div class="offer-dept">{{ o.department }}</div>
            <h3>{{ o.title }}</h3>
            <div class="offer-location">📍 {{ o.location }}</div>
            <p>{{ o.description | slice:0:150 }}{{ (o.description?.length ?? 0) > 150 ? '…' : '' }}</p>
            <button class="btn-apply">Apply Now</button>
          </div>
        </div>
      </div>

      <!-- Application Modal -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div *ngIf="!submitted">
            <h2>Apply for: {{ selectedOffer?.title }}</h2>
            <p class="apply-dept">{{ selectedOffer?.department }} · {{ selectedOffer?.location }}</p>
            <div class="form-col">
              <label>Full Name *
                <input [(ngModel)]="form.applicantName" placeholder="Your full name" />
              </label>
              <label>Email Address *
                <input type="email" [(ngModel)]="form.applicantEmail" placeholder="your@email.com" />
              </label>
              <label>Phone Number
                <input [(ngModel)]="form.applicantPhone" placeholder="+216 xx xxx xxx" />
              </label>
              <label>Cover Letter
                <textarea [(ngModel)]="form.coverLetter" rows="5" placeholder="Tell us about yourself and why you're a great fit…"></textarea>
              </label>
            </div>
            <div *ngIf="formError" class="form-error">{{ formError }}</div>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-submit" [disabled]="submitting" (click)="submit()">
                {{ submitting ? 'Submitting…' : 'Submit Application' }}
              </button>
            </div>
          </div>

          <div *ngIf="submitted" class="success-view">
            <div class="success-icon">✓</div>
            <h2>Application Received!</h2>
            <p>Your tracking token has been sent to <strong>{{ form.applicantEmail }}</strong>.</p>
            <p>You can use it to track your progress at any time.</p>
            <div class="token-box">{{ trackingToken }}</div>
            <a [href]="'/careers/track?token=' + trackingToken" class="btn-track">Track my application →</a>
            <button class="btn-cancel" style="margin-top:0.75rem" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .careers-page { min-height: 100vh; background: #f8fafc; font-family: inherit; }

    .careers-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white; border-bottom: 1px solid #e2e8f0; }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .adp-badge { background: #cc0000; color: white; font-weight: 900; padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.9rem; }
    .brand-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .track-link { color: #cc0000; font-size: 0.85rem; font-weight: 600; text-decoration: none; }

    .hero { text-align: center; padding: 4rem 2rem 2rem; }
    .hero h1 { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin: 0 0 0.75rem; }
    .hero p { color: #64748b; font-size: 1.05rem; }

    .disabled-msg { text-align: center; padding: 4rem; color: #94a3b8; }
    .loading { text-align: center; padding: 3rem; color: #64748b; }
    .offers-container { max-width: 1100px; margin: 0 auto; padding: 1.5rem 2rem 4rem; }
    .no-offers { text-align: center; color: #94a3b8; padding: 3rem; }

    .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .offer-card { background: white; border-radius: 14px; padding: 1.5rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
    .offer-card:hover, .offer-card.selected { border-color: #cc0000; box-shadow: 0 4px 20px rgba(204,0,0,0.1); }
    .offer-dept { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #cc0000; margin-bottom: 0.5rem; }
    .offer-card h3 { margin: 0 0 0.35rem; font-size: 1.1rem; color: #1e293b; }
    .offer-location { font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem; }
    .offer-card p { font-size: 0.875rem; color: #475569; margin: 0 0 1rem; line-height: 1.5; }
    .btn-apply { background: #cc0000; color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 7px; font-weight: 700; cursor: pointer; font-size: 0.875rem; width: 100%; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: white; border-radius: 16px; padding: 2rem; width: 540px; max-width: 100%; max-height: 90vh; overflow-y: auto; }
    .modal h2 { margin: 0 0 0.25rem; font-size: 1.2rem; color: #1e293b; }
    .apply-dept { font-size: 0.82rem; color: #64748b; margin-bottom: 1.25rem; }

    .form-col { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-col label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: #374151; }
    .form-col input, .form-col textarea { padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 7px; font-size: 0.875rem; }
    .form-col input:focus, .form-col textarea:focus { outline: none; border-color: #cc0000; box-shadow: 0 0 0 2px rgba(204,0,0,0.1); }

    .form-error { color: #dc2626; font-size: 0.82rem; margin-top: 0.5rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }
    .btn-submit { background: #cc0000; color: white; border: none; padding: 0.55rem 1.5rem; border-radius: 7px; font-weight: 700; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel { background: #f1f5f9; color: #374151; border: 1px solid #e2e8f0; padding: 0.55rem 1.25rem; border-radius: 7px; font-weight: 600; cursor: pointer; display: block; width: 100%; }

    .success-view { text-align: center; padding: 1rem 0; }
    .success-icon { width: 56px; height: 56px; background: #dcfce7; color: #15803d; font-size: 1.5rem; font-weight: 900; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .success-view h2 { color: #15803d; margin: 0 0 0.5rem; }
    .success-view p { color: #475569; font-size: 0.9rem; margin: 0.25rem 0; }
    .token-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85rem; color: #475569; margin: 1rem 0; word-break: break-all; }
    .btn-track { display: inline-block; background: #cc0000; color: white; padding: 0.55rem 1.5rem; border-radius: 7px; font-weight: 700; text-decoration: none; font-size: 0.875rem; }
  `]
})
export class CareersComponent implements OnInit {
  offers: JobOffer[] = [];
  loading = true;
  disabled = false;
  selectedOffer: JobOffer | null = null;
  showModal = false;
  submitted = false;
  submitting = false;
  trackingToken = '';
  formError = '';

  form = { applicantName: '', applicantEmail: '', applicantPhone: '', coverLetter: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<JobOffer[]>(`${API_BASE}/careers/offers`).subscribe({
      next: (data) => { this.offers = data; this.loading = false; },
      error: (e) => {
        if (e.status === 403) this.disabled = true;
        this.loading = false;
      }
    });
  }

  openOffer(o: JobOffer) {
    this.selectedOffer = o;
    this.submitted = false;
    this.formError = '';
    this.form = { applicantName: '', applicantEmail: '', applicantPhone: '', coverLetter: '' };
    this.showModal = true;
  }

  submit() {
    if (!this.form.applicantName.trim()) { this.formError = 'Full name is required.'; return; }
    if (!this.form.applicantEmail.trim()) { this.formError = 'Email is required.'; return; }
    this.formError = '';
    this.submitting = true;
    this.http.post<any>(`${API_BASE}/careers/offers/${this.selectedOffer!.id}/apply`, this.form).subscribe({
      next: (res) => {
        this.trackingToken = res.trackingToken;
        this.submitted = true;
        this.submitting = false;
      },
      error: (e) => {
        this.formError = e?.error?.details ?? 'Submission failed. Please try again.';
        this.submitting = false;
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.selectedOffer = null;
  }
}
