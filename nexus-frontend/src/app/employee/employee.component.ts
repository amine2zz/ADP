import { Component, OnInit } from '@angular/core';
import { API_BASE } from '../services/api.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule],
  template: `
    <div class="hr-page slide-up">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2>Employee Management</h2>
          <p>Provision accounts, manage profiles and team hierarchy.</p>
        </div>
        <button class="btn-primary" (click)="refreshData()">↻ Sync Roster</button>
      </div>

      <!-- Tabs -->
      <div class="card" style="padding: 1rem; margin-top: 1rem; margin-bottom: 1.5rem;">
        <div class="tabs" style="display: flex; gap: 2rem; border-bottom: 1px solid var(--adp-border);">
          <button (click)="currentTab = 'roster'" [style.border-bottom]="currentTab === 'roster' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600; color: var(--adp-charcoal);">Employee Roster</button>
          <button (click)="currentTab = 'history'" [style.border-bottom]="currentTab === 'history' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600; color: var(--adp-charcoal);">Change History</button>
        </div>
      </div>

      <!-- ROSTER TAB -->
      <div *ngIf="currentTab === 'roster'" class="roster-layout">

        <!-- Provision Form -->
        <div class="card provision-card">
          <h3 class="section-title">Provision New Employee</h3>
          <form (submit)="createEmployee($event)" class="provision-form">
            <div class="form-group"><label>First Name</label><input type="text" name="firstName" placeholder="John" required></div>
            <div class="form-group"><label>Last Name</label><input type="text" name="lastName" placeholder="Doe" required></div>
            <div class="form-group"><label>Work Email</label><input type="email" name="email" placeholder="john.doe@adp.com" required></div>
            <div class="form-group">
              <label>Role</label>
              <select name="role" required>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR_ADMIN">HR Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Department</label>
              <select name="departmentId" required>
                <option value="" disabled selected>Select Department</option>
                <option *ngFor="let dep of departments" [value]="dep.id">{{ dep.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Reporting Manager <span style="color:#94a3b8">(optional)</span></label>
              <select name="managerId">
                <option value="">— None —</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.firstName }} {{ m.lastName }}</option>
              </select>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:0.5rem;">Generate Account</button>
          </form>
        </div>

        <!-- Roster Table -->
        <div class="card table-card">

          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="search-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name or email..." class="search-input">
            </div>
            <select [(ngModel)]="filterRole" class="filter-select">
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR Admin</option>
            </select>
            <select [(ngModel)]="filterStatus" class="filter-select">
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_SETUP">Pending Setup</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select [(ngModel)]="filterDept" class="filter-select">
              <option value="">All Departments</option>
              <option *ngFor="let dep of departments" [value]="dep.name">{{ dep.name }}</option>
            </select>
            <span class="result-count">{{ filteredEmployees.length }} result{{ filteredEmployees.length !== 1 ? 's' : '' }}</span>
          </div>

          <div class="table-container">
            <table class="adp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Reports To</th>
                  <th>Status</th>
                  <th>Balances</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let emp of filteredEmployees">
                  <td>
                    <div class="emp-cell">
                      <div class="emp-avatar">{{ emp.firstName?.charAt(0) }}{{ emp.lastName?.charAt(0) }}</div>
                      <div>
                        <div class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</div>
                        <div class="emp-email">{{ emp.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="role-badge" [ngClass]="emp.role?.toLowerCase()">{{ emp.role?.replace('_',' ') }}</span></td>
                  <td><span class="dept-text">{{ emp.department?.name || '—' }}</span></td>
                  <td>
                    <div *ngIf="emp.manager; else noManager" class="manager-cell">
                      <div class="manager-avatar">{{ emp.manager.firstName?.charAt(0) }}</div>
                      <span>{{ emp.manager.firstName }} {{ emp.manager.lastName }}</span>
                    </div>
                    <ng-template #noManager><span class="no-manager">— None —</span></ng-template>
                  </td>
                  <td><span class="status-badge" [ngClass]="(emp.status||'unknown').toLowerCase()">{{ (emp.status||'Unknown').replace('_',' ') }}</span></td>
                  <td>
                    <div class="balance-cell">
                      <div title="Annual Leave">📅 {{ emp.leaveBalance?.toFixed(1) || '0.0' }}d</div>
                      <div title="Sick Leave" style="color:#ef4444">💊 {{ emp.sickLeaveBalance?.toFixed(1) || '0.0' }}d</div>
                    </div>
                  </td>
                  <td>
                    <button class="btn-edit" (click)="openEdit(emp)">Edit</button>
                  </td>
                </tr>
                <tr *ngIf="filteredEmployees.length === 0">
                  <td colspan="6" class="empty-row">No employees match the current filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- HISTORY TAB -->
      <div *ngIf="currentTab === 'history'" class="card">
        <div class="filter-bar" style="margin-bottom:1rem;">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" [(ngModel)]="historySearch" placeholder="Search by actor or operation..." class="search-input">
          </div>
        </div>
        <div class="table-container">
          <table class="adp-table">
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Operation</th><th>Target</th><th>Description</th></tr></thead>
            <tbody>
              <tr *ngFor="let log of filteredHistory">
                <td style="white-space:nowrap; color:#64748b; font-size:0.8rem;">{{ log.timestamp | date:'dd/MM/yy HH:mm' }}</td>
                <td><strong style="font-size:0.85rem;">{{ log.actor }}</strong></td>
                <td><span class="op-badge">{{ log.operation }}</span></td>
                <td style="font-size:0.85rem;">{{ log.target }}</td>
                <td style="font-size:0.82rem; color:#64748b;">{{ log.description }}</td>
              </tr>
              <tr *ngIf="filteredHistory.length === 0">
                <td colspan="5" class="empty-row">No history records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- EDIT MODAL -->
      <div class="modal-overlay" *ngIf="selectedEmployee">
        <div class="modal-box" style="width:580px;">
          <div class="modal-header">
            <div>
              <h3>Edit Employee</h3>
              <p style="font-size:0.8rem; color:#64748b; margin-top:2px;">{{ selectedEmployee.email }}</p>
            </div>
            <button class="modal-close" (click)="selectedEmployee = null">&times;</button>
          </div>
          <form (submit)="updateEmployee($event)" style="display:flex; flex-direction:column; gap:1rem;">

            <div class="modal-section-label">Personal Information</div>
            <div class="form-row-2">
              <div class="form-group"><label>First Name</label><input type="text" name="firstName" [value]="selectedEmployee.firstName||''"></div>
              <div class="form-group"><label>Last Name</label><input type="text" name="lastName" [value]="selectedEmployee.lastName||''"></div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>CIN / National ID</label><input type="text" name="cin" [value]="selectedEmployee.cin||''"></div>
              <div class="form-group"><label>Employee Code</label><input type="text" name="employeeCode" [value]="selectedEmployee.employeeCode||''"></div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Gender</label>
                <select name="gender">
                  <option value="" [selected]="!selectedEmployee.gender">— Select —</option>
                  <option value="Male" [selected]="selectedEmployee.gender==='Male'">Male</option>
                  <option value="Female" [selected]="selectedEmployee.gender==='Female'">Female</option>
                </select>
              </div>
              <div class="form-group"><label>Marital Status</label><input type="text" name="maritalStatus" [value]="selectedEmployee.maritalStatus||''"></div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Nationality</label><input type="text" name="nationality" [value]="selectedEmployee.nationality||''"></div>
              <div class="form-group"><label>Emergency Contact</label><input type="text" name="emergencyContact" [value]="selectedEmployee.emergencyContact||''"></div>
            </div>

            <div class="modal-section-label">Professional Information</div>
            <div class="form-row-2">
              <div class="form-group"><label>Job Title</label><input type="text" name="jobTitle" [value]="selectedEmployee.jobTitle||''"></div>
              <div class="form-group"><label>Joining Date</label><input type="text" name="joiningDate" [value]="selectedEmployee.joiningDate||''"></div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Role</label>
                <select name="role">
                  <option value="EMPLOYEE" [selected]="selectedEmployee.role==='EMPLOYEE'">Employee</option>
                  <option value="MANAGER" [selected]="selectedEmployee.role==='MANAGER'">Manager</option>
                  <option value="HR_ADMIN" [selected]="selectedEmployee.role==='HR_ADMIN'">HR Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select name="status">
                  <option value="ACTIVE" [selected]="selectedEmployee.status==='ACTIVE'">Active</option>
                  <option value="PENDING_SETUP" [selected]="selectedEmployee.status==='PENDING_SETUP'">Pending Setup</option>
                  <option value="INACTIVE" [selected]="selectedEmployee.status==='INACTIVE'">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Department</label>
                <select name="departmentId">
                  <option value="">— None —</option>
                  <option *ngFor="let dep of departments" [value]="dep.id" [selected]="selectedEmployee.department?.id === dep.id">{{ dep.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Reporting Manager</label>
                <select name="managerId">
                  <option value="">— None —</option>
                  <option *ngFor="let m of managers" [value]="m.id" [selected]="selectedEmployee.manager?.id === m.id">{{ m.firstName }} {{ m.lastName }}</option>
                </select>
              </div>
            </div>


            <div class="modal-section-label" style="display:flex; justify-content:space-between; align-items:center;">
              Leave Bank (Days)
              <button type="button" class="btn-secondary" style="font-size:0.65rem; padding:0.1rem 0.4rem;" (click)="syncWithPolicy()">🔄 Sync with Policy</button>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Category Policy</label>
                <select name="categoryId">
                  <option value="">— Unassigned —</option>
                  <option *ngFor="let cat of categories" [value]="cat.id" [selected]="selectedEmployee.category?.id === cat.id">{{ cat.name }} ({{ cat.annualLeaveAllowance }}d/y)</option>
                </select>
              </div>
              <div class="form-row-2" style="gap:0.5rem;">
                <div class="form-group"><label>Annual Bal.</label><input type="number" step="0.1" name="leaveBalance" [value]="selectedEmployee.leaveBalance||0"></div>
                <div class="form-group"><label>Sick Bal.</label><input type="number" step="0.1" name="sickLeaveBalance" [value]="selectedEmployee.sickLeaveBalance||0"></div>
              </div>
            </div>

            <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
              <button type="submit" class="btn-primary" style="flex:1">Save Changes</button>
              <button type="button" class="btn-secondary" style="flex:1" (click)="selectedEmployee = null">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hr-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-header h2 { font-size: 1.5rem; font-weight: 800; }
    .page-header p { font-size: 0.875rem; color: var(--adp-dark-gray); margin-top: 0.25rem; }

    .roster-layout { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; align-items: start; }
    .provision-card { padding: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--adp-charcoal); }
    .provision-form { display: flex; flex-direction: column; gap: 1rem; }

    /* Filter Bar */
    .filter-bar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .search-wrap { display: flex; align-items: center; gap: 0.5rem; background: var(--adp-light-gray); border: 1.5px solid var(--adp-border); border-radius: 8px; padding: 0.5rem 0.75rem; flex: 1; min-width: 200px; }
    .search-icon { font-size: 0.9rem; }
    .search-input { border: none; background: transparent; outline: none; font-size: 0.875rem; width: 100%; font-family: inherit; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1.5px solid var(--adp-border); border-radius: 8px; font-size: 0.82rem; font-family: inherit; background: white; color: var(--adp-charcoal); cursor: pointer; }
    .filter-select:focus { outline: none; border-color: var(--adp-red); }
    .result-count { font-size: 0.78rem; color: var(--adp-dark-gray); font-weight: 600; white-space: nowrap; margin-left: auto; }

    /* Table */
    .table-container { overflow-x: auto; }
    .adp-table { width: 100%; border-collapse: collapse; min-width: 700px; }
    .adp-table th { text-align: left; padding: 0.75rem 1rem; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--adp-dark-gray); background: var(--adp-light-gray); border-bottom: 1px solid var(--adp-border); }
    .adp-table td { padding: 0.9rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--adp-border); vertical-align: middle; }
    .adp-table tbody tr:hover { background: #f8faff; }
    .adp-table tbody tr:last-child td { border-bottom: none; }
    .empty-row { text-align: center; padding: 2.5rem; color: var(--adp-dark-gray); font-size: 0.875rem; }

    /* Employee cell */
    .emp-cell { display: flex; align-items: center; gap: 0.75rem; }
    .emp-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .emp-name { font-weight: 600; font-size: 0.875rem; color: var(--adp-charcoal); }
    .emp-email { font-size: 0.75rem; color: var(--adp-dark-gray); margin-top: 1px; }

    /* Manager cell */
    .manager-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 500; }
    .manager-avatar { width: 24px; height: 24px; border-radius: 50%; background: #dbeafe; color: #1967D2; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .no-manager { font-size: 0.8rem; color: #94a3b8; }
    .dept-text { font-size: 0.82rem; color: var(--adp-charcoal); }

    /* Badges */
    .role-badge { padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; background: #eff6ff; color: #1967D2; }
    .role-badge.manager { background: #fdf4ff; color: #7e22ce; }
    .role-badge.hr_admin { background: #fff1f2; color: #be123c; }
    .status-badge { padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-block; }
    .status-badge.active { background: #dcfce7; color: #15803d; }
    .status-badge.pending_setup { background: #fff7ed; color: #c2410c; }
    .status-badge.inactive { background: #f1f5f9; color: #64748b; }
    .op-badge { background: #fff7ed; color: #c2410c; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.72rem; font-weight: 700; }

    /* Edit button */
    .btn-edit { padding: 0.3rem 0.8rem; background: #eff6ff; color: #1967D2; border: 1.5px solid #bfdbfe; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-edit:hover { background: #1967D2; color: white; }
    
    .balance-cell { display: flex; flex-direction: column; gap: 2px; font-size: 0.75rem; font-weight: 600; }

    /* Modal */
    .modal-section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--adp-dark-gray); padding-bottom: 0.25rem; border-bottom: 1px solid var(--adp-border); }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class EmployeeComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  managers: any[] = [];
  categories: any[] = [];
  history: any[] = [];
  currentTab: string = 'roster';
  selectedEmployee: any = null;
  searchQuery: string = '';
  filterRole: string = '';
  filterStatus: string = '';
  filterDept: string = '';
  historySearch: string = '';

  get filteredEmployees() {
    return this.employees.filter(e => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q || `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q);
      const matchRole = !this.filterRole || e.role === this.filterRole;
      const matchStatus = !this.filterStatus || e.status === this.filterStatus;
      const matchDept = !this.filterDept || e.department?.name === this.filterDept;
      return matchSearch && matchRole && matchStatus && matchDept;
    });
  }

  get filteredHistory() {
    const q = this.historySearch.toLowerCase();
    return this.history.filter(h => !q || `${h.actor} ${h.operation} ${h.target}`.toLowerCase().includes(q));
  }

  constructor(private http: HttpClient, private notifService: NotificationService) {}

  ngOnInit() { this.refreshData(); }

  refreshData() {
    this.http.get<any[]>('${API_BASE}/employees').subscribe(d => this.employees = d);
    this.http.get<any[]>('${API_BASE}/departments').subscribe(d => this.departments = d);
    this.http.get<any[]>('${API_BASE}/employees/managers').subscribe(d => this.managers = d);
    this.http.get<any[]>('${API_BASE}/hr/categories').subscribe(d => this.categories = d);
    this.http.get<any[]>('${API_BASE}/hr/history').subscribe(d => this.history = d);
  }

  openEdit(emp: any) { this.selectedEmployee = { ...emp }; }

  createEmployee(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const managerId = (form.elements.namedItem('managerId') as HTMLSelectElement).value;
    const deptId = (form.elements.namedItem('departmentId') as HTMLSelectElement).value;
    const payload: any = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      role: (form.elements.namedItem('role') as HTMLSelectElement).value,
      department: deptId ? { id: Number(deptId) } : null
    };
    if (managerId) payload.manager = { id: Number(managerId) };
    this.http.post('${API_BASE}/employees', payload).subscribe({
      next: () => { (event.target as HTMLFormElement).reset(); this.refreshData(); this.notifService.show('Employee created successfully!', 'success'); },
      error: () => this.notifService.show('Creation failed', 'error')
    });
  }

  syncWithPolicy() {
    if (!this.selectedEmployee || !this.selectedEmployee.category?.id) {
      // Find category details from the local list if not already expanded
      const catId = (document.getElementsByName('categoryId')[0] as HTMLSelectElement).value;
      const cat = this.categories.find(c => c.id == catId);
      if (cat && this.selectedEmployee) {
        this.selectedEmployee.leaveBalance = cat.annualLeaveAllowance;
        this.selectedEmployee.sickLeaveBalance = cat.sickLeaveAllowance;
        this.notifService.show(`Recalibrated to ${cat.name} standards.`, 'success');
      } else {
        this.notifService.show('Please select a Category first.', 'info');
      }
    } else {
      const cat = this.selectedEmployee.category;
      this.selectedEmployee.leaveBalance = cat.annualLeaveAllowance;
      this.selectedEmployee.sickLeaveBalance = cat.sickLeaveAllowance;
      this.notifService.show(`Recalibrated to ${cat.name} standards.`, 'success');
    }
  }

  updateEmployee(event: Event) {
    event.preventDefault();
    if (!this.selectedEmployee) return;
    const form = event.target as HTMLFormElement;
    const deptId = (form.elements.namedItem('departmentId') as HTMLSelectElement).value;
    const managerId = (form.elements.namedItem('managerId') as HTMLSelectElement).value;
    const payload: any = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      cin: (form.elements.namedItem('cin') as HTMLInputElement).value,
      employeeCode: (form.elements.namedItem('employeeCode') as HTMLInputElement).value,
      gender: (form.elements.namedItem('gender') as HTMLSelectElement).value,
      maritalStatus: (form.elements.namedItem('maritalStatus') as HTMLInputElement).value,
      nationality: (form.elements.namedItem('nationality') as HTMLInputElement).value,
      emergencyContact: (form.elements.namedItem('emergencyContact') as HTMLInputElement).value,
      jobTitle: (form.elements.namedItem('jobTitle') as HTMLInputElement).value,
      joiningDate: (form.elements.namedItem('joiningDate') as HTMLInputElement).value,
      role: (form.elements.namedItem('role') as HTMLSelectElement).value,
      status: (form.elements.namedItem('status') as HTMLSelectElement).value,
      department: deptId ? { id: Number(deptId) } : null,
      manager: managerId ? { id: Number(managerId) } : null,
      categoryId: (form.elements.namedItem('categoryId') as HTMLSelectElement).value,
      leaveBalance: (form.elements.namedItem('leaveBalance') as HTMLInputElement).value,
      sickLeaveBalance: (form.elements.namedItem('sickLeaveBalance') as HTMLInputElement).value
    };
    this.http.put(`${API_BASE}/employees/${this.selectedEmployee.id}`, payload).subscribe({
      next: () => { this.selectedEmployee = null; this.notifService.show('Profile updated successfully', 'success'); this.refreshData(); },
      error: () => this.notifService.show('Update failed', 'error')
    });
  }
}


