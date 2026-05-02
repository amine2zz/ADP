import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, DatePipe],
  template: `
    <div class="emp-dash slide-up">

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-left">
          <div class="welcome-avatar">{{ userName.charAt(0) }}</div>
          <div>
            <h2>Welcome back, {{ userName }}!</h2>
            <p>{{ employeeData?.jobTitle || 'Employee' }} &nbsp;&middot;&nbsp; {{ employeeData?.department?.name || 'No Department' }}</p>
          </div>
        </div>
        <button class="btn-primary" (click)="openProfileModal()">✏️ Edit Profile</button>
      </div>

      <!-- KPI Row -->
      <div class="kpi-grid">

        <!-- Attendance Card - Button that opens modal -->
        <div class="card attendance-card" (click)="showAttendanceModal = true" style="cursor:pointer;">
          <div class="att-header">
            <span class="att-icon">⏱</span>
            <div style="flex:1">
              <div class="kpi-title">Today's Attendance</div>
              <div class="att-date">{{ todayDate }}</div>
            </div>
            <div class="att-quick" *ngIf="activeTimer">
              <span class="timer-label">{{ activeTimer }}</span>
              <span class="timer-value">{{ elapsedDisplay }}</span>
            </div>
            <div class="att-quick" *ngIf="!activeTimer && today?.eveningOut">
              <span class="timer-label">✅ Day complete</span>
              <span class="timer-value" style="font-size:0.9rem; color:#16a34a">{{ getLiveTotalDuration() }}</span>
            </div>
            <div class="att-quick" *ngIf="!activeTimer && !today?.eveningOut && !today?.morningIn">
              <span class="timer-label">Not started</span>
            </div>
            <span class="att-arrow">›</span>
          </div>
          <div class="att-punch-preview">
            <div class="preview-dot" [class.done]="today?.morningIn" [class.active]="!today?.morningIn">1</div>
            <div class="preview-line" [class.done]="today?.lunchOut"></div>
            <div class="preview-dot" [class.done]="today?.lunchOut" [class.active]="today?.morningIn && !today?.lunchOut">2</div>
            <div class="preview-line" [class.done]="today?.afternoonIn"></div>
            <div class="preview-dot" [class.done]="today?.afternoonIn" [class.active]="today?.lunchOut && !today?.afternoonIn">3</div>
            <div class="preview-line" [class.done]="today?.eveningOut"></div>
            <div class="preview-dot" [class.done]="today?.eveningOut" [class.active]="today?.afternoonIn && !today?.eveningOut">4</div>
          </div>
        </div>

        <div class="kpi-card" style="--accent: #1967D2">
          <div class="kpi-icon" style="background:#dbeafe; color:#1967D2">📅</div>
          <div>
            <div class="kpi-title">Leave Balance</div>
            <div class="kpi-value">12 <span style="font-size:1rem;font-weight:500">days</span></div>
            <div class="kpi-trend">Annual remaining</div>
          </div>
        </div>
        <div class="kpi-card" style="--accent: #137333">
          <div class="kpi-icon" style="background:#dcfce7; color:#137333">✅</div>
          <div>
            <div class="kpi-title">Account Status</div>
            <div class="kpi-value" style="font-size:1.3rem">{{ employeeData?.status || 'Active' }}</div>
            <div class="kpi-trend positive">Fully configured</div>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="main-grid">
        <div class="card">
          <h3 class="section-title">📋 Request Time Off</h3>
          <form class="leave-form" (submit)="submitLeave($event)">
            <div class="form-row">
              <div class="form-group"><label>Start Date</label><input type="date" name="startDate" required></div>
              <div class="form-group"><label>End Date</label><input type="date" name="endDate" required></div>
            </div>
            <div class="form-group">
              <label>Leave Type</label>
              <select name="type" required>
                <option value="ANNUAL">🌴 Annual Leave</option>
                <option value="SICK">🏥 Sick Leave</option>
                <option value="UNPAID">💼 Unpaid Leave</option>
              </select>
            </div>
            <div class="form-group">
              <label>Reason</label>
              <textarea name="reason" placeholder="Brief reason..." required style="height:80px; resize:none;"></textarea>
            </div>
            <button type="submit" class="btn-primary" style="width:100%">Submit Request</button>
          </form>
        </div>

        <div class="card">
          <h3 class="section-title">👤 My Profile</h3>
          <div class="profile-list">
            <div class="profile-row"><span class="profile-label">Full Name</span><span class="profile-val">{{ employeeData?.firstName }} {{ employeeData?.lastName }}</span></div>
            <div class="profile-row"><span class="profile-label">Email</span><span class="profile-val">{{ employeeData?.email || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Phone</span><span class="profile-val">{{ employeeData?.phoneNumber || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">CIN</span><span class="profile-val">{{ employeeData?.cin || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Nationality</span><span class="profile-val">{{ employeeData?.nationality || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Marital Status</span><span class="profile-val">{{ employeeData?.maritalStatus || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Emergency</span><span class="profile-val">{{ employeeData?.emergencyContact || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Address</span><span class="profile-val">{{ employeeData?.address || '—' }}</span></div>
          </div>
        </div>
      </div>

      <!-- Attendance Modal -->
      <div class="modal-overlay" *ngIf="showAttendanceModal">
        <div class="modal-box att-modal">
          <div class="modal-header">
            <div>
              <h3>⏱ Today's Attendance</h3>
              <p style="font-size:0.8rem; color:#64748b; margin-top:2px;">{{ todayDate }}</p>
            </div>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <button class="refresh-btn" (click)="loadTodayAttendance()" title="Refresh">↻</button>
              <button class="modal-close" (click)="showAttendanceModal = false">&times;</button>
            </div>
          </div>

          <!-- Timer -->
          <div class="att-modal-timer" *ngIf="activeTimer">
            <span class="timer-label">{{ activeTimer }}</span>
            <span class="timer-value">{{ elapsedDisplay }}</span>
          </div>

          <!-- Punch items -->
          <div class="punch-list">
            <div class="punch-item" [class.done]="today?.morningIn" [class.active]="nextPunch === 'MORNING_IN'">
              <div class="punch-num">1</div>
              <div class="punch-info">
                <div class="punch-label">Clock In</div>
                <div class="punch-sub">Start of work</div>
                <div class="punch-time" *ngIf="today?.morningIn">{{ today.morningIn | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn" *ngIf="nextPunch === 'MORNING_IN'" (click)="punch('MORNING_IN')">Punch</button>
              <span class="punch-check" *ngIf="today?.morningIn">✓</span>
            </div>

            <div class="punch-item" [class.done]="today?.lunchOut" [class.active]="nextPunch === 'LUNCH_OUT'">
              <div class="punch-num">2</div>
              <div class="punch-info">
                <div class="punch-label">Out for Lunch</div>
                <div class="punch-sub">Lunch break start</div>
                <div class="punch-time" *ngIf="today?.lunchOut">{{ today.lunchOut | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn" *ngIf="nextPunch === 'LUNCH_OUT'" (click)="punch('LUNCH_OUT')">Punch</button>
              <span class="punch-check" *ngIf="today?.lunchOut">✓</span>
            </div>

            <div class="punch-item" [class.done]="today?.afternoonIn" [class.active]="nextPunch === 'AFTERNOON_IN'">
              <div class="punch-num">3</div>
              <div class="punch-info">
                <div class="punch-label">Back from Lunch</div>
                <div class="punch-sub">Afternoon start</div>
                <div class="punch-time" *ngIf="today?.afternoonIn">{{ today.afternoonIn | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn" *ngIf="nextPunch === 'AFTERNOON_IN'" (click)="punch('AFTERNOON_IN')">Punch</button>
              <span class="punch-check" *ngIf="today?.afternoonIn">✓</span>
            </div>

            <div class="punch-item" [class.done]="today?.eveningOut" [class.active]="nextPunch === 'EVENING_OUT'">
              <div class="punch-num">4</div>
              <div class="punch-info">
                <div class="punch-label">Clock Out</div>
                <div class="punch-sub">End of work</div>
                <div class="punch-time" *ngIf="today?.eveningOut">{{ today.eveningOut | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn out" *ngIf="nextPunch === 'EVENING_OUT'" (click)="punch('EVENING_OUT')">Punch</button>
              <span class="punch-check" *ngIf="today?.eveningOut">✓</span>
            </div>
          </div>

          <!-- Work stats -->
          <div class="work-stats" *ngIf="today?.morningIn">
            <div class="stat-item">
              <div class="stat-label">🌅 Morning</div>
              <div class="stat-value">{{ getMorningDuration() }}</div>
            </div>
            <div class="stat-divider" *ngIf="today?.afternoonIn"></div>
            <div class="stat-item" *ngIf="today?.afternoonIn">
              <div class="stat-label">🌇 Afternoon</div>
              <div class="stat-value">{{ getAfternoonDuration() }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item total">
              <div class="stat-label">⏱ Total</div>
              <div class="stat-value">{{ getLiveTotalDuration() }}</div>
            </div>
          </div>

          <div class="att-summary" *ngIf="today?.eveningOut">
            ✅ Day complete &nbsp;·&nbsp; Total worked: <strong>{{ totalWorked }}</strong>
          </div>
        </div>
      </div>

      <!-- Profile Edit Modal -->
      <div class="modal-overlay" *ngIf="showProfileModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Edit My Profile</h3>
            <button class="modal-close" (click)="showProfileModal = false">&times;</button>
          </div>
          <form (submit)="updateProfile($event)" style="display:flex; flex-direction:column; gap:1rem;">
            <div class="form-row">
              <div class="form-group"><label>First Name</label><input type="text" name="firstName" [value]="employeeData?.firstName || ''"></div>
              <div class="form-group"><label>Last Name</label><input type="text" name="lastName" [value]="employeeData?.lastName || ''"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Phone Number</label><input type="text" name="phoneNumber" [value]="employeeData?.phoneNumber || ''"></div>
              <div class="form-group"><label>CIN</label><input type="text" name="cin" [value]="employeeData?.cin || ''"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Nationality</label><input type="text" name="nationality" [value]="employeeData?.nationality || ''"></div>
              <div class="form-group"><label>Marital Status</label><input type="text" name="maritalStatus" [value]="employeeData?.maritalStatus || ''"></div>
            </div>
            <div class="form-group"><label>Address</label><input type="text" name="address" [value]="employeeData?.address || ''"></div>
            <div class="form-group"><label>Emergency Contact</label><input type="text" name="emergencyContact" [value]="employeeData?.emergencyContact || ''"></div>
            <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
              <button type="submit" class="btn-primary" style="flex:1">Save Changes</button>
              <button type="button" class="btn-secondary" style="flex:1" (click)="showProfileModal = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .emp-dash { display: flex; flex-direction: column; gap: 1.5rem; }
    .welcome-banner { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: var(--radius); padding: 1.75rem 2rem; display: flex; justify-content: space-between; align-items: center; color: white; }
    .welcome-left { display: flex; align-items: center; gap: 1.25rem; }
    .welcome-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--adp-red), #ff6b6b); color: white; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .welcome-banner h2 { color: white; font-size: 1.4rem; margin-bottom: 0.25rem; }
    .welcome-banner p { color: rgba(255,255,255,0.65); font-size: 0.875rem; }

    .kpi-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.25rem; }
    .kpi-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }

    /* Attendance Card (compact clickable) */
    .attendance-card { padding: 1.25rem 1.5rem; transition: box-shadow 0.2s, transform 0.2s; }
    .attendance-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .att-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .att-icon { font-size: 1.5rem; }
    .att-date { font-size: 0.75rem; color: var(--adp-dark-gray); margin-top: 2px; }
    .att-quick { text-align: right; }
    .att-arrow { font-size: 1.4rem; color: var(--adp-dark-gray); margin-left: 0.5rem; }
    .timer-label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--adp-dark-gray); }
    .timer-value { font-size: 1.1rem; font-weight: 800; color: var(--adp-red); font-variant-numeric: tabular-nums; }

    /* Progress dots preview */
    .att-punch-preview { display: flex; align-items: center; gap: 0; }
    .preview-dot { width: 28px; height: 28px; border-radius: 50%; background: var(--adp-border); color: var(--adp-dark-gray); font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
    .preview-dot.done { background: #16a34a; color: white; }
    .preview-dot.active { background: var(--adp-red); color: white; }
    .preview-line { flex: 1; height: 2px; background: var(--adp-border); transition: background 0.2s; }
    .preview-line.done { background: #16a34a; }

    /* Attendance Modal */
    .att-modal { width: 460px; }
    .att-modal-timer { text-align: center; padding: 0.75rem; background: var(--adp-light-gray); border-radius: 8px; margin-bottom: 1.25rem; }
    .att-modal-timer .timer-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--adp-dark-gray); }
    .att-modal-timer .timer-value { font-size: 2rem; font-weight: 800; color: var(--adp-red); font-variant-numeric: tabular-nums; display: block; margin-top: 2px; }

    .punch-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
    .refresh-btn { width: 32px; height: 32px; border-radius: 6px; border: 1.5px solid var(--adp-border); background: white; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--adp-dark-gray); flex-shrink: 0; }
    .refresh-btn:hover { border-color: var(--adp-red); color: var(--adp-red); transform: rotate(180deg); }

    .punch-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; border: 1.5px solid var(--adp-border); background: #fafafa; transition: all 0.2s; }
    .punch-item.active { border-color: var(--adp-red); background: #fff5f5; }
    .punch-item.done { border-color: #bbf7d0; background: #f0fdf4; }
    .punch-num { width: 24px; height: 24px; border-radius: 50%; background: var(--adp-border); color: var(--adp-dark-gray); font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .punch-item.active .punch-num { background: var(--adp-red); color: white; }
    .punch-item.done .punch-num { background: #16a34a; color: white; }
    .punch-info { flex: 1; }
    .punch-label { font-size: 0.85rem; font-weight: 700; color: var(--adp-charcoal); }
    .punch-sub { font-size: 0.75rem; color: var(--adp-dark-gray); }
    .punch-time { font-size: 0.8rem; font-weight: 700; color: #16a34a; margin-top: 2px; }
    .punch-btn { padding: 0.4rem 1rem; background: var(--adp-red); color: white; border: none; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .punch-btn:hover { background: var(--adp-red-dark); transform: translateY(-1px); }
    .punch-btn.out { background: #1a1a2e; }
    .punch-btn.out:hover { background: #0f172a; }
    .punch-check { color: #16a34a; font-size: 1.1rem; font-weight: 700; }
    .att-summary { margin-top: 0.75rem; padding: 0.6rem 1rem; background: #f0fdf4; border-radius: 6px; font-size: 0.82rem; color: #15803d; border: 1px solid #bbf7d0; }
    .work-stats { display: flex; align-items: center; margin-bottom: 1rem; background: var(--adp-light-gray); border-radius: 8px; border: 1px solid var(--adp-border); overflow: hidden; }
    .stat-item { flex: 1; padding: 0.65rem 1rem; text-align: center; }
    .stat-item.total { background: #1a1a2e; }
    .stat-item.total .stat-label { color: rgba(255,255,255,0.6); }
    .stat-item.total .stat-value { color: white; }
    .stat-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--adp-dark-gray); margin-bottom: 2px; }
    .stat-value { font-size: 1rem; font-weight: 800; color: var(--adp-charcoal); font-variant-numeric: tabular-nums; }
    .stat-divider { width: 1px; height: 36px; background: var(--adp-border); flex-shrink: 0; }
    .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--adp-charcoal); }
    .leave-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .profile-list { display: flex; flex-direction: column; }
    .profile-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--adp-border); font-size: 0.85rem; }
    .profile-row:last-child { border-bottom: none; }
    .profile-label { color: var(--adp-dark-gray); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .profile-val { color: var(--adp-charcoal); font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }
    .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; }
  `]
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  userName: string = 'Employee';
  employeeData: any = {};
  showProfileModal: boolean = false;
  showAttendanceModal: boolean = false;
  userId: number = 0;
  today: any = null;
  elapsedDisplay: string = '00:00:00';
  activeTimer: string = '';
  totalWorked: string = '';
  todayDate: string = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  private timerInterval: any = null;
  private timerStart: Date | null = null;
  private pollInterval: any = null;

  get nextPunch(): string {
    if (!this.today || !this.today.morningIn) return 'MORNING_IN';
    if (!this.today.lunchOut) return 'LUNCH_OUT';
    if (!this.today.afternoonIn) return 'AFTERNOON_IN';
    if (!this.today.eveningOut) return 'EVENING_OUT';
    return 'DONE';
  }

  constructor(private http: HttpClient, private notifService: NotificationService) {}

  ngOnInit() {
    this.userName = localStorage.getItem('adp_user') || 'Employee';
    const userIdStr = localStorage.getItem('adp_user_id');
    if (userIdStr) {
      this.userId = parseInt(userIdStr, 10);

      // Load attendance immediately after userId is set
      this.loadTodayAttendance();

      this.http.get<any[]>('http://localhost:8085/api/employees').subscribe({
        next: (employees: any[]) => {
          const me = employees.find((e: any) => e.id === this.userId);
          if (me) { this.employeeData = me; this.userName = me.firstName + ' ' + me.lastName; localStorage.setItem('adp_user_full', JSON.stringify(me)); }
        }
      });

      // Poll every 30 seconds
      this.pollInterval = setInterval(() => this.loadTodayAttendance(), 30000);
    }
    const storedUser = localStorage.getItem('adp_user_full');
    if (storedUser && storedUser !== 'undefined') this.employeeData = JSON.parse(storedUser);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    clearInterval(this.pollInterval);
  }

  loadTodayAttendance() {
    if (!this.userId) return;
    this.http.get<any>(`http://localhost:8085/api/employees/${this.userId}/attendance/today`).subscribe({
      next: (data) => {
        if (data) {
          // Normalize all timestamp fields — backend may return array [y,m,d,h,min,s] or ISO string
          this.today = {
            ...data,
            morningIn:   this.parseTs(data.morningIn),
            lunchOut:    this.parseTs(data.lunchOut),
            afternoonIn: this.parseTs(data.afternoonIn),
            eveningOut:  this.parseTs(data.eveningOut)
          };
        } else {
          this.today = null;
        }
        this.restoreTimer();
        if (this.today?.eveningOut) this.calcTotalWorked();
      },
      error: () => this.today = null
    });
  }

  // Converts [2026,5,2,13,27,32] or "2026-05-02T13:27:32" or "2026-05-02 13:27:32" to ISO string
  parseTs(val: any): string | null {
    if (!val) return null;
    if (Array.isArray(val)) {
      const [y, mo, d, h = 0, mi = 0, s = 0] = val;
      return new Date(y, mo - 1, d, h, mi, s).toISOString();
    }
    if (typeof val === 'string') {
      return new Date(val.replace(' ', 'T')).toISOString();
    }
    return null;
  }

  restoreTimer() {
    clearInterval(this.timerInterval);
    if (!this.today) return;
    const punch = this.nextPunch;
    if (punch === 'LUNCH_OUT' && this.today.morningIn) {
      this.activeTimer = 'Morning session';
      this.timerStart = new Date(this.today.morningIn);
      this.startTick();
    } else if (punch === 'EVENING_OUT' && this.today.afternoonIn) {
      this.activeTimer = 'Afternoon session';
      this.timerStart = new Date(this.today.afternoonIn);
      this.startTick();
    } else {
      this.activeTimer = '';
      this.elapsedDisplay = '00:00:00';
    }
  }

  startTick() {
    this.tick();
    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  tick() {
    if (!this.timerStart) return;
    const diff = Math.floor((Date.now() - this.timerStart.getTime()) / 1000);
    const h = Math.floor(diff / 3600).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    this.elapsedDisplay = `${h}:${m}:${s}`;
  }

  calcTotalWorked() {
    if (!this.today?.morningIn || !this.today?.eveningOut) return;
    let totalSec = 0;
    if (this.today.morningIn && this.today.lunchOut)
      totalSec += (new Date(this.today.lunchOut).getTime() - new Date(this.today.morningIn).getTime()) / 1000;
    if (this.today.afternoonIn && this.today.eveningOut)
      totalSec += (new Date(this.today.eveningOut).getTime() - new Date(this.today.afternoonIn).getTime()) / 1000;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    this.totalWorked = `${h}h ${m}m`;
  }

  private fmtDuration(sec: number): string {
    if (sec <= 0) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  }

  getMorningDuration(): string {
    if (!this.today?.morningIn) return '—';
    const end = this.today.lunchOut ? new Date(this.today.lunchOut) : new Date();
    return this.fmtDuration((end.getTime() - new Date(this.today.morningIn).getTime()) / 1000);
  }

  getAfternoonDuration(): string {
    if (!this.today?.afternoonIn) return '—';
    const end = this.today.eveningOut ? new Date(this.today.eveningOut) : new Date();
    return this.fmtDuration((end.getTime() - new Date(this.today.afternoonIn).getTime()) / 1000);
  }

  getLiveTotalDuration(): string {
    if (!this.today?.morningIn) return '—';
    let totalSec = 0;
    const morningEnd = this.today.lunchOut ? new Date(this.today.lunchOut) : (!this.today.lunchOut && !this.today.afternoonIn ? new Date() : null);
    if (morningEnd) totalSec += (morningEnd.getTime() - new Date(this.today.morningIn).getTime()) / 1000;
    if (this.today.afternoonIn) {
      const afternoonEnd = this.today.eveningOut ? new Date(this.today.eveningOut) : new Date();
      totalSec += (afternoonEnd.getTime() - new Date(this.today.afternoonIn).getTime()) / 1000;
    }
    return this.fmtDuration(totalSec);
  }

  punch(punchType: string) {
    if (!this.userId) return;
    this.http.post(`http://localhost:8085/api/employees/${this.userId}/attendance`, { punchType }).subscribe({
      next: (data: any) => {
        this.today = {
          ...data,
          morningIn:   this.parseTs(data.morningIn),
          lunchOut:    this.parseTs(data.lunchOut),
          afternoonIn: this.parseTs(data.afternoonIn),
          eveningOut:  this.parseTs(data.eveningOut)
        };
        const labels: any = { MORNING_IN: 'Clocked in for work', LUNCH_OUT: 'Out for lunch', AFTERNOON_IN: 'Back from lunch', EVENING_OUT: 'Clocked out — have a great evening!' };
        this.notifService.show(labels[punchType] || 'Punched!', 'success');
        this.restoreTimer();
        if (punchType === 'EVENING_OUT') { clearInterval(this.timerInterval); this.activeTimer = ''; this.calcTotalWorked(); }
      },
      error: () => this.notifService.show('Failed to record punch.', 'error')
    });
  }

  openProfileModal() { this.showProfileModal = true; }

  updateProfile(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const payload: any = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      cin: (form.elements.namedItem('cin') as HTMLInputElement).value,
      nationality: (form.elements.namedItem('nationality') as HTMLInputElement).value,
      maritalStatus: (form.elements.namedItem('maritalStatus') as HTMLInputElement).value,
      emergencyContact: (form.elements.namedItem('emergencyContact') as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem('phoneNumber') as HTMLInputElement).value,
      address: (form.elements.namedItem('address') as HTMLInputElement).value
    };
    if (this.userId) {
      this.http.put(`http://localhost:8085/api/employees/${this.userId}`, payload).subscribe({
        next: (updatedObj: any) => {
          this.showProfileModal = false;
          this.notifService.show('Profile Updated Successfully', 'success');
          localStorage.setItem('adp_user_full', JSON.stringify(updatedObj));
          this.employeeData = updatedObj;
          this.userName = updatedObj.firstName + ' ' + updatedObj.lastName;
        },
        error: () => this.notifService.show('Failed to update profile', 'error')
      });
    }
  }

  submitLeave(event: Event) {
    event.preventDefault();
    if (!this.userId) return;
    const form = event.target as HTMLFormElement;
    const payload = {
      startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
      endDate: (form.elements.namedItem('endDate') as HTMLInputElement).value,
      reason: (form.elements.namedItem('reason') as HTMLTextAreaElement).value,
      type: (form.elements.namedItem('type') as HTMLSelectElement).value
    };
    this.http.post(`http://localhost:8085/api/employees/${this.userId}/leaves`, payload).subscribe({
      next: () => { this.notifService.show('Leave request submitted.', 'info'); (event.target as HTMLFormElement).reset(); },
      error: () => this.notifService.show('Failed to submit leave.', 'error')
    });
  }
}
