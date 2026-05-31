import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';

const API = 'http://localhost:8085/api';

@Component({
  selector: 'app-job-board',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="jb-wrapper">
      <div class="jb-welcome">
        <h2>Job Board</h2>
        <p>Manage open positions, track applications, and coordinate hiring.</p>
      </div>

      <!-- Summary KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-top: 4px solid #22c55e;">
          <div class="kpi-title">Open Positions</div>
          <div class="kpi-value" style="color:#16a34a;">{{ summary.open }}</div>
          <div class="kpi-trend positive">Live on careers page</div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #94a3b8;">
          <div class="kpi-title">Draft Positions</div>
          <div class="kpi-value" style="color:#64748b;">{{ summary.draft }}</div>
          <div class="kpi-trend">Not yet published</div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #64748b;">
          <div class="kpi-title">Closed</div>
          <div class="kpi-value" style="color:#475569;">{{ summary.closed }}</div>
          <div class="kpi-trend">Archived</div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #ef4444; cursor: pointer;" (click)="tab='applications'">
          <div class="kpi-title">New Applications</div>
          <div class="kpi-value" style="color:#ef4444;">{{ summary.newApplications }}</div>
          <div class="kpi-trend negative" *ngIf="summary.newApplications > 0">Awaiting review ↗</div>
          <div class="kpi-trend positive" *ngIf="!summary.newApplications">All reviewed</div>
        </div>
      </div>

      <!-- Tab Nav -->
      <div class="card" style="padding: 0 1rem; margin-top: 1rem;">
        <div class="jb-tabs">
          <button [class.active]="tab==='positions'" (click)="tab='positions'">📋 Positions</button>
          <button [class.active]="tab==='create'" (click)="openCreate()">＋ New Position</button>
          <button [class.active]="tab==='applications'" (click)="tab='applications'; loadApplications()">📩 Applications</button>
        </div>
      </div>

      <!-- ── Positions Tab ── -->
      <div *ngIf="tab==='positions'" class="fade-in" style="margin-top: 1.5rem;">
        <div class="card table-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <h3>All Positions</h3>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <div style="display: flex; border: 1px solid var(--adp-border); border-radius: 6px; overflow: hidden;">
                <button *ngFor="let s of ['ALL','DRAFT','OPEN','CLOSED']"
                        (click)="posStatusFilter = s"
                        [style.background]="posStatusFilter === s ? 'var(--adp-red)' : 'white'"
                        [style.color]="posStatusFilter === s ? 'white' : 'var(--adp-charcoal)'"
                        style="padding: 0.4rem 0.75rem; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 600;">{{ s }}</button>
              </div>
              <input type="text" [(ngModel)]="posSearch" placeholder="Search..." style="padding: 0.4rem 0.75rem; border: 1.5px solid var(--adp-border); border-radius: 6px; font-size: 0.85rem;">
            </div>
          </div>
          <div style="overflow-x: auto;">
            <table class="adp-table" *ngIf="filteredPositions.length > 0; else noPosT">
              <thead>
                <tr>
                  <th>Title</th><th>Department</th><th>Type</th><th>Salary</th><th>Hiring Manager</th><th>Status</th><th>Applicants</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filteredPositions">
                  <td>
                    <strong>{{ p.title }}</strong>
                    <div style="font-size:0.72rem;color:#64748b;">{{ p.location || '' }}</div>
                  </td>
                  <td>{{ p.department || '—' }}</td>
                  <td><span class="type-chip" [ngClass]="typeClass(p.jobType)">{{ typeLabel(p.jobType) }}</span></td>
                  <td style="white-space:nowrap; font-size:0.82rem;">
                    <span *ngIf="p.salaryMin || p.salaryMax">{{ p.salaryMin | number:'1.0-0' }}{{ p.salaryMax ? '–' + (p.salaryMax | number:'1.0-0') : '+' }} TND</span>
                    <span *ngIf="!p.salaryMin && !p.salaryMax" style="color:#94a3b8;">—</span>
                  </td>
                  <td>
                    <span *ngIf="p.hiringManager">{{ p.hiringManager.firstName }} {{ p.hiringManager.lastName }}</span>
                    <span *ngIf="!p.hiringManager" style="color:#94a3b8;">—</span>
                  </td>
                  <td>
                    <span class="status-badge"
                          [style.background]="p.status==='OPEN' ? '#dcfce7' : p.status==='DRAFT' ? '#f1f5f9' : '#f1f5f9'"
                          [style.color]="p.status==='OPEN' ? '#166534' : p.status==='DRAFT' ? '#64748b' : '#475569'">
                      {{ p.status }}
                    </span>
                  </td>
                  <td style="text-align:center;">{{ p.applicantsCount }}</td>
                  <td>
                    <div style="display:flex; gap:0.3rem; flex-wrap: wrap;">
                      <button (click)="openEdit(p)" style="padding: 0.2rem 0.5rem; background: #eff6ff; color: #1967D2; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">Edit</button>
                      <button *ngIf="p.status === 'DRAFT'" (click)="publish(p)" style="padding: 0.2rem 0.5rem; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">Publish</button>
                      <button *ngIf="p.status === 'OPEN'" (click)="close(p)" style="padding: 0.2rem 0.5rem; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">Close</button>
                      <button *ngIf="p.applicantsCount > 0" (click)="viewApps(p)" style="padding: 0.2rem 0.5rem; background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">{{ p.applicantsCount }} Apps</button>
                      <button (click)="deletePos(p)" style="padding: 0.2rem 0.5rem; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">Del</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #noPosT>
              <p style="text-align:center; padding:2rem; color:#64748b;">No positions found.</p>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- ── Create/Edit Tab ── -->
      <div *ngIf="tab==='create'" class="fade-in" style="margin-top: 1.5rem;">
        <div class="card" style="max-width: 800px;">
          <h3 style="margin-bottom: 1.5rem;">{{ editingId ? 'Edit Position' : 'Create New Position' }}</h3>
          <div class="pos-form">
            <div class="pf-row">
              <div class="pf-group wide2">
                <label>Job Title *</label>
                <input type="text" [(ngModel)]="form.title" placeholder="e.g. Senior Software Engineer">
              </div>
              <div class="pf-group">
                <label>Status</label>
                <select [(ngModel)]="form.status">
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open (Published)</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            <div class="pf-row">
              <div class="pf-group">
                <label>Department</label>
                <input type="text" [(ngModel)]="form.department" list="dept-list" placeholder="Select or type department">
                <datalist id="dept-list">
                  <option *ngFor="let d of allDepartments" [value]="d"></option>
                </datalist>
              </div>
              <div class="pf-group">
                <label>Location</label>
                <input type="text" [(ngModel)]="form.location" placeholder="e.g. Tunis, Tunisia">
              </div>
              <div class="pf-group">
                <label>Job Type</label>
                <select [(ngModel)]="form.jobType">
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
            </div>

            <div class="pf-row">
              <div class="pf-group">
                <label>Salary Min (TND)</label>
                <input type="number" [(ngModel)]="form.salaryMin" placeholder="3000">
              </div>
              <div class="pf-group">
                <label>Salary Max (TND)</label>
                <input type="number" [(ngModel)]="form.salaryMax" placeholder="5000">
              </div>
              <div class="pf-group">
                <label>Closing Date</label>
                <input type="date" [(ngModel)]="form.closingDate">
              </div>
            </div>

            <div class="pf-group wide">
              <label>Hiring Manager</label>
              <select [(ngModel)]="form.hiringManagerId">
                <option value="">— No manager assigned —</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.firstName }} {{ m.lastName }} ({{ m.role | titlecase }})</option>
              </select>
            </div>

            <div class="pf-group wide">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" rows="5" placeholder="Describe the role, responsibilities, team culture..."></textarea>
            </div>

            <div class="pf-group wide">
              <label>Requirements</label>
              <textarea [(ngModel)]="form.requirements" rows="5" placeholder="List required skills, experience, qualifications..."></textarea>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; margin-top:1.5rem;">
            <button class="btn-primary" (click)="savePosition()" style="padding: 0.7rem 2rem;">
              {{ editingId ? '💾 Update Position' : '✚ Create Position' }}
            </button>
            <button class="btn-secondary" (click)="tab='positions'; resetForm()">Cancel</button>
          </div>
        </div>
      </div>

      <!-- ── Applications Tab ── -->
      <div *ngIf="tab==='applications'" class="fade-in" style="margin-top: 1.5rem;">
        <div class="card table-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <h3>{{ viewingPositionTitle ? 'Applications for: ' + viewingPositionTitle : 'All Applications' }}</h3>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button *ngIf="viewingPositionTitle" (click)="clearPositionFilter()" style="padding: 0.35rem 0.75rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; cursor:pointer;">✕ Show All</button>
              <div style="display: flex; border: 1px solid var(--adp-border); border-radius: 6px; overflow: hidden;">
                <button *ngFor="let s of ['ALL','NEW','REVIEWING','INTERVIEW','REJECTED','ACCEPTED']"
                        (click)="appStatusFilter = s"
                        [style.background]="appStatusFilter === s ? 'var(--adp-red)' : 'white'"
                        [style.color]="appStatusFilter === s ? 'white' : 'var(--adp-charcoal)'"
                        style="padding: 0.3rem 0.6rem; border: none; cursor: pointer; font-size: 0.72rem; font-weight: 600;">{{ s }}</button>
              </div>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="adp-table" *ngIf="filteredApps.length > 0; else noAppsT">
              <thead>
                <tr><th>Applicant</th><th>Position</th><th>Applied</th><th>Cover Letter</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of filteredApps">
                  <td>
                    <strong>{{ a.applicantName }}</strong>
                    <div style="font-size:0.72rem; color:#64748b;">{{ a.applicantEmail }}</div>
                    <div *ngIf="a.phone" style="font-size:0.72rem; color:#94a3b8;">{{ a.phone }}</div>
                  </td>
                  <td style="font-size:0.82rem; color:#475569;">{{ a.position?.title }}</td>
                  <td style="font-size:0.78rem; color:#64748b; white-space:nowrap;">{{ a.appliedDate }}</td>
                  <td style="max-width:200px; font-size:0.8rem; color:#475569;">{{ a.coverLetter ? truncate(a.coverLetter, 80) : '—' }}</td>
                  <td>
                    <span class="app-badge"
                          [style.background]="appBg(a.status)"
                          [style.color]="appColor(a.status)">{{ a.status }}</span>
                  </td>
                  <td>
                    <select [(ngModel)]="appNotes[a.id + '_status']" (change)="updateAppStatus(a)"
                            style="padding: 0.25rem 0.4rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.72rem; font-family: inherit;">
                      <option value="">Move to...</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="ACCEPTED">Accepted</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #noAppsT>
              <p style="text-align:center; padding:2rem; color:#64748b;">No applications found.</p>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .jb-wrapper { display: flex; flex-direction: column; gap: 1rem; }
    .jb-welcome h2 { color: var(--adp-charcoal); font-size: 1.75rem; font-weight: 700; margin-bottom: 0.35rem; }
    .jb-welcome p { color: var(--adp-dark-gray); font-size: 0.95rem; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
    .kpi-card { background: white; padding: 1.25rem; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    .kpi-title { font-size: 0.8rem; text-transform: uppercase; color: var(--adp-dark-gray); font-weight: 600; }
    .kpi-value { font-size: 2.25rem; font-weight: 700; color: var(--adp-charcoal); margin: 0.4rem 0; }
    .kpi-trend { font-size: 0.8rem; }
    .kpi-trend.positive { color: #137333; }
    .kpi-trend.negative { color: #dc2626; }

    .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

    .jb-tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--adp-border); padding-bottom: 0; }
    .jb-tabs button { background: none; border: none; border-bottom: 3px solid transparent; padding: 0.85rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.88rem; color: #64748b; transition: all 0.15s; font-family: inherit; }
    .jb-tabs button:hover { color: var(--adp-charcoal); }
    .jb-tabs button.active { color: var(--adp-red); border-bottom-color: var(--adp-red); }

    .adp-table { width: 100%; border-collapse: collapse; }
    .adp-table th, .adp-table td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--adp-border); font-size: 0.84rem; }
    .adp-table th { background: #f8fafc; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }

    .status-badge, .app-badge { padding: 0.2rem 0.55rem; border-radius: 10px; font-size: 0.68rem; font-weight: 700; white-space: nowrap; }
    .type-chip { padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
    .type-full { background: #dcfce7; color: #166534; }
    .type-part { background: #dbeafe; color: #1e40af; }
    .type-cont { background: #fef3c7; color: #92400e; }
    .type-intern { background: #f3e8ff; color: #6b21a8; }

    /* Form */
    .pos-form { display: flex; flex-direction: column; gap: 1rem; }
    .pf-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .pf-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .pf-group.wide { grid-column: span 3; }
    .pf-group.wide2 { grid-column: span 2; }
    .pf-group label { font-size: 0.75rem; font-weight: 700; color: #475569; }
    .pf-group input, .pf-group select, .pf-group textarea {
      padding: 0.55rem 0.7rem; border: 1.5px solid #e2e8f0; border-radius: 7px;
      font-size: 0.88rem; font-family: inherit; outline: none; transition: border-color 0.15s;
      background: #fafafa; resize: vertical;
    }
    .pf-group input:focus, .pf-group select:focus, .pf-group textarea:focus { border-color: var(--adp-red); background: white; }

    .btn-primary { background: var(--adp-red); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s; }
    .btn-primary:hover { background: #dc2626; }
    .btn-secondary { padding: 0.7rem 1.25rem; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-secondary:hover { background: #e2e8f0; }
    .table-card { overflow: hidden; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class JobBoardComponent implements OnInit {
  tab = 'positions';
  positions: any[] = [];
  applications: any[] = [];
  managers: any[] = [];
  employeeDepts: string[] = [];
  summary = { open: 0, draft: 0, closed: 0, total: 0, newApplications: 0 };

  posStatusFilter = 'ALL';
  posSearch = '';
  appStatusFilter = 'ALL';
  appNotes: Record<string, string> = {};
  editingId: number | null = null;
  viewingPositionTitle = '';
  viewingPositionId: number | null = null;

  form: any = this.blankForm();

  constructor(private http: HttpClient, private notif: NotificationService) {}

  ngOnInit() {
    this.loadPositions();
    this.loadManagers();
    this.loadSummary();
  }

  loadPositions() {
    this.http.get<any[]>(`${API}/jobs`).subscribe({ next: d => this.positions = d, error: () => {} });
  }

  loadApplications() {
    const url = this.viewingPositionId
      ? `${API}/jobs/${this.viewingPositionId}/applications`
      : `${API}/jobs/applications/all`;
    this.http.get<any[]>(url).subscribe({ next: d => this.applications = d, error: () => {} });
  }

  loadManagers() {
    this.http.get<any[]>(`${API}/employees`).subscribe({
      next: d => {
        this.managers = d.filter(e => e.role === 'MANAGER' || e.role === 'HR_ADMIN');
        // collect unique department names from all employees
        const raw = d.map((e: any) => e.department?.name).filter(Boolean) as string[];
        this.employeeDepts = [...new Set(raw)].sort();
      },
      error: () => {}
    });
  }

  loadSummary() {
    this.http.get<any>(`${API}/jobs/summary`).subscribe({ next: d => this.summary = d, error: () => {} });
  }

  get allDepartments(): string[] {
    const fromPositions = this.positions.map((p: any) => p.department).filter(Boolean) as string[];
    return [...new Set([...this.employeeDepts, ...fromPositions])].sort();
  }

  get filteredPositions() {
    return this.positions.filter(p => {
      const q = this.posSearch.toLowerCase();
      const mQ = !q || p.title?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q);
      const mS = this.posStatusFilter === 'ALL' || p.status === this.posStatusFilter;
      return mQ && mS;
    });
  }

  get filteredApps() {
    return this.applications.filter(a => {
      const mS = this.appStatusFilter === 'ALL' || a.status === this.appStatusFilter;
      const mP = !this.viewingPositionId || a.position?.id === this.viewingPositionId;
      return mS && mP;
    });
  }

  openCreate() {
    this.editingId = null;
    this.form = this.blankForm();
    this.tab = 'create';
  }

  openEdit(p: any) {
    this.editingId = p.id;
    this.form = {
      title: p.title, description: p.description, requirements: p.requirements,
      department: p.department, location: p.location, jobType: p.jobType,
      status: p.status, salaryMin: p.salaryMin || '', salaryMax: p.salaryMax || '',
      closingDate: p.closingDate || '', hiringManagerId: p.hiringManager?.id || ''
    };
    this.tab = 'create';
  }

  savePosition() {
    if (!this.form.title?.trim()) { this.notif.show('Job title is required.', 'error'); return; }
    const body = { ...this.form };
    const req = this.editingId
      ? this.http.put<any>(`${API}/jobs/${this.editingId}`, body)
      : this.http.post<any>(`${API}/jobs`, body);
    req.subscribe({
      next: () => {
        this.notif.show(this.editingId ? 'Position updated.' : 'Position created.', 'success');
        this.tab = 'positions';
        this.resetForm();
        this.loadPositions();
        this.loadSummary();
      },
      error: () => this.notif.show('Save failed.', 'error')
    });
  }

  publish(p: any) {
    this.http.put<any>(`${API}/jobs/${p.id}/publish`, {}).subscribe({
      next: (u) => { Object.assign(p, u); this.loadSummary(); this.notif.show('Position published!', 'success'); },
      error: () => this.notif.show('Publish failed.', 'error')
    });
  }

  close(p: any) {
    if (!confirm(`Close "${p.title}"? It will be removed from the careers page.`)) return;
    this.http.put<any>(`${API}/jobs/${p.id}/close`, {}).subscribe({
      next: (u) => { Object.assign(p, u); this.loadSummary(); this.notif.show('Position closed.', 'success'); },
      error: () => this.notif.show('Close failed.', 'error')
    });
  }

  deletePos(p: any) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    this.http.delete(`${API}/jobs/${p.id}`).subscribe({
      next: () => { this.positions = this.positions.filter(x => x.id !== p.id); this.loadSummary(); this.notif.show('Deleted.', 'success'); },
      error: () => this.notif.show('Delete failed.', 'error')
    });
  }

  viewApps(p: any) {
    this.viewingPositionId = p.id;
    this.viewingPositionTitle = p.title;
    this.tab = 'applications';
    this.loadApplications();
  }

  clearPositionFilter() {
    this.viewingPositionId = null;
    this.viewingPositionTitle = '';
    this.loadApplications();
  }

  updateAppStatus(app: any) {
    const newStatus = this.appNotes[app.id + '_status'];
    if (!newStatus) return;
    this.http.put(`${API}/jobs/applications/${app.id}/status`, { status: newStatus }).subscribe({
      next: (u: any) => { app.status = u.status; this.appNotes[app.id + '_status'] = ''; this.loadSummary(); this.notif.show(`Application moved to ${newStatus}.`, 'success'); },
      error: () => this.notif.show('Update failed.', 'error')
    });
  }

  typeLabel(t: string): string {
    return ({ FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', INTERNSHIP: 'Internship' } as any)[t] || t;
  }
  typeClass(t: string): string {
    return ({ FULL_TIME: 'type-full', PART_TIME: 'type-part', CONTRACT: 'type-cont', INTERNSHIP: 'type-intern' } as any)[t] || '';
  }
  appBg(s: string): string {
    return ({ NEW: '#f1f5f9', REVIEWING: '#dbeafe', INTERVIEW: '#fef3c7', REJECTED: '#fee2e2', ACCEPTED: '#dcfce7' } as any)[s] || '#f1f5f9';
  }
  appColor(s: string): string {
    return ({ NEW: '#64748b', REVIEWING: '#1e40af', INTERVIEW: '#92400e', REJECTED: '#991b1b', ACCEPTED: '#166534' } as any)[s] || '#64748b';
  }
  truncate(t: string, n: number) { return t.length > n ? t.slice(0, n) + '...' : t; }

  resetForm() { this.editingId = null; this.form = this.blankForm(); }
  private blankForm() {
    return { title: '', description: '', requirements: '', department: '', location: '', jobType: 'FULL_TIME', status: 'DRAFT', salaryMin: '', salaryMax: '', closingDate: '', hiringManagerId: '' };
  }
}
