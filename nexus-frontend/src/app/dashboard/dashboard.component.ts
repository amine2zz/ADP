import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="dashboard-wrapper">
      <div class="dash-welcome">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Monitor real-time metrics, employee statistics, and platform health.</p>
          </div>
          <button class="btn-primary" (click)="fetchMetrics()" style="font-size: 0.8rem; padding: 0.5rem 1rem;">Force Sync</button>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="card" style="padding: 1rem; margin-top: 1rem;">
        <div class="tabs" style="display: flex; gap: 2rem; border-bottom: 1px solid var(--adp-border);">
          <button (click)="currentTab = 'overview'" [style.border-bottom]="currentTab === 'overview' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">System Overview</button>
          <button (click)="currentTab = 'leaves'" [style.border-bottom]="currentTab === 'leaves' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Global Leaves</button>
          <button (click)="currentTab = 'attendance'" [style.border-bottom]="currentTab === 'attendance' ? '3px solid var(--adp-red)' : 'none'" style="background: none; border: none; padding: 1rem 0.5rem; cursor: pointer; font-weight: 600;">Global Attendance</button>
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
              <div class="kpi-title">Departments</div>
              <div class="kpi-value">{{ metrics?.totalDepartments || 4 }}</div>
              <div class="kpi-trend">Fully Mapped</div>
            </div>
          </div>

          <div class="charts-section" style="margin-top: 2rem;">
            <div class="chart-card">
              <h3>Employee Growth (2026)</h3>
              <div class="mock-chart">
                <div class="bar" style="height: 40%;" title="Jan"></div>
                <div class="bar" style="height: 55%;" title="Feb"></div>
                <div class="bar" style="height: 50%;" title="Mar"></div>
                <div class="bar" style="height: 70%;" title="Apr"></div>
                <div class="bar" style="height: 65%;" title="May"></div>
                <div class="bar" style="height: 85%;" title="Jun"></div>
                <div class="bar" style="height: 95%; background-color: var(--adp-red);" title="Jul"></div>
              </div>
              <div class="chart-labels">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span style="font-weight: bold; color: var(--adp-red);">Jul</span>
              </div>
            </div>

            <div class="chart-card list-card">
              <h3>Recent HR Operations</h3>
              <ul class="activity-feed">
                <li><div class="activity-icon bg-green">✓</div><div class="activity-text"><strong>System Link</strong> dynamically activated.<br><small>Just Now</small></div></li>
                <li><div class="activity-icon bg-blue">👤</div><div class="activity-text"><strong>Java API</strong> integrated flawlessly.<br><small>Mapping Configured</small></div></li>
                <li><div class="activity-icon bg-red">!</div><div class="activity-text">Database Synchronization completed.<br><small>All connections live.</small></div></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Tab 2: Global Leaves -->
        <div *ngIf="currentTab === 'leaves'" class="fade-in">
          <div class="card table-card">
            <h3 style="margin-bottom: 1.5rem; color: var(--adp-charcoal);">Global Leave Management</h3>
            <div class="table-container">
               <table class="adp-table" *ngIf="leaves.length > 0; else noLeaves">
                 <thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
                 <tbody>
                   <tr *ngFor="let leave of leaves">
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="color: var(--adp-charcoal);">Global Availability Calendar</h3>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                 <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #5f6368;" (click)="changeWeek(-1)">← Previous</button>
                 <span style="font-weight: 600; font-size: 0.9rem;">Week of {{ weekDays[0]?.date }}</span>
                 <button class="btn-primary" style="padding: 0.3rem 0.6rem; background: #5f6368;" (click)="changeWeek(1)">Next →</button>
              </div>
            </div>
            <p style="color: var(--adp-dark-gray); font-size: 0.9rem; margin-bottom: 1rem;">View schedule: <span style="color:#137333">■ Worked</span> | <span style="color:#1967D2">■ Leave</span> | <span style="color:#80868B">■ Rest Day</span></p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
               <div *ngFor="let emp of allEmployees" style="display: flex; flex-direction: column; border-bottom: 1px solid var(--adp-border); padding-bottom: 0.5rem;">
                  <div style="font-weight: 600; margin-bottom: 0.5rem;">{{ emp.firstName }} {{ emp.lastName }} <span style="font-size:0.75rem; color:gray; font-weight:normal;">({{ emp.department?.name || 'No Dept' }})</span></div>
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
    .mock-chart { height: 250px; display: flex; align-items: flex-end; gap: 5%; border-bottom: 2px solid var(--adp-light-gray); padding-bottom: 5px; }
    .bar { flex: 1; background-color: var(--adp-dark-gray); border-radius: 4px 4px 0 0; }
    .chart-labels { display: flex; justify-content: space-between; margin-top: 1rem; color: var(--adp-dark-gray); font-size: 0.85rem; }
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
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MainDashboardComponent implements OnInit {
  metrics: any = null;
  currentTab: string = 'overview';
  leaves: any[] = [];
  attendanceData: any[] = [];
  allEmployees: any[] = [];
  weekDays: any[] = [];
  navigationDate: Date = new Date();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.generateWeekDays();
    this.fetchMetrics();
    this.fetchData();
  }

  generateWeekDays() {
      this.weekDays = [];
      const startOfWeek = new Date(this.navigationDate);
      startOfWeek.setDate(this.navigationDate.getDate() - this.navigationDate.getDay() + 1);
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

  fetchData() {
    this.http.get<any[]>('http://localhost:8085/api/employees').subscribe({
        next: (data) => this.allEmployees = data,
        error: (err) => console.error(err)
    });
    this.http.get<any[]>('http://localhost:8085/api/hr/all-leaves').subscribe({
        next: (data) => this.leaves = data,
        error: (err) => console.error(err)
    });
    this.http.get<any[]>('http://localhost:8085/api/hr/all-attendance').subscribe({
        next: (data) => this.attendanceData = data,
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
      if (s.status === 'leave') return '#1967D2';
      if (s.status === 'weekend') return '#80868B';
      if (s.status === 'worked') return '#137333';
      if (s.status === 'future') return '#E8EAED';
      return '#D0271D';
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
      if (s.status === 'worked') return `Worked ${s.hrs}h ${s.mins}m`;
      return s.status;
  }

  updateLeave(leaveId: number, action: string) {
      const email = localStorage.getItem('adp_user') || 'System';
      this.http.post(`http://localhost:8085/api/hr/leaves/${leaveId}/${action}`, { managerEmail: email }).subscribe({
          next: () => this.fetchData(),
          error: (err) => console.error(err)
      });
  }

  fetchMetrics() {
    this.http.get('http://localhost:8085/api/dashboard/metrics').subscribe({
      next: (data) => this.metrics = data,
      error: (err) => console.error('Metrics sync failed', err)
    });
    this.fetchData();
  }
}
