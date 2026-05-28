import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

const API = 'http://localhost:8085/api';

const PRESETS = [
  { label: 'HR Admin', role: 'HR_ADMIN', firstName: 'Sarah', lastName: 'Connor', email: 'sarah.connor@adp.com', password: 'password123', color: '#be123c', bg: '#fff1f2' },
  { label: 'Manager', role: 'MANAGER', firstName: 'John', lastName: 'Smith', email: 'john.smith@adp.com', password: 'password123', color: '#7e22ce', bg: '#fdf4ff' },
  { label: 'Employee', role: 'EMPLOYEE', firstName: 'Alex', lastName: 'Johnson', email: 'alex.johnson@adp.com', password: 'password123', color: '#1967D2', bg: '#eff6ff' },
];

@Component({
  selector: 'app-quick-setup',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="top-bar">
        <div class="brand"><span class="adp-badge">ADP</span><span class="brand-title">Nexus HCM · Quick Setup</span></div>
        <a routerLink="/login" class="login-link">→ Go to Login</a>
      </div>

      <div class="content">
        <div class="intro">
          <h1>Create Test Accounts</h1>
          <p>Bootstrap your system by creating accounts for any role. Each account will receive an activation token shown in the backend console.</p>
        </div>

        <!-- Preset Cards -->
        <div class="presets">
          <div class="preset-card" *ngFor="let p of presets" (click)="applyPreset(p)" [style.border-color]="p.color">
            <span class="preset-role" [style.background]="p.bg" [style.color]="p.color">{{ p.label }}</span>
            <div class="preset-name">{{ p.firstName }} {{ p.lastName }}</div>
            <div class="preset-email">{{ p.email }}</div>
            <div class="preset-hint">Click to fill form →</div>
          </div>
        </div>

        <div class="main-grid">

          <!-- Form -->
          <div class="form-card">
            <h2>New Account</h2>
            <form (submit)="create($event)">
              <div class="role-toggle">
                <button type="button" *ngFor="let r of roles" (click)="form.role = r.value"
                  [class.active]="form.role === r.value" [style.--rc]="r.color">
                  {{ r.label }}
                </button>
              </div>

              <div class="field-row">
                <div class="field">
                  <label>First Name</label>
                  <input type="text" [(ngModel)]="form.firstName" name="firstName" placeholder="John" required>
                </div>
                <div class="field">
                  <label>Last Name</label>
                  <input type="text" [(ngModel)]="form.lastName" name="lastName" placeholder="Doe" required>
                </div>
              </div>

              <div class="field">
                <label>Email</label>
                <input type="email" [(ngModel)]="form.email" name="email" placeholder="john.doe@adp.com" required>
              </div>

              <div class="field">
                <label>Password</label>
                <div class="pw-wrap">
                  <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="form.password" name="password" placeholder="Min. 6 characters" required minlength="6">
                  <button type="button" class="pw-toggle" (click)="showPw = !showPw">{{ showPw ? '🙈' : '👁' }}</button>
                </div>
              </div>

              <div class="field">
                <label>Department <span class="opt">(optional)</span></label>
                <select [(ngModel)]="form.departmentId" name="departmentId">
                  <option value="">— None —</option>
                  <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
                </select>
              </div>

              <button type="submit" class="btn-create" [class.loading]="creating">
                <span *ngIf="!creating">+ Create {{ roleLabel(form.role) }} Account</span>
                <span *ngIf="creating">Creating...</span>
              </button>
            </form>

            <!-- Toast -->
            <div class="toast" *ngIf="toast" [class.error]="toast.type === 'error'">
              <span>{{ toast.msg }}</span>
              <button (click)="toast = null">×</button>
            </div>
          </div>

          <!-- Accounts List -->
          <div class="list-card">
            <div class="list-header">
              <h2>Existing Accounts <span class="count">{{ employees.length }}</span></h2>
              <button class="refresh-btn" (click)="load()">↻ Refresh</button>
            </div>

            <div class="search-box">
              <input type="text" [(ngModel)]="search" placeholder="Search by name or email...">
            </div>

            <div class="emp-list">
              <div class="emp-row" *ngFor="let e of filtered">
                <div class="emp-avatar">{{ e.firstName?.charAt(0) }}{{ e.lastName?.charAt(0) }}</div>
                <div class="emp-info">
                  <div class="emp-name">{{ e.firstName }} {{ e.lastName }}</div>
                  <div class="emp-email">{{ e.email }}</div>
                </div>
                <div class="emp-right">
                  <span class="role-tag" [ngClass]="e.role?.toLowerCase()">{{ e.role?.replace('_',' ') }}</span>
                  <span class="status-dot" [ngClass]="e.status?.toLowerCase()" [title]="e.status">●</span>
                </div>
              </div>
              <div class="empty" *ngIf="filtered.length === 0">No accounts yet.</div>
            </div>

            <div class="legend">
              <span><span class="dot active">●</span> Active</span>
              <span><span class="dot pending_setup">●</span> Pending Setup</span>
              <span><span class="dot inactive">●</span> Inactive</span>
            </div>
          </div>
        </div>

        <!-- Quick Tips -->
        <div class="tips">
          <div class="tip">
            <span class="tip-icon">✅</span>
            <div><strong>Instant Activation</strong><br>Accounts created here are immediately <strong>ACTIVE</strong> — no token flow needed. The user can log in right away with the password you set.</div>
          </div>
          <div class="tip">
            <span class="tip-icon">🔑</span>
            <div><strong>Admin Login</strong><br>Default HR Admin: <code>admin@adp.com</code> / <code>password123</code> (seeded on first startup)</div>
          </div>
          <div class="tip">
            <span class="tip-icon">🗄️</span>
            <div><strong>Database</strong><br>Make sure XAMPP MySQL is running and <code>adp_hcm</code> database exists before starting the backend.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .page {
      min-height: 100vh;
      background: #f1f5f9;
      font-family: 'Inter', system-ui, sans-serif;
      color: #1e293b;
    }

    /* Top bar */
    .top-bar {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .adp-badge { background: #D0271D; color: white; font-weight: 900; font-size: 0.9rem; padding: 0.25rem 0.6rem; border-radius: 5px; }
    .brand-title { font-weight: 700; font-size: 1rem; color: #1e293b; }
    .login-link { color: #D0271D; font-weight: 700; font-size: 0.85rem; text-decoration: none; }
    .login-link:hover { text-decoration: underline; }

    /* Content */
    .content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.5rem; }

    .intro { margin-bottom: 2rem; }
    .intro h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.4rem; }
    .intro p { color: #64748b; font-size: 0.95rem; }

    /* Presets */
    .presets { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .preset-card {
      flex: 1; min-width: 180px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .preset-role { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.2rem 0.6rem; border-radius: 20px; display: inline-block; margin-bottom: 0.6rem; }
    .preset-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.2rem; }
    .preset-email { font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; }
    .preset-hint { font-size: 0.7rem; color: #94a3b8; font-style: italic; }

    /* Main grid */
    .main-grid { display: grid; grid-template-columns: 420px 1fr; gap: 1.5rem; align-items: start; margin-bottom: 2rem; }

    /* Form card */
    .form-card {
      background: white;
      border-radius: 14px;
      padding: 1.75rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .form-card h2 { font-size: 1.1rem; font-weight: 800; margin-bottom: 1.25rem; }

    .role-toggle { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
    .role-toggle button {
      flex: 1;
      padding: 0.6rem 0.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.15s;
      color: #64748b;
    }
    .role-toggle button.active {
      border-color: #D0271D;
      background: #fff1f2;
      color: #D0271D;
    }

    .field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field label { font-size: 0.78rem; font-weight: 700; color: #475569; }
    .field .opt { color: #94a3b8; font-weight: 400; }
    .field input, .field select {
      padding: 0.6rem 0.75rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.88rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      color: #1e293b;
    }
    .field input:focus, .field select:focus { border-color: #D0271D; }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .pw-wrap { position: relative; display: flex; align-items: center; }
    .pw-wrap input { flex: 1; padding-right: 2.5rem; }
    .pw-toggle { position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; opacity: 0.6; }
    .pw-toggle:hover { opacity: 1; }

    .btn-create {
      width: 100%;
      padding: 0.85rem;
      background: #D0271D;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.2s;
      font-family: inherit;
    }
    .btn-create:hover { background: #b91c1c; }
    .btn-create.loading { background: #9ca3af; cursor: not-allowed; }

    /* Toast */
    .toast {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: #dcfce7;
      color: #166534;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toast.error { background: #fee2e2; color: #b91c1c; }
    .toast button { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: inherit; opacity: 0.6; }

    /* List card */
    .list-card {
      background: white;
      border-radius: 14px;
      padding: 1.75rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .list-header h2 { font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
    .count { background: #f1f5f9; color: #64748b; font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 20px; }
    .refresh-btn { background: none; border: 1.5px solid #e2e8f0; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; color: #64748b; }
    .refresh-btn:hover { border-color: #D0271D; color: #D0271D; }

    .search-box { margin-bottom: 0.75rem; }
    .search-box input {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.84rem;
      font-family: inherit;
      outline: none;
    }
    .search-box input:focus { border-color: #D0271D; }

    .emp-list { max-height: 380px; overflow-y: auto; }
    .emp-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .emp-row:last-child { border-bottom: none; }
    .emp-avatar {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: white;
      font-size: 0.68rem;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .emp-info { flex: 1; min-width: 0; }
    .emp-name { font-weight: 700; font-size: 0.85rem; }
    .emp-email { font-size: 0.72rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .emp-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

    .role-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 0.15rem 0.55rem; border-radius: 20px; }
    .role-tag.employee { background: #eff6ff; color: #1967D2; }
    .role-tag.manager { background: #fdf4ff; color: #7e22ce; }
    .role-tag.hr_admin { background: #fff1f2; color: #be123c; }

    .status-dot { font-size: 1rem; }
    .status-dot.active { color: #16a34a; }
    .status-dot.pending_setup { color: #d97706; }
    .status-dot.inactive { color: #94a3b8; }

    .dot { font-size: 0.8rem; }
    .dot.active { color: #16a34a; }
    .dot.pending_setup { color: #d97706; }
    .dot.inactive { color: #94a3b8; }

    .empty { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.85rem; }

    .legend { display: flex; gap: 1rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; font-size: 0.72rem; color: #64748b; }

    /* Tips */
    .tips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .tip {
      background: white;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .tip-icon { font-size: 1.4rem; flex-shrink: 0; }
    .tip { font-size: 0.82rem; color: #475569; line-height: 1.6; }
    .tip strong { color: #1e293b; display: block; margin-bottom: 0.2rem; }
    .tip code { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.78rem; color: #D0271D; }
  `]
})
export class QuickSetupComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  search = '';
  creating = false;
  showPw = false;
  toast: { msg: string; type: string } | null = null;

  presets = PRESETS;

  roles = [
    { label: 'Employee', value: 'EMPLOYEE', color: '#1967D2' },
    { label: 'Manager', value: 'MANAGER', color: '#7e22ce' },
    { label: 'HR Admin', value: 'HR_ADMIN', color: '#be123c' },
  ];

  form = { firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '' };

  get filtered() {
    const q = this.search.toLowerCase();
    return this.employees.filter(e =>
      !q || `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q)
    );
  }

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.http.get<any[]>(`${API}/employees`).subscribe({ next: d => this.employees = d, error: () => {} });
    this.http.get<any[]>(`${API}/departments`).subscribe({ next: d => this.departments = d, error: () => {} });
  }

  applyPreset(p: any) {
    this.form = { firstName: p.firstName, lastName: p.lastName, email: p.email, password: p.password, role: p.role, departmentId: '' };
  }

  roleLabel(role: string) {
    return this.roles.find(r => r.value === role)?.label || role;
  }

  create(event: Event) {
    event.preventDefault();
    if (!this.form.password || this.form.password.length < 6) {
      this.toast = { msg: '✕ Password must be at least 6 characters.', type: 'error' };
      return;
    }
    this.creating = true;
    this.toast = null;

    const payload: any = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      email: this.form.email,
      role: this.form.role,
      password: this.form.password,
    };
    if (this.form.departmentId) payload.departmentId = Number(this.form.departmentId);

    this.http.post(`${API}/employees/quick`, payload).subscribe({
      next: () => {
        this.creating = false;
        this.toast = { msg: `✓ ${this.form.firstName} ${this.form.lastName} created and activated! Can log in immediately.`, type: 'success' };
        this.form = { firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '' };
        this.showPw = false;
        this.load();
        setTimeout(() => this.toast = null, 6000);
      },
      error: err => {
        this.creating = false;
        this.toast = { msg: `✕ Failed: ${err.error?.message || err.message || 'Email may already exist.'}`, type: 'error' };
      }
    });
  }
}
