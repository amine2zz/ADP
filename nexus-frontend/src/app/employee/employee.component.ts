import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule],
  template: `
    <div class="hr-dashboard">
      <div class="dash-welcome" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>HR Admin Portal - Employee Management</h2>
          <p>As an HR Administrator, you can instantly provision new employee accounts and manage the roster.</p>
        </div>
        <button class="btn-primary" (click)="refreshData()" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Sync Roster</button>
      </div>

      <div class="card" style="padding: 1rem; margin-bottom: 2rem;">
        <div class="tabs" style="display: flex; gap: 2rem; border-bottom: 1px solid var(--adp-border);">
          <button (click)="currentTab = 'roster'" [style.border-bottom]="currentTab === 'roster' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Employee Roster</button>
          <button (click)="currentTab = 'history'" [style.border-bottom]="currentTab === 'history' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Operation History</button>
        </div>
      </div>
      
      <div class="grid-layout" *ngIf="currentTab === 'roster'">
        <div class="card add-employee-card">
          <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">Provision New Employee</h3>
          <form (submit)="createEmployee($event)" class="provision-form">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" placeholder="e.g. John" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" placeholder="e.g. Doe" required>
            </div>
            <div class="form-group">
                <label>Work Email</label>
                <input type="email" name="email" placeholder="e.g. john.doe@adp.com" required>
            </div>
            <div class="form-group">
                <label>Department</label>
                <select name="departmentId" required style="padding: 0.75rem; border: 1px solid var(--adp-border); border-radius: 4px; width: 100%;">
                <option value="" disabled selected>Select Department</option>
                <option *ngFor="let dep of departments" [value]="dep.id">{{ dep.name }}</option>
                </select>
            </div>
            <div class="form-group">
                <label>Reporting Manager (Optional)</label>
                <select name="managerId" style="padding: 0.75rem; border: 1px solid var(--adp-border); border-radius: 4px; width: 100%;">
                <option value="">No Manager (Independent)</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.firstName }} {{ m.lastName }} ({{ m.role }})</option>
                </select>
            </div>
            <button type="submit" class="btn-primary" style="margin-top: 1rem; width: 100%;">Generate Account</button>
          </form>
        </div>

        <div class="card table-card">
          <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">Employee Roster</h3>
          <div class="table-container" style="overflow-x: auto;">
            <table class="adp-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Reports To</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr *ngFor="let emp of employees">
                    <td><strong>{{ emp.firstName }} {{ emp.lastName }}</strong></td>
                    <td>{{ emp.email }}</td>
                    <td><span class="role-badge">{{ emp.role }}</span></td>
                    <td>
                      <select [disabled]="emp.role === 'HR_ADMIN'" 
                              (change)="assignManager(emp.id, $event)" 
                              style="padding: 0.4rem; border: 1px solid var(--adp-border); border-radius: 4px; font-size: 0.8rem; background: #fafafa; width: 100%;">
                        <option value="">N/A</option>
                        <option *ngFor="let m of managers" 
                                [value]="m.id" 
                                [selected]="emp.manager?.id === m.id">
                          {{ m.firstName }} {{ m.lastName }}
                        </option>
                      </select>
                    </td>
                    <td>
                    <span class="status-badge" [ngClass]="(emp.status || 'UNKNOWN').toLowerCase()">
                        {{ (emp.status || 'UNKNOWN').replace('_', ' ') }}
                    </span>
                    </td>
                    <td>
                      <button (click)="selectedEmployee = emp" class="btn-primary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; background: #1967D2;">Edit</button>
                    </td>
                </tr>
                <tr *ngIf="employees.length === 0">
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--adp-dark-gray);">No employees found.</td>
                </tr>
                </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card table-card" *ngIf="currentTab === 'history'">
        <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">System Audit Trail</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table class="adp-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Operation</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of history">
                <td>{{ log.timestamp | date:'short' }}</td>
                <td><strong>{{ log.actor }}</strong></td>
                <td><span class="role-badge" style="background: #FFF3E0; color: #E65100;">{{ log.operation }}</span></td>
                <td>{{ log.target }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit Modal -->
      <div class="modal" *ngIf="selectedEmployee" style="position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index: 1000;">
        <div class="card" style="width: 500px; max-height: 90vh; overflow-y: auto;">
          <h3 style="margin-bottom: 1.5rem;">Edit Profile: {{ selectedEmployee.firstName }}</h3>
          <form (submit)="updateEmployee($event)" class="provision-form">
            <div class="form-group"><label>First Name</label><input type="text" name="firstName" [ngModel]="selectedEmployee.firstName"></div>
            <div class="form-group"><label>Last Name</label><input type="text" name="lastName" [ngModel]="selectedEmployee.lastName"></div>
            <div class="form-group"><label>CIN / National ID</label><input type="text" name="cin" [ngModel]="selectedEmployee.cin"></div>
            <div class="form-group"><label>Employee Code</label><input type="text" name="employeeCode" [ngModel]="selectedEmployee.employeeCode"></div>
            <div class="form-group"><label>Gender</label><input type="text" name="gender" [ngModel]="selectedEmployee.gender"></div>
            <div class="form-group"><label>Marital Status</label><input type="text" name="maritalStatus" [ngModel]="selectedEmployee.maritalStatus"></div>
            <div class="form-group"><label>Nationality</label><input type="text" name="nationality" [ngModel]="selectedEmployee.nationality"></div>
            <div class="form-group"><label>Emergency Contact</label><input type="text" name="emergencyContact" [ngModel]="selectedEmployee.emergencyContact"></div>
            <div class="form-group"><label>Job Title</label><input type="text" name="jobTitle" [ngModel]="selectedEmployee.jobTitle"></div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="btn-primary" style="flex: 1;">Save Changes</button>
              <button type="button" class="btn-primary" style="flex: 1; background: #e0e0e0; color: #333;" (click)="selectedEmployee = null">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hr-dashboard { width: 100%; animation: fadeIn 0.5s ease; }
    .grid-layout { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .provision-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--adp-dark-gray); }
    .provision-form input { padding: 0.75rem; border: 1px solid var(--adp-border); border-radius: 4px; font-size: 0.9rem; }
    .adp-table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .adp-table th, .adp-table td { text-align: left; padding: 1.25rem 1rem; border-bottom: 1px solid var(--adp-border); font-size: 0.9rem;}
    .adp-table th { color: var(--adp-dark-gray); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px;}
    .role-badge { background: #E8F0FE; color: #1967D2; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;}
    .status-badge { padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;}
    .status-badge.pending_setup { background: #FFF3E0; color: #E65100; }
    .status-badge.active { background: #E6F4EA; color: #137333; }
    .status-badge.unknown { background: #F1F3F4; color: #5F6368; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EmployeeComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  managers: any[] = [];
  history: any[] = [];
  currentTab: string = 'roster';
  selectedEmployee: any = null;

  constructor(private http: HttpClient, private notifService: NotificationService) {}

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.fetchEmployees();
    this.fetchDepartments();
    this.fetchManagers();
    this.fetchHistory();
  }

  fetchHistory() {
    this.http.get<any[]>('http://localhost:8085/api/hr/history').subscribe(data => this.history = data);
  }

  fetchEmployees() {
    this.http.get<any[]>('http://localhost:8085/api/employees').subscribe(data => this.employees = data);
  }

  fetchDepartments() {
    this.http.get<any[]>('http://localhost:8085/api/departments').subscribe(data => this.departments = data);
  }

  fetchManagers() {
    this.http.get<any[]>('http://localhost:8085/api/employees/managers').subscribe(data => this.managers = data);
  }

  assignManager(empId: number, event: any) {
    const managerId = event.target.value;
    const body = { managerId: managerId ? Number(managerId) : null };
    
    this.http.patch(`http://localhost:8085/api/employees/${empId}/manager`, body).subscribe({
      next: () => {
        this.notifService.show("Hierarchy Updated Successfully", "success");
        this.refreshData();
      },
      error: () => this.notifService.show("Update failed", "error")
    });
  }

  createEmployee(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const managerId = (form.elements.namedItem('managerId') as HTMLSelectElement).value;
    
    const payload: any = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      department: { id: Number((form.elements.namedItem('departmentId') as HTMLSelectElement).value) },
      role: 'EMPLOYEE'
    };

    if (managerId) {
      payload.manager = { id: Number(managerId) };
    }

    this.http.post('http://localhost:8085/api/employees', payload).subscribe({
      next: () => {
        form.reset();
        this.refreshData();
        this.notifService.show("Employee successfully created & assigned!", 'success');
      },
      error: (err) => this.notifService.show("Creation failed", 'error')
    });
  }

  updateEmployee(event: Event) {
    event.preventDefault();
    if (!this.selectedEmployee) return;

    const form = event.target as HTMLFormElement;
    const payload: any = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      cin: (form.elements.namedItem('cin') as HTMLInputElement).value,
      employeeCode: (form.elements.namedItem('employeeCode') as HTMLInputElement).value,
      gender: (form.elements.namedItem('gender') as HTMLInputElement).value,
      maritalStatus: (form.elements.namedItem('maritalStatus') as HTMLInputElement).value,
      nationality: (form.elements.namedItem('nationality') as HTMLInputElement).value,
      emergencyContact: (form.elements.namedItem('emergencyContact') as HTMLInputElement).value,
      jobTitle: (form.elements.namedItem('jobTitle') as HTMLInputElement).value
    };

    this.http.put(`http://localhost:8085/api/employees/${this.selectedEmployee.id}`, payload).subscribe({
      next: () => {
        this.selectedEmployee = null;
        this.notifService.show("Profile Updated Successfully", "success");
        this.refreshData();
      },
      error: () => this.notifService.show("Failed to update profile", "error")
    });
  }
}
