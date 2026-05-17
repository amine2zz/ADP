import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../services/api.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { NotificationService } from '../services/notification.service';

interface FeatureConfig {
  id: number;
  featureKey: string;
  featureLabel: string;
  isEnabled: boolean;
  isCore: boolean;
  parentFeatureKey: string | null;
}

interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string;
  configLabel: string;
}

interface LabelOverride {
  id: number;
  labelKey: string;
  defaultValue: string;
  customValue: string | null;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-wrap">
      <div class="sa-header">
        <div class="sa-badge">SA</div>
        <div>
          <h1 class="sa-title">SuperAdmin Console</h1>
          <p class="sa-sub">Platform configuration — restricted access</p>
        </div>
      </div>

      <div class="sa-tabs">
        <button *ngFor="let t of tabs" [class.active]="activeTab === t.id" (click)="activeTab = t.id">{{ t.label }}</button>
      </div>

      <!-- Feature Flags -->
      <div *ngIf="activeTab === 'flags'" class="sa-panel">
        <h2>Feature Flags</h2>
        <p class="hint">Core features are always on and cannot be disabled.</p>
        <div class="flag-grid">
          <div *ngFor="let f of features" class="flag-card" [class.core]="f.isCore" [class.child]="f.parentFeatureKey">
            <div class="flag-info">
              <span class="flag-key">{{ f.featureKey }}</span>
              <span class="flag-label">{{ f.featureLabel }}</span>
              <span *ngIf="f.parentFeatureKey" class="flag-parent">child of {{ f.parentFeatureKey }}</span>
            </div>
            <label class="toggle" [class.disabled]="f.isCore">
              <input type="checkbox" [checked]="f.isEnabled" [disabled]="f.isCore" (change)="toggleFlag(f, $event)" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- System Config -->
      <div *ngIf="activeTab === 'config'" class="sa-panel">
        <h2>System Configuration</h2>
        <div class="config-grid">
          <div *ngFor="let c of configs" class="config-row">
            <label>{{ c.configLabel || c.configKey }}</label>
            <input [type]="c.configKey.includes('pass') ? 'password' : 'text'"
                   [(ngModel)]="c.configValue"
                   class="config-input" />
            <button class="btn-save" (click)="saveConfig(c)">Save</button>
          </div>
        </div>
      </div>

      <!-- Label Customisation -->
      <div *ngIf="activeTab === 'labels'" class="sa-panel">
        <h2>Label Customisation</h2>
        <p class="hint">Override UI text throughout the platform. Leave blank to use the default.</p>
        <div class="config-grid">
          <div *ngFor="let l of labels" class="config-row">
            <label>{{ l.labelKey }}</label>
            <span class="default-val">Default: "{{ l.defaultValue }}"</span>
            <input type="text" [(ngModel)]="l.customValue" [placeholder]="l.defaultValue" class="config-input" />
            <button class="btn-save" (click)="saveLabel(l)">Save</button>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div *ngIf="activeTab === 'users'" class="sa-panel">
        <h2>User Management</h2>
        <table class="sa-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>{{ u.firstName }} {{ u.lastName }}</td>
              <td>{{ u.email }}</td>
              <td><span class="role-badge" [class]="'role-' + u.role.toLowerCase()">{{ u.role }}</span></td>
              <td><span class="status-badge" [class]="'status-' + u.status.toLowerCase()">{{ u.status }}</span></td>
              <td class="actions">
                <button *ngIf="u.role !== 'SUPERADMIN'" class="btn-sm btn-promote" (click)="promote(u)">Promote SA</button>
                <button *ngIf="u.role === 'SUPERADMIN'" class="btn-sm btn-demote" (click)="demote(u)">Demote</button>
                <button *ngIf="u.status === 'ACTIVE'" class="btn-sm btn-deactivate" (click)="deactivate(u)">Deactivate</button>
                <button class="btn-sm btn-reset" (click)="forceReset(u)">Force Reset</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .sa-wrap { max-width: 1100px; margin: 0 auto; }
    .sa-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .sa-badge { background: #1e293b; color: white; font-weight: 900; font-size: 1rem; padding: 0.4rem 0.7rem; border-radius: 8px; }
    .sa-title { margin: 0; font-size: 1.5rem; color: #1e293b; }
    .sa-sub { margin: 0; font-size: 0.82rem; color: #64748b; }

    .sa-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    .sa-tabs button { background: none; border: none; padding: 0.5rem 1.25rem; font-weight: 600; font-size: 0.85rem; color: #64748b; cursor: pointer; border-radius: 6px 6px 0 0; }
    .sa-tabs button.active { color: var(--adp-red, #cc0000); border-bottom: 2px solid var(--adp-red, #cc0000); margin-bottom: -2px; }

    .sa-panel { background: white; border-radius: 12px; padding: 1.75rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .sa-panel h2 { margin: 0 0 0.5rem; font-size: 1.1rem; color: #1e293b; }
    .hint { color: #64748b; font-size: 0.82rem; margin-bottom: 1.25rem; }

    .flag-grid { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
    .flag-card { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; }
    .flag-card.core { background: #f8fafc; border-color: #cbd5e1; }
    .flag-card.child { margin-left: 1.5rem; border-style: dashed; }
    .flag-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .flag-key { font-family: monospace; font-size: 0.82rem; color: #475569; }
    .flag-label { font-weight: 600; font-size: 0.9rem; color: #1e293b; }
    .flag-parent { font-size: 0.75rem; color: #94a3b8; }

    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
    .toggle.disabled { cursor: not-allowed; opacity: 0.5; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; border-radius: 24px; transition: 0.3s; }
    .slider:before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    input:checked + .slider { background: #16a34a; }
    input:checked + .slider:before { transform: translateX(20px); }

    .config-grid { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
    .config-row { display: grid; grid-template-columns: 200px 1fr auto; align-items: center; gap: 0.75rem; }
    .config-row label { font-weight: 600; font-size: 0.875rem; color: #374151; }
    .config-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
    .default-val { grid-column: 2; font-size: 0.78rem; color: #94a3b8; margin-bottom: -0.5rem; }
    .btn-save { background: #1e293b; color: white; border: none; padding: 0.45rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .btn-save:hover { background: #0f172a; }

    .sa-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    .sa-table th { text-align: left; padding: 0.625rem 0.75rem; border-bottom: 2px solid #e2e8f0; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .sa-table td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; }
    .sa-table tr:last-child td { border-bottom: none; }

    .role-badge, .status-badge { padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .role-hr_admin { background: #dbeafe; color: #1d4ed8; }
    .role-manager { background: #fef3c7; color: #92400e; }
    .role-employee { background: #f1f5f9; color: #475569; }
    .role-superadmin { background: #1e293b; color: white; }
    .status-active { background: #dcfce7; color: #15803d; }
    .status-inactive { background: #fee2e2; color: #dc2626; }
    .status-pending_setup { background: #fef9c3; color: #a16207; }

    .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: 600; border: none; border-radius: 5px; cursor: pointer; }
    .btn-promote { background: #1e293b; color: white; }
    .btn-demote { background: #e2e8f0; color: #374151; }
    .btn-deactivate { background: #fee2e2; color: #dc2626; }
    .btn-reset { background: #fef3c7; color: #92400e; }
  `]
})
export class SuperAdminComponent implements OnInit {
  activeTab = 'flags';
  tabs = [
    { id: 'flags', label: 'Feature Flags' },
    { id: 'config', label: 'System Config' },
    { id: 'labels', label: 'Labels' },
    { id: 'users', label: 'Users' }
  ];

  features: FeatureConfig[] = [];
  configs: SystemConfig[] = [];
  labels: LabelOverride[] = [];
  users: Employee[] = [];

  constructor(
    private http: HttpClient,
    private flagService: FeatureFlagService,
    private notif: NotificationService
  ) {}

  ngOnInit() {
    this.loadFeatures();
    this.loadConfigs();
    this.loadLabels();
    this.loadUsers();
  }

  loadFeatures() {
    this.http.get<FeatureConfig[]>(`${API_BASE}/features`).subscribe(d => this.features = d);
  }

  loadConfigs() {
    this.http.get<SystemConfig[]>(`${API_BASE}/superadmin/config`).subscribe(d => this.configs = d);
  }

  loadLabels() {
    this.http.get<LabelOverride[]>(`${API_BASE}/superadmin/labels`).subscribe(d => this.labels = d);
  }

  loadUsers() {
    this.http.get<Employee[]>(`${API_BASE}/superadmin/users`).subscribe(d => this.users = d);
  }

  toggleFlag(f: FeatureConfig, event: Event) {
    const enabled = (event.target as HTMLInputElement).checked;
    this.http.patch(`${API_BASE}/features/${f.featureKey}/toggle`, { enabled }).subscribe({
      next: () => {
        f.isEnabled = enabled;
        this.flagService.reload();
        this.notif.show(`"${f.featureLabel}" ${enabled ? 'enabled' : 'disabled'}`, 'success');
        this.loadFeatures();
      },
      error: (e) => this.notif.show(e?.error?.details ?? 'Toggle failed', 'error')
    });
  }

  saveConfig(c: SystemConfig) {
    this.http.put(`${API_BASE}/superadmin/config/${c.configKey}`, { value: c.configValue }).subscribe({
      next: () => this.notif.show(`${c.configLabel || c.configKey} saved`, 'success'),
      error: () => this.notif.show('Save failed', 'error')
    });
  }

  saveLabel(l: LabelOverride) {
    this.http.put(`${API_BASE}/superadmin/labels/${l.labelKey}`, { customValue: l.customValue ?? '' }).subscribe({
      next: () => this.notif.show('Label saved', 'success'),
      error: () => this.notif.show('Save failed', 'error')
    });
  }

  promote(u: Employee) {
    this.http.patch(`${API_BASE}/superadmin/users/${u.id}/promote`, {}).subscribe({
      next: () => { this.notif.show(`${u.firstName} promoted to SuperAdmin`, 'success'); this.loadUsers(); },
      error: () => this.notif.show('Promote failed', 'error')
    });
  }

  demote(u: Employee) {
    this.http.patch(`${API_BASE}/superadmin/users/${u.id}/demote`, {}).subscribe({
      next: () => { this.notif.show(`${u.firstName} demoted`, 'success'); this.loadUsers(); },
      error: () => this.notif.show('Demote failed', 'error')
    });
  }

  deactivate(u: Employee) {
    this.http.patch(`${API_BASE}/superadmin/users/${u.id}/deactivate`, {}).subscribe({
      next: () => { this.notif.show(`${u.firstName} deactivated`, 'success'); this.loadUsers(); },
      error: () => this.notif.show('Deactivate failed', 'error')
    });
  }

  forceReset(u: Employee) {
    this.http.patch(`${API_BASE}/superadmin/users/${u.id}/force-reset`, {}).subscribe({
      next: () => this.notif.show(`Password reset triggered for ${u.firstName}`, 'info'),
      error: () => this.notif.show('Reset failed', 'error')
    });
  }
}
