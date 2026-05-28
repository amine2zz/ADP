import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
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
          <div class="kpi-title">📅 My Annual Leave</div>
          <div class="kpi-value">{{ employeeData?.leaveBalance?.toFixed(1) || '0.0' }}d</div>
          <div class="kpi-trend">
            <strong style="color: #1967D2;">{{ employeeData?.category?.name || 'Standard' }} Policy</strong>
            <div *ngIf="employeeData?.category" style="font-size:0.75rem; margin-top:0.25rem;">
              <div>{{ employeeData.category.description }}</div>
              <div style="color:gray; margin-top:0.1rem;">{{ employeeData.category.annualLeaveAllowance }}d/year &middot; +{{ employeeData.category.monthlyIncrement?.toFixed(2) }}d/mo</div>
            </div>
          </div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #ef4444;">
          <div class="kpi-title">💊 My Sick Leave</div>
          <div class="kpi-value">{{ employeeData?.sickLeaveBalance?.toFixed(1) || '0.0' }}d</div>
          <div class="kpi-trend">Remaining balance</div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="card" style="padding: 1rem;">
        <div class="tabs" style="display: flex; gap: 2rem; border-bottom: 1px solid var(--adp-border);">
          <button (click)="currentTab = 'leaves'" [style.border-bottom]="currentTab === 'leaves' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Leave Requests</button>
          <button (click)="currentTab = 'team'" [style.border-bottom]="currentTab === 'team' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">My Team</button>
          <button (click)="currentTab = 'attendance'" [style.border-bottom]="currentTab === 'attendance' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Attendance (Pointage)</button>
        </div>
      </div>

      <div class="card table-card" *ngIf="currentTab === 'team'">
        <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">Team Management</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table class="adp-table">
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Hire Date</th><th>Email</th></tr></thead>
            <tbody>
              <tr *ngFor="let emp of subordinates">
                <td>
                  <strong>{{ emp.firstName }} {{ emp.lastName }}</strong>
                  <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">{{ emp.jobTitle || 'Employee' }}</div>
                </td>
                <td><span class="role-badge">{{ emp.role }}</span></td>
                <td>{{ emp.department?.name || 'N/A' }}</td>
                <td>{{ formatEmployeeDate(emp.createdAt || emp.joiningDate) }}</td>
                <td>{{ emp.email || 'N/A' }}</td>
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
                     (click)="openAttendanceEditor(emp, day)"
                     style="min-width: 80px; height: 50px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; padding: 2px; cursor: pointer;"
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

      <div *ngIf="attendanceEditorOpen" class="modal-overlay" (click)="attendanceEditorOpen = false">
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
            <button class="btn-secondary" (click)="attendanceEditorOpen = false">Cancel</button>
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
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: flex-start; justify-content: center; padding: 1.5rem 0.75rem; overflow-y: auto; z-index: 1000; }
    .modal-card { background: white; border-radius: 1rem; padding: 1.75rem; width: min(90vw, 520px); max-height: calc(100vh - 3rem); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
    .modal-body { overflow-y: auto; flex: 1; padding-right: 0.25rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; flex-shrink: 0; background: white; padding-top: 0.75rem; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    .form-grid label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .form-grid input, .form-grid select { width: 100%; padding: 0.75rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #f8fafc; font-family: inherit; font-size: 0.95rem; }
    .btn-secondary { padding: 0.75rem 1.25rem; border-radius: 0.75rem; font-weight: 700; background: #e2e8f0; border: none; color: #334155; cursor: pointer; }
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
  currentTab: any = 'leaves';
  userId: any = null;
  attendanceData: any[] = [];
  attendanceEditorOpen: boolean = false;
  editAttendanceRecord: any = null;
  attendanceEditPayload: any = { morningIn: '', lunchOut: '', afternoonIn: '', eveningOut: '', status: '' };
  weekDays: any[] = [];
  navigationDate: Date = new Date();

  constructor(private http: HttpClient, private notifService: NotificationService) {}

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
        next: (employees: any[]) => { const me = employees.find((e: any) => e.id === Number(this.userId)); if (me) this.employeeData = me; }
      });
      this.fetchLeaves();
    }
  }

  fetchLeaves() {
    this.http.get<any[]>(`http://localhost:8085/api/hr/manager/${this.userId}/leaves`).subscribe({ next: (data) => this.leaves = data, error: (err) => console.error(err) });
    this.http.get<any[]>(`http://localhost:8085/api/hr/manager/${this.userId}/attendance`).subscribe({ next: (data) => this.attendanceData = data, error: (err) => console.error(err) });
  }

  updateLeave(leaveId: number, action: string) {
    const email = localStorage.getItem('adp_user') || 'System';
    this.http.post(`http://localhost:8085/api/hr/leaves/${leaveId}/${action}`, { managerEmail: email }).subscribe({
      next: () => { this.notifService.show(`Leave request ${action}ed!`, 'success'); this.fetchLeaves(); },
      error: () => this.notifService.show(`Failed to ${action} leave`, 'error')
    });
  }

  generateWeekDays() {
    this.weekDays = [];
    const startOfWeek = new Date(this.navigationDate);
    startOfWeek.setDate(this.navigationDate.getDate() - this.navigationDate.getDay() + 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      this.weekDays.push({ name: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], date: d.toISOString().split('T')[0], isWeekend: d.getDay() === 0 || d.getDay() === 6 });
    }
  }

  changeWeek(offset: number) { this.navigationDate.setDate(this.navigationDate.getDate() + (offset * 7)); this.generateWeekDays(); }

  getDayStats(empId: number, dateStr: string) {
    for (const req of this.leaves) {
      if (req.employee?.id === empId && req.status === 'APPROVED') {
        if (dateStr >= req.startDate && dateStr <= req.endDate) return { status: 'leave', type: req.type };
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
        if (lunchOut && afternoonIn) totalMs -= Math.max(0, afternoonIn.getTime() - lunchOut.getTime());
        return { status: 'worked', hrs: Math.floor(totalMs / 3600000), mins: Math.floor((totalMs % 3600000) / 60000) };
      }
      if (morningIn) return { status: 'partial' };
    }
    return dateStr > new Date().toISOString().split('T')[0] ? { status: 'future' } : { status: 'absent' };
  }

  findAttendanceRecord(empId: number, dateStr: string) {
    return this.attendanceData.find((att: any) => att.employee?.id === empId && att.workDate === dateStr);
  }

  formatTime(value: any) {
    if (!value) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    if (typeof value === 'string') { const [, timePart] = value.split('T'); if (!timePart) return ''; const [hours = '00', minutes = '00'] = timePart.split(':'); return `${pad(Number(hours))}:${pad(Number(minutes))}`; }
    const date = value instanceof Date ? value : new Date(value);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  formatEmployeeDate(value: any) {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toISOString().split('T')[0];
  }

  buildDateTime(dateStr: string, timeValue: string) { if (!timeValue) return undefined; return `${dateStr}T${timeValue}:00`; }

  validateAttendanceTimeOrder() {
    const sequence = [
      { label: 'Morning In', time: this.attendanceEditPayload.morningIn },
      { label: 'Lunch Out', time: this.attendanceEditPayload.lunchOut },
      { label: 'Afternoon In', time: this.attendanceEditPayload.afternoonIn },
      { label: 'Evening Out', time: this.attendanceEditPayload.eveningOut }
    ];
    let lastDateTime: string | undefined;
    for (const item of sequence) {
      if (!item.time) continue;
      const current = this.buildDateTime(this.editAttendanceRecord.workDate, item.time);
      if (!current) continue;
      if (lastDateTime && lastDateTime >= current) { this.notifService.show(`${item.label} must be after the previous time.`, 'error'); return false; }
      lastDateTime = current;
    }
    return true;
  }

  openAttendanceEditor(emp: any, day: any) {
    const existing = this.findAttendanceRecord(emp.id, day.date);
    if (existing) {
      this.editAttendanceRecord = existing;
      this.attendanceEditPayload = { morningIn: this.formatTime(existing.morningIn), lunchOut: this.formatTime(existing.lunchOut), afternoonIn: this.formatTime(existing.afternoonIn), eveningOut: this.formatTime(existing.eveningOut), status: existing.status || 'ABSENT' };
    } else {
      this.editAttendanceRecord = { employee: emp, workDate: day.date };
      this.attendanceEditPayload = { morningIn: '', lunchOut: '', afternoonIn: '', eveningOut: '', status: 'ABSENT' };
    }
    this.attendanceEditorOpen = true;
  }

  saveAttendanceEdit() {
    if (!this.editAttendanceRecord || !this.editAttendanceRecord.employee) return;
    if (!this.validateAttendanceTimeOrder()) return;
    const morningIn = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.morningIn);
    const lunchOut = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.lunchOut);
    const afternoonIn = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.afternoonIn);
    const eveningOut = this.buildDateTime(this.editAttendanceRecord.workDate, this.attendanceEditPayload.eveningOut);
    const payload: any = { employeeId: String(this.editAttendanceRecord.employee.id), workDate: this.editAttendanceRecord.workDate, status: this.attendanceEditPayload.status || undefined, updatedBy: localStorage.getItem('adp_user') || 'SYSTEM' };
    if (morningIn) payload.morningIn = morningIn;
    if (lunchOut) payload.lunchOut = lunchOut;
    if (afternoonIn) payload.afternoonIn = afternoonIn;
    if (eveningOut) payload.eveningOut = eveningOut;
    const request = this.editAttendanceRecord.id ? this.http.put(`http://localhost:8085/api/hr/attendance/${this.editAttendanceRecord.id}`, payload) : this.http.post(`http://localhost:8085/api/hr/attendance`, payload);
    request.subscribe({
      next: () => { this.notifService.show('Attendance saved successfully.', 'success'); this.attendanceEditorOpen = false; this.fetchLeaves(); },
      error: () => this.notifService.show('Failed to save attendance.', 'error')
    });
  }

  getDayColor(empId: number, dateStr: string) {
    const s = this.getDayStats(empId, dateStr);
    if (s.status === 'leave') return '#1967D2';
    if (s.status === 'weekend') return '#80868B';
    if (s.status === 'worked') return '#137333';
    if (s.status === 'future') return '#E8EAED';
    return '#D93025';
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
}
