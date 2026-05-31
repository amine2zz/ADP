import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';

const API = 'http://localhost:8085/api';

interface FlatNode {
  emp: any;
  ancestors: boolean[]; // true = ancestor had more siblings after it
  isLast: boolean;
  isRoot: boolean;
  depth: number;
  reportCount: number;
  hasChildren: boolean;
  isCollapsed: boolean;
}

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="org-page slide-up">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>Organisation Hierarchy</h2>
          <p>Visualise reporting lines and manage manager assignments.</p>
        </div>
        <button class="btn-primary" (click)="load()">↻ Refresh</button>
      </div>

      <div class="org-layout">

        <!-- ── LEFT: Assignment Panel ── -->
        <div class="assign-panel">

          <div class="card panel-card">
            <h3 class="panel-title">Assign Reporting Manager</h3>

            <div class="form-group">
              <label>Employee</label>
              <div class="select-search-wrap">
                <input type="text" [(ngModel)]="empSearch" placeholder="Search employee..." class="select-search">
              </div>
              <select [(ngModel)]="assignEmpId" size="6" class="list-select">
                <option value="">— Select —</option>
                <option *ngFor="let e of filteredEmpList" [value]="e.id">
                  {{ e.firstName }} {{ e.lastName }}
                  <span *ngIf="e.role === 'MANAGER'"> · MGR</span>
                  <span *ngIf="e.role === 'HR_ADMIN'"> · HR</span>
                </option>
              </select>
            </div>

            <div class="arrow-divider">↓ reports to</div>

            <div class="form-group">
              <label>Reporting Manager <span class="opt">(leave blank to remove)</span></label>
              <div class="select-search-wrap">
                <input type="text" [(ngModel)]="mgrSearch" placeholder="Search manager..." class="select-search">
              </div>
              <select [(ngModel)]="assignManagerId" size="6" class="list-select">
                <option value="">— No Manager —</option>
                <option *ngFor="let m of filteredMgrList" [value]="m.id">
                  {{ m.firstName }} {{ m.lastName }}
                  <span *ngIf="m.role === 'MANAGER'"> · MGR</span>
                  <span *ngIf="m.role === 'HR_ADMIN'"> · HR</span>
                </option>
              </select>
            </div>

            <button class="btn-assign" (click)="assign()" [disabled]="!assignEmpId || saving">
              {{ saving ? 'Saving…' : '✓ Assign' }}
            </button>
          </div>

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-num">{{ allEmployees.length }}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-card hr">
              <div class="stat-num">{{ countRole('HR_ADMIN') }}</div>
              <div class="stat-label">HR Admins</div>
            </div>
            <div class="stat-card mgr">
              <div class="stat-num">{{ countRole('MANAGER') }}</div>
              <div class="stat-label">Managers</div>
            </div>
            <div class="stat-card emp">
              <div class="stat-num">{{ countRole('EMPLOYEE') }}</div>
              <div class="stat-label">Employees</div>
            </div>
          </div>
        </div>

        <!-- ── RIGHT: Tree View ── -->
        <div class="tree-panel card">
          <div class="tree-header">
            <h3 class="panel-title" style="margin:0">Org Tree</h3>
            <div class="tree-controls">
              <button class="ctrl-btn" (click)="collapseAll()" title="Collapse all nodes">⊟ Collapse All</button>
              <button class="ctrl-btn" (click)="expandAll()" title="Expand all nodes">⊞ Expand All</button>
              <div class="tree-search-wrap">
                <span>🔍</span>
                <input type="text" [(ngModel)]="treeSearch" placeholder="Highlight name..." class="tree-search">
              </div>
            </div>
          </div>

          <!-- Unassigned warning -->
          <div class="unassigned-bar" *ngIf="unassigned.length > 0">
            <span>⚠ {{ unassigned.length }} employee{{ unassigned.length > 1 ? 's' : '' }} not assigned to a manager:</span>
            <span *ngFor="let u of unassigned" class="unassigned-chip">{{ u.firstName }} {{ u.lastName }}</span>
          </div>

          <div class="tree-scroll">

            <div *ngIf="flatTree.length === 0" class="empty-tree">
              No employees found.
            </div>

            <div class="tree-body" *ngIf="flatTree.length > 0">
              <div *ngFor="let node of flatTree"
                   class="tree-row"
                   [class.highlighted]="treeSearch && (node.emp.firstName + ' ' + node.emp.lastName).toLowerCase().includes(treeSearch.toLowerCase())"
                   [class.root-row]="node.isRoot">

                <!-- Indent connectors -->
                <div class="connectors" *ngIf="!node.isRoot">
                  <span *ngFor="let hasMore of node.ancestors" class="conn-unit">
                    <span class="conn-vert" [class.invisible]="!hasMore">│</span>
                  </span>
                  <span class="conn-branch">{{ node.isLast ? '└' : '├' }}──</span>
                </div>

                <!-- Node card -->
                <div class="node-card" [ngClass]="'role-' + node.emp.role?.toLowerCase()">
                  <div class="node-avatar" [ngClass]="'av-' + node.emp.role?.toLowerCase()">
                    {{ node.emp.firstName?.charAt(0) }}{{ node.emp.lastName?.charAt(0) }}
                  </div>
                  <div class="node-info">
                    <div class="node-name">{{ node.emp.firstName }} {{ node.emp.lastName }}</div>
                    <div class="node-meta">
                      <span class="node-role-badge" [ngClass]="node.emp.role?.toLowerCase()">{{ node.emp.role?.replace('_', ' ') }}</span>
                      <span class="node-dept" *ngIf="node.emp.department">· {{ node.emp.department.name }}</span>
                    </div>
                  </div>
                  <div class="node-right">
                    <!-- Collapse/Expand toggle for nodes with children -->
                    <button *ngIf="node.hasChildren"
                            class="toggle-btn"
                            [class.is-collapsed]="node.isCollapsed"
                            (click)="toggleNode(node.emp.id); $event.stopPropagation()"
                            [title]="node.isCollapsed ? 'Expand (' + node.reportCount + ' direct reports)' : 'Collapse subtree'">
                      <span *ngIf="!node.isCollapsed">▼</span>
                      <span *ngIf="node.isCollapsed">▶</span>
                      <span class="toggle-count">{{ node.reportCount }}</span>
                    </button>
                    <button class="quick-assign-btn" (click)="quickAssign(node.emp)" title="Change manager">✎</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick-assign modal -->
      <div class="modal-overlay" *ngIf="quickEmp">
        <div class="modal-box" style="width:420px;">
          <div class="modal-header">
            <div>
              <h3>Reassign Manager</h3>
              <p style="font-size:0.8rem;color:#64748b;margin-top:2px;">
                {{ quickEmp.firstName }} {{ quickEmp.lastName }} · {{ quickEmp.role }}
              </p>
            </div>
            <button class="modal-close" (click)="quickEmp = null">&times;</button>
          </div>
          <div class="form-group" style="margin-bottom:1.25rem;">
            <label style="font-size:0.78rem;font-weight:700;color:#475569;display:block;margin-bottom:0.4rem;">Reports To</label>
            <select [(ngModel)]="quickManagerId" style="width:100%;padding:0.6rem;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.88rem;">
              <option value="">— No Manager —</option>
              <option *ngFor="let m of managersOnly" [value]="m.id"
                      [disabled]="m.id === quickEmp.id">
                {{ m.firstName }} {{ m.lastName }} ({{ m.role?.replace('_',' ') }})
              </option>
            </select>
          </div>
          <div style="display:flex;gap:0.75rem;">
            <button class="btn-primary" style="flex:1" (click)="saveQuick()">Save</button>
            <button class="btn-secondary" style="flex:1" (click)="quickEmp = null">Cancel</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .org-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-header h2 { font-size: 1.5rem; font-weight: 800; }
    .page-header p { font-size: 0.875rem; color: var(--adp-dark-gray); margin-top: 0.25rem; }

    /* Layout */
    .org-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }

    /* Left panel */
    .assign-panel { display: flex; flex-direction: column; gap: 1rem; }
    .panel-card { padding: 1.5rem; }
    .panel-title { font-size: 1rem; font-weight: 800; color: var(--adp-charcoal); margin-bottom: 1.25rem; }

    .select-search-wrap { margin-bottom: 0.4rem; }
    .select-search { width: 100%; padding: 0.45rem 0.65rem; border: 1.5px solid var(--adp-border); border-radius: 7px; font-size: 0.82rem; font-family: inherit; outline: none; }
    .select-search:focus { border-color: var(--adp-red); }

    .list-select {
      width: 100%;
      border: 1.5px solid var(--adp-border);
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.82rem;
      padding: 0.2rem;
      outline: none;
      background: #fafafa;
    }
    .list-select:focus { border-color: var(--adp-red); }
    .list-select option { padding: 0.4rem 0.5rem; }

    .arrow-divider { text-align: center; font-size: 0.78rem; font-weight: 700; color: var(--adp-dark-gray); padding: 0.6rem 0; letter-spacing: 0.05em; }

    .opt { color: #94a3b8; font-weight: 400; font-size: 0.7rem; }

    .btn-assign {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--adp-red);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    .btn-assign:hover { background: #b91c1c; }
    .btn-assign:disabled { background: #9ca3af; cursor: not-allowed; }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
    .stat-card { background: white; border-radius: 10px; padding: 0.85rem 1rem; text-align: center; border: 1.5px solid var(--adp-border); }
    .stat-card.hr { border-color: #fecdd3; background: #fff1f2; }
    .stat-card.mgr { border-color: #e9d5ff; background: #fdf4ff; }
    .stat-card.emp { border-color: #bfdbfe; background: #eff6ff; }
    .stat-num { font-size: 1.6rem; font-weight: 900; color: var(--adp-charcoal); line-height: 1; }
    .stat-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--adp-dark-gray); margin-top: 0.3rem; }

    /* Tree panel */
    .tree-panel { padding: 1.5rem; }
    .tree-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
    .tree-controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

    /* Control buttons */
    .ctrl-btn {
      background: #f1f5f9; border: 1.5px solid #e2e8f0; color: #475569;
      padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: all 0.15s;
    }
    .ctrl-btn:hover { background: #e2e8f0; border-color: #cbd5e1; }

    .tree-search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--adp-light-gray); border: 1.5px solid var(--adp-border); border-radius: 7px; padding: 0.35rem 0.65rem; }
    .tree-search { border: none; background: transparent; outline: none; font-size: 0.82rem; font-family: inherit; width: 140px; }

    .unassigned-bar {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 0.6rem 1rem;
      font-size: 0.78rem;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .unassigned-chip { background: #fef3c7; border: 1px solid #fde68a; padding: 0.1rem 0.5rem; border-radius: 20px; font-weight: 700; }

    .tree-scroll { overflow-x: auto; overflow-y: auto; max-height: calc(100vh - 280px); min-height: 400px; }
    .tree-body { display: flex; flex-direction: column; gap: 2px; }

    /* Tree rows */
    .tree-row {
      display: flex;
      align-items: center;
      gap: 0;
      min-width: max-content;
      border-radius: 8px;
      transition: background 0.15s;
    }
    .tree-row:hover { background: #f8faff; }
    .tree-row.highlighted { background: #fef9c3; }
    .tree-row.root-row { margin-bottom: 4px; }

    /* Connectors */
    .connectors { display: flex; align-items: center; font-family: monospace; font-size: 0.95rem; color: #94a3b8; flex-shrink: 0; }
    .conn-unit { display: flex; align-items: center; width: 20px; justify-content: center; }
    .conn-vert { color: #cbd5e1; }
    .conn-vert.invisible { color: transparent; }
    .conn-branch { color: #94a3b8; margin-right: 4px; white-space: nowrap; }

    /* Node card */
    .node-card {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0.65rem;
      border-radius: 8px;
      border: 1.5px solid transparent;
      min-width: 240px;
      cursor: default;
    }
    .node-card.role-hr_admin { border-color: #fecdd3; background: #fff1f2; }
    .node-card.role-manager { border-color: #e9d5ff; background: #fdf4ff; }
    .node-card.role-employee { border-color: #e2e8f0; background: white; }

    .node-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      font-size: 0.65rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: white;
    }
    .av-hr_admin { background: linear-gradient(135deg, #be123c, #e11d48); }
    .av-manager { background: linear-gradient(135deg, #7e22ce, #9333ea); }
    .av-employee { background: linear-gradient(135deg, #1967D2, #2563eb); }

    .node-info { flex: 1; min-width: 0; }
    .node-name { font-weight: 700; font-size: 0.85rem; color: var(--adp-charcoal); white-space: nowrap; }
    .node-meta { display: flex; align-items: center; gap: 0.4rem; margin-top: 1px; }
    .node-role-badge { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; padding: 0.1rem 0.45rem; border-radius: 20px; }
    .node-role-badge.hr_admin { background: #fecdd3; color: #be123c; }
    .node-role-badge.manager { background: #e9d5ff; color: #7e22ce; }
    .node-role-badge.employee { background: #dbeafe; color: #1967D2; }
    .node-dept { font-size: 0.72rem; color: #64748b; }

    .node-right { display: flex; align-items: center; gap: 0.35rem; margin-left: 0.5rem; }

    /* Toggle collapse/expand button */
    .toggle-btn {
      display: inline-flex; align-items: center; gap: 0.25rem;
      background: #f1f5f9; border: 1.5px solid #cbd5e1; color: #64748b;
      padding: 0.15rem 0.5rem; border-radius: 20px;
      font-size: 0.68rem; font-weight: 700; cursor: pointer;
      transition: all 0.15s; flex-shrink: 0; line-height: 1.4;
      font-family: inherit;
    }
    .toggle-btn:hover { border-color: var(--adp-red); color: var(--adp-red); background: #fff1f2; }
    .toggle-btn.is-collapsed { background: #fdf4ff; border-color: #c4b5fd; color: #7c3aed; }
    .toggle-btn.is-collapsed:hover { border-color: var(--adp-red); color: var(--adp-red); background: #fff1f2; }
    .toggle-count { font-size: 0.62rem; opacity: 0.8; }

    .quick-assign-btn { background: none; border: 1.5px solid #e2e8f0; color: #94a3b8; width: 24px; height: 24px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .quick-assign-btn:hover { border-color: var(--adp-red); color: var(--adp-red); background: #fff1f2; }

    .empty-tree { text-align: center; padding: 3rem; color: var(--adp-dark-gray); }
  `]
})
export class OrgChartComponent implements OnInit {
  allEmployees: any[] = [];
  flatTree: FlatNode[] = [];
  collapsed = new Set<number>();

  // Assignment form
  assignEmpId: string = '';
  assignManagerId: string = '';
  empSearch: string = '';
  mgrSearch: string = '';
  saving = false;

  // Quick-assign modal
  quickEmp: any = null;
  quickManagerId: string = '';

  // Tree filter
  treeSearch: string = '';

  constructor(private http: HttpClient, private notif: NotificationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.http.get<any[]>(`${API}/employees`).subscribe(data => {
      this.allEmployees = data;
      this.buildTree();
    });
  }

  // ── Filtered lists for assignment panel ──────────────────────────────

  get filteredEmpList() {
    const q = this.empSearch.toLowerCase();
    return this.allEmployees.filter(e =>
      !q || `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q)
    );
  }

  get filteredMgrList() {
    const q = this.mgrSearch.toLowerCase();
    return this.allEmployees.filter(e =>
      (e.role === 'MANAGER' || e.role === 'HR_ADMIN') &&
      e.id !== Number(this.assignEmpId) &&
      (!q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q))
    );
  }

  get managersOnly() {
    return this.allEmployees.filter(e => e.role === 'MANAGER' || e.role === 'HR_ADMIN');
  }

  get unassigned() {
    return this.allEmployees.filter(e =>
      !e.manager && e.role === 'EMPLOYEE' && e.status === 'ACTIVE'
    );
  }

  countRole(role: string) {
    return this.allEmployees.filter(e => e.role === role).length;
  }

  // ── Tree building ─────────────────────────────────────────────────────

  buildTree() {
    const roots = this.allEmployees
      .filter(e => !e.manager)
      .sort((a, b) => this.roleOrder(a.role) - this.roleOrder(b.role));

    this.flatTree = [];
    roots.forEach((root, i) => {
      this.flatten(root, [], i === roots.length - 1);
    });
  }

  private flatten(emp: any, ancestors: boolean[], isLast: boolean) {
    const children = this.allEmployees
      .filter(e => e.manager?.id === emp.id)
      .sort((a, b) => this.roleOrder(a.role) - this.roleOrder(b.role));

    const isCollapsed = this.collapsed.has(emp.id);

    this.flatTree.push({
      emp,
      ancestors,
      isLast,
      isRoot: ancestors.length === 0,
      depth: ancestors.length,
      reportCount: children.length,
      hasChildren: children.length > 0,
      isCollapsed
    });

    // Only recurse into children if this node is NOT collapsed
    if (!isCollapsed) {
      const newAncestors = [...ancestors, !isLast];
      children.forEach((child, i) => {
        this.flatten(child, newAncestors, i === children.length - 1);
      });
    }
  }

  private roleOrder(role: string): number {
    return role === 'HR_ADMIN' ? 0 : role === 'MANAGER' ? 1 : 2;
  }

  // ── Collapse / Expand ─────────────────────────────────────────────────

  toggleNode(empId: number) {
    if (this.collapsed.has(empId)) {
      this.collapsed.delete(empId);
    } else {
      this.collapsed.add(empId);
    }
    this.buildTree();
  }

  collapseAll() {
    this.allEmployees.forEach(e => {
      const hasChildren = this.allEmployees.some(c => c.manager?.id === e.id);
      if (hasChildren) this.collapsed.add(e.id);
    });
    this.buildTree();
  }

  expandAll() {
    this.collapsed.clear();
    this.buildTree();
  }

  // ── Assignment ────────────────────────────────────────────────────────

  assign() {
    if (!this.assignEmpId) { this.notif.show('Select an employee first.', 'info'); return; }
    this.saving = true;
    const managerId = this.assignManagerId ? Number(this.assignManagerId) : null;
    this.http.patch(`${API}/employees/${this.assignEmpId}/manager`, { managerId }).subscribe({
      next: () => {
        this.saving = false;
        const emp = this.allEmployees.find(e => e.id === Number(this.assignEmpId));
        const mgr = this.allEmployees.find(e => e.id === managerId);
        const msg = mgr
          ? `${emp?.firstName} now reports to ${mgr.firstName} ${mgr.lastName}`
          : `${emp?.firstName} removed from reporting line`;
        this.notif.show(msg, 'success');
        this.assignEmpId = '';
        this.assignManagerId = '';
        this.load();
      },
      error: () => { this.saving = false; this.notif.show('Assignment failed', 'error'); }
    });
  }

  quickAssign(emp: any) {
    this.quickEmp = emp;
    this.quickManagerId = emp.manager?.id?.toString() || '';
  }

  saveQuick() {
    if (!this.quickEmp) return;
    const managerId = this.quickManagerId ? Number(this.quickManagerId) : null;
    this.http.patch(`${API}/employees/${this.quickEmp.id}/manager`, { managerId }).subscribe({
      next: () => {
        this.notif.show('Manager updated!', 'success');
        this.quickEmp = null;
        this.load();
      },
      error: () => this.notif.show('Update failed', 'error')
    });
  }
}
