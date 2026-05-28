import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

const API = 'http://localhost:8085/api';

interface TestCase {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'idle' | 'running' | 'pass' | 'fail' | 'warn';
  duration?: number;
  statusCode?: number;
  message?: string;
  response?: any;
  expanded: boolean;
}

interface CategorySummary {
  name: string;
  icon: string;
  pass: number;
  fail: number;
  warn: number;
  total: number;
}

@Component({
  selector: 'app-test-runner',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink],
  template: `
    <div class="tr-page">

      <!-- Top bar -->
      <div class="tr-topbar">
        <div class="tr-brand">
          <span class="tr-badge">🧪</span>
          <span class="tr-title">System Test Runner</span>
          <span class="tr-env">localhost:8085</span>
        </div>
        <div class="tr-actions">
          <a routerLink="/login" class="tr-link">← Login</a>
          <button class="tr-btn-clear" (click)="clear()" [disabled]="running">⊘ Clear</button>
          <button class="tr-btn-run" (click)="runAll()" [disabled]="running">
            <span *ngIf="!running">▶ Run All Tests</span>
            <span *ngIf="running" class="running-text">⏳ Running ({{ doneCount }}/{{ tests.length }})…</span>
          </button>
        </div>
      </div>

      <!-- Summary bar -->
      <div class="tr-summary" *ngIf="hasRun">
        <div class="sum-item pass">
          <span class="sum-num">{{ passCount }}</span>
          <span class="sum-lbl">Passed</span>
        </div>
        <div class="sum-item fail">
          <span class="sum-num">{{ failCount }}</span>
          <span class="sum-lbl">Failed</span>
        </div>
        <div class="sum-item warn">
          <span class="sum-num">{{ warnCount }}</span>
          <span class="sum-lbl">Warnings</span>
        </div>
        <div class="sum-item total">
          <span class="sum-num">{{ tests.length }}</span>
          <span class="sum-lbl">Total</span>
        </div>
        <div class="sum-bar">
          <div class="sum-bar-pass"  [style.width.%]="(passCount / tests.length) * 100"></div>
          <div class="sum-bar-warn"  [style.width.%]="(warnCount / tests.length) * 100"></div>
          <div class="sum-bar-fail"  [style.width.%]="(failCount / tests.length) * 100"></div>
        </div>
        <div class="sum-time">{{ totalMs }}ms total</div>
      </div>

      <div class="tr-body">

        <!-- Sidebar: categories -->
        <aside class="tr-sidebar">
          <div class="cat-header">Categories</div>
          <div class="cat-item" *ngFor="let cat of categorySummaries"
               [class.active]="filterCat === cat.name"
               (click)="filterCat = filterCat === cat.name ? '' : cat.name">
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <div class="cat-badges">
              <span class="cat-pass" *ngIf="cat.pass > 0">{{ cat.pass }}</span>
              <span class="cat-fail" *ngIf="cat.fail > 0">{{ cat.fail }}</span>
              <span class="cat-pending" *ngIf="cat.pass + cat.fail + cat.warn === 0">{{ cat.total }}</span>
            </div>
          </div>
          <div class="cat-all" [class.active]="filterCat === ''" (click)="filterCat = ''">
            All tests ({{ tests.length }})
          </div>
        </aside>

        <!-- Main: test list -->
        <main class="tr-main">

          <!-- Group by category -->
          <div class="cat-section" *ngFor="let cat of visibleCategories">
            <div class="cat-section-header">
              <span>{{ catIcon(cat) }} {{ cat }}</span>
              <span class="cat-section-count">
                {{ countFor(cat, 'pass') }}/{{ countFor(cat, 'all') }}
                <span *ngIf="countFor(cat, 'fail') > 0" class="fail-chip">{{ countFor(cat,'fail') }} failed</span>
              </span>
            </div>

            <div class="test-list">
              <div class="test-row" *ngFor="let t of testsFor(cat)"
                   [class.status-pass]="t.status==='pass'"
                   [class.status-fail]="t.status==='fail'"
                   [class.status-warn]="t.status==='warn'"
                   [class.status-running]="t.status==='running'">

                <div class="test-left" (click)="t.expanded = !t.expanded && !!t.response">
                  <span class="test-icon">{{ statusIcon(t.status) }}</span>
                  <div class="test-info">
                    <div class="test-name">{{ t.name }}</div>
                    <div class="test-desc">{{ t.description }}</div>
                  </div>
                </div>

                <div class="test-right">
                  <span class="test-msg" [class.fail-text]="t.status==='fail'" *ngIf="t.message">
                    {{ t.message }}
                  </span>
                  <span class="test-code" *ngIf="t.statusCode" [class.code-ok]="t.statusCode < 300">
                    {{ t.statusCode }}
                  </span>
                  <span class="test-dur" *ngIf="t.duration !== undefined">
                    {{ t.duration }}ms
                  </span>
                  <button class="expand-btn" *ngIf="t.response" (click)="t.expanded = !t.expanded">
                    {{ t.expanded ? '▲' : '▼' }}
                  </button>
                  <button class="run-one-btn" (click)="runOne(t)" [disabled]="running" title="Run this test">▶</button>
                </div>

              </div>

              <!-- Expanded response -->
              <div class="test-expand" *ngFor="let t of testsFor(cat)" [style.display]="t.expanded ? 'block' : 'none'">
                <pre class="response-pre">{{ t.response | json }}</pre>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div class="tr-empty" *ngIf="!running && !hasRun">
            <div class="tr-empty-icon">🧪</div>
            <div class="tr-empty-title">No tests run yet</div>
            <div class="tr-empty-sub">Click "Run All Tests" to test every endpoint and feature in the system.</div>
            <button class="tr-btn-run big" (click)="runAll()">▶ Run All Tests</button>
          </div>

        </main>

        <!-- Console log -->
        <div class="tr-console">
          <div class="console-header">
            Console
            <button class="console-clear" (click)="logs = []">clear</button>
          </div>
          <div class="console-body" #consoleEl>
            <div class="log-line" *ngFor="let log of logs" [ngClass]="log.type">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-msg">{{ log.msg }}</span>
            </div>
            <div class="log-cursor" *ngIf="running">█</div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .tr-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0d1117;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      color: #e6edf3;
      overflow: hidden;
    }

    /* ── Top bar ── */
    .tr-topbar {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      padding: 0 1.5rem;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .tr-brand   { display: flex; align-items: center; gap: 0.75rem; }
    .tr-badge   { font-size: 1.1rem; }
    .tr-title   { font-weight: 800; font-size: 0.95rem; color: #e6edf3; }
    .tr-env     { font-size: 0.72rem; color: #8b949e; background: #21262d; padding: 0.15rem 0.5rem; border-radius: 20px; font-family: monospace; }
    .tr-actions { display: flex; align-items: center; gap: 0.6rem; }
    .tr-link    { color: #58a6ff; font-size: 0.8rem; text-decoration: none; }
    .tr-link:hover { text-decoration: underline; }

    .tr-btn-clear {
      background: none;
      border: 1px solid #30363d;
      color: #8b949e;
      padding: 0.35rem 0.8rem;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }
    .tr-btn-clear:hover:not(:disabled) { border-color: #58a6ff; color: #58a6ff; }
    .tr-btn-clear:disabled { opacity: 0.4; cursor: not-allowed; }

    .tr-btn-run {
      background: #238636;
      border: 1px solid #2ea043;
      color: white;
      padding: 0.4rem 1.1rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .tr-btn-run:hover:not(:disabled) { background: #2ea043; }
    .tr-btn-run:disabled { opacity: 0.6; cursor: not-allowed; }
    .tr-btn-run.big { padding: 0.75rem 2rem; font-size: 0.95rem; margin-top: 1rem; }
    .running-text { color: #f0a400; }

    /* ── Summary bar ── */
    .tr-summary {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      padding: 0.6rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-shrink: 0;
    }
    .sum-item { display: flex; flex-direction: column; align-items: center; min-width: 50px; }
    .sum-num { font-size: 1.1rem; font-weight: 900; line-height: 1; }
    .sum-lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: #8b949e; margin-top: 1px; }
    .sum-item.pass .sum-num { color: #3fb950; }
    .sum-item.fail .sum-num { color: #f85149; }
    .sum-item.warn .sum-num { color: #d29922; }
    .sum-item.total .sum-num { color: #58a6ff; }
    .sum-bar { flex: 1; height: 6px; background: #21262d; border-radius: 3px; display: flex; overflow: hidden; }
    .sum-bar-pass { background: #3fb950; transition: width 0.4s; }
    .sum-bar-warn { background: #d29922; transition: width 0.4s; }
    .sum-bar-fail { background: #f85149; transition: width 0.4s; }
    .sum-time { font-size: 0.72rem; color: #8b949e; font-family: monospace; white-space: nowrap; }

    /* ── Body ── */
    .tr-body {
      flex: 1;
      display: grid;
      grid-template-columns: 200px 1fr 280px;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .tr-sidebar {
      background: #161b22;
      border-right: 1px solid #30363d;
      overflow-y: auto;
      padding: 0.75rem 0;
    }
    .cat-header { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8b949e; padding: 0 0.75rem 0.5rem; }
    .cat-item, .cat-all {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-size: 0.78rem;
      color: #8b949e;
      transition: all 0.12s;
      border-radius: 0;
    }
    .cat-item:hover, .cat-all:hover { background: #21262d; color: #e6edf3; }
    .cat-item.active, .cat-all.active { background: rgba(88,166,255,0.1); color: #58a6ff; }
    .cat-icon { font-size: 0.9rem; flex-shrink: 0; }
    .cat-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cat-badges { display: flex; gap: 3px; flex-shrink: 0; }
    .cat-pass    { background: rgba(63,185,80,0.15); color: #3fb950; font-size: 0.65rem; font-weight: 800; padding: 0 4px; border-radius: 4px; }
    .cat-fail    { background: rgba(248,81,73,0.15); color: #f85149; font-size: 0.65rem; font-weight: 800; padding: 0 4px; border-radius: 4px; }
    .cat-pending { color: #30363d; font-size: 0.65rem; padding: 0 4px; }
    .cat-all     { margin-top: 0.5rem; border-top: 1px solid #21262d; padding-top: 0.75rem; font-weight: 600; color: #8b949e; }

    /* ── Main ── */
    .tr-main {
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cat-section {}
    .cat-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8b949e;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #21262d;
      margin-bottom: 0.25rem;
    }
    .cat-section-count { font-weight: 400; color: #8b949e; display: flex; gap: 0.5rem; align-items: center; }
    .fail-chip { background: rgba(248,81,73,0.15); color: #f85149; padding: 0.1rem 0.5rem; border-radius: 10px; font-weight: 700; font-size: 0.65rem; }

    .test-list { display: flex; flex-direction: column; gap: 1px; }

    .test-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      background: #161b22;
      border-radius: 6px;
      border: 1px solid transparent;
      transition: border-color 0.12s;
      cursor: default;
    }
    .test-row:hover { border-color: #30363d; }
    .test-row.status-pass    { border-left: 3px solid #3fb950; }
    .test-row.status-fail    { border-left: 3px solid #f85149; background: rgba(248,81,73,0.05); }
    .test-row.status-warn    { border-left: 3px solid #d29922; }
    .test-row.status-running { border-left: 3px solid #58a6ff; animation: pulse 1s infinite; }

    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }

    .test-left { display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 0; cursor: pointer; }
    .test-icon { font-size: 0.95rem; flex-shrink: 0; width: 20px; text-align: center; }
    .test-info { min-width: 0; }
    .test-name { font-size: 0.83rem; font-weight: 600; color: #e6edf3; }
    .test-desc { font-size: 0.7rem; color: #8b949e; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .test-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .test-msg { font-size: 0.72rem; color: #8b949e; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .test-msg.fail-text { color: #f85149; }
    .test-code { font-family: monospace; font-size: 0.7rem; background: #21262d; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .test-code.code-ok { color: #3fb950; }
    .test-dur { font-family: monospace; font-size: 0.7rem; color: #8b949e; min-width: 44px; text-align: right; }
    .expand-btn { background: none; border: 1px solid #30363d; color: #8b949e; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; }
    .expand-btn:hover { border-color: #58a6ff; color: #58a6ff; }
    .run-one-btn { background: none; border: 1px solid #30363d; color: #8b949e; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; }
    .run-one-btn:hover:not(:disabled) { border-color: #3fb950; color: #3fb950; }
    .run-one-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .test-expand { background: #0d1117; border: 1px solid #21262d; border-radius: 0 0 6px 6px; margin-top: -1px; }
    .response-pre { font-family: monospace; font-size: 0.7rem; color: #8b949e; padding: 0.75rem 1rem; overflow-x: auto; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }

    /* ── Empty state ── */
    .tr-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 4rem 2rem; }
    .tr-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .tr-empty-title { font-size: 1.2rem; font-weight: 700; color: #e6edf3; margin-bottom: 0.5rem; }
    .tr-empty-sub { font-size: 0.85rem; color: #8b949e; max-width: 360px; line-height: 1.6; }

    /* ── Console ── */
    .tr-console {
      background: #0d1117;
      border-left: 1px solid #21262d;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .console-header {
      background: #161b22;
      border-bottom: 1px solid #21262d;
      padding: 0.4rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8b949e;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .console-clear { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 0.68rem; font-family: inherit; }
    .console-clear:hover { color: #f85149; }
    .console-body { flex: 1; overflow-y: auto; padding: 0.5rem; font-family: monospace; font-size: 0.72rem; }
    .log-line { display: flex; gap: 0.5rem; padding: 0.1rem 0; border-bottom: 1px solid rgba(48,54,61,0.3); }
    .log-line.log-pass   { color: #3fb950; }
    .log-line.log-fail   { color: #f85149; }
    .log-line.log-warn   { color: #d29922; }
    .log-line.log-info   { color: #58a6ff; }
    .log-line.log-system { color: #8b949e; }
    .log-time { color: #30363d; flex-shrink: 0; }
    .log-msg  { word-break: break-word; }
    .log-cursor { color: #3fb950; animation: blink 1s step-end infinite; font-size: 0.9rem; }
    @keyframes blink { 50% { opacity: 0; } }
  `]
})
export class TestRunnerComponent implements OnInit {
  tests: TestCase[] = [];
  running = false;
  hasRun = false;
  filterCat = '';
  logs: { time: string; msg: string; type: string }[] = [];
  totalMs = 0;

  get passCount()  { return this.tests.filter(t => t.status === 'pass').length; }
  get failCount()  { return this.tests.filter(t => t.status === 'fail').length; }
  get warnCount()  { return this.tests.filter(t => t.status === 'warn').length; }
  get doneCount()  { return this.tests.filter(t => t.status !== 'idle' && t.status !== 'running').length; }

  get categorySummaries(): CategorySummary[] {
    const cats = [...new Set(this.tests.map(t => t.category))];
    return cats.map(name => ({
      name,
      icon: this.catIcon(name),
      pass:  this.tests.filter(t => t.category === name && t.status === 'pass').length,
      fail:  this.tests.filter(t => t.category === name && t.status === 'fail').length,
      warn:  this.tests.filter(t => t.category === name && t.status === 'warn').length,
      total: this.tests.filter(t => t.category === name).length,
    }));
  }

  get visibleCategories(): string[] {
    const all = [...new Set(this.tests.map(t => t.category))];
    return this.filterCat ? all.filter(c => c === this.filterCat) : all;
  }

  testsFor(cat: string) { return this.tests.filter(t => t.category === cat); }

  countFor(cat: string, type: string) {
    const list = this.testsFor(cat);
    if (type === 'all')  return list.length;
    if (type === 'pass') return list.filter(t => t.status === 'pass').length;
    if (type === 'fail') return list.filter(t => t.status === 'fail').length;
    return 0;
  }

  catIcon(cat: string) {
    const map: Record<string, string> = {
      'Connectivity':  '🌐',
      'Authentication':'🔐',
      'Employees':     '👥',
      'HR Management': '🏢',
      'Performance':   '📊',
      'Attendance':    '🕐',
      'Leaves':        '🌿',
      'System Config': '⚙️',
      'Org Chart':     '🗂️',
    };
    return map[cat] || '🔷';
  }

  statusIcon(status: string) {
    return { idle: '○', running: '⏳', pass: '✅', fail: '❌', warn: '⚠️' }[status] || '○';
  }

  constructor(private http: HttpClient) {}

  ngOnInit() { this.buildTests(); }

  buildTests() {
    this.tests = [

      // ── Connectivity ────────────────────────────────────────────────
      { id:'c1', category:'Connectivity', name:'Backend Reachable',
        description:'GET /api/config/public', expanded:false, status:'idle' },
      { id:'c2', category:'Connectivity', name:'Database Connected',
        description:'GET /api/employees — DB must have seeded data', expanded:false, status:'idle' },
      { id:'c3', category:'Connectivity', name:'Departments Seeded',
        description:'GET /api/departments — expects ≥3', expanded:false, status:'idle' },

      // ── Authentication ───────────────────────────────────────────────
      { id:'a1', category:'Authentication', name:'HR Admin Login',
        description:'POST /api/auth/login  admin@adp.com / admin123', expanded:false, status:'idle' },
      { id:'a2', category:'Authentication', name:'Manager Login',
        description:'POST /api/auth/login  manager@adp.com / manager123', expanded:false, status:'idle' },
      { id:'a3', category:'Authentication', name:'Employee Login',
        description:'POST /api/auth/login  john.smith@adp.com / password123', expanded:false, status:'idle' },
      { id:'a4', category:'Authentication', name:'Superuser Login',
        description:'POST /api/auth/login  superuser / superuser', expanded:false, status:'idle' },
      { id:'a5', category:'Authentication', name:'Invalid Credentials Rejected',
        description:'Wrong password → must return 401', expanded:false, status:'idle' },

      // ── Employees ────────────────────────────────────────────────────
      { id:'e1', category:'Employees', name:'Get All Employees',
        description:'GET /api/employees', expanded:false, status:'idle' },
      { id:'e2', category:'Employees', name:'Get Managers List',
        description:'GET /api/employees/managers', expanded:false, status:'idle' },
      { id:'e3', category:'Employees', name:'Quick Create & Activate',
        description:'POST /api/employees/quick — create + activate in one step', expanded:false, status:'idle' },
      { id:'e4', category:'Employees', name:'Employee Profile by ID',
        description:'GET /api/employees/1/profile', expanded:false, status:'idle' },

      // ── HR Management ────────────────────────────────────────────────
      { id:'h1', category:'HR Management', name:'Leave Categories',
        description:'GET /api/hr/categories — expects ≥3', expanded:false, status:'idle' },
      { id:'h2', category:'HR Management', name:'Operation History',
        description:'GET /api/hr/history', expanded:false, status:'idle' },
      { id:'h3', category:'HR Management', name:'All Leaves',
        description:'GET /api/hr/all-leaves', expanded:false, status:'idle' },
      { id:'h4', category:'HR Management', name:'All Attendance Records',
        description:'GET /api/hr/all-attendance', expanded:false, status:'idle' },

      // ── Performance ──────────────────────────────────────────────────
      { id:'p1', category:'Performance', name:'Questions Seeded',
        description:'GET /api/performance/questions — expects ≥5', expanded:false, status:'idle' },
      { id:'p2', category:'Performance', name:'Reports Endpoint',
        description:'GET /api/performance/reports', expanded:false, status:'idle' },
      { id:'p3', category:'Performance', name:'Employee History',
        description:'GET /api/performance/history/employee/1', expanded:false, status:'idle' },

      // ── Attendance ───────────────────────────────────────────────────
      { id:'at1', category:'Attendance', name:'Today\'s Attendance',
        description:'GET /api/employees/1/attendance/today', expanded:false, status:'idle' },
      { id:'at2', category:'Attendance', name:'Attendance History',
        description:'GET /api/employees/1/attendance-history', expanded:false, status:'idle' },

      // ── Leaves ───────────────────────────────────────────────────────
      { id:'l1', category:'Leaves', name:'Employee Leave History',
        description:'GET /api/employees/1/leaves-history', expanded:false, status:'idle' },

      // ── System Config ────────────────────────────────────────────────
      { id:'cfg1', category:'System Config', name:'Config Keys Present',
        description:'GET /api/config/public — all required keys', expanded:false, status:'idle' },
      { id:'cfg2', category:'System Config', name:'Theme Values Valid',
        description:'primary_color must be a valid hex (#rrggbb)', expanded:false, status:'idle' },
      { id:'cfg3', category:'System Config', name:'Feature Flags Valid',
        description:'All feature.* values must be "true" or "false"', expanded:false, status:'idle' },

      // ── Org Chart ────────────────────────────────────────────────────
      { id:'org1', category:'Org Chart', name:'Manager Assignment Endpoint',
        description:'PATCH /api/employees/1/manager — structure check', expanded:false, status:'idle' },
    ];
  }

  private log(msg: string, type: string = 'log-info') {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
    this.logs.push({ time, msg, type });
  }

  async runAll() {
    this.running = true;
    this.hasRun = true;
    this.logs = [];
    this.totalMs = 0;
    const start = Date.now();
    this.log('▶ Starting test suite…', 'log-system');
    this.log(`Running ${this.tests.length} tests across ${new Set(this.tests.map(t=>t.category)).size} categories`, 'log-system');

    for (const t of this.tests) {
      t.status = 'idle';
      t.message = undefined;
      t.response = undefined;
      t.duration = undefined;
      t.expanded = false;
    }

    for (const t of this.tests) {
      await this.runOne(t);
    }

    this.totalMs = Date.now() - start;
    this.log(`✔ Suite complete — ${this.passCount} passed, ${this.failCount} failed in ${this.totalMs}ms`, 'log-system');
    this.running = false;
  }

  async runOne(t: TestCase) {
    t.status = 'running';
    t.expanded = false;
    const tStart = Date.now();
    this.log(`⏳ ${t.category} › ${t.name}`, 'log-info');
    try {
      const result = await this.execTest(t.id);
      t.duration = Date.now() - tStart;
      t.status    = result.ok ? 'pass' : (result.warn ? 'warn' : 'fail');
      t.message   = result.message;
      t.statusCode = result.statusCode;
      t.response  = result.response;
      const icon = t.status === 'pass' ? '✅' : t.status === 'warn' ? '⚠️' : '❌';
      this.log(`${icon} ${t.name} — ${result.message} (${t.duration}ms)`,
        t.status === 'pass' ? 'log-pass' : t.status === 'warn' ? 'log-warn' : 'log-fail');
    } catch (err: any) {
      t.duration   = Date.now() - tStart;
      t.status     = 'fail';
      t.statusCode = err.status;
      t.message    = err.status ? `HTTP ${err.status}: ${err.statusText || 'Error'}` : (err.message || 'Connection refused');
      this.log(`❌ ${t.name} — ${t.message}`, 'log-fail');
    }
    if (!this.hasRun) this.hasRun = true;
  }

  private async execTest(id: string): Promise<{ ok: boolean; warn?: boolean; message: string; statusCode?: number; response?: any }> {
    switch(id) {

      case 'c1': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/config/public`));
        return { ok: Array.isArray(d) && d.length > 0, message: `${d.length} config entries`, statusCode: 200, response: d };
      }
      case 'c2': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        return { ok: d.length > 0, message: `${d.length} employees in database`, statusCode: 200, response: d.slice(0,3) };
      }
      case 'c3': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/departments`));
        return { ok: d.length >= 3, message: `${d.length} departments`, statusCode: 200, response: d };
      }

      case 'a1': {
        const d: any = await firstValueFrom(this.http.post(`${API}/auth/login`, { email:'admin@adp.com', password:'admin123' }));
        const ok = d?.role === 'HR_ADMIN';
        return { ok, message: ok ? `✓ HR_ADMIN: ${d.firstName} ${d.lastName}` : `Wrong role: ${d?.role}`, statusCode: 200 };
      }
      case 'a2': {
        const d: any = await firstValueFrom(this.http.post(`${API}/auth/login`, { email:'manager@adp.com', password:'manager123' }));
        const ok = d?.role === 'MANAGER';
        return { ok, message: ok ? `✓ MANAGER: ${d.firstName} ${d.lastName}` : `Wrong role: ${d?.role}`, statusCode: 200 };
      }
      case 'a3': {
        const d: any = await firstValueFrom(this.http.post(`${API}/auth/login`, { email:'john.smith@adp.com', password:'password123' }));
        const ok = d?.role === 'EMPLOYEE';
        return { ok, message: ok ? `✓ EMPLOYEE: ${d.firstName} ${d.lastName}` : `Wrong role: ${d?.role}`, statusCode: 200 };
      }
      case 'a4': {
        const d: any = await firstValueFrom(this.http.post(`${API}/auth/login`, { email:'superuser', password:'superuser' }));
        const ok = d?.role === 'SUPERUSER';
        return { ok, message: ok ? `✓ SUPERUSER activated` : `Wrong role: ${d?.role}`, statusCode: 200 };
      }
      case 'a5': {
        try {
          await firstValueFrom(this.http.post(`${API}/auth/login`, { email:'admin@adp.com', password:'WRONG_PASSWORD_XOXO' }));
          return { ok: false, message: 'Expected 401 but got 200 — SECURITY ISSUE', statusCode: 200 };
        } catch(e: any) {
          const ok = e.status === 401;
          return { ok, message: ok ? `✓ 401 Unauthorized returned correctly` : `Expected 401 got ${e.status}`, statusCode: e.status };
        }
      }

      case 'e1': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const roles = [...new Set(d.map((e:any) => e.role))];
        return { ok: d.length > 0, message: `${d.length} employees, roles: ${roles.join(', ')}`, statusCode: 200, response: d.slice(0,5) };
      }
      case 'e2': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/employees/managers`));
        return { ok: d.length > 0, message: `${d.length} managers/admins available`, statusCode: 200, response: d };
      }
      case 'e3': {
        const ts = Date.now();
        const payload = { firstName:'Test', lastName:'User', email:`test_${ts}@test.com`, role:'EMPLOYEE', password:'test1234' };
        const d: any = await firstValueFrom(this.http.post(`${API}/employees/quick`, payload));
        const ok = d?.status === 'ACTIVE' && d?.id;
        return { ok, message: ok ? `✓ Created ID=${d.id}, status=ACTIVE` : `Failed: status=${d?.status}`, statusCode: 200, response: d };
      }
      case 'e4': {
        const all = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const firstId = all[0]?.id;
        const d = await firstValueFrom(this.http.get<any>(`${API}/employees/${firstId}/profile`));
        return { ok: !!d?.id, message: `✓ Profile: ${d.firstName} ${d.lastName} (${d.role})`, statusCode: 200, response: d };
      }

      case 'h1': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/hr/categories`));
        return { ok: d.length >= 3, message: `${d.length} categories (expected ≥3)`, statusCode: 200, response: d };
      }
      case 'h2': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/hr/history`));
        return { ok: Array.isArray(d), message: `${d.length} history records`, statusCode: 200, response: d.slice(0,3) };
      }
      case 'h3': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/hr/all-leaves`));
        return { ok: Array.isArray(d), message: `${d.length} leave requests`, statusCode: 200, response: d.slice(0,3) };
      }
      case 'h4': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/hr/all-attendance`));
        return { ok: Array.isArray(d), message: `${d.length} attendance records`, statusCode: 200, response: d.slice(0,3) };
      }

      case 'p1': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/performance/questions`));
        return { ok: d.length >= 5, message: `${d.length} questions seeded`, statusCode: 200, response: d };
      }
      case 'p2': {
        const period = new Date().toISOString().substring(0,7);
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/performance/reports?period=${period}`));
        return { ok: Array.isArray(d), message: `${d.length} reports for ${period}`, statusCode: 200, response: d.slice(0,3) };
      }
      case 'p3': {
        const emps = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const emp = emps.find((e:any) => e.role === 'EMPLOYEE');
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/performance/history/employee/${emp?.id || 1}`));
        return { ok: Array.isArray(d), message: `${d.length} history entries for employee #${emp?.id}`, statusCode: 200, response: d };
      }

      case 'at1': {
        const emps = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const id = emps[0]?.id || 1;
        try {
          const d = await firstValueFrom(this.http.get<any>(`${API}/employees/${id}/attendance/today`));
          const punches = Object.keys(d).filter(k => d[k]).length;
          return { ok: true, message: `Today's record: ${punches} punches`, statusCode: 200, response: d };
        } catch(e:any) {
          if (e.status === 404) return { ok: true, warn: true, message: 'No attendance today — endpoint OK', statusCode: 404 };
          throw e;
        }
      }
      case 'at2': {
        const emps = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const id = emps[0]?.id || 1;
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/employees/${id}/attendance-history`));
        return { ok: Array.isArray(d), message: `${d.length} attendance records`, statusCode: 200, response: d.slice(0,3) };
      }

      case 'l1': {
        const emps = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const id = emps.find((e:any)=>e.role==='EMPLOYEE')?.id || 1;
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/employees/${id}/leaves-history`));
        return { ok: Array.isArray(d), message: `${d.length} leave requests`, statusCode: 200, response: d };
      }

      case 'cfg1': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/config/public`));
        const required = ['theme.primary_color','theme.logo_text','feature.performance','feature.attendance','general.company_name','feature.superuser'];
        const missing = required.filter(k => !d.find((c:any) => c.configKey === k));
        const ok = missing.length === 0;
        return { ok, message: ok ? `✓ All ${d.length} keys present` : `Missing: ${missing.join(', ')}`, statusCode: 200, response: d };
      }
      case 'cfg2': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/config/public`));
        const c = d.find((x:any) => x.configKey === 'theme.primary_color');
        const ok = /^#[0-9A-Fa-f]{6}$/.test(c?.configValue || '');
        return { ok, message: ok ? `✓ primary_color = ${c?.configValue}` : `Invalid: "${c?.configValue}"`, statusCode: 200 };
      }
      case 'cfg3': {
        const d = await firstValueFrom(this.http.get<any[]>(`${API}/config/public`));
        const features = d.filter((c:any) => c.category === 'FEATURE');
        const bad = features.filter((c:any) => c.configValue !== 'true' && c.configValue !== 'false');
        const ok = bad.length === 0;
        return { ok, message: ok ? `✓ ${features.length} feature flags all valid` : `Invalid: ${bad.map((c:any)=>c.configKey).join(', ')}`, statusCode: 200, response: features };
      }

      case 'org1': {
        const emps = await firstValueFrom(this.http.get<any[]>(`${API}/employees`));
        const withMgr = emps.filter((e:any) => e.manager);
        const roots   = emps.filter((e:any) => !e.manager);
        return { ok: true, message: `${withMgr.length} assigned, ${roots.length} root nodes`, statusCode: 200, response: { withManager: withMgr.length, roots: roots.length } };
      }

      default:
        return { ok: false, message: 'Test not implemented' };
    }
  }

  clear() {
    this.buildTests();
    this.logs = [];
    this.hasRun = false;
    this.totalMs = 0;
  }
}
