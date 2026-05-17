import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { API_BASE } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';

@Pipe({ name: 'mapDepts', standalone: true })
export class MapDeptsPipe implements PipeTransform {
  transform(employees: any[]): string[] {
    if (!employees) return [];
    return Array.from(new Set(employees.filter(e => e.department?.name).map(e => e.department.name)));
  }
}

@Pipe({ name: 'keyValues', standalone: true })
export class KeyValuesPipe implements PipeTransform {
  transform(value: any): any[] {
    if (!value) return [];
    return Object.entries(value).map(([key, val]) => ({ key, val }));
  }
}

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, MapDeptsPipe, KeyValuesPipe],
  template: `
    <div class="dashboard-wrapper">
      <div class="dash-welcome">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Monitor real-time metrics, employee statistics, and platform health.</p>
          </div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="card" style="padding: 1rem; margin-top: 1rem;">
        <div class="tabs" style="display: flex; gap: 2rem; border-bottom: 1px solid var(--adp-border);">
          <button (click)="setTab('attendance')" [style.border-bottom]="currentTab === 'attendance' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Global Attendance</button>
          <button (click)="setTab('overview')" [style.border-bottom]="currentTab === 'overview' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">System Overview</button>
          <button (click)="setTab('leaves')" [style.border-bottom]="currentTab === 'leaves' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Global Leaves</button>
          <button (click)="setTab('policies')" [style.border-bottom]="currentTab === 'policies' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Leave Policies</button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content" style="margin-top: 2rem;">
        
        <!-- Tab 1: System Overview -->
        <div *ngIf="currentTab === 'overview'" class="fade-in">
          <div class="kpi-grid">
            <div class="kpi-card" style="border-top: 4px solid var(--adp-red);">
              <div class="kpi-title">Total Headcount</div>
              <div class="kpi-value">{{ metrics?.totalHeadcount || 0 }}</div>
              <div class="kpi-trend positive">Synchronized Live</div>
            </div>
            <div class="kpi-card" style="border-top: 4px solid #137333;">
              <div class="kpi-title">Active Profiles</div>
              <div class="kpi-value">{{ metrics?.activeProfiles || 0 }}</div>
              <div class="kpi-trend positive">Fully Configured</div>
            </div>
            <div class="kpi-card" style="border-top: 4px solid #E65100;">
              <div class="kpi-title">Pending Setups</div>
              <div class="kpi-value">{{ metrics?.pendingSetups || 0 }}</div>
              <div class="kpi-trend negative">Awaiting Activation</div>
            </div>
            <div class="kpi-card" style="border-top: 4px solid #1967D2;">
              <div class="kpi-title">Total Leave Bank</div>
              <div class="kpi-value">📅 {{ metrics?.totalLeaveDays?.toFixed(0) || 0 }}d</div>
              <div class="kpi-trend positive">Annual Company Total</div>
            </div>
            <div class="kpi-card" style="border-top: 4px solid #9c27b0;">
              <div class="kpi-title">Defined Policies</div>
              <div class="kpi-value">{{ metrics?.totalPolicies || 0 }}</div>
              <div class="kpi-trend">Leave Categories</div>
            </div>
          </div>

          <div class="charts-section" style="margin-top: 2rem;">
            <!-- Dynamic Chart 1: Department Distribution -->
            <div class="chart-card">
              <h3>Department Composition</h3>
              <div class="composition-list">
                <div *ngFor="let d of metrics?.deptDistribution | keyValues" class="comp-item">
                  <div class="comp-info">
                    <span class="comp-name">{{ d.key }}</span>
                    <span class="comp-count">{{ d.val }} headcounts</span>
                  </div>
                  <div class="comp-bar-bg">
                    <div class="comp-bar-fill" [style.width.%]="(d.val / metrics.totalHeadcount) * 100"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dynamic Chart 2: Leave Type Trends -->
            <div class="chart-card">
              <h3>Leave Request Analysis</h3>
              <div class="mock-chart">
                <div *ngFor="let l of metrics?.leaveTypeDistribution | keyValues" 
                     class="bar-wrap" 
                     [title]="l.key + ': ' + l.val">
                  <div class="bar" 
                       [style.height.%]="(l.val / 10) * 100" 
                       [class.bg-red]="l.key === 'SICK'"
                       [class.bg-blue]="l.key === 'ANNUAL'"></div>
                  <span class="bar-label">{{ l.key.charAt(0) }}{{ l.key.substring(1,3).toLowerCase() }}</span>
                </div>
              </div>
              <div class="chart-legend" style="margin-top: 1rem; display: flex; gap: 1rem; font-size: 0.75rem;">
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#1967D2; border-radius:2px;"></span> Annual</span>
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#D0271D; border-radius:2px;"></span> Sick</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Global Leaves -->
        <div *ngIf="currentTab === 'leaves'" class="fade-in">
          <div class="card table-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="color: var(--adp-charcoal);">Global Leave Management</h3>
              <div style="display: flex; gap: 0.75rem;">
                <input type="text" [(ngModel)]="leaveSearch" placeholder="Search employee..." style="padding: 0.4rem 0.75rem; border: 1.5px solid var(--adp-border); border-radius: 6px; font-size: 0.85rem;">
                <select [(ngModel)]="leaveDeptFilter" style="padding: 0.4rem 0.75rem; border: 1.5px solid var(--adp-border); border-radius: 6px; font-size: 0.85rem;">
                  <option value="">All Departments</option>
                  <option *ngFor="let d of allEmployees | mapDepts" [value]="d">{{ d }}</option>
                </select>
              </div>
            </div>
            <div class="table-container">
               <table class="adp-table" *ngIf="leaves.length > 0; else noLeaves">
                 <thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
                 <tbody>
                   <tr *ngFor="let leave of filteredLeaves">
                     <td><strong>{{ leave.employee?.firstName }} {{ leave.employee?.lastName }}</strong></td>
                     <td>{{ leave.employee?.department?.name || 'N/A' }}</td>
                     <td>{{ leave.type }}</td>
                     <td>{{ leave.startDate }} to {{ leave.endDate }}</td>
                     <td><span class="status-badge" [ngClass]="leave.status === 'APPROVED' ? 'active' : ''">{{ leave.status }}</span></td>
                     <td>
                       <button *ngIf="leave.status === 'PENDING'" class="btn-primary" style="background:#137333; margin-right:5px; padding:0.3rem 0.6rem;" (click)="updateLeave(leave.id, 'approve')">Approve</button>
                       <button *ngIf="leave.status === 'PENDING'" class="btn-primary" style="background:#E65100; padding:0.3rem 0.6rem;" (click)="updateLeave(leave.id, 'reject')">Reject</button>
                     </td>
                   </tr>
                 </tbody>
               </table>
               <ng-template #noLeaves><p style="color: var(--adp-dark-gray); padding: 2rem; text-align: center;">No pending leave requests exist.</p></ng-template>
            </div>
          </div>
        </div>

        <!-- Tab 3: Global Attendance -->
        <div *ngIf="currentTab === 'attendance'" class="fade-in">
          <div class="card table-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="color: var(--adp-charcoal);">Global Availability Calendar</h3>
              <div style="display: flex; gap: 0.75rem;">
                <input type="text" [(ngModel)]="attSearch" placeholder="Search employee..." style="padding: 0.4rem 0.75rem; border: 1.5px solid var(--adp-border); border-radius: 6px; font-size: 0.85rem;">
                <select [(ngModel)]="attDeptFilter" style="padding: 0.4rem 0.75rem; border: 1.5px solid var(--adp-border); border-radius: 6px; font-size: 0.85rem;">
                  <option value="">All Departments</option>
                  <option *ngFor="let d of allEmployees | mapDepts" [value]="d">{{ d }}</option>
                </select>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <div></div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                 <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #5f6368;" (click)="changeWeek(-1)">← Previous</button>
                 <span style="font-weight: 600; font-size: 0.9rem;">Week of {{ weekDays[0]?.date }}</span>
                 <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #5f6368;" (click)="changeWeek(1)">Next →</button>
              </div>
            </div>
            <p style="color: var(--adp-dark-gray); font-size: 0.9rem; margin-bottom: 1rem;">View schedule: <span style="color:#137333">■ Worked</span> | <span style="color:#1967D2">■ Leave</span> | <span style="color:#80868B">■ Rest Day</span></p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
               <!-- Week Headers -->
               <div style="display: flex; gap: 0.5rem; margin-left: 0; padding-bottom: 0.5rem; border-bottom: 2px solid var(--adp-border);">
                 <div style="min-width: 150px; font-weight: 800; color: var(--adp-dark-gray); font-size: 0.75rem; text-transform: uppercase;">Employee</div>
                 <div *ngFor="let dayName of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']" 
                      style="min-width: 80px; text-align: center; font-weight: 800; color: var(--adp-dark-gray); font-size: 0.75rem; text-transform: uppercase;">
                   {{ dayName }}
                 </div>
               </div>

               <div *ngFor="let emp of filteredEmployees" style="display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--adp-border); padding: 0.5rem 0;">
                  <div style="min-width: 150px; font-weight: 600; font-size: 0.85rem;">
                    {{ emp.firstName }} {{ emp.lastName }} 
                    <div style="font-size:0.65rem; color:gray; font-weight:normal;">{{ emp.department?.name || 'No Dept' }}</div>
                  </div>
                  <div style="display: flex; gap: 0.5rem; overflow-x: auto;">
                    <div *ngFor="let day of weekDays" 
                         (click)="openAttendanceEditor(emp, day)"
                         style="min-width: 80px; height: 44px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 800; padding: 2px; transition: transform 0.1s; cursor: pointer;"
                         [style.background]="day.isWeekend ? '#f1f5f9' : getDayColor(emp.id, day.date)"
                         [style.color]="day.isWeekend ? '#64748b' : 'white'"
                         [style.border]="day.isWeekend ? '1px dashed var(--adp-border)' : 'none'"
                         [title]="getDayTitle(emp.id, day.date)">
                      <div style="opacity: 0.8;">{{ day.date.split('-')[2] }}/{{ day.date.split('-')[1] }}</div>
                      <div style="font-size: 0.65rem; margin-top: 1px;">{{ getDayLabel(emp.id, day.date) }}</div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div *ngIf="attendanceEditModalVisible" class="modal-overlay" (click)="attendanceEditModalVisible = false">
            <div class="modal-card" (click)="$event.stopPropagation()">
              <h3 style="margin-bottom: 1rem;">Edit Attendance for {{ editAttendanceRecord.employee.firstName }} {{ editAttendanceRecord.employee.lastName }} on {{ editAttendanceRecord.workDate }}</h3>
              <div class="modal-body">
                <div class="form-grid">
                  <label>Date</label>
                  <input type="text" [value]="editAttendanceRecord.workDate" readonly style="background:#f1f5f9; cursor:not-allowed;" />
                  <label>Morning In</label>
                  <input type="time" [(ngModel)]="attendanceEditPayload.morningIn">
                  <label>Lunch Out</label>
                  <input type="time" [(ngModel)]="attendanceEditPayload.lunchOut">
                  <label>Afternoon In</label>
                  <input type="time" [(ngModel)]="attendanceEditPayload.afternoonIn">
                  <label>Evening Out</label>
                  <input type="time" [(ngModel)]="attendanceEditPayload.eveningOut">
                  <label>Status</label>
                  <select [(ngModel)]="attendanceEditPayload.status">
                    <option value="ABSENT">ABSENT</option>
                    <option value="MORNING_IN">MORNING_IN</option>
                    <option value="LUNCH_OUT">LUNCH_OUT</option>
                    <option value="AFTERNOON_IN">AFTERNOON_IN</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-primary" (click)="saveAttendanceEdit()">Save</button>
                <button class="btn-secondary" (click)="attendanceEditModalVisible = false">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Leave Policies -->
        <div *ngIf="currentTab === 'policies'" class="fade-in" style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem;">
          <!-- Form Card -->
          <div class="card">
            <h3 style="margin-bottom: 1.25rem;">{{ selectedCategory ? 'Edit Policy' : 'New Leave Policy' }}</h3>
            <form (submit)="saveCategory($event)" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b;">Policy Name</label>
                <input type="text" name="name" [(ngModel)]="policyForm.name" placeholder="Category 1" required style="padding: 0.5rem; border: 1.5px solid var(--adp-border); border-radius: 6px;">
              </div>
              <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b;">Annual Allowance (Days)</label>
                <input type="number" name="annualAllowance" [(ngModel)]="policyForm.annualLeaveAllowance" (input)="onAnnualChange()" (change)="onAnnualChange()" placeholder="20" required style="padding: 0.5rem; border: 1.5px solid var(--adp-border); border-radius: 6px;">
              </div>
              <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b;">Sick Leave Allowance (Days)</label>
                <input type="number" name="sickAllowance" [(ngModel)]="policyForm.sickLeaveAllowance" placeholder="10" required style="padding: 0.5rem; border: 1.5px solid var(--adp-border); border-radius: 6px;">
              </div>
              <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b;">Monthly Accrual Rate</label>
                <div style="padding: 0.5rem; border: 1.5px solid var(--adp-border); border-radius: 6px; background: #f1f5f9; color: #0f172a; font-weight: 700; min-height: 38px; display: flex; align-items: center; justify-content: space-between;">
                  <span>📅 Monthly Increment:</span>
                  <span style="color: #1967D2;">+{{ policyForm.monthlyIncrement || '0.00' }} days</span>
                </div>
                <input type="hidden" name="monthlyIncrement" [(ngModel)]="policyForm.monthlyIncrement">
              </div>
              <div class="form-group" style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #64748b;">Description</label>
                <input type="text" name="description" [(ngModel)]="policyForm.description" placeholder="Details..." style="padding: 0.5rem; border: 1.5px solid var(--adp-border); border-radius: 6px;">
              </div>
              <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                <button type="submit" class="btn-primary" style="flex:1">{{ selectedCategory ? 'Update' : 'Save' }} Policy</button>
                <button *ngIf="selectedCategory" type="button" class="btn-primary" style="flex:1; background:#64748b" (click)="resetPolicyForm()">Cancel</button>
              </div>
            </form>
          </div>

          <!-- List Card -->
          <div class="card table-card">
            <h3 style="margin-bottom: 1.25rem;">Defined Policies</h3>
            <div class="table-container">
              <table class="adp-table">
                <thead><tr><th>Policy Name</th><th>Entitlements</th><th>Accrual</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr *ngFor="let cat of categories">
                    <td>
                      <strong>{{ cat.name }}</strong>
                      <div style="font-size:0.75rem; color:#64748b;">{{ cat.description }}</div>
                    </td>
                    <td>
                      <div style="font-weight:600;">📅 {{ cat.annualLeaveAllowance }}d Annual</div>
                      <div style="color:#ef4444; font-size:0.8rem; font-weight:600;">💊 {{ cat.sickLeaveAllowance }}d Sick</div>
                    </td>
                    <td>+{{ cat.monthlyIncrement?.toFixed(2) }}d/mo</td>
                    <td>
                      <div style="display:flex; gap:0.4rem;">
                        <button (click)="editPolicy(cat)" style="padding: 0.2rem 0.5rem; background: #eff6ff; color: #1967D2; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Edit</button>
                        <button (click)="deleteCategory(cat.id)" style="padding: 0.2rem 0.5rem; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Del</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { display: flex; flex-direction: column; gap: 1rem; }
    .dash-welcome h2 { color: var(--adp-charcoal); font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;}
    .dash-welcome p { color: var(--adp-dark-gray); font-size: 1rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
    .kpi-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .kpi-title { font-size: 0.85rem; text-transform: uppercase; color: var(--adp-dark-gray); font-weight: 600; }
    .kpi-value { font-size: 2.5rem; font-weight: 700; color: var(--adp-charcoal); margin: 0.5rem 0; }
    .kpi-trend { font-size: 0.85rem; }
    .kpi-trend.positive { color: #137333; }
    .charts-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    .chart-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .chart-card h3 { font-size: 1.1rem; color: var(--adp-charcoal); margin-bottom: 1.5rem; }
    .mock-chart { height: 200px; display: flex; align-items: flex-end; gap: 10%; border-bottom: 2px solid var(--adp-light-gray); padding-bottom: 5px; }
    .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .bar { width: 100%; background-color: var(--adp-blue); border-radius: 4px 4px 0 0; transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    .bar-label { font-size: 0.7rem; color: var(--adp-dark-gray); margin-top: 0.5rem; font-weight: 600; }
    .composition-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .comp-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .comp-info { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; }
    .comp-name { color: var(--adp-charcoal); }
    .comp-count { color: var(--adp-dark-gray); font-size: 0.75rem; }
    .comp-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .comp-bar-fill { height: 100%; background: linear-gradient(90deg, var(--adp-red), #ff6b6b); border-radius: 4px; transition: width 1s ease-out; }
    .activity-feed { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem;}
    .activity-feed li { display: flex; gap: 0.5rem; align-items: center; }
    .activity-icon { width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; justify-content: center; align-items: center; font-size: 12px; }
    .bg-green { background: #137333; }
    .bg-blue { background: #1967D2; }
    .bg-red { background: #D0271D; }
    .activity-text { font-size: 0.85rem; color: var(--adp-charcoal); }
    .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .adp-table { width: 100%; border-collapse: collapse; }
    .adp-table th, .adp-table td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--adp-border); font-size: 0.85rem;}
    .status-badge { padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7rem; font-weight: 600;}
    .status-badge.active { background: #E6F4EA; color: #137333; }
    .fade-in { animation: fadeIn 0.4s ease; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 1.5rem 0.75rem;
      overflow-y: auto;
      z-index: 1000;
    }
    .modal-card {
      background: white;
      border-radius: 1rem;
      padding: 1.75rem;
      width: min(90vw, 520px);
      max-height: calc(100vh - 3rem);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    }
    .modal-body {
      overflow-y: auto;
      flex: 1;
      padding-right: 0.25rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      flex-shrink: 0;
      background: white;
      padding-top: 0.75rem;
    }
    .modal-card .form-grid {
      min-width: 0;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .form-grid label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .form-grid input,
    .form-grid select {
      width: 100%;
      padding: 0.75rem 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.75rem;
      background: #f8fafc;
      font-family: inherit;
      font-size: 0.95rem;
    }
    .btn-secondary {
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      font-weight: 700;
      background: #e2e8f0;
      border: none;
      color: #334155;
      cursor: pointer;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MainDashboardComponent implements OnInit {
  metrics: any = null;
  currentTab: string = 'overview';
  leaves: any[] = [];
  attendanceData: any[] = [];
  allEmployees: any[] = [];
  leaveSearch: string = '';
  leaveDeptFilter: string = '';
  attSearch: string = '';
  attDeptFilter: string = '';
  categories: any[] = [];
  selectedCategory: any = null;
  policyForm: any = { name: '', annualLeaveAllowance: null, monthlyIncrement: null, description: '' };
  attendanceEditModalVisible: boolean = false;
  editAttendanceRecord: any = null;
  attendanceEditPayload: any = { morningIn: '', lunchOut: '', afternoonIn: '', eveningOut: '', status: '' };
  weekDays: any[] = [];
  navigationDate: Date = new Date();

  constructor(private http: HttpClient, private notifService: NotificationService) {}

  ngOnInit() {
    const savedTab = localStorage.getItem('adp_dash_tab');
    if (savedTab) this.currentTab = savedTab;

    this.generateWeekDays();
    this.fetchMetrics();
    this.fetchData();
  }

  setTab(tab: string) {
    this.currentTab = tab;
    localStorage.setItem('adp_dash_tab', tab);
    // Automatically refresh data whenever switching tabs
    this.fetchMetrics();
  }

  generateWeekDays() {
      this.weekDays = [];
      const startOfWeek = new Date(this.navigationDate);
      startOfWeek.setDate(this.navigationDate.getDate() - this.navigationDate.getDay() + 1);
      for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const dateStr = this.formatLocalDate(d);
          this.weekDays.push({
              name: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
              date: dateStr,
              isWeekend: d.getDay() === 0 || d.getDay() === 6
          });
      }
  }

  formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isWeekend(dateStr: string): boolean {
    if (!dateStr) return false;
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay() === 0 || d.getDay() === 6;
  }

  changeWeek(offset: number) {
      this.navigationDate.setDate(this.navigationDate.getDate() + (offset * 7));
      this.generateWeekDays();
  }

  fetchData() {
    this.http.get<any[]>('${API_BASE}/employees').subscribe({
        next: (data) => this.allEmployees = data,
        error: (err) => console.error(err)
    });
    this.http.get<any[]>('${API_BASE}/hr/all-leaves').subscribe({
        next: (data) => this.leaves = data,
        error: (err) => console.error(err)
    });
    this.http.get<any[]>('${API_BASE}/hr/all-attendance').subscribe({
        next: (data) => this.attendanceData = data,
        error: (err) => console.error(err)
    });
    this.http.get<any[]>('${API_BASE}/hr/categories').subscribe({
        next: (data) => this.categories = data,
        error: (err) => console.error(err)
    });
  }

  getDayStats(empId: number, dateStr: string) {
      for (const req of this.leaves) {
          if (req.employee?.id === empId && req.status === 'APPROVED') {
              if (dateStr >= req.startDate && dateStr <= req.endDate) {
                  return { status: 'leave', type: req.type };
              }
          }
      }
      const dayDef = this.weekDays.find(d => d.date === dateStr);
      if (dayDef?.isWeekend) return { status: 'weekend' };

      const attendance = this.findAttendanceRecord(empId, dateStr);
      if (attendance) {
          const morningIn = attendance.morningIn ? new Date(attendance.morningIn) : null;
          const lunchOut = attendance.lunchOut ? new Date(attendance.lunchOut) : null;
          const afternoonIn = attendance.afternoonIn ? new Date(attendance.afternoonIn) : null;
          const eveningOut = attendance.eveningOut ? new Date(attendance.eveningOut) : null;

          if (morningIn && eveningOut) {
              let totalMs = eveningOut.getTime() - morningIn.getTime();
              if (lunchOut && afternoonIn) {
                  totalMs -= Math.max(0, afternoonIn.getTime() - lunchOut.getTime());
              }
              const hrs = Math.floor(totalMs / 3600000);
              const mins = Math.floor((totalMs % 3600000) / 60000);
              return { status: 'worked', hrs, mins };
          }
          if (morningIn) {
              return { status: 'partial' };
          }
      }
      return dateStr > new Date().toISOString().split('T')[0] ? { status: 'future' } : { status: 'absent' };
  }

  findAttendanceRecord(empId: number, dateStr: string) {
      return this.attendanceData.find((att: any) => att.employee?.id === empId && att.workDate === dateStr);
  }

  formatTime(value: any) {
      if (!value) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      if (typeof value === 'string') {
          const [, timePart] = value.split('T');
          if (!timePart) return '';
          const [hours = '00', minutes = '00'] = timePart.split(':');
          return `${pad(Number(hours))}:${pad(Number(minutes))}`;
      }
      const date = value instanceof Date ? value : new Date(value);
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  buildDateTime(dateStr: string, timeValue: string) {
      if (!timeValue) return undefined;
      return `${dateStr}T${timeValue}:00`;
  }

  validateAttendanceTimeOrder() {
      const sequence = [
          { label: 'Morning In', time: this.attendanceEditPayload.morningIn },
          { label: 'Lunch Out', time: this.attendanceEditPayload.lunchOut },
          { label: 'Afternoon In', time: this.attendanceEditPayload.afternoonIn },
          { label: 'Evening Out', time: this.attendanceEditPayload.eveningOut }
      ];
      let lastDateTime: string | undefined;

      for (const item of sequence) {
          if (!item.time) {
              continue;
          }
          const current = this.buildDateTime(this.editAttendanceRecord.workDate, item.time);
          if (!current) {
              continue;
          }
          if (lastDateTime && lastDateTime >= current) {
              this.notifService.show(`${item.label} must be after the previous time.`, 'error');
              return false;
          }
          lastDateTime = current;
      }

      return true;
  }

  openAttendanceEditor(emp: any, day: any) {
      const existing = this.findAttendanceRecord(emp.id, day.date);
      if (existing) {
          this.editAttendanceRecord = existing;
          this.attendanceEditPayload = {
              morningIn: this.formatTime(existing.morningIn),
              lunchOut: this.formatTime(existing.lunchOut),
              afternoonIn: this.formatTime(existing.afternoonIn),
              eveningOut: this.formatTime(existing.eveningOut),
              status: existing.status || 'ABSENT'
          };
      } else {
          this.editAttendanceRecord = { employee: emp, workDate: day.date };
          this.attendanceEditPayload = { morningIn: '', lunchOut: '', afternoonIn: '', eveningOut: '', status: 'ABSENT' };
      }
      this.attendanceEditModalVisible = true;
  }

  saveAttendanceEdit() {
      if (!this.editAttendanceRecord || !this.editAttendanceRecord.employee) {
          return;
      }

      if (!this.validateAttendanceTimeOrder()) {
          return;
      }

      const morningIn = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.morningIn);
      const lunchOut = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.lunchOut);
      const afternoonIn = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.afternoonIn);
      const eveningOut = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.eveningOut);

      const payload: any = {
          employeeId: String(this.editAttendanceRecord.employee.id),
          workDate: this.editAttendanceRecord.workDate,
          status: this.attendanceEditPayload.status || undefined,
          updatedBy: localStorage.getItem('adp_user') || 'SYSTEM'
      };

      if (morningIn) payload.morningIn = morningIn;
      if (lunchOut) payload.lunchOut = lunchOut;
      if (afternoonIn) payload.afternoonIn = afternoonIn;
      if (eveningOut) payload.eveningOut = eveningOut;

      const request = this.editAttendanceRecord.id
          ? this.http.put(`${API_BASE}/hr/attendance/${this.editAttendanceRecord.id}`, payload)
          : this.http.post(`${API_BASE}/hr/attendance`, payload);

      request.subscribe({
          next: () => {
              this.notifService.show('Attendance saved successfully.', 'success');
              this.attendanceEditModalVisible = false;
              this.fetchData();
          },
          error: () => this.notifService.show('Failed to save attendance.', 'error')
      });
  }

  getDayColor(empId: number, dateStr: string) {
      const s = this.getDayStats(empId, dateStr);
      if (s.status === 'leave') {
          if (s.type === 'SICK') return '#ef4444';
          if (s.type === 'UNPAID') return '#f59e0b'; // Amber for Unpaid
          return '#1967D2';
      }
      if (s.status === 'weekend') return '#80868B';
      if (s.status === 'worked') return '#137333';
      if (s.status === 'future') return '#E8EAED';
      return '#D0271D';
  }

  getDayLabel(empId: number, dateStr: string) {
      if (this.isWeekend(dateStr)) return '';
      const s = this.getDayStats(empId, dateStr);
      if (s.status === 'leave') {
          if (s.type === 'UNPAID') return 'UNPAID 💼';
          return s.type;
      }
      if (s.status === 'worked') return `${s.hrs}h ${s.mins}m`;
      if (s.status === 'future') return '-';
      return '0h 0m';
  }

  getDayTitle(empId: number, dateStr: string) {
      const s = this.getDayStats(empId, dateStr);
      if (s.status === 'worked') return `Worked ${s.hrs}h ${s.mins}m`;
      return s.status;
  }

  updateLeave(leaveId: number, action: string) {
      const email = localStorage.getItem('adp_user') || 'System';
      this.http.post(`${API_BASE}/hr/leaves/${leaveId}/${action}`, { managerEmail: email }).subscribe({
          next: () => this.fetchData(),
          error: (err) => console.error(err)
      });
  }

  fetchMetrics() {
    this.http.get('${API_BASE}/dashboard/metrics').subscribe({
      next: (data) => this.metrics = data,
      error: (err) => console.error('Metrics sync failed', err)
    });
    this.fetchData();
  }

  get filteredLeaves() {
    return this.leaves.filter(l => {
      const matchSearch = !this.leaveSearch || `${l.employee?.firstName} ${l.employee?.lastName}`.toLowerCase().includes(this.leaveSearch.toLowerCase());
      const matchDept = !this.leaveDeptFilter || l.employee?.department?.name === this.leaveDeptFilter;
      return matchSearch && matchDept;
    });
  }

  get filteredEmployees() {
    return this.allEmployees.filter(e => {
      const matchSearch = !this.attSearch || `${e.firstName} ${e.lastName}`.toLowerCase().includes(this.attSearch.toLowerCase());
      const matchDept = !this.attDeptFilter || e.department?.name === this.attDeptFilter;
      return matchSearch && matchDept;
    });
  }

  saveCategory(event: Event) {
    event.preventDefault();
    // Force recalculation before saving to be absolutely sure
    this.onAnnualChange();
    
    if (this.selectedCategory) {
      this.http.put(`${API_BASE}/hr/categories/${this.selectedCategory.id}`, this.policyForm).subscribe({
        next: () => { this.resetPolicyForm(); this.fetchMetrics(); this.fetchData(); },
        error: (err) => console.error(err)
      });
    } else {
      this.http.post('${API_BASE}/hr/categories', this.policyForm).subscribe({
        next: () => { this.resetPolicyForm(); this.fetchMetrics(); this.fetchData(); },
        error: (err) => console.error(err)
      });
    }
  }

  onAnnualChange() {
    const annual = Number(this.policyForm.annualLeaveAllowance);
    if (annual > 0) {
      // Strictly enforce Annual / 12
      this.policyForm.monthlyIncrement = Number((annual / 12).toFixed(2));
    } else {
      this.policyForm.monthlyIncrement = 0;
    }
  }

  editPolicy(cat: any) {
    this.selectedCategory = cat;
    this.policyForm = { ...cat };
  }

  resetPolicyForm() {
    this.selectedCategory = null;
    this.policyForm = { name: '', annualLeaveAllowance: null, monthlyIncrement: null, description: '' };
  }

  deleteCategory(id: number) {
    if (confirm('Delete this policy?')) {
      this.http.delete(`${API_BASE}/hr/categories/${id}`).subscribe({
        next: () => { this.fetchMetrics(); this.fetchData(); },
        error: (err) => console.error(err)
      });
    }
  }
}


