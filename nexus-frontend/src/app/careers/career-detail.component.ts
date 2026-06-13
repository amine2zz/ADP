import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { timeout } from 'rxjs/operators';
import { SystemConfigService } from '../services/system-config.service';

const API = 'http://localhost:8085/api';

@Component({
  selector: 'app-career-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterLink],
  template: `
    <div class="detail-page">

      <!-- Header -->
      <header class="det-header">
        <a routerLink="/careers" class="back-link">← All Positions</a>
        <div class="logo-group">
          <a routerLink="/login" class="back-home">
            <img *ngIf="logoImgUrl" [src]="logoImgUrl" style="height:26px;border-radius:4px;" alt="logo">
            <div *ngIf="!logoImgUrl" class="logo-badge" [style.background]="logoBg">{{ logoText }}</div>
            <span class="company-name">{{ companyName }}</span>
          </a>
          <button class="logo-refresh-btn" [class.spinning]="refreshingConfig"
                  title="Refresh branding & settings" (click)="refreshConfig()">↻</button>
        </div>
        <a routerLink="/login" class="hdr-link">Sign In</a>
      </header>

      <!-- Loading state -->
      <div *ngIf="loading" class="center-state">
        <div class="spinner"></div>
        <p>Loading position...</p>
      </div>

      <!-- Not found -->
      <div *ngIf="!loading && notFound" class="center-state">
        <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
        <h3>Position not found</h3>
        <p style="margin-bottom:1.5rem;">This position may have been closed or removed.</p>
        <a routerLink="/careers" class="btn-back-full">← Browse All Positions</a>
      </div>

      <!-- Position content -->
      <div *ngIf="!loading && position" class="det-body">

        <!-- Hero strip -->
        <div class="pos-hero">
          <div class="pos-hero-inner">
            <div class="pos-badges">
              <span class="pos-dept">{{ position.department || 'General' }}</span>
              <span class="pos-type" [ngClass]="typeClass(position.jobType)">{{ typeLabel(position.jobType) }}</span>
              <span *ngIf="position.status === 'OPEN'" class="pos-live">● Live</span>
            </div>
            <h1>{{ position.title }}</h1>
            <div class="pos-chips">
              <span *ngIf="position.location">📍 {{ position.location }}</span>
              <span *ngIf="position.salaryMin || position.salaryMax">
                💰 {{ position.salaryMin | number:'1.0-0' }}{{ position.salaryMax ? ' – ' + (position.salaryMax | number:'1.0-0') : '+' }} TND
              </span>
              <span *ngIf="position.hiringManager">
                👤 {{ position.hiringManager.firstName }} {{ position.hiringManager.lastName }}
              </span>
              <span *ngIf="position.closingDate" [class.closing-soon]="isClosingSoon(position.closingDate)">
                📅 Closes {{ position.closingDate }}{{ isClosingSoon(position.closingDate) ? ' (soon!)' : '' }}
              </span>
              <span *ngIf="position.postedDate" class="posted-chip">
                🗓 Posted {{ position.postedDate }}
              </span>
            </div>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="det-columns">

          <!-- LEFT: Description + Requirements -->
          <div class="det-left">
            <div class="det-section" *ngIf="position.description">
              <h2>About the Role</h2>
              <p style="white-space:pre-line;">{{ position.description }}</p>
            </div>

            <div class="det-section" *ngIf="position.requirements">
              <h2>Requirements</h2>
              <p style="white-space:pre-line;">{{ position.requirements }}</p>
            </div>

            <div class="det-meta-grid" *ngIf="position.department || position.location || position.jobType">
              <div class="dmg-item" *ngIf="position.department">
                <span class="dmg-k">Department</span>
                <span class="dmg-v">{{ position.department }}</span>
              </div>
              <div class="dmg-item" *ngIf="position.location">
                <span class="dmg-k">Location</span>
                <span class="dmg-v">{{ position.location }}</span>
              </div>
              <div class="dmg-item" *ngIf="position.jobType">
                <span class="dmg-k">Contract Type</span>
                <span class="dmg-v">{{ typeLabel(position.jobType) }}</span>
              </div>
              <div class="dmg-item" *ngIf="position.salaryMin || position.salaryMax">
                <span class="dmg-k">Salary Range</span>
                <span class="dmg-v">{{ position.salaryMin | number:'1.0-0' }}{{ position.salaryMax ? ' – ' + (position.salaryMax | number:'1.0-0') : '+' }} TND/month</span>
              </div>
            </div>
          </div>

          <!-- RIGHT: Apply Form -->
          <div class="det-right">
            <!-- Success state -->
            <div *ngIf="applied" class="apply-success">
              <div class="success-icon">🎉</div>
              <h3>Application Sent!</h3>
              <p>Thank you, <strong>{{ applyForm.applicantName }}</strong>! We've received your application for <strong>{{ position.title }}</strong> and will review it shortly.</p>
              <a routerLink="/careers" class="btn-browse-more">Browse More Positions</a>
            </div>

            <!-- Apply Form -->
            <div *ngIf="!applied" class="apply-card">
              <div class="apply-card-header">
                <h3>Apply for this Position</h3>
                <p>Fill out the form below and we'll be in touch.</p>
              </div>

              <div class="af-field">
                <label>Full Name <span class="req">*</span></label>
                <input type="text" [(ngModel)]="applyForm.applicantName" placeholder="Your full name"
                       [class.invalid]="touched && !applyForm.applicantName.trim()">
              </div>

              <div class="af-field">
                <label>Email Address <span class="req">*</span></label>
                <input type="email" [(ngModel)]="applyForm.applicantEmail" placeholder="you@example.com"
                       [class.invalid]="touched && !isValidEmail(applyForm.applicantEmail)">
              </div>

              <div class="af-field">
                <label>Phone <span class="opt">(optional)</span></label>
                <input type="tel" [(ngModel)]="applyForm.phone" placeholder="+216 XX XXX XXX">
              </div>

              <div class="af-field">
                <label>Cover Letter <span class="opt">(optional)</span></label>
                <textarea [(ngModel)]="applyForm.coverLetter" rows="5"
                          placeholder="Tell us why you're a great fit for this role..."></textarea>
              </div>

              <!-- CV Upload -->
              <div class="af-field">
                <label>Attach CV / Resume <span class="opt">(PDF, DOC, DOCX)</span></label>
                <div class="cv-upload-area" [class.has-file]="cvFileName" (click)="cvInput.click()">
                  <input #cvInput type="file" accept=".pdf,.doc,.docx" style="display:none"
                         (change)="onCvChange($event)">
                  <div *ngIf="!cvFileName" class="cv-placeholder">
                    <span class="cv-icon">📎</span>
                    <span>Click to attach your CV</span>
                    <span class="cv-hint">PDF, DOC or DOCX · max 5 MB</span>
                  </div>
                  <div *ngIf="cvFileName" class="cv-selected">
                    <span class="cv-icon">📄</span>
                    <span class="cv-name">{{ cvFileName }}</span>
                    <button class="cv-remove" (click)="removeCV($event)">✕</button>
                  </div>
                </div>
                <div *ngIf="cvError" class="cv-err">{{ cvError }}</div>
              </div>

              <div *ngIf="applyError" class="apply-err-bar">⚠ {{ applyError }}</div>

              <button class="btn-submit" (click)="submit()" [disabled]="applying">
                <span *ngIf="!applying">🚀 Submit Application</span>
                <span *ngIf="applying" class="submitting">
                  <span class="dot-spin"></span> Submitting...
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer class="det-footer">
        <p>© {{ year }} {{ companyName }} · <a routerLink="/login">Sign In</a></p>
      </footer>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .detail-page { min-height: 100vh; background: #f8fafc; font-family: 'Inter', system-ui, sans-serif; color: #1e293b; display: flex; flex-direction: column; }

    /* ── Header ── */
    .det-header {
      background: white; border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem; height: 58px; display: flex; align-items: center;
      justify-content: space-between; position: sticky; top: 0; z-index: 100;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    }
    .back-link { color: #64748b; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: color 0.15s; }
    .back-link:hover { color: #ef4444; }
    .back-home { display: flex; align-items: center; gap: 0.65rem; text-decoration: none; }
    .logo-group { display: flex; align-items: center; gap: 0.4rem; }
    .logo-badge { color: white; font-weight: 900; font-size: 0.9rem; padding: 0.22rem 0.55rem; border-radius: 5px; }
    .company-name { font-weight: 700; font-size: 1rem; color: #1e293b; }
    .logo-refresh-btn {
      background: none; border: none; cursor: pointer; padding: 0.2rem;
      font-size: 0.95rem; line-height: 1; color: #94a3b8;
      border-radius: 6px; transition: color 0.2s, background 0.2s;
    }
    .logo-refresh-btn:hover { color: #ef4444; background: #fef2f2; }
    .logo-refresh-btn.spinning { animation: logo-spin 0.7s linear infinite; }
    @keyframes logo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .hdr-link { color: #ef4444; font-weight: 600; font-size: 0.85rem; text-decoration: none; padding: 0.4rem 0.85rem; border: 1.5px solid #fca5a5; border-radius: 6px; transition: all 0.2s; }
    .hdr-link:hover { background: #fef2f2; }

    /* ── Hero strip ── */
    .pos-hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
      padding: 2.5rem 2rem 2rem;
    }
    .pos-hero-inner { max-width: 1100px; margin: 0 auto; }
    .pos-badges { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.85rem; flex-wrap: wrap; }
    .pos-dept { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8); font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .pos-type { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase; }
    .type-full  { background: #dcfce7; color: #166534; }
    .type-part  { background: #dbeafe; color: #1e40af; }
    .type-cont  { background: #fef3c7; color: #92400e; }
    .type-intern{ background: #f3e8ff; color: #6b21a8; }
    .pos-live { background: rgba(34,197,94,0.15); color: #86efac; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; border: 1px solid rgba(34,197,94,0.25); }
    .pos-hero-inner h1 { color: white; font-size: 2rem; font-weight: 900; margin: 0 0 1rem; line-height: 1.2; }
    .pos-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pos-chips span { font-size: 0.75rem; color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.08); padding: 0.25rem 0.65rem; border-radius: 6px; white-space: nowrap; }
    .closing-soon { color: #fca5a5 !important; background: rgba(239,68,68,0.15) !important; }
    .posted-chip { color: rgba(255,255,255,0.4) !important; }

    /* ── Two columns ── */
    .det-body { flex: 1; }
    .det-columns { max-width: 1100px; margin: 0 auto; padding: 2rem; display: grid; grid-template-columns: 1fr 400px; gap: 2rem; align-items: start; }

    /* LEFT */
    .det-left { display: flex; flex-direction: column; gap: 1.75rem; }
    .det-section { background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 1.5rem 1.75rem; }
    .det-section h2 { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 0 0 1rem; }
    .det-section p { font-size: 0.9rem; color: #475569; line-height: 1.7; margin: 0; }
    .det-meta-grid { background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 1.25rem 1.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .dmg-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .dmg-k { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    .dmg-v { font-size: 0.88rem; font-weight: 600; color: #1e293b; }

    /* RIGHT — Apply card */
    .det-right { position: sticky; top: 74px; }

    .apply-card {
      background: white; border-radius: 14px; border: 1.5px solid #e2e8f0;
      padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .apply-card-header { margin-bottom: 0.25rem; }
    .apply-card-header h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0 0 0.2rem; }
    .apply-card-header p { font-size: 0.78rem; color: #94a3b8; margin: 0; }

    .af-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .af-field label { font-size: 0.72rem; font-weight: 700; color: #475569; }
    .af-field .req { color: #ef4444; }
    .af-field .opt { color: #94a3b8; font-weight: 400; }
    .af-field input, .af-field textarea {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.88rem; font-family: inherit; outline: none; transition: border-color 0.15s;
      background: #fafafa; resize: vertical; color: #1e293b;
    }
    .af-field input:focus, .af-field textarea:focus { border-color: #ef4444; background: white; }
    .af-field input.invalid { border-color: #ef4444; background: #fff8f8; }

    /* CV Upload */
    .cv-upload-area {
      border: 2px dashed #e2e8f0; border-radius: 8px; padding: 1rem;
      cursor: pointer; transition: all 0.2s; background: #fafafa;
      display: flex; align-items: center; justify-content: center;
    }
    .cv-upload-area:hover { border-color: #ef4444; background: #fff8f8; }
    .cv-upload-area.has-file { border-style: solid; border-color: #bbf7d0; background: #f0fdf4; }
    .cv-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
    .cv-icon { font-size: 1.5rem; }
    .cv-placeholder span:nth-child(2) { font-size: 0.82rem; font-weight: 600; color: #475569; }
    .cv-hint { font-size: 0.68rem; color: #94a3b8; }
    .cv-selected { display: flex; align-items: center; gap: 0.6rem; width: 100%; }
    .cv-name { font-size: 0.82rem; font-weight: 600; color: #166534; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cv-remove { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem; padding: 0.1rem 0.2rem; border-radius: 3px; transition: color 0.15s; }
    .cv-remove:hover { color: #ef4444; }
    .cv-err { font-size: 0.72rem; color: #dc2626; font-weight: 600; }

    .apply-err-bar { background: #fef2f2; border: 1px solid #fecaca; border-radius: 7px; padding: 0.6rem 0.85rem; font-size: 0.8rem; color: #dc2626; font-weight: 600; }

    .btn-submit {
      width: 100%; padding: 0.8rem; background: #ef4444; color: white;
      border: none; border-radius: 8px; font-weight: 800; font-size: 0.95rem;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }
    .btn-submit:hover:not(:disabled) { background: #dc2626; box-shadow: 0 4px 14px rgba(239,68,68,0.35); transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
    .submitting { display: flex; align-items: center; gap: 0.5rem; }
    .dot-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Success state */
    .apply-success {
      background: white; border-radius: 14px; border: 1.5px solid #bbf7d0;
      padding: 2rem 1.5rem; text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .success-icon { font-size: 2.75rem; margin-bottom: 0.75rem; }
    .apply-success h3 { font-size: 1.15rem; font-weight: 800; color: #166534; margin: 0 0 0.5rem; }
    .apply-success p { font-size: 0.85rem; color: #15803d; line-height: 1.55; margin: 0 0 1.25rem; }
    .btn-browse-more { display: inline-block; padding: 0.55rem 1.25rem; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 0.82rem; font-weight: 700; text-decoration: none; transition: all 0.15s; }
    .btn-browse-more:hover { background: #bbf7d0; }

    /* Center states */
    .center-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; text-align: center; }
    .center-state h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
    .center-state p { font-size: 0.88rem; }
    .spinner { width: 34px; height: 34px; border: 3px solid #e2e8f0; border-top-color: #ef4444; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
    .btn-back-full { display: inline-block; padding: 0.6rem 1.5rem; background: #ef4444; color: white; border-radius: 7px; font-weight: 700; font-size: 0.88rem; text-decoration: none; }

    /* Footer */
    .det-footer { background: #1e293b; color: rgba(255,255,255,0.4); text-align: center; padding: 1.1rem; font-size: 0.75rem; }
    .det-footer a { color: #fca5a5; text-decoration: none; }

    @media (max-width: 860px) {
      .det-columns { grid-template-columns: 1fr; }
      .det-right { position: static; }
      .pos-hero-inner h1 { font-size: 1.55rem; }
    }
  `]
})
export class CareerDetailComponent implements OnInit {
  position: any = null;
  loading = true;
  notFound = false;
  applying = false;
  applied = false;
  touched = false;
  applyError = '';
  cvFileName = '';
  cvBase64 = '';
  cvError = '';
  year = new Date().getFullYear();

  applyForm = { applicantName: '', applicantEmail: '', phone: '', coverLetter: '' };

  refreshingConfig = false;

  refreshConfig() {
    if (this.refreshingConfig) return;
    this.refreshingConfig = true;
    this.configSvc.load(this.http)
      .finally(() => setTimeout(() => this.refreshingConfig = false, 400));
  }

  get logoText()    { return this.configSvc.get('theme.logo_text', 'ADP'); }
  get logoBg()      { return this.configSvc.get('theme.logo_bg', '#D0271D'); }
  get logoImgUrl()  { return this.configSvc.get('theme.logo_image_url', ''); }
  get companyName() { return this.configSvc.get('general.company_name', 'Nexus HCM'); }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private configSvc: SystemConfigService
  ) {}

  ngOnInit() {
    this.configSvc.load(this.http);
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any>(`${API}/jobs/${id}`).subscribe({
      next: (pos) => { this.position = pos; this.loading = false; },
      error: () => { this.loading = false; this.notFound = true; }
    });
  }

  onCvChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      this.cvError = 'File is too large (max 5 MB).';
      input.value = '';
      return;
    }
    this.cvError = '';
    this.cvFileName = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.cvBase64 = dataUrl.split(',')[1] || '';
    };
    reader.readAsDataURL(file);
  }

  removeCV(event: Event) {
    event.stopPropagation();
    this.cvFileName = '';
    this.cvBase64 = '';
    this.cvError = '';
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  submit() {
    this.touched = true;
    if (!this.applyForm.applicantName.trim()) { this.applyError = 'Full name is required.'; return; }
    if (!this.applyForm.applicantEmail.trim() || !this.isValidEmail(this.applyForm.applicantEmail)) {
      this.applyError = 'A valid email address is required.'; return;
    }
    this.applyError = '';
    this.applying = true;

    const body = {
      ...this.applyForm,
      cvFileName: this.cvFileName || null,
      cvData: this.cvBase64 || null
    };

    this.http.post(`${API}/jobs/${this.position.id}/apply`, body).pipe(timeout(30000)).subscribe({
      next: () => { this.applied = true; this.applying = false; },
      error: (e) => {
        this.applyError = e.error?.error || (e.name === 'TimeoutError'
          ? 'The request timed out. Please check your connection and try again.'
          : 'Submission failed. Please try again.');
        this.applying = false;
      }
    });
  }

  typeLabel(t: string): string {
    return ({ FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', INTERNSHIP: 'Internship' } as any)[t] || t;
  }

  typeClass(t: string): string {
    return ({ FULL_TIME: 'type-full', PART_TIME: 'type-part', CONTRACT: 'type-cont', INTERNSHIP: 'type-intern' } as any)[t] || '';
  }

  isClosingSoon(dateStr: string): boolean {
    if (!dateStr) return false;
    const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  }
}
