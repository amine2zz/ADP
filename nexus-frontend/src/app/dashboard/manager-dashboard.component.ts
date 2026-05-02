import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="dashboard-wrapper">
      <div class="dash-welcome">
        <h2>Manager Console: Welcome, {{ userName }}</h2>
        <p>Overview of your direct reports and team performance.</p>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card" style="border-top: 4px solid var(--adp-red);">
          <div class="kpi-title">Direct Reports</div>
          <div class="kpi-value">{{ subordinates.length }}</div>
          <div class="kpi-trend positive">Active Team Members</div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #1967D2;">
          <div class="kpi-title">My Annual Leave</div>
          <div class="kpi-value">📅 {{ employeeData?.leaveBalance?.toFixed(1) || '0.0' }}d</div>
          <div class="kpi-trend">
            <strong style="color: #1967D2;">{{ employeeData?.category?.name || 'Standard' }} Policy</strong>
            <div *ngIf="employeeData?.category" style="font-size:0.75rem; margin-top:0.25rem;">
              <div>{{ employeeData.category.description }}</div>
              <div style="color:gray; margin-top:0.1rem;">
                {{ employeeData.category.annualLeaveAllowance }}d/year &middot; +{{ employeeData.category.monthlyIncrement?.toFixed(2) }}d/mo
              </div>
            </div>
          </div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #ef4444;">
          <div class="kpi-title">My Sick Leave</div>
          <div class="kpi-value">💊 {{ employeeData?.sickLeaveBalance?.toFixed(1) || '0.0' }}d</div>
          <div class="kpi-trend">Remaining balance</div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="card" style="padding: 1rem;">
        <div class="tabs" style="display: flex; gap: 2rem; border-bottom: 1px solid var(--adp-border);">
          <button (click)="currentTab = 'team'" [style.border-bottom]="currentTab === 'team' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">My Team</button>
          <button (click)="currentTab = 'leaves'" [style.border-bottom]="currentTab === 'leaves' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Leave Requests</button>
          <button (click)="currentTab = 'attendance'" [style.border-bottom]="currentTab === 'attendance' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Attendance (Pointage)</button>
        </div>
      </div>

      <div class="card table-card" *ngIf="currentTab === 'team'">
        <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">Team Management</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table class="adp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of subordinates">
                <td><strong>{{ emp.firstName }} {{ emp.lastName }}</strong></td>
                <td><span class="role-badge">{{ emp.role }}</span></td>
                <td><span style="color: #F4B400;">★★★★☆</span></td>
                <td>
                  <button class="btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" (click)="rateEmployee()">Rate</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card table-card" *ngIf="currentTab === 'leaves'">
        <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">Leave Management</h3>
        <div class="table-container">
           <table class="adp-table" *ngIf="leaves.length > 0; else noLeaves">
             <thead><tr><th>Employee</th><th>Type</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
             <tbody>
               <tr *ngFor="let leave of leaves">
                 <td><strong>{{ leave.employee?.firstName }} {{ leave.employee?.lastName }}</strong></td>
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
           <ng-template #noLeaves><p style="color: var(--adp-dark-gray); padding: 2rem; text-align: center;">No pending leave requests from your team.</p></ng-template>
        </div>
      </div>

      <div class="card table-card" *ngIf="currentTab === 'attendance'">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="color: var(--adp-charcoal);">Team Availability Calendar</h3>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
             <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #5f6368;" (click)="changeWeek(-1)">← Previous</button>
             <span style="font-weight: 600; font-size: 0.9rem;">Week of {{ weekDays[0]?.date }}</span>
             <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #5f6368;" (click)="changeWeek(1)">Next →</button>
          </div>
        </div>
        <p style="color: var(--adp-dark-gray); font-size: 0.9rem; margin-bottom: 1rem;">View schedule: <span style="color:#137333">■ Worked</span> | <span style="color:#1967D2">■ Leave</span> | <span style="color:#80868B">■ Rest Day</span></p>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
           <div *ngFor="let emp of subordinates" style="display: flex; flex-direction: column; border-bottom: 1px solid var(--adp-border); padding-bottom: 0.5rem;">
              <div style="font-weight: 600; margin-bottom: 0.5rem;">{{ emp.firstName }} {{ emp.lastName }}</div>
              <div style="display: flex; gap: 0.5rem; overflow-x: auto;">
                <div *ngFor="let day of weekDays" 
                     style="min-width: 80px; height: 50px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; padding: 2px"
                     [style.background]="getDayColor(emp.id, day.date)"
                     [style.color]="'white'"
                     [title]="getDayTitle(emp.id, day.date)">
                  <div>{{ day.name }}</div>
                  <div>{{ day.date.split('-')[2] }}/{{ day.date.split('-')[1] }}</div>
                  <div style="font-size: 0.6rem; margin-top: 2px;">{{ getDayLabel(emp.id, day.date) }}</div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { display: flex; flex-direction: column; gap: 2rem; animation: fadeIn 0.5s ease; }
    .dash-welcome h2 { color: var(--adp-charcoal); font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;}
    .dash-welcome p { color: var(--adp-dark-gray); font-size: 1rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
    .kpi-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .kpi-title { font-size: 0.85rem; text-transform: uppercase; color: var(--adp-dark-gray); font-weight: 600; }
    .kpi-value { font-size: 2.5rem; font-weight: 700; color: var(--adp-charcoal); margin: 0.5rem 0; }
    .kpi-trend { font-size: 0.85rem; }
    .kpi-trend.positive { color: #137333; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .adp-table { width: 100%; border-collapse: collapse; }
    .adp-table th, .adp-table td { text-align: left; padding: 1rem; border-bottom: 1px solid var(--adp-border); font-size: 0.9rem;}
    .status-badge { padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize;}
    .status-badge.active { background: #E6F4EA; color: #137333; }
    .role-badge { background: #E8F0FE; color: #1967D2; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;}
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  userName: string = 'Manager';
  employeeData: any = {};
  subordinates: any[] = [];
  leaves: any[] = [];
  currentTab: any = 'team';
  userId: any = null;

  constructor(
    private http: HttpClient,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.generateWeekDays();
    this.userName = localStorage.getItem('adp_user') || 'Manager';
    this.userId = localStorage.getItem('adp_user_id');
    if (this.userId) {
      this.http.get<any[]>(`http://localhost:8085/api/manager/${this.userId}/subordinates`).subscribe({
        next: (data) => this.subordinates = data,
        error: (err) => console.error("Error fetching subordinates", err)
      });

      this.http.get<any[]>(`http://localhost:8085/api/employees`).subscribe({
        next: (employees: any[]) => {
          const me = employees.find((e: any) => e.id === Number(this.userId));
          if (me) { this.employeeData = me; }
        }
      });

      this.fetchLeaves();
    }
  }

  fetchLeaves() {
      this.http.get<any[]>(`http://localhost:8085/api/hr/manager/${this.userId}/leaves`).subscribe({
        next: (data) => this.leaves = data,
        error: (err) => console.error(err)
      });
      this.http.get<any[]>(`http://localhost:8085/api/hr/manager/${this.userId}/attendance`).subscribe({
        next: (data) => this.attendanceData = data,
        error: (err) => console.error(err)
      });
  }

  updateLeave(leaveId: number, action: string) {
      const email = localStorage.getItem('adp_user') || 'System';
      this.http.post(`http://localhost:8085/api/hr/leaves/${leaveId}/${action}`, { managerEmail: email }).subscribe({
          next: () => {
              this.notifService.show(`Leave request ${action}ed!`, 'success');
              this.fetchLeaves(); // refresh
          },
          error: () => this.notifService.show(`Failed to ${action} leave`, 'error')
      });
  }

  attendanceData: any[] = [];
  weekDays: any[] = [];
  navigationDate: Date = new Date();
  
  generateWeekDays() {
      this.weekDays = [];
      const startOfWeek = new Date(this.navigationDate);
      startOfWeek.setDate(this.navigationDate.getDate() - this.navigationDate.getDay() + 1); // Monday
      
      for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          this.weekDays.push({
              name: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
              date: d.toISOString().split('T')[0],
              isWeekend: d.getDay() === 0 || d.getDay() === 6
          });
      }
  }

  changeWeek(offset: number) {
      this.navigationDate.setDate(this.navigationDate.getDate() + (offset * 7));
      this.generateWeekDays();
  }

  getDayStats(empId: number, dateStr: string) {
      // Check for leaves (simple overlapping date)
      for (const req of this.leaves) {
          if (req.employee?.id === empId && req.status === 'APPROVED') {
              if (dateStr >= req.startDate && dateStr <= req.endDate) {
                  return { status: 'leave', type: req.type };
              }
          }
      }
      
      const dayDef = this.weekDays.find(d => d.date === dateStr);
      if (dayDef?.isWeekend) return { status: 'weekend' };

      // Calculate attendance duration
      let totalMins = 0;
      let hasClockIn = false;
      for (const att of this.attendanceData) {
          if (att.employee?.id === empId && att.checkIn && att.checkIn.startsWith(dateStr)) {
              hasClockIn = true;
              if (att.checkOut) {
                  const cin = new Date(att.checkIn).getTime();
                  const cout = new Date(att.checkOut).getTime();
                  totalMins += Math.floor((cout - cin) / 60000);
              }
          }
      }
      if (hasClockIn) {
          const hrs = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          return { status: 'worked', hrs, mins };
      }
      return dateStr > new Date().toISOString().split('T')[0] ? { status: 'future' } : { status: 'absent' };
  }

  getDayColor(empId: number, dateStr: string) {
      const s = this.getDayStats(empId, dateStr);
      if (s.status === 'leave') return '#1967D2'; // Blue as requested
      if (s.status === 'weekend') return '#80868B'; // Gray
      if (s.status === 'worked') return '#137333'; // Green
      if (s.status === 'future') return '#E8EAED'; // Light Gray
      return '#D93025'; // Absent (Red)
  }

  getDayLabel(empId: number, dateStr: string) {
      const s = this.getDayStats(empId, dateStr);
      if (s.status === 'leave') return s.type;
      if (s.status === 'weekend') return 'Rest Day';
      if (s.status === 'worked') return `${s.hrs}h ${s.mins}m`;
      if (s.status === 'future') return '-';
      return '0h 0m';
  }

  getDayTitle(empId: number, dateStr: string) {
      const s = this.getDayStats(empId, dateStr);
      if (s.status === 'worked') return `Worked ${s.hrs} hours and ${s.mins} minutes`;
      return s.status;
  }

  rateEmployee() {
    this.notifService.show("Employee rating saved successfully.", 'success');
  }
}
