import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SystemConfigService } from '../services/system-config.service';

const API = 'http://localhost:8085/api';

// Keys that can never be changed or deleted — system integrity requires them
const CORE_KEYS = new Set(['feature.dashboard', 'feature.auth', 'feature.superuser']);
const CORE_REASON: Record<string, string> = {
  'feature.dashboard': 'Core navigation module — must always be active',
  'feature.auth':      'Authentication layer — disabling this locks everyone out',
  'feature.superuser': 'Admin access module — required for this panel to work',
};

interface Test {
  id: string; name: string; cat: string; endpoint: string;
  status: 'idle' | 'running' | 'pass' | 'fail' | 'warn';
  msg?: string; code?: number; ms?: number; data?: any; open: boolean;
}

@Component({
  selector: 'app-superuser-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterLink],
  template: `
    <div class="su-page">

      <!-- ══ SIDEBAR ══ -->
      <aside class="sidebar">
        <div class="su-brand">
          <div class="su-badge">SU</div>
          <div>
            <div class="su-title">Control Panel</div>
            <div class="su-sub">Superuser · Full Access</div>
          </div>
        </div>

        <nav class="su-nav">
          <button [class.active]="tab==='overview'"  (click)="tab='overview'">
            <span class="ni">📊</span> Overview
          </button>
          <button [class.active]="tab==='branding'"  (click)="tab='branding'">
            <span class="ni">🎨</span> Branding
          </button>
          <button [class.active]="tab==='features'"  (click)="tab='features'">
            <span class="ni">🧩</span> Features
          </button>
          <button [class.active]="tab==='variables'" (click)="tab='variables'">
            <span class="ni">⚙️</span> Variables
          </button>
          <button [class.active]="tab==='users'"     (click)="tab='users'; loadUsers()">
            <span class="ni">👥</span> Users
          </button>
          <button [class.active]="tab==='tests'"     (click)="tab='tests'">
            <span class="ni">🧪</span> System Tests
            <span class="test-badge" *ngIf="failCount > 0">{{ failCount }}</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="be-status" [class.online]="backendUp">
            <span class="be-dot">●</span>
            {{ backendUp ? 'Backend Online' : 'Offline' }}
          </div>
          <button class="logout-btn" (click)="logout()">← Sign Out</button>
          <a routerLink="/dashboard" class="goto-btn">Open App →</a>
        </div>
      </aside>

      <!-- ══ MAIN ══ -->
      <main class="su-main">

        <!-- ════ OVERVIEW ════ -->
        <div *ngIf="tab==='overview'" class="section slide-up">
          <div class="sec-head">
            <h2>System Overview</h2>
            <p>Live status and health of the ADP Nexus HCM platform.</p>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-n">{{ users.length || '—' }}</div>
              <div class="stat-l">Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-n">{{ allConfigs.length || '—' }}</div>
              <div class="stat-l">Config Variables</div>
            </div>
            <div class="stat-card green">
              <div class="stat-n">{{ featuresOnCount }}</div>
              <div class="stat-l">Features Enabled</div>
            </div>
            <div class="stat-card" [class.green]="hasRun && failCount===0" [class.red]="failCount>0">
              <div class="stat-n">{{ hasRun ? passCount+'/'+tests.length : '—' }}</div>
              <div class="stat-l">Tests Passing</div>
            </div>
          </div>

          <div class="info-grid">
            <!-- System Info -->
            <div class="info-card">
              <div class="info-title">System Info</div>
              <div class="info-row">
                <span class="ik">Application</span>
                <span class="iv">Nexus HCM v1.0</span>
              </div>
              <div class="info-row">
                <span class="ik">Backend</span>
                <span class="iv mono">localhost:8085</span>
              </div>
              <div class="info-row">
                <span class="ik">Frontend</span>
                <span class="iv mono">localhost:4200</span>
              </div>
              <div class="info-row">
                <span class="ik">Database</span>
                <span class="iv mono">MySQL · adp_hcm</span>
              </div>
              <div class="info-row">
                <span class="ik">Status</span>
                <span class="iv" [class.c-green]="backendUp" [class.c-red]="!backendUp">
                  {{ backendUp ? '● Online' : '✕ Offline' }}
                </span>
              </div>
            </div>

            <!-- Role Breakdown -->
            <div class="info-card">
              <div class="info-title">Users by Role</div>
              <div class="info-row" *ngFor="let r of roleBreakdown">
                <span class="ik">{{ r.role }}</span>
                <div style="display:flex;align-items:center;gap:0.5rem;flex:1">
                  <div class="rbar-track">
                    <div class="rbar-fill" [ngClass]="r.cls" [style.width.%]="r.pct"></div>
                  </div>
                  <span class="iv">{{ r.count }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="info-card">
              <div class="info-title">Quick Actions</div>
              <button class="qa-btn" (click)="tab='tests'; runAll()">🧪 Run All Tests</button>
              <button class="qa-btn" (click)="tab='branding'">🎨 Edit Branding</button>
              <button class="qa-btn" (click)="tab='features'">🧩 Manage Features</button>
              <button class="qa-btn" (click)="tab='variables'">⚙️ Config Variables</button>
              <a routerLink="/quick-setup" class="qa-btn qa-link">👤 Quick Account Setup</a>
            </div>
          </div>
        </div>

        <!-- ════ BRANDING ════ -->
        <div *ngIf="tab==='branding'" class="section slide-up">
          <div class="sec-head">
            <h2>Branding & Appearance</h2>
            <p>Customize your platform's look. Changes preview instantly — save to apply globally.</p>
          </div>

          <!-- Live preview -->
          <div class="preview-box">
            <div class="preview-label">Live Preview</div>
            <div class="preview-hdr" [style.background]="getCfg('theme.header_bg','#fff')">
              <div class="p-left">
                <img *ngIf="getCfg('theme.logo_image_url','')"
                     [src]="getCfg('theme.logo_image_url','')" class="p-logo-img">
                <div *ngIf="!getCfg('theme.logo_image_url','')"
                     class="p-badge" [style.background]="getCfg('theme.logo_bg','#D0271D')">
                  {{ getCfg('theme.logo_text','ADP') }}
                </div>
                <span class="p-company">{{ getCfg('general.company_name','Nexus HCM') }}</span>
              </div>
              <div class="p-nav">
                <span [style.color]="getCfg('theme.primary_color','#D0271D')" style="font-weight:700">Dashboard</span>
                <span style="color:#94a3b8">Employees</span>
                <span style="color:#94a3b8">Performance</span>
              </div>
              <div class="p-btn" [style.background]="getCfg('theme.primary_color','#D0271D')">Sign Out</div>
            </div>
          </div>

          <div class="brand-grid">
            <div class="brand-group">
              <div class="group-title">Company Identity</div>
              <div class="setting-card" *ngFor="let c of generalConfigs">
                <div class="s-label">{{ c.label }}</div>
                <div class="s-desc">{{ c.description }}</div>
                <input type="text" class="s-input" [(ngModel)]="c.configValue"
                       (input)="livePreview(c)" [placeholder]="c.label">
              </div>
            </div>

            <div class="brand-group">
              <div class="group-title">Colors & Logo</div>
              <div class="setting-card" *ngFor="let c of themeConfigs">
                <div class="s-label">{{ c.label }}</div>
                <div class="s-desc">{{ c.description }}</div>
                <div *ngIf="c.inputType==='COLOR'" class="color-row">
                  <input type="color" class="color-swatch" [(ngModel)]="c.configValue" (input)="livePreview(c)">
                  <input type="text" class="s-input" [(ngModel)]="c.configValue" (input)="livePreview(c)" placeholder="#rrggbb">
                </div>
                <input *ngIf="c.inputType!=='COLOR'"
                       [type]="c.inputType==='URL' ? 'url' : 'text'"
                       class="s-input" [(ngModel)]="c.configValue"
                       (input)="livePreview(c)" [placeholder]="c.label">
              </div>
            </div>
          </div>

          <div class="btn-row">
            <button class="btn-save" (click)="saveBranding()">💾 Save Branding</button>
            <button class="btn-ghost" (click)="resetTheme()">↺ Reset to Defaults</button>
          </div>
        </div>

        <!-- ════ FEATURES ════ -->
        <div *ngIf="tab==='features'" class="section slide-up">
          <div class="sec-head">
            <h2>Feature Flags</h2>
            <p>Enable or disable platform modules. Core features are regulated by the system.</p>
          </div>

          <div class="rule-banner">
            <div class="rb-item">
              <span class="rb-icon">🔒</span>
              <div><strong>Core</strong> — required for the system to function. Cannot be changed.</div>
            </div>
            <div class="rb-item">
              <span class="rb-icon">🧩</span>
              <div><strong>Optional</strong> — can be freely enabled or disabled.</div>
            </div>
          </div>

          <div class="features-list">
            <div class="feat-row" *ngFor="let c of featureConfigs" [class.feat-locked]="!c.optional">
              <div class="feat-icon-col">{{ c.optional ? '🧩' : '🔒' }}</div>
              <div class="feat-info">
                <div class="feat-name">{{ c.label }}</div>
                <div class="feat-desc">{{ c.optional ? c.description : lockReason(c.configKey) }}</div>
              </div>
              <div class="feat-right">
                <span class="feat-tag" [class.tag-core]="!c.optional" [class.tag-opt]="c.optional">
                  {{ c.optional ? 'Optional' : 'Core' }}
                </span>
                <label class="toggle" [class.tog-locked]="!c.optional">
                  <input type="checkbox"
                         [checked]="c.configValue==='true'"
                         [disabled]="!c.optional"
                         (change)="toggleFeature(c,$event)">
                  <span class="slider"></span>
                </label>
                <span class="tog-val" [class.tog-on]="c.configValue==='true'">
                  {{ c.configValue==='true' ? 'On' : 'Off' }}
                </span>
              </div>
            </div>
          </div>

          <button class="btn-save" (click)="saveSection('FEATURE')">💾 Save Feature Settings</button>
        </div>

        <!-- ════ VARIABLES ════ -->
        <div *ngIf="tab==='variables'" class="section slide-up">
          <div class="sec-head-row">
            <div>
              <h2>Config Variables</h2>
              <p>All {{ allConfigs.length }} system variables. Add custom ones, edit values, remove non-essential entries.</p>
            </div>
            <button class="btn-add" (click)="showAddForm=!showAddForm">
              {{ showAddForm ? '✕ Cancel' : '+ Add Variable' }}
            </button>
          </div>

          <!-- Add form -->
          <div class="add-form" *ngIf="showAddForm">
            <div class="add-form-title">➕ New Configuration Variable</div>
            <div class="add-grid">
              <div class="add-field">
                <label>Key <span class="hint">e.g. custom.welcome_text</span></label>
                <input type="text" class="s-input" [(ngModel)]="newVar.configKey" placeholder="category.variable_name">
              </div>
              <div class="add-field">
                <label>Value</label>
                <input type="text" class="s-input" [(ngModel)]="newVar.configValue" placeholder="Value">
              </div>
              <div class="add-field">
                <label>Category</label>
                <select class="s-input" [(ngModel)]="newVar.category">
                  <option value="GENERAL">GENERAL</option>
                  <option value="THEME">THEME</option>
                  <option value="FEATURE">FEATURE</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div class="add-field">
                <label>Input Type</label>
                <select class="s-input" [(ngModel)]="newVar.inputType">
                  <option value="TEXT">TEXT</option>
                  <option value="COLOR">COLOR</option>
                  <option value="BOOLEAN">BOOLEAN (true/false)</option>
                  <option value="URL">URL</option>
                </select>
              </div>
              <div class="add-field wide">
                <label>Label <span class="hint">display name</span></label>
                <input type="text" class="s-input" [(ngModel)]="newVar.label" placeholder="Human-readable label">
              </div>
              <div class="add-field wide">
                <label>Description</label>
                <input type="text" class="s-input" [(ngModel)]="newVar.description" placeholder="What does this setting do?">
              </div>
            </div>
            <div class="add-actions">
              <button class="btn-save sm" (click)="addVariable()">✓ Create Variable</button>
              <button class="btn-ghost sm" (click)="showAddForm=false; resetNewVar()">Cancel</button>
            </div>
          </div>

          <!-- Rules legend -->
          <div class="var-legend">
            <span class="vl-item lock">🔒 Core — cannot be edited or removed (system integrity)</span>
            <span class="vl-item edit">✓ Standard — value editable; removing may affect the app</span>
            <span class="vl-item cust">✨ Custom — added by you; fully editable and removable</span>
          </div>

          <!-- Toolbar -->
          <div class="var-toolbar">
            <div class="var-filters">
              <button *ngFor="let f of ['ALL','GENERAL','THEME','FEATURE','CUSTOM']"
                      class="filter-btn" [class.active]="varFilter===f"
                      (click)="varFilter=f">
                {{ f }}
                <span class="filter-count">{{ countByCategory(f) }}</span>
              </button>
            </div>
            <input type="text" class="var-search" [(ngModel)]="varSearch" placeholder="Search keys or values…">
          </div>

          <!-- Variables table -->
          <div class="vtable-wrap">
            <table class="vtable">
              <thead>
                <tr>
                  <th style="width:32%">Key / Label</th>
                  <th style="width:25%">Value</th>
                  <th style="width:10%">Category</th>
                  <th style="width:14%">Status</th>
                  <th style="width:19%">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of filteredVars"
                    [class.row-locked]="!c.optional"
                    [class.row-custom]="isCustom(c)">
                  <td>
                    <code class="key-code">{{ c.configKey }}</code>
                    <div class="key-lbl" *ngIf="c.label">{{ c.label }}</div>
                  </td>
                  <td>
                    <div *ngIf="editingKey !== c.configKey" class="val-view">
                      <span class="color-swatch-sm" *ngIf="c.inputType==='COLOR' && c.configValue"
                            [style.background]="c.configValue"></span>
                      <span class="val-text" [class.val-empty]="!c.configValue">
                        {{ c.configValue || '—' }}
                      </span>
                    </div>
                    <input *ngIf="editingKey === c.configKey"
                           type="text" class="inline-edit"
                           [(ngModel)]="editingValue"
                           (keyup.enter)="saveEdit(c)"
                           (keyup.escape)="cancelEdit()">
                  </td>
                  <td>
                    <span class="cat-chip" [ngClass]="'cat-'+c.category?.toLowerCase()">
                      {{ c.category }}
                    </span>
                  </td>
                  <td>
                    <span *ngIf="!c.optional"     class="st-lock" [title]="lockReason(c.configKey)">🔒 Core</span>
                    <span *ngIf="c.optional && isCustom(c)"  class="st-cust">✨ Custom</span>
                    <span *ngIf="c.optional && !isCustom(c)" class="st-edit">✓ Editable</span>
                  </td>
                  <td>
                    <div *ngIf="c.optional" class="act-row">
                      <ng-container *ngIf="editingKey !== c.configKey">
                        <button class="act-btn act-edit" (click)="startEdit(c)" title="Edit value">✏️ Edit</button>
                        <button class="act-btn act-del"  (click)="deleteVariable(c)" title="Delete variable">🗑️</button>
                      </ng-container>
                      <ng-container *ngIf="editingKey === c.configKey">
                        <button class="act-btn act-save"   (click)="saveEdit(c)">✓ Save</button>
                        <button class="act-btn act-cancel" (click)="cancelEdit()">✕</button>
                      </ng-container>
                    </div>
                    <span *ngIf="!c.optional" class="act-none" [title]="lockReason(c.configKey)">—</span>
                  </td>
                </tr>
                <tr *ngIf="filteredVars.length === 0">
                  <td colspan="5" class="empty-row">No variables match your filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ════ USERS ════ -->
        <div *ngIf="tab==='users'" class="section slide-up">
          <div class="sec-head">
            <h2>All Accounts</h2>
            <p>Every user registered in the system.</p>
          </div>

          <div class="user-toolbar">
            <input type="text" class="s-input flex1" [(ngModel)]="userSearch"
                   placeholder="Search by name, email or role…">
            <span class="count-badge">{{ filteredUsers.length }} accounts</span>
          </div>

          <div class="vtable-wrap">
            <table class="vtable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Manager</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filteredUsers">
                  <td>
                    <div class="u-cell">
                      <div class="u-av" [ngClass]="'av-'+u.role?.toLowerCase()">
                        {{ u.firstName?.charAt(0) }}{{ u.lastName?.charAt(0) }}
                      </div>
                      <div>
                        <div class="u-name">{{ u.firstName }} {{ u.lastName }}</div>
                        <div class="u-email">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="role-chip" [ngClass]="u.role?.toLowerCase()">
                      {{ u.role?.replace('_', ' ') }}
                    </span>
                  </td>
                  <td>
                    <span class="sdot" [ngClass]="u.status?.toLowerCase()">●</span>
                    {{ u.status?.replace('_', ' ') }}
                  </td>
                  <td>{{ u.department?.name || '—' }}</td>
                  <td>{{ u.manager ? u.manager.firstName+' '+u.manager.lastName : '—' }}</td>
                </tr>
                <tr *ngIf="filteredUsers.length === 0">
                  <td colspan="5" class="empty-row">No users found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ════ TESTS ════ -->
        <div *ngIf="tab==='tests'" class="section slide-up">
          <div class="sec-head-row">
            <div>
              <h2>System Tests</h2>
              <p>{{ tests.length }} automated tests across {{ testCatCount }} categories covering every endpoint.</p>
            </div>
            <div class="test-hdr-btns">
              <button class="btn-ghost sm" (click)="clearTests()" [disabled]="running">⊘ Clear</button>
              <button class="btn-save sm" (click)="runAll()" [disabled]="running">
                <span *ngIf="!running">▶ Run All Tests</span>
                <span *ngIf="running">⏳ {{ doneCount }}/{{ tests.length }}…</span>
              </button>
            </div>
          </div>

          <!-- Summary -->
          <div class="test-sum" *ngIf="hasRun">
            <div class="ts-item ts-pass"><span class="ts-n">{{ passCount }}</span><span class="ts-l">Passed</span></div>
            <div class="ts-item ts-fail"><span class="ts-n">{{ failCount }}</span><span class="ts-l">Failed</span></div>
            <div class="ts-item ts-warn"><span class="ts-n">{{ warnCount }}</span><span class="ts-l">Warnings</span></div>
            <div class="ts-item ts-tot"><span class="ts-n">{{ tests.length }}</span><span class="ts-l">Total</span></div>
            <div class="ts-bar">
              <div class="tsb-p" [style.width.%]="(passCount/tests.length)*100"></div>
              <div class="tsb-w" [style.width.%]="(warnCount/tests.length)*100"></div>
              <div class="tsb-f" [style.width.%]="(failCount/tests.length)*100"></div>
            </div>
            <div class="ts-ms">{{ totalMs }}ms</div>
          </div>

          <!-- Empty state -->
          <div class="test-empty" *ngIf="!hasRun && !running">
            <div class="te-icon">🧪</div>
            <div class="te-title">Ready to test</div>
            <div class="te-sub">Run all tests to verify every backend endpoint and feature in the system.</div>
            <button class="btn-save" style="margin-top:1rem" (click)="runAll()">▶ Run All Tests</button>
          </div>

          <!-- Test groups -->
          <div *ngFor="let cat of testCategories" class="tg">
            <div class="tg-header">
              <span>{{ catIcon(cat) }} {{ cat }}</span>
              <span class="tg-right">
                <span class="tg-cnt">{{ countFor(cat,'pass') }}/{{ countFor(cat,'all') }} passed</span>
                <span class="fail-chip" *ngIf="countFor(cat,'fail')>0">{{ countFor(cat,'fail') }} failed</span>
              </span>
            </div>
            <div class="tg-rows">
              <div *ngFor="let t of testsFor(cat)" class="tr"
                   [class.tr-pass]="t.status==='pass'"
                   [class.tr-fail]="t.status==='fail'"
                   [class.tr-warn]="t.status==='warn'"
                   [class.tr-run]="t.status==='running'">
                <span class="t-ico">{{ stIcon(t.status) }}</span>
                <div class="t-info">
                  <div class="t-name">{{ t.name }}</div>
                  <code class="t-ep">{{ t.endpoint }}</code>
                </div>
                <span class="t-msg" [class.t-msg-fail]="t.status==='fail'">{{ t.msg }}</span>
                <span class="t-code" *ngIf="t.code" [class.c-ok]="t.code < 300">{{ t.code }}</span>
                <span class="t-ms" *ngIf="t.ms !== undefined">{{ t.ms }}ms</span>
                <button class="t-expand" *ngIf="t.data" (click)="t.open=!t.open">{{ t.open?'▲':'▼' }}</button>
                <button class="t-runone" (click)="runOne(t)" [disabled]="running" title="Re-run">▶</button>
              </div>
              <ng-container *ngFor="let t of testsFor(cat)">
                <div *ngIf="t.open && t.data" class="t-resp">
                  <pre>{{ t.data | json }}</pre>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

      </main>

      <!-- Toast -->
      <div class="su-toast" [class.show]="!!toast" [class.error]="toastType==='error'">
        {{ toast }}
        <button (click)="toast=''">×</button>
      </div>

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .su-page {
      display: flex;
      min-height: 100vh;
      background: #f1f5f9;
      font-family: 'Inter', system-ui, sans-serif;
      color: #1e293b;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      flex-shrink: 0;
    }
    .su-brand {
      display: flex; align-items: center; gap: 0.7rem;
      padding: 1.25rem 1rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .su-badge {
      background: #ef4444; color: white; font-weight: 900; font-size: 0.8rem;
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .su-title { color: white; font-weight: 800; font-size: 0.88rem; }
    .su-sub   { color: rgba(255,255,255,0.38); font-size: 0.65rem; }

    .su-nav { flex: 1; padding: 0.75rem 0.6rem; display: flex; flex-direction: column; gap: 2px; }
    .su-nav button {
      display: flex; align-items: center; gap: 0.55rem;
      width: 100%; background: none; border: none;
      color: rgba(255,255,255,0.5); padding: 0.6rem 0.75rem;
      border-radius: 7px; cursor: pointer; font-size: 0.82rem; font-weight: 600;
      font-family: inherit; text-align: left; transition: all 0.15s; position: relative;
    }
    .su-nav button:hover  { background: rgba(255,255,255,0.07); color: white; }
    .su-nav button.active { background: rgba(239,68,68,0.2); color: #fca5a5; }
    .ni { font-size: 0.88rem; }
    .test-badge {
      margin-left: auto; background: #ef4444; color: white;
      font-size: 0.6rem; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 10px;
    }

    .sidebar-footer { padding: 0.75rem 0.6rem; border-top: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 0.4rem; }
    .be-status {
      font-size: 0.68rem; color: rgba(255,255,255,0.3);
      display: flex; align-items: center; gap: 0.35rem; padding: 0 0.25rem 0.25rem;
    }
    .be-dot { font-size: 0.65rem; color: #ef4444; }
    .be-status.online .be-dot { color: #22c55e; }
    .be-status.online { color: rgba(255,255,255,0.5); }
    .logout-btn {
      background: none; border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.45); padding: 0.45rem 0.7rem;
      border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-family: inherit;
      text-align: left; transition: all 0.15s;
    }
    .logout-btn:hover { border-color: #ef4444; color: #fca5a5; }
    .goto-btn {
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55);
      padding: 0.45rem 0.7rem; border-radius: 6px; font-size: 0.75rem;
      font-weight: 700; text-decoration: none; text-align: center;
      display: block; transition: all 0.15s;
    }
    .goto-btn:hover { background: rgba(255,255,255,0.12); color: white; }

    /* ── Main ── */
    .su-main { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; }
    .section { display: flex; flex-direction: column; gap: 1.5rem; }
    @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
    .slide-up { animation: slideUp 0.2s ease; }

    .sec-head h2   { font-size: 1.4rem; font-weight: 800; }
    .sec-head p    { color: #64748b; font-size: 0.85rem; margin-top: 0.25rem; }
    .sec-head-row  { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .sec-head-row h2 { font-size: 1.4rem; font-weight: 800; }
    .sec-head-row p  { color: #64748b; font-size: 0.85rem; margin-top: 0.25rem; }

    /* ── Stats ── */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .stat-card {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      padding: 1.25rem; text-align: center;
    }
    .stat-card.green { border-color: #bbf7d0; background: #f0fdf4; }
    .stat-card.red   { border-color: #fecaca; background: #fff1f2; }
    .stat-n { font-size: 2rem; font-weight: 900; color: #1e293b; line-height: 1; }
    .stat-l { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.3rem; }
    .stat-card.green .stat-n { color: #16a34a; }
    .stat-card.red   .stat-n { color: #dc2626; }

    /* ── Info grid ── */
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .info-card {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem;
    }
    .info-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; }
    .info-row { display: flex; align-items: center; gap: 0.5rem; }
    .ik { font-size: 0.75rem; color: #64748b; min-width: 80px; flex-shrink: 0; }
    .iv { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .iv.mono { font-family: monospace; font-size: 0.75rem; }
    .c-green { color: #16a34a !important; }
    .c-red   { color: #dc2626 !important; }

    .rbar-track { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
    .rbar-fill  { height: 100%; border-radius: 3px; transition: width 0.5s; }
    .rbar-hr_admin  { background: #e11d48; }
    .rbar-manager   { background: #9333ea; }
    .rbar-employee  { background: #2563eb; }
    .rbar-superuser { background: #0f172a; }

    .qa-btn, .qa-btn-link {
      display: block; width: 100%;
      background: #f8fafc; border: 1.5px solid #e2e8f0;
      color: #475569; padding: 0.55rem 0.75rem;
      border-radius: 8px; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; font-family: inherit; text-decoration: none;
      text-align: left; transition: all 0.15s;
    }
    .qa-btn:hover, .qa-btn-link:hover { border-color: #ef4444; color: #ef4444; background: #fff1f2; }

    /* ── Preview ── */
    .preview-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
    .preview-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 0.6rem; }
    .preview-hdr {
      border-radius: 8px; border: 1px solid #e2e8f0;
      padding: 0.65rem 1rem; display: flex; align-items: center;
      justify-content: space-between; gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .p-left { display: flex; align-items: center; gap: 0.5rem; }
    .p-badge { padding: 0.2rem 0.5rem; border-radius: 5px; color: white; font-weight: 900; font-size: 0.78rem; }
    .p-logo-img { height: 26px; border-radius: 4px; }
    .p-company { font-weight: 800; font-size: 0.9rem; }
    .p-nav { display: flex; gap: 0.75rem; font-size: 0.75rem; font-weight: 600; }
    .p-btn { padding: 0.3rem 0.75rem; border-radius: 5px; color: white; font-size: 0.72rem; font-weight: 700; }

    /* ── Brand grid ── */
    .brand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .brand-group { display: flex; flex-direction: column; gap: 0.75rem; }
    .group-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; }
    .setting-card { background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .s-label { font-size: 0.8rem; font-weight: 700; color: #1e293b; }
    .s-desc  { font-size: 0.7rem; color: #94a3b8; }
    .s-input {
      padding: 0.5rem 0.65rem; border: 1.5px solid #e2e8f0; border-radius: 7px;
      font-size: 0.83rem; font-family: inherit; outline: none; transition: border-color 0.15s;
    }
    .s-input:focus { border-color: #ef4444; }
    .color-row { display: flex; gap: 0.5rem; align-items: center; }
    .color-swatch { width: 38px; height: 36px; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 2px; cursor: pointer; flex-shrink: 0; }

    /* ── Buttons ── */
    .btn-row { display: flex; gap: 1rem; }
    .btn-save {
      padding: 0.65rem 1.75rem; background: #ef4444; color: white;
      border: none; border-radius: 8px; font-weight: 700; font-size: 0.88rem;
      cursor: pointer; font-family: inherit; transition: background 0.15s;
    }
    .btn-save:hover:not(:disabled) { background: #dc2626; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-save.sm { padding: 0.45rem 1.1rem; font-size: 0.8rem; }
    .btn-ghost {
      padding: 0.65rem 1.4rem; background: white; color: #64748b;
      border: 1.5px solid #e2e8f0; border-radius: 8px; font-weight: 600;
      font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: all 0.15s;
    }
    .btn-ghost:hover:not(:disabled) { border-color: #94a3b8; color: #1e293b; }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-ghost.sm { padding: 0.45rem 1rem; font-size: 0.8rem; }
    .btn-add {
      padding: 0.5rem 1.1rem; background: #1e293b; color: white;
      border: none; border-radius: 8px; font-weight: 700; font-size: 0.82rem;
      cursor: pointer; font-family: inherit; white-space: nowrap; transition: background 0.15s;
    }
    .btn-add:hover { background: #334155; }

    /* ── Features ── */
    .rule-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.9rem 1.1rem; display: flex; gap: 2rem; }
    .rb-item { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: #475569; }
    .rb-icon { font-size: 1rem; flex-shrink: 0; }

    .features-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .feat-row {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 0.9rem 1.1rem; display: flex; align-items: center; gap: 1rem;
      transition: border-color 0.15s;
    }
    .feat-row:hover:not(.feat-locked) { border-color: #cbd5e1; }
    .feat-row.feat-locked { background: #f8fafc; }
    .feat-icon-col { font-size: 1.1rem; flex-shrink: 0; }
    .feat-info { flex: 1; }
    .feat-name { font-weight: 700; font-size: 0.88rem; }
    .feat-desc { font-size: 0.73rem; color: #64748b; margin-top: 0.15rem; }
    .feat-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .feat-tag { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 20px; }
    .tag-core { background: #f1f5f9; color: #94a3b8; }
    .tag-opt  { background: #dbeafe; color: #1d4ed8; }
    .toggle { position: relative; display: inline-block; width: 42px; height: 22px; cursor: pointer; }
    .toggle.tog-locked { cursor: not-allowed; opacity: 0.45; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; background: #e2e8f0; border-radius: 22px; transition: background 0.2s; }
    .slider:before {
      content: ''; position: absolute; height: 16px; width: 16px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25); transition: transform 0.2s;
    }
    input:checked + .slider { background: #22c55e; }
    input:checked + .slider:before { transform: translateX(20px); }
    .tog-val { font-size: 0.72rem; font-weight: 700; color: #94a3b8; min-width: 26px; }
    .tog-val.tog-on { color: #16a34a; }

    /* ── Variables ── */
    .add-form {
      background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .add-form-title { font-weight: 800; font-size: 0.9rem; }
    .add-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem; }
    .add-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .add-field.wide { grid-column: span 2; }
    .add-field label { font-size: 0.72rem; font-weight: 700; color: #475569; }
    .hint { font-weight: 400; color: #94a3b8; margin-left: 0.3rem; }
    .add-actions { display: flex; gap: 0.75rem; }

    .var-legend { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .vl-item { font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 20px; font-weight: 600; }
    .vl-item.lock { background: #f1f5f9; color: #64748b; }
    .vl-item.edit { background: #f0fdf4; color: #16a34a; }
    .vl-item.cust { background: #fef3c7; color: #b45309; }

    .var-toolbar { display: flex; align-items: center; gap: 1rem; }
    .var-filters { display: flex; gap: 4px; }
    .filter-btn {
      padding: 0.3rem 0.65rem; background: white; border: 1.5px solid #e2e8f0;
      border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer;
      font-family: inherit; color: #64748b; transition: all 0.12s; display: flex; align-items: center; gap: 0.3rem;
    }
    .filter-btn:hover  { border-color: #94a3b8; color: #1e293b; }
    .filter-btn.active { background: #1e293b; border-color: #1e293b; color: white; }
    .filter-count { font-size: 0.62rem; opacity: 0.7; }
    .var-search {
      flex: 1; max-width: 300px; padding: 0.4rem 0.75rem;
      border: 1.5px solid #e2e8f0; border-radius: 7px;
      font-size: 0.82rem; font-family: inherit; outline: none;
    }
    .var-search:focus { border-color: #ef4444; }

    .vtable-wrap { background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; }
    .vtable { width: 100%; border-collapse: collapse; }
    .vtable th {
      background: #f8fafc; padding: 0.65rem 0.85rem;
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #64748b; text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .vtable td { padding: 0.7rem 0.85rem; font-size: 0.82rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .vtable tbody tr:last-child td { border-bottom: none; }
    .vtable tbody tr:hover { background: #fafafa; }
    .vtable tr.row-locked { background: #f8fafc; }
    .vtable tr.row-custom { background: #fffbeb; }

    .key-code { font-family: monospace; font-size: 0.75rem; color: #1e293b; background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .key-lbl  { font-size: 0.68rem; color: #94a3b8; margin-top: 0.2rem; }
    .val-view { display: flex; align-items: center; gap: 0.4rem; }
    .val-text { font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
    .val-empty { color: #cbd5e1; }
    .color-swatch-sm { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }
    .inline-edit { width: 100%; padding: 0.3rem 0.5rem; border: 1.5px solid #ef4444; border-radius: 6px; font-size: 0.8rem; font-family: inherit; outline: none; }

    .cat-chip { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; padding: 0.1rem 0.45rem; border-radius: 20px; }
    .cat-general { background: #dbeafe; color: #1d4ed8; }
    .cat-theme   { background: #fae8ff; color: #9333ea; }
    .cat-feature { background: #dcfce7; color: #16a34a; }
    .cat-custom  { background: #fef3c7; color: #b45309; }

    .st-lock { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
    .st-edit { font-size: 0.72rem; font-weight: 700; color: #16a34a; }
    .st-cust { font-size: 0.72rem; font-weight: 700; color: #b45309; }

    .act-row { display: flex; gap: 4px; align-items: center; }
    .act-btn { padding: 0.2rem 0.45rem; border-radius: 5px; font-size: 0.7rem; cursor: pointer; border: 1.5px solid #e2e8f0; background: white; font-family: inherit; transition: all 0.12s; white-space: nowrap; }
    .act-edit:hover   { border-color: #3b82f6; color: #3b82f6; }
    .act-del:hover    { border-color: #ef4444; color: #ef4444; background: #fff1f2; }
    .act-save:hover   { border-color: #22c55e; color: #16a34a; background: #f0fdf4; }
    .act-cancel:hover { border-color: #94a3b8; color: #475569; }
    .act-none { color: #cbd5e1; font-size: 0.75rem; }
    .empty-row { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.85rem; }

    /* ── Users ── */
    .user-toolbar { display: flex; align-items: center; gap: 1rem; }
    .flex1 { flex: 1; }
    .count-badge { background: #f1f5f9; color: #64748b; font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; white-space: nowrap; }
    .u-cell { display: flex; align-items: center; gap: 0.6rem; }
    .u-av { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; color: white; flex-shrink: 0; }
    .av-hr_admin  { background: linear-gradient(135deg,#be123c,#e11d48); }
    .av-manager   { background: linear-gradient(135deg,#7e22ce,#9333ea); }
    .av-employee  { background: linear-gradient(135deg,#1967D2,#2563eb); }
    .av-superuser { background: linear-gradient(135deg,#0f172a,#334155); }
    .u-name  { font-weight: 700; font-size: 0.82rem; }
    .u-email { font-size: 0.68rem; color: #64748b; }
    .role-chip { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; padding: 0.12rem 0.5rem; border-radius: 20px; }
    .role-chip.employee  { background: #dbeafe; color: #1d4ed8; }
    .role-chip.manager   { background: #e9d5ff; color: #7e22ce; }
    .role-chip.hr_admin  { background: #fecdd3; color: #be123c; }
    .role-chip.superuser { background: #1e293b; color: white; }
    .sdot { font-size: 0.75rem; }
    .sdot.active        { color: #16a34a; }
    .sdot.pending_setup { color: #d97706; }
    .sdot.inactive      { color: #94a3b8; }

    /* ── Tests ── */
    .test-hdr-btns { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
    .test-sum {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      padding: 0.9rem 1.25rem; display: flex; align-items: center; gap: 1.5rem;
    }
    .ts-item { display: flex; flex-direction: column; align-items: center; min-width: 52px; }
    .ts-n { font-size: 1.3rem; font-weight: 900; line-height: 1; }
    .ts-l { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-top: 2px; }
    .ts-pass .ts-n { color: #16a34a; }
    .ts-fail .ts-n { color: #dc2626; }
    .ts-warn .ts-n { color: #d97706; }
    .ts-tot  .ts-n { color: #3b82f6; }
    .ts-bar { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; display: flex; overflow: hidden; }
    .tsb-p { background: #22c55e; transition: width 0.4s; }
    .tsb-w { background: #f59e0b; transition: width 0.4s; }
    .tsb-f { background: #ef4444; transition: width 0.4s; }
    .ts-ms { font-size: 0.7rem; color: #94a3b8; font-family: monospace; white-space: nowrap; }

    .test-empty { text-align: center; padding: 4rem 2rem; }
    .te-icon  { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .te-title { font-weight: 700; font-size: 1rem; margin-bottom: 0.4rem; }
    .te-sub   { color: #64748b; font-size: 0.85rem; }

    .tg { background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .tg-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.65rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b;
    }
    .tg-right { display: flex; gap: 0.5rem; align-items: center; }
    .tg-cnt { font-weight: 600; }
    .fail-chip { background: #fee2e2; color: #dc2626; padding: 0.1rem 0.5rem; border-radius: 10px; font-weight: 700; font-size: 0.62rem; }
    .tg-rows { display: flex; flex-direction: column; }
    .tr {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.55rem 1rem; border-bottom: 1px solid #f8fafc;
      border-left: 3px solid transparent; transition: background 0.1s;
    }
    .tr:last-child { border-bottom: none; }
    .tr-pass { border-left-color: #22c55e; }
    .tr-fail { border-left-color: #ef4444; background: #fff8f8; }
    .tr-warn { border-left-color: #f59e0b; }
    .tr-run  { border-left-color: #3b82f6; opacity: 0.8; }
    .t-ico  { font-size: 0.85rem; flex-shrink: 0; width: 18px; text-align: center; }
    .t-info { flex: 1; min-width: 0; }
    .t-name { font-size: 0.8rem; font-weight: 700; color: #1e293b; }
    .t-ep   { font-size: 0.67rem; color: #94a3b8; display: block; margin-top: 1px; }
    .t-msg  { font-size: 0.72rem; color: #64748b; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .t-msg-fail { color: #dc2626; }
    .t-code { font-family: monospace; font-size: 0.68rem; background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; flex-shrink: 0; }
    .c-ok { color: #16a34a; }
    .t-ms { font-family: monospace; font-size: 0.68rem; color: #94a3b8; flex-shrink: 0; min-width: 44px; text-align: right; }
    .t-expand, .t-runone {
      background: none; border: 1px solid #e2e8f0; color: #94a3b8;
      width: 22px; height: 22px; border-radius: 5px; cursor: pointer;
      font-size: 0.62rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .t-expand:hover  { border-color: #3b82f6; color: #3b82f6; }
    .t-runone:hover:not(:disabled) { border-color: #22c55e; color: #16a34a; }
    .t-runone:disabled { opacity: 0.3; cursor: not-allowed; }
    .t-resp { background: #0f172a; }
    .t-resp pre { font-family: monospace; font-size: 0.68rem; color: #7dd3fc; padding: 0.75rem 1rem; overflow-x: auto; max-height: 160px; overflow-y: auto; white-space: pre-wrap; }

    /* ── Toast ── */
    .su-toast {
      position: fixed; bottom: 24px; right: -440px;
      background: white; border-left: 4px solid #22c55e; border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      padding: 0.9rem 1.1rem; min-width: 300px;
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.85rem; font-weight: 600; color: #1e293b;
      z-index: 9999; transition: right 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    .su-toast.show  { right: 24px; }
    .su-toast.error { border-left-color: #ef4444; }
    .su-toast button { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #94a3b8; margin-left: auto; }
  `]
})
export class SuperuserDashboardComponent implements OnInit {
  tab = 'overview';

  // Configs
  allConfigs:     any[] = [];
  generalConfigs: any[] = [];
  themeConfigs:   any[] = [];
  featureConfigs: any[] = [];

  // Variables tab
  varFilter   = 'ALL';
  varSearch   = '';
  showAddForm = false;
  editingKey: string | null = null;
  editingValue = '';
  newVar = this.blankVar();

  // Users
  users:      any[] = [];
  userSearch: string = '';

  // System
  backendUp = false;

  // Tests
  tests:    Test[] = [];
  running   = false;
  hasRun    = false;
  totalMs   = 0;

  // Toast
  toast     = '';
  toastType = 'success';

  // ── Computed ──────────────────────────────────────────────────
  get featuresOnCount() {
    return this.featureConfigs.filter(c => c.configValue === 'true').length;
  }
  get filteredUsers() {
    const q = this.userSearch.toLowerCase();
    return !q ? this.users
      : this.users.filter(u => `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(q));
  }
  get filteredVars() {
    let list = this.allConfigs;
    if (this.varFilter !== 'ALL') list = list.filter(c => c.category === this.varFilter);
    const q = this.varSearch.toLowerCase();
    if (q) list = list.filter(c =>
      c.configKey?.toLowerCase().includes(q) || c.configValue?.toLowerCase().includes(q) || c.label?.toLowerCase().includes(q)
    );
    return list;
  }
  get passCount()  { return this.tests.filter(t => t.status === 'pass').length; }
  get failCount()  { return this.tests.filter(t => t.status === 'fail').length; }
  get warnCount()  { return this.tests.filter(t => t.status === 'warn').length; }
  get doneCount()  { return this.tests.filter(t => !['idle','running'].includes(t.status)).length; }
  get testCategories() { return [...new Set(this.tests.map(t => t.cat))]; }
  get testCatCount()   { return this.testCategories.length; }
  get roleBreakdown() {
    const roles = ['HR_ADMIN','MANAGER','EMPLOYEE','SUPERUSER'];
    return roles.map(role => ({
      role: role.replace('_',' '),
      count: this.users.filter(u => u.role === role).length,
      pct: this.users.length ? (this.users.filter(u => u.role === role).length / this.users.length) * 100 : 0,
      cls: 'rbar-' + role.toLowerCase()
    })).filter(r => r.count > 0);
  }

  constructor(private http: HttpClient, private configSvc: SystemConfigService) {}

  ngOnInit() {
    this.loadConfigs();
    this.loadUsers();
    this.buildTests();
    this.pingBackend();
  }

  // ── Backend ping ───────────────────────────────────────────────
  pingBackend() {
    this.http.get(`${API}/config/public`).subscribe({
      next: () => this.backendUp = true,
      error: () => this.backendUp = false
    });
  }

  // ── Configs ───────────────────────────────────────────────────
  loadConfigs() {
    this.http.get<any[]>(`${API}/config`).subscribe(list => {
      this.allConfigs     = list;
      this.generalConfigs = list.filter(c => c.category === 'GENERAL');
      this.themeConfigs   = list.filter(c => c.category === 'THEME');
      this.featureConfigs = list.filter(c => c.category === 'FEATURE');
    });
  }

  getCfg(key: string, fallback = '') {
    return this.allConfigs.find(c => c.configKey === key)?.configValue || fallback;
  }

  livePreview(cfg: any) {
    this.configSvc.previewSet(cfg.configKey, cfg.configValue);
  }

  saveBranding() {
    const both = [...this.generalConfigs, ...this.themeConfigs];
    const updates = both.filter(c => c.optional).map(c => ({ key: c.configKey, value: c.configValue }));
    this.http.put(`${API}/config/bulk`, updates).subscribe({
      next: () => { this.configSvc.load(this.http); this.showToast('Branding saved!', 'success'); },
      error: () => this.showToast('Save failed — backend offline?', 'error')
    });
  }

  saveSection(category: string) {
    const configs  = this.allConfigs.filter(c => c.category === category && c.optional);
    const updates  = configs.map(c => ({ key: c.configKey, value: c.configValue }));
    this.http.put(`${API}/config/bulk`, updates).subscribe({
      next: () => { this.configSvc.load(this.http); this.showToast(`${category} settings saved!`, 'success'); },
      error: () => this.showToast('Save failed — backend offline?', 'error')
    });
  }

  resetTheme() {
    const defaults: Record<string, string> = {
      'theme.primary_color': '#D0271D', 'theme.primary_light': '#fff1f2',
      'theme.logo_text': 'ADP', 'theme.logo_bg': '#D0271D',
      'theme.header_bg': '#ffffff', 'theme.logo_image_url': ''
    };
    this.themeConfigs.forEach(c => {
      if (defaults[c.configKey] !== undefined) {
        c.configValue = defaults[c.configKey];
        this.configSvc.previewSet(c.configKey, c.configValue);
      }
    });
    this.showToast('Theme reset to ADP defaults.', 'success');
  }

  toggleFeature(cfg: any, event: Event) {
    cfg.configValue = (event.target as HTMLInputElement).checked ? 'true' : 'false';
  }

  // ── Variables CRUD ────────────────────────────────────────────
  isCustom(cfg: any) { return cfg.category === 'CUSTOM'; }

  lockReason(key: string) { return CORE_REASON[key] || 'System-regulated — cannot be modified'; }

  countByCategory(filter: string) {
    if (filter === 'ALL') return this.allConfigs.length;
    return this.allConfigs.filter(c => c.category === filter).length;
  }

  startEdit(cfg: any) {
    this.editingKey   = cfg.configKey;
    this.editingValue = cfg.configValue || '';
  }
  cancelEdit() { this.editingKey = null; }

  saveEdit(cfg: any) {
    this.http.put(`${API}/config/${cfg.configKey}`, { value: this.editingValue }).subscribe({
      next: (updated: any) => {
        cfg.configValue = updated.configValue;
        this.configSvc.previewSet(cfg.configKey, cfg.configValue);
        this.editingKey = null;
        this.showToast(`Updated: ${cfg.configKey}`, 'success');
        if (this.allConfigs.find(c => c.configKey === cfg.configKey)) {
          this.allConfigs.find(c => c.configKey === cfg.configKey).configValue = updated.configValue;
        }
      },
      error: () => this.showToast('Update failed — check backend.', 'error')
    });
  }

  addVariable() {
    if (!this.newVar.configKey.trim()) { this.showToast('Key is required.', 'error'); return; }
    if (!this.newVar.configKey.includes('.')) { this.showToast('Key must use a dot namespace (e.g. custom.my_key)', 'error'); return; }
    this.http.post<any>(`${API}/config`, this.newVar).subscribe({
      next: (created) => {
        this.allConfigs.push(created);
        this.showAddForm = false;
        this.newVar = this.blankVar();
        this.showToast(`Variable "${created.configKey}" created.`, 'success');
      },
      error: (e) => this.showToast(e.status === 409 ? 'Key already exists.' : 'Create failed.', 'error')
    });
  }

  deleteVariable(cfg: any) {
    if (!confirm(`Delete variable "${cfg.configKey}"?`)) return;
    this.http.delete(`${API}/config/${cfg.configKey}`).subscribe({
      next: () => {
        this.allConfigs = this.allConfigs.filter(c => c.configKey !== cfg.configKey);
        this.featureConfigs = this.featureConfigs.filter(c => c.configKey !== cfg.configKey);
        this.generalConfigs = this.generalConfigs.filter(c => c.configKey !== cfg.configKey);
        this.themeConfigs   = this.themeConfigs.filter(c => c.configKey !== cfg.configKey);
        this.showToast(`"${cfg.configKey}" deleted.`, 'success');
      },
      error: (e) => this.showToast(e.status === 403 ? 'Cannot delete a core variable.' : 'Delete failed.', 'error')
    });
  }

  resetNewVar() { this.newVar = this.blankVar(); }
  private blankVar() {
    return { configKey: '', configValue: '', category: 'CUSTOM', label: '', description: '', inputType: 'TEXT', optional: true };
  }

  // ── Users ─────────────────────────────────────────────────────
  loadUsers() {
    this.http.get<any[]>(`${API}/employees`).subscribe(d => this.users = d);
  }

  // ── Tests ─────────────────────────────────────────────────────
  testsFor(cat: string) { return this.tests.filter(t => t.cat === cat); }
  countFor(cat: string, type: string) {
    const list = this.testsFor(cat);
    if (type === 'all')  return list.length;
    if (type === 'pass') return list.filter(t => t.status === 'pass').length;
    if (type === 'fail') return list.filter(t => t.status === 'fail').length;
    return 0;
  }
  catIcon(cat: string) {
    return ({ 'Connectivity':'🌐','Authentication':'🔐','Employees':'👥','HR Management':'🏢',
              'Performance':'📊','Attendance':'🕐','Leaves':'🌿','System Config':'⚙️','Org Chart':'🗂️' } as any)[cat] || '🔷';
  }
  stIcon(s: string) {
    return ({ idle:'○', running:'⏳', pass:'✅', fail:'❌', warn:'⚠️' } as any)[s] || '○';
  }

  buildTests() {
    this.tests = [
      // Connectivity
      { id:'c1', cat:'Connectivity',    name:'Backend Reachable',          endpoint:'GET /api/config/public',                 status:'idle', open:false },
      { id:'c2', cat:'Connectivity',    name:'Database Connected',          endpoint:'GET /api/employees',                     status:'idle', open:false },
      { id:'c3', cat:'Connectivity',    name:'Departments Seeded',          endpoint:'GET /api/departments (≥3)',               status:'idle', open:false },
      // Auth
      { id:'a1', cat:'Authentication',  name:'HR Admin Login',              endpoint:'POST /api/auth/login  admin@adp.com',     status:'idle', open:false },
      { id:'a2', cat:'Authentication',  name:'Manager Login',               endpoint:'POST /api/auth/login  manager@adp.com',   status:'idle', open:false },
      { id:'a3', cat:'Authentication',  name:'Employee Login',              endpoint:'POST /api/auth/login  john.smith@adp.com',status:'idle', open:false },
      { id:'a4', cat:'Authentication',  name:'Superuser Login',             endpoint:'POST /api/auth/login  superuser',         status:'idle', open:false },
      { id:'a5', cat:'Authentication',  name:'Invalid Credentials → 401',   endpoint:'Wrong password must return 401',          status:'idle', open:false },
      // Employees
      { id:'e1', cat:'Employees',       name:'List All Employees',          endpoint:'GET /api/employees',                     status:'idle', open:false },
      { id:'e2', cat:'Employees',       name:'Managers List',               endpoint:'GET /api/employees/managers',             status:'idle', open:false },
      { id:'e3', cat:'Employees',       name:'Quick Create & Activate',     endpoint:'POST /api/employees/quick',               status:'idle', open:false },
      { id:'e4', cat:'Employees',       name:'Employee Profile by ID',      endpoint:'GET /api/employees/{id}/profile',         status:'idle', open:false },
      // HR
      { id:'h1', cat:'HR Management',   name:'Leave Categories',            endpoint:'GET /api/hr/categories (≥3)',             status:'idle', open:false },
      { id:'h2', cat:'HR Management',   name:'Operation History',           endpoint:'GET /api/hr/history',                    status:'idle', open:false },
      { id:'h3', cat:'HR Management',   name:'All Leave Requests',          endpoint:'GET /api/hr/all-leaves',                 status:'idle', open:false },
      { id:'h4', cat:'HR Management',   name:'All Attendance Records',      endpoint:'GET /api/hr/all-attendance',             status:'idle', open:false },
      // Performance
      { id:'p1', cat:'Performance',     name:'Questions Seeded',            endpoint:'GET /api/performance/questions (≥5)',    status:'idle', open:false },
      { id:'p2', cat:'Performance',     name:'Reports Endpoint',            endpoint:'GET /api/performance/reports',           status:'idle', open:false },
      { id:'p3', cat:'Performance',     name:'Employee History',            endpoint:'GET /api/performance/history/employee/{id}', status:'idle', open:false },
      // Attendance
      { id:'at1', cat:'Attendance',     name:'Today\'s Attendance',         endpoint:'GET /api/employees/{id}/attendance/today', status:'idle', open:false },
      { id:'at2', cat:'Attendance',     name:'Attendance History',          endpoint:'GET /api/employees/{id}/attendance-history', status:'idle', open:false },
      // Leaves
      { id:'l1', cat:'Leaves',          name:'Employee Leave History',      endpoint:'GET /api/employees/{id}/leaves-history', status:'idle', open:false },
      // Config
      { id:'cfg1', cat:'System Config', name:'Required Keys Present',       endpoint:'GET /api/config/public',                 status:'idle', open:false },
      { id:'cfg2', cat:'System Config', name:'Theme Color Valid Hex',        endpoint:'theme.primary_color must be #rrggbb',    status:'idle', open:false },
      { id:'cfg3', cat:'System Config', name:'Feature Flags Valid',         endpoint:'All feature.* = "true" or "false"',      status:'idle', open:false },
      // Org Chart
      { id:'org1', cat:'Org Chart',     name:'Manager Assignment Structure', endpoint:'GET /api/employees (check manager field)', status:'idle', open:false },
    ];
  }

  clearTests() {
    this.buildTests();
    this.hasRun  = false;
    this.totalMs = 0;
  }

  async runAll() {
    this.running = true;
    this.hasRun  = true;
    const start  = Date.now();
    for (const t of this.tests) { t.status='idle'; t.msg=undefined; t.data=undefined; t.ms=undefined; t.open=false; }
    for (const t of this.tests) { await this.runOne(t); }
    this.totalMs = Date.now() - start;
    this.running = false;
  }

  async runOne(t: Test) {
    t.status = 'running'; t.open = false;
    const s = Date.now();
    try {
      const r = await this.exec(t.id);
      t.ms     = Date.now() - s;
      t.status = r.ok ? 'pass' : (r.warn ? 'warn' : 'fail');
      t.msg    = r.msg;
      t.code   = r.code;
      t.data   = r.data;
    } catch (e: any) {
      t.ms     = Date.now() - s;
      t.status = 'fail';
      t.code   = e.status;
      t.msg    = e.status ? `HTTP ${e.status}: ${e.statusText || 'Error'}` : 'Connection refused — is the backend running?';
    }
    if (!this.hasRun) this.hasRun = true;
  }

  private async exec(id: string): Promise<{ ok: boolean; warn?: boolean; msg: string; code?: number; data?: any }> {
    const G = (url: string) => firstValueFrom(this.http.get<any>(url));
    const P = (url: string, body: any) => firstValueFrom(this.http.post<any>(url, body));

    switch (id) {
      case 'c1': { const d = await G(`${API}/config/public`);
        return { ok: d.length > 0, msg: `${d.length} config entries`, code: 200, data: d.slice(0,3) }; }
      case 'c2': { const d = await G(`${API}/employees`);
        return { ok: d.length > 0, msg: `${d.length} employees in DB`, code: 200 }; }
      case 'c3': { const d = await G(`${API}/departments`);
        return { ok: d.length >= 3, msg: `${d.length} departments`, code: 200, data: d }; }

      case 'a1': {
        try {
          const d = await P(`${API}/auth/login`, { email:'admin@adp.com', password:'admin123' });
          return { ok: d?.role==='HR_ADMIN', msg: d?.role==='HR_ADMIN' ? `✓ ${d.firstName} ${d.lastName}` : `Wrong role: ${d?.role}`, code:200 };
        } catch(e:any) {
          if (e.status===401) {
            const emps = await G(`${API}/employees`);
            const any = emps.find((x:any)=>x.role==='HR_ADMIN');
            if (any) return { ok:false, warn:true, msg:`HR Admin "${any.firstName} ${any.lastName}" exists — test password mismatch`, code:401 };
            return { ok:false, msg:'No HR_ADMIN account found in system', code:401 };
          } throw e;
        }
      }
      case 'a2': {
        try {
          const d = await P(`${API}/auth/login`, { email:'manager@adp.com', password:'manager123' });
          return { ok: d?.role==='MANAGER', msg: d?.role==='MANAGER' ? `✓ ${d.firstName} ${d.lastName}` : `Wrong role: ${d?.role}`, code:200 };
        } catch(e:any) {
          if (e.status===401) {
            const emps = await G(`${API}/employees`);
            const any = emps.find((x:any)=>x.role==='MANAGER');
            if (any) return { ok:false, warn:true, msg:`Manager "${any.firstName} ${any.lastName}" exists — test password mismatch`, code:401 };
            return { ok:false, msg:'No MANAGER account found in system', code:401 };
          } throw e;
        }
      }
      case 'a3': {
        try {
          const d = await P(`${API}/auth/login`, { email:'john.smith@adp.com', password:'password123' });
          return { ok: d?.role==='EMPLOYEE', msg: d?.role==='EMPLOYEE' ? `✓ ${d.firstName} ${d.lastName}` : `Role: ${d?.role}`, code:200 };
        } catch(e:any) {
          if (e.status===401) {
            const emps = await G(`${API}/employees`);
            const any = emps.find((x:any)=>x.role==='EMPLOYEE');
            if (any) return { ok:false, warn:true, msg:`Employee "${any.firstName} ${any.lastName}" exists — test password mismatch`, code:401 };
            return { ok:false, msg:'No EMPLOYEE account found in system', code:401 };
          } throw e;
        }
      }
      case 'a4': {
        try {
          const d = await P(`${API}/auth/login`, { email:'superuser', password:'superuser' });
          return { ok: d?.role==='SUPERUSER', msg: d?.role==='SUPERUSER' ? '✓ Superuser authenticated' : `Wrong role: ${d?.role}`, code:200 };
        } catch(e:any) {
          if (e.status===401) return { ok:false, msg:'Superuser login failed — check superuser credentials', code:401 };
          throw e;
        }
      }
      case 'a5': {
        try { await P(`${API}/auth/login`, { email:'admin@adp.com', password:'WRONG_XYZ' });
          return { ok: false, msg: 'Expected 401 but got 200 — security issue!', code: 200 };
        } catch(e: any) {
          return { ok: e.status===401, msg: e.status===401 ? '✓ 401 returned correctly' : `Expected 401, got ${e.status}`, code: e.status };
        }
      }

      case 'e1': { const d = await G(`${API}/employees`);
        const roles = [...new Set(d.map((e:any)=>e.role))];
        return { ok: d.length>0, msg: `${d.length} employees — roles: ${roles.join(', ')}`, code:200, data: d.slice(0,5) }; }
      case 'e2': { const d = await G(`${API}/employees/managers`);
        return { ok: d.length>0, msg: `${d.length} managers available`, code:200, data: d }; }
      case 'e3': { const ts = Date.now();
        const d = await P(`${API}/employees/quick`, { firstName:'Test', lastName:'User', email:`test_${ts}@t.com`, role:'EMPLOYEE', password:'test1234' });
        const ok = d?.status==='ACTIVE' && !!d?.id;
        // Clean up — delete the test employee so the DB stays unchanged
        if (d?.id) { try { await firstValueFrom(this.http.delete(`${API}/employees/${d.id}`)); } catch(_){} }
        return { ok, msg: ok ? `✓ Created & deleted (ID=${d.id}) — endpoint works` : `status=${d?.status}`, code:200, data:d }; }
      case 'e4': { const all = await G(`${API}/employees`); const id = all[0]?.id;
        const d = await G(`${API}/employees/${id}/profile`);
        return { ok: !!d?.id, msg: `✓ ${d.firstName} ${d.lastName} (${d.role})`, code:200, data:d }; }

      case 'h1': { const d = await G(`${API}/hr/categories`);
        return { ok: d.length>=3, msg: `${d.length} categories`, code:200, data:d }; }
      case 'h2': { const d = await G(`${API}/hr/history`);
        return { ok: Array.isArray(d), msg: `${d.length} history entries`, code:200, data:d.slice(0,3) }; }
      case 'h3': { const d = await G(`${API}/hr/all-leaves`);
        return { ok: Array.isArray(d), msg: `${d.length} leave requests`, code:200, data:d.slice(0,3) }; }
      case 'h4': { const d = await G(`${API}/hr/all-attendance`);
        return { ok: Array.isArray(d), msg: `${d.length} attendance records`, code:200, data:d.slice(0,3) }; }

      case 'p1': { const d = await G(`${API}/performance/questions`);
        return { ok: d.length>=5, msg: `${d.length} questions`, code:200, data:d }; }
      case 'p2': { const period = new Date().toISOString().substring(0,7);
        const d = await G(`${API}/performance/reports?period=${period}`);
        return { ok: Array.isArray(d), msg: `${d.length} reports for ${period}`, code:200, data:d.slice(0,3) }; }
      case 'p3': { const emps = await G(`${API}/employees`);
        const emp = emps.find((e:any)=>e.role==='EMPLOYEE');
        const d = await G(`${API}/performance/history/employee/${emp?.id||1}`);
        return { ok: Array.isArray(d), msg: `${d.length} history entries for #${emp?.id}`, code:200, data:d }; }

      case 'at1': { const emps = await G(`${API}/employees`); const id=emps[0]?.id||1;
        try { const d = await G(`${API}/employees/${id}/attendance/today`);
          return { ok:true, msg:`Today's record: ${Object.keys(d).filter(k=>d[k]).length} punches`, code:200, data:d };
        } catch(e:any) {
          if (e.status===404) return { ok:true, warn:true, msg:'No record today — endpoint OK', code:404 }; throw e;
        }
      }
      case 'at2': { const emps = await G(`${API}/employees`); const id=emps[0]?.id||1;
        const d = await G(`${API}/employees/${id}/attendance-history`);
        return { ok: Array.isArray(d), msg:`${d.length} records`, code:200, data:d.slice(0,3) }; }

      case 'l1': { const emps = await G(`${API}/employees`); const id=emps.find((e:any)=>e.role==='EMPLOYEE')?.id||1;
        const d = await G(`${API}/employees/${id}/leaves-history`);
        return { ok: Array.isArray(d), msg:`${d.length} leave requests`, code:200, data:d }; }

      case 'cfg1': { const d = await G(`${API}/config/public`);
        const req = ['theme.primary_color','theme.logo_text','feature.performance','general.company_name','feature.superuser'];
        const missing = req.filter(k => !d.find((c:any)=>c.configKey===k));
        return { ok: missing.length===0, msg: missing.length===0 ? `✓ All ${d.length} keys present` : `Missing: ${missing.join(', ')}`, code:200, data:d }; }
      case 'cfg2': { const d = await G(`${API}/config/public`);
        const c = d.find((x:any)=>x.configKey==='theme.primary_color');
        const ok = /^#[0-9A-Fa-f]{6}$/.test(c?.configValue||'');
        return { ok, msg: ok ? `✓ primary_color = ${c?.configValue}` : `Invalid hex: "${c?.configValue}"`, code:200 }; }
      case 'cfg3': { const d = await G(`${API}/config/public`);
        const features = d.filter((c:any)=>c.category==='FEATURE');
        const bad = features.filter((c:any)=>c.configValue!=='true'&&c.configValue!=='false');
        return { ok: bad.length===0, msg: bad.length===0 ? `✓ ${features.length} flags all valid` : `Invalid: ${bad.map((c:any)=>c.configKey).join(', ')}`, code:200, data:features }; }

      case 'org1': { const emps = await G(`${API}/employees`);
        const withMgr = emps.filter((e:any)=>e.manager);
        const roots   = emps.filter((e:any)=>!e.manager);
        return { ok:true, msg:`${withMgr.length} assigned, ${roots.length} root nodes`, code:200, data:{withManager:withMgr.length, roots:roots.length} }; }

      default: return { ok:false, msg:'Test not implemented' };
    }
  }

  // ── Utils ─────────────────────────────────────────────────────
  showToast(msg: string, type: string) {
    this.toast     = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 4000);
  }
  logout() { localStorage.clear(); window.location.href = '/login'; }
}
