import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SystemConfigService } from '../services/system-config.service';

const API = 'http://localhost:8085/api';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterLink],
  template: `
    <div class="careers-page">

      <!-- ── Header ── -->
      <header class="careers-header">
        <div class="hdr-left">
          <a routerLink="/login" class="back-home">
            <img *ngIf="logoImgUrl" [src]="logoImgUrl" style="height:28px;border-radius:4px;" alt="logo">
            <div *ngIf="!logoImgUrl" class="logo-badge" [style.background]="logoBg">{{ logoText }}</div>
            <span class="company-name">{{ companyName }}</span>
          </a>
        </div>
        <div class="hdr-right">
          <a routerLink="/login" class="hdr-link">Sign In</a>
        </div>
      </header>

      <!-- ── Hero ── -->
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-eyebrow">We're Hiring</div>
          <h1>Join {{ companyName }}</h1>
          <p>Build the future of HR technology with us. Explore our open positions and find where you belong.</p>
          <div class="hero-stats">
            <div class="hs-item"><span class="hs-n">{{ positions.length }}</span><span class="hs-l">Open Positions</span></div>
            <div class="hs-div"></div>
            <div class="hs-item"><span class="hs-n">{{ depts.length }}</span><span class="hs-l">Departments</span></div>
            <div class="hs-div"></div>
            <div class="hs-item"><span class="hs-n">{{ types.length }}</span><span class="hs-l">Work Types</span></div>
          </div>
        </div>
      </section>

      <!-- ── Filters ── -->
      <div class="filters-bar">
        <div class="filters-inner">
          <div class="search-box">
            <span class="s-icon">🔍</span>
            <input type="text" [(ngModel)]="searchQ" placeholder="Search job title, keyword...">
          </div>
          <div class="filter-chips">
            <select [(ngModel)]="filterDept">
              <option value="">All Departments</option>
              <option *ngFor="let d of depts" [value]="d">{{ d }}</option>
            </select>
            <select [(ngModel)]="filterType">
              <option value="">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
          <div class="results-count">{{ filtered.length }} position{{ filtered.length !== 1 ? 's' : '' }}</div>
        </div>
      </div>

      <!-- ── Positions Grid ── -->
      <main class="positions-section">
        <div class="positions-inner">

          <div *ngIf="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading positions...</p>
          </div>

          <div *ngIf="!loading && filtered.length === 0" class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔭</div>
            <h3>No positions found</h3>
            <p>Try adjusting your search or check back soon for new openings.</p>
          </div>

          <div *ngIf="!loading" class="positions-grid">
            <div class="pos-card" *ngFor="let p of filtered" [class.expanded]="selectedId === p.id">
              <!-- Card Header -->
              <div class="pos-card-top">
                <div class="pos-dept-badge">{{ p.department || 'General' }}</div>
                <div class="pos-type-chip" [ngClass]="typeClass(p.jobType)">{{ typeLabel(p.jobType) }}</div>
              </div>

              <h3 class="pos-title">{{ p.title }}</h3>

              <div class="pos-meta">
                <span *ngIf="p.location">📍 {{ p.location }}</span>
                <span *ngIf="p.salaryMin || p.salaryMax">
                  💰 {{ p.salaryMin | number:'1.0-0' }}{{ p.salaryMax ? ' – ' + (p.salaryMax | number:'1.0-0') : '+' }} TND
                </span>
                <span *ngIf="p.hiringManager">👤 {{ p.hiringManager.firstName }} {{ p.hiringManager.lastName }}</span>
                <span *ngIf="p.closingDate" [class.closing-soon]="isClosingSoon(p.closingDate)">
                  📅 Closes {{ p.closingDate }}{{ isClosingSoon(p.closingDate) ? ' (soon!)' : '' }}
                </span>
              </div>

              <p class="pos-desc" *ngIf="p.description">{{ truncate(p.description, 160) }}</p>

              <!-- Expanded details -->
              <div class="pos-expanded" *ngIf="selectedId === p.id">
                <div *ngIf="p.description" class="exp-section">
                  <h4>About the Role</h4>
                  <p style="white-space: pre-line;">{{ p.description }}</p>
                </div>
                <div *ngIf="p.requirements" class="exp-section">
                  <h4>Requirements</h4>
                  <p style="white-space: pre-line;">{{ p.requirements }}</p>
                </div>
                <div class="exp-meta-grid">
                  <div *ngIf="p.department"><span class="emk">Department</span><span class="emv">{{ p.department }}</span></div>
                  <div *ngIf="p.location"><span class="emk">Location</span><span class="emv">{{ p.location }}</span></div>
                  <div *ngIf="p.jobType"><span class="emk">Type</span><span class="emv">{{ typeLabel(p.jobType) }}</span></div>
                  <div *ngIf="p.salaryMin || p.salaryMax"><span class="emk">Salary</span><span class="emv">{{ p.salaryMin | number:'1.0-0' }}{{ p.salaryMax ? ' – ' + (p.salaryMax | number:'1.0-0') : '+' }} TND</span></div>
                  <div *ngIf="p.hiringManager"><span class="emk">Hiring Manager</span><span class="emv">{{ p.hiringManager.firstName }} {{ p.hiringManager.lastName }}</span></div>
                  <div *ngIf="p.postedDate"><span class="emk">Posted</span><span class="emv">{{ p.postedDate }}</span></div>
                </div>

                <!-- Apply form -->
                <div class="apply-form" *ngIf="!applySuccess[p.id]; else applyDone">
                  <h4>Apply for this Position</h4>
                  <div class="apply-grid">
                    <div class="af-group">
                      <label>Full Name *</label>
                      <input type="text" [(ngModel)]="applyForm.applicantName" placeholder="Your full name">
                    </div>
                    <div class="af-group">
                      <label>Email Address *</label>
                      <input type="email" [(ngModel)]="applyForm.applicantEmail" placeholder="you@example.com">
                    </div>
                    <div class="af-group">
                      <label>Phone Number</label>
                      <input type="tel" [(ngModel)]="applyForm.phone" placeholder="+216 XX XXX XXX">
                    </div>
                    <div class="af-group wide">
                      <label>Cover Letter</label>
                      <textarea [(ngModel)]="applyForm.coverLetter" rows="5"
                                placeholder="Tell us why you're a great fit for this role..."></textarea>
                    </div>
                  </div>
                  <div class="apply-actions">
                    <button class="btn-apply" (click)="submitApplication(p)" [disabled]="applying">
                      {{ applying ? 'Submitting...' : '🚀 Submit Application' }}
                    </button>
                    <span *ngIf="applyError" class="apply-err">{{ applyError }}</span>
                  </div>
                </div>
                <ng-template #applyDone>
                  <div class="apply-success">
                    <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎉</div>
                    <h4>Application Submitted!</h4>
                    <p>Thank you for applying. We'll review your application and get back to you soon.</p>
                  </div>
                </ng-template>
              </div>

              <div class="pos-actions">
                <button class="btn-view" (click)="toggle(p.id)">
                  {{ selectedId === p.id ? '↑ Show Less' : '↓ View Details & Apply' }}
                </button>
                <div class="pos-applicants" *ngIf="p.applicantsCount > 0">
                  {{ p.applicantsCount }} applicant{{ p.applicantsCount !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- ── Footer ── -->
      <footer class="careers-footer">
        <p>© {{ year }} {{ companyName }} · <a routerLink="/login">Sign In</a></p>
      </footer>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .careers-page { min-height: 100vh; background: #f8fafc; font-family: 'Inter', system-ui, sans-serif; color: #1e293b; display: flex; flex-direction: column; }

    /* ── Header ── */
    .careers-header {
      background: white; border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem; height: 60px; display: flex; align-items: center;
      justify-content: space-between; position: sticky; top: 0; z-index: 100;
      box-shadow: 0 1px 8px rgba(0,0,0,0.05);
    }
    .hdr-left { display: flex; align-items: center; }
    .back-home { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
    .logo-badge { color: white; font-weight: 900; font-size: 0.95rem; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .company-name { font-weight: 700; font-size: 1.1rem; color: #1e293b; }
    .hdr-link { color: #ef4444; font-weight: 600; font-size: 0.9rem; text-decoration: none; padding: 0.5rem 1rem; border: 1.5px solid #fca5a5; border-radius: 6px; transition: all 0.2s; }
    .hdr-link:hover { background: #fef2f2; }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
      padding: 5rem 2rem 4rem;
    }
    .hero-inner { max-width: 780px; margin: 0 auto; text-align: center; }
    .hero-eyebrow { display: inline-block; background: rgba(239,68,68,0.15); color: #fca5a5; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.35rem 0.9rem; border-radius: 20px; margin-bottom: 1.25rem; border: 1px solid rgba(239,68,68,0.25); }
    .hero h1 { color: white; font-size: 3rem; font-weight: 900; margin: 0 0 1rem; line-height: 1.1; }
    .hero p { color: rgba(255,255,255,0.65); font-size: 1.1rem; line-height: 1.65; margin-bottom: 2.5rem; }
    .hero-stats { display: flex; align-items: center; justify-content: center; gap: 2rem; }
    .hs-item { display: flex; flex-direction: column; align-items: center; }
    .hs-n { font-size: 2rem; font-weight: 900; color: white; line-height: 1; }
    .hs-l { font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.25rem; }
    .hs-div { width: 1px; height: 40px; background: rgba(255,255,255,0.15); }

    /* ── Filters ── */
    .filters-bar { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .filters-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .search-box { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.75rem; flex: 1; min-width: 200px; max-width: 360px; }
    .search-box input { border: none; background: none; font-size: 0.9rem; color: #1e293b; outline: none; flex: 1; }
    .s-icon { font-size: 0.9rem; }
    .filter-chips { display: flex; gap: 0.5rem; }
    .filter-chips select { padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; color: #475569; background: white; cursor: pointer; outline: none; font-family: inherit; }
    .results-count { font-size: 0.82rem; color: #64748b; font-weight: 600; margin-left: auto; white-space: nowrap; }

    /* ── Positions ── */
    .positions-section { flex: 1; padding: 2.5rem 2rem; }
    .positions-inner { max-width: 1200px; margin: 0 auto; }
    .positions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem; }

    .pos-card {
      background: white; border-radius: 1rem; border: 1.5px solid #e2e8f0;
      padding: 1.5rem; transition: all 0.25s; display: flex; flex-direction: column; gap: 0.75rem;
    }
    .pos-card:hover { border-color: #cbd5e1; box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .pos-card.expanded { border-color: #ef4444; box-shadow: 0 8px 32px rgba(239,68,68,0.12); }

    .pos-card-top { display: flex; align-items: center; justify-content: space-between; }
    .pos-dept-badge { background: #f1f5f9; color: #475569; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .pos-type-chip { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase; }
    .type-full  { background: #dcfce7; color: #166534; }
    .type-part  { background: #dbeafe; color: #1e40af; }
    .type-cont  { background: #fef3c7; color: #92400e; }
    .type-intern{ background: #f3e8ff; color: #6b21a8; }

    .pos-title { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; }
    .pos-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .pos-meta span { font-size: 0.78rem; color: #64748b; background: #f8fafc; padding: 0.2rem 0.55rem; border-radius: 6px; }
    .closing-soon { color: #dc2626 !important; background: #fee2e2 !important; }
    .pos-desc { font-size: 0.85rem; color: #475569; line-height: 1.55; margin: 0; }

    /* Expanded */
    .pos-expanded { display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; }
    .exp-section h4 { font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .exp-section p { font-size: 0.88rem; color: #475569; line-height: 1.6; }
    .exp-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: #f8fafc; border-radius: 0.75rem; padding: 1rem; }
    .exp-meta-grid div { display: flex; flex-direction: column; gap: 0.1rem; }
    .emk { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .emv { font-size: 0.85rem; font-weight: 600; color: #1e293b; }

    /* Apply form */
    .apply-form { background: #f8fafc; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e2e8f0; }
    .apply-form h4 { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem; }
    .apply-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .af-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .af-group.wide { grid-column: span 2; }
    .af-group label { font-size: 0.75rem; font-weight: 700; color: #475569; }
    .af-group input, .af-group textarea {
      padding: 0.6rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.88rem; font-family: inherit; outline: none; transition: border-color 0.15s;
      background: white; resize: vertical;
    }
    .af-group input:focus, .af-group textarea:focus { border-color: #ef4444; }
    .apply-actions { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
    .btn-apply {
      padding: 0.75rem 2rem; background: #ef4444; color: white; border: none;
      border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer;
      transition: all 0.2s; font-family: inherit;
    }
    .btn-apply:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
    .btn-apply:disabled { opacity: 0.6; cursor: not-allowed; }
    .apply-err { font-size: 0.82rem; color: #dc2626; font-weight: 600; }
    .apply-success { background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 1rem; padding: 1.5rem; text-align: center; }
    .apply-success h4 { font-size: 1rem; font-weight: 800; color: #166534; margin-bottom: 0.5rem; }
    .apply-success p { font-size: 0.88rem; color: #15803d; }

    .pos-actions { display: flex; align-items: center; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; margin-top: auto; }
    .btn-view { padding: 0.5rem 1.1rem; background: none; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: #475569; transition: all 0.15s; font-family: inherit; }
    .btn-view:hover { border-color: #ef4444; color: #ef4444; }
    .pos-applicants { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

    /* Loading / empty */
    .loading-state, .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #ef4444; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; color: #1e293b; }

    /* Footer */
    .careers-footer { background: #1e293b; color: rgba(255,255,255,0.5); text-align: center; padding: 1.5rem; font-size: 0.82rem; }
    .careers-footer a { color: #fca5a5; text-decoration: none; }

    @media (max-width: 600px) {
      .positions-grid { grid-template-columns: 1fr; }
      .apply-grid { grid-template-columns: 1fr; }
      .af-group.wide { grid-column: span 1; }
      .hero h1 { font-size: 2rem; }
    }
  `]
})
export class CareersComponent implements OnInit {
  positions: any[] = [];
  loading = true;
  searchQ = '';
  filterDept = '';
  filterType = '';
  selectedId: number | null = null;
  applying = false;
  applySuccess: Record<number, boolean> = {};
  applyError = '';
  year = new Date().getFullYear();

  applyForm = { applicantName: '', applicantEmail: '', phone: '', coverLetter: '' };

  get logoText()   { return this.configSvc.get('theme.logo_text', 'ADP'); }
  get logoBg()     { return this.configSvc.get('theme.logo_bg', '#D0271D'); }
  get logoImgUrl() { return this.configSvc.get('theme.logo_image_url', ''); }
  get companyName(){ return this.configSvc.get('general.company_name', 'Nexus HCM'); }

  get depts(): string[] {
    return [...new Set(this.positions.map(p => p.department).filter(Boolean))];
  }
  get types(): string[] {
    return [...new Set(this.positions.map(p => p.jobType).filter(Boolean))];
  }
  get filtered() {
    return this.positions.filter(p => {
      const q = this.searchQ.toLowerCase();
      const matchQ = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q);
      const matchD = !this.filterDept || p.department === this.filterDept;
      const matchT = !this.filterType || p.jobType === this.filterType;
      return matchQ && matchD && matchT;
    });
  }

  constructor(private http: HttpClient, private configSvc: SystemConfigService) {}

  ngOnInit() {
    this.configSvc.load(this.http);
    this.http.get<any[]>(`${API}/jobs/open`).subscribe({
      next: (data) => { this.positions = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggle(id: number) {
    if (this.selectedId === id) {
      this.selectedId = null;
    } else {
      this.selectedId = id;
      this.applyForm = { applicantName: '', applicantEmail: '', phone: '', coverLetter: '' };
      this.applyError = '';
    }
  }

  submitApplication(pos: any) {
    if (!this.applyForm.applicantName.trim()) { this.applyError = 'Full name is required.'; return; }
    if (!this.applyForm.applicantEmail.trim()) { this.applyError = 'Email is required.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.applyForm.applicantEmail)) { this.applyError = 'Invalid email address.'; return; }
    this.applyError = '';
    this.applying = true;
    this.http.post(`${API}/jobs/${pos.id}/apply`, this.applyForm).subscribe({
      next: () => {
        this.applySuccess[pos.id] = true;
        this.applying = false;
        pos.applicantsCount = (pos.applicantsCount || 0) + 1;
      },
      error: (e) => {
        this.applyError = e.error?.error || 'Submission failed. Please try again.';
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
    const closing = new Date(dateStr);
    const now = new Date();
    const diff = (closing.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
}
