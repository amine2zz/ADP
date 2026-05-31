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
            <input type="text" [(ngModel)]="searchQ" placeholder="Search jobs...">
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
            <div class="pos-card" *ngFor="let p of filtered">
              <!-- Card Top row: dept + type -->
              <div class="pos-card-top">
                <span class="pos-dept-badge">{{ p.department || 'General' }}</span>
                <span class="pos-type-chip" [ngClass]="typeClass(p.jobType)">{{ typeLabel(p.jobType) }}</span>
              </div>

              <!-- Title -->
              <h3 class="pos-title">{{ p.title }}</h3>

              <!-- Meta chips -->
              <div class="pos-meta">
                <span *ngIf="p.location">📍 {{ p.location }}</span>
                <span *ngIf="p.salaryMin || p.salaryMax">
                  💰 {{ p.salaryMin | number:'1.0-0' }}{{ p.salaryMax ? ' – ' + (p.salaryMax | number:'1.0-0') : '+' }} TND
                </span>
                <span *ngIf="p.closingDate" [class.closing-soon]="isClosingSoon(p.closingDate)">
                  📅 {{ p.closingDate }}{{ isClosingSoon(p.closingDate) ? ' · soon' : '' }}
                </span>
              </div>

              <!-- Short description -->
              <p class="pos-desc" *ngIf="p.description">{{ truncate(p.description, 120) }}</p>

              <!-- Footer -->
              <div class="pos-footer">
                <button class="btn-view" (click)="openDetail(p.id)">
                  View &amp; Apply ↗
                </button>
                <span class="pos-applicants" *ngIf="p.applicantsCount > 0">
                  {{ p.applicantsCount }} applicant{{ p.applicantsCount !== 1 ? 's' : '' }}
                </span>
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
    .company-name { font-weight: 700; font-size: 1.05rem; color: #1e293b; }
    .hdr-link { color: #ef4444; font-weight: 600; font-size: 0.88rem; text-decoration: none; padding: 0.45rem 0.9rem; border: 1.5px solid #fca5a5; border-radius: 6px; transition: all 0.2s; }
    .hdr-link:hover { background: #fef2f2; }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
      padding: 4.5rem 2rem 3.5rem;
    }
    .hero-inner { max-width: 720px; margin: 0 auto; text-align: center; }
    .hero-eyebrow { display: inline-block; background: rgba(239,68,68,0.15); color: #fca5a5; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.3rem 0.85rem; border-radius: 20px; margin-bottom: 1.1rem; border: 1px solid rgba(239,68,68,0.25); }
    .hero h1 { color: white; font-size: 2.6rem; font-weight: 900; margin: 0 0 0.85rem; line-height: 1.1; }
    .hero p { color: rgba(255,255,255,0.6); font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; }
    .hero-stats { display: flex; align-items: center; justify-content: center; gap: 2rem; }
    .hs-item { display: flex; flex-direction: column; align-items: center; }
    .hs-n { font-size: 1.75rem; font-weight: 900; color: white; line-height: 1; }
    .hs-l { font-size: 0.68rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 0.2rem; }
    .hs-div { width: 1px; height: 34px; background: rgba(255,255,255,0.15); }

    /* ── Filters ── */
    .filters-bar { background: white; border-bottom: 1px solid #e2e8f0; padding: 0.85rem 2rem; }
    .filters-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .search-box { display: flex; align-items: center; gap: 0.45rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 0.45rem 0.7rem; flex: 1; min-width: 180px; max-width: 320px; }
    .search-box input { border: none; background: none; font-size: 0.85rem; color: #1e293b; outline: none; flex: 1; }
    .s-icon { font-size: 0.82rem; }
    .filter-chips { display: flex; gap: 0.45rem; }
    .filter-chips select { padding: 0.42rem 0.65rem; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: 0.8rem; color: #475569; background: white; cursor: pointer; outline: none; font-family: inherit; }
    .results-count { font-size: 0.78rem; color: #94a3b8; font-weight: 600; margin-left: auto; white-space: nowrap; }

    /* ── Positions ── */
    .positions-section { flex: 1; padding: 2rem; }
    .positions-inner { max-width: 1200px; margin: 0 auto; }
    .positions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }

    .pos-card {
      background: white; border-radius: 12px; border: 1.5px solid #e2e8f0;
      padding: 1.25rem 1.35rem; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 0.65rem;
    }
    .pos-card:hover { border-color: #cbd5e1; box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-2px); }

    .pos-card-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .pos-dept-badge { background: #f1f5f9; color: #64748b; font-size: 0.65rem; font-weight: 700; padding: 0.18rem 0.55rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
    .pos-type-chip { font-size: 0.63rem; font-weight: 700; padding: 0.18rem 0.55rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
    .type-full  { background: #dcfce7; color: #166534; }
    .type-part  { background: #dbeafe; color: #1e40af; }
    .type-cont  { background: #fef3c7; color: #92400e; }
    .type-intern{ background: #f3e8ff; color: #6b21a8; }

    .pos-title { font-size: 1.05rem; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.3; }

    .pos-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .pos-meta span { font-size: 0.72rem; color: #64748b; background: #f8fafc; padding: 0.18rem 0.5rem; border-radius: 5px; white-space: nowrap; }
    .closing-soon { color: #dc2626 !important; background: #fee2e2 !important; font-weight: 600; }

    .pos-desc { font-size: 0.82rem; color: #64748b; line-height: 1.5; margin: 0; flex: 1; }

    .pos-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.65rem; border-top: 1px solid #f1f5f9; margin-top: auto; }
    .btn-view {
      padding: 0.45rem 1.1rem; background: #ef4444; color: white;
      border: none; border-radius: 6px; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
    }
    .btn-view:hover { background: #dc2626; box-shadow: 0 3px 10px rgba(239,68,68,0.3); transform: translateY(-1px); }
    .pos-applicants { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

    /* Loading / empty */
    .loading-state, .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
    .spinner { width: 34px; height: 34px; border: 3px solid #e2e8f0; border-top-color: #ef4444; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; color: #1e293b; }

    /* Footer */
    .careers-footer { background: #1e293b; color: rgba(255,255,255,0.45); text-align: center; padding: 1.25rem; font-size: 0.78rem; }
    .careers-footer a { color: #fca5a5; text-decoration: none; }

    @media (max-width: 600px) {
      .positions-grid { grid-template-columns: 1fr; }
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
  year = new Date().getFullYear();

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

  openDetail(id: number) {
    window.open('/careers/position/' + id, '_blank');
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

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
}
