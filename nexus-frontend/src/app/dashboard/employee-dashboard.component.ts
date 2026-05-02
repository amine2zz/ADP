import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
            <div class="att-quick" *ngIf="!activeTimer && loadingAttendance">
              <span class="timer-label">⏱ Calculating...</span>
              <span class="timer-value" style="font-size:0.8rem; color:var(--adp-dark-gray)">🔄 Synchronizing</span>
            </div>
            <div class="att-quick" *ngIf="!activeTimer && !loadingAttendance && today?.eveningOut">
              <span class="timer-label">✅ Day complete</span>
              <span class="timer-value" style="font-size:0.9rem; color:#16a34a">{{ getLiveTotalDuration() }}</span>
            </div>
            <div class="att-quick" *ngIf="!activeTimer && !loadingAttendance && !today?.eveningOut && !today?.morningIn">
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
        </div>
        <div class="kpi-card" style="--accent: #ef4444">
          <div class="kpi-icon" style="background:#fee2e2; color:#ef4444">💊</div>
          <div>
            <div class="kpi-title">Sick Leave Bank</div>
            <div class="kpi-value">💊 {{ employeeData?.sickLeaveBalance?.toFixed(1) || '0.0' }}d</div>
            <div class="kpi-trend">Remaining balance</div>
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

          <!-- History Table -->
          <div style="margin-top: 2rem;">
            <h4 class="section-title" style="font-size: 0.85rem; margin-bottom: 0.75rem;">My Leave Requests History</h4>
            <div class="table-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--adp-border); border-radius: 6px;">
              <table class="adp-table" style="font-size: 0.75rem;">
                <thead><tr><th>Dates</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let req of myLeaves">
                    <td>{{ req.startDate | date:'dd MMM' }} - {{ req.endDate | date:'dd MMM' }}</td>
                    <td>{{ req.type }}</td>
                    <td><span [class]="'badge-' + req.status.toLowerCase()">{{ req.status }}</span></td>
                  </tr>
                  <tr *ngIf="myLeaves.length === 0"><td colspan="3" style="text-align:center; padding:1rem; color:gray;">No requests yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
             <h3 class="section-title" style="margin:0;">📅 My Attendance Calendar</h3>
             <div style="display:flex; gap:0.5rem; align-items:center;">
               <span style="font-size:0.8rem; font-weight:700; color:#64748b;">{{ navigationDate | date:'MMMM yyyy' }}</span>
               <div class="cal-nav">
                 <button (click)="changeMonth(-1)" class="nav-btn">‹</button>
                 <button (click)="changeMonth(1)" class="nav-btn">›</button>
               </div>
             </div>
          </div>
          
          <div class="personal-calendar monthly">
            <div class="cal-row header">
              <div class="cal-cell" *ngFor="let dayName of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']">
                <div class="day-name">{{ dayName }}</div>
              </div>
            </div>
            <div class="cal-grid">
              <div class="cal-cell" *ngFor="let day of monthDays" 
                   [style.background-color]="getDayColor(day.date)" 
                   [title]="getDayTitle(day.date)"
                   [class.weekend]="isWeekend(day.date)"
                   [class.is-today]="day.isToday">
                <div class="day-num">{{ day.date | date:'d' }}</div>
                <div class="day-status">{{ getDayLabel(day.date) }}</div>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:1rem; margin-top:1rem; font-size:0.65rem; font-weight:700; color:#64748b; justify-content:center;">
            <div style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#137333; border-radius:2px;"></span> Worked</div>
            <div style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#1967D2; border-radius:2px;"></span> Annual</div>
            <div style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#ef4444; border-radius:2px;"></span> Sick</div>
            <div style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#f59e0b; border-radius:2px;"></span> Unpaid</div>
          </div>

          <div class="profile-list" style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--adp-border);">
            <div class="profile-row"><span class="profile-label">Email</span><span class="profile-val">{{ employeeData?.email || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Phone</span><span class="profile-val">{{ employeeData?.phoneNumber || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Job Title</span><span class="profile-val">{{ employeeData?.jobTitle || 'Employee' }}</span></div>
            <div class="profile-row" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
              <div style="display: flex; justify-content: space-between; width: 100%;">
                <span class="profile-label">Category</span>
                <span class="profile-val" style="color:#1967D2; font-weight:700">{{ employeeData?.category?.name || '—' }}</span>
              </div>
              <div *ngIf="employeeData?.category" style="background: #f8fafc; padding: 0.75rem; border-radius: 6px; width: 100%; font-size: 0.75rem; border: 1px solid var(--adp-border);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748b;">Annual Allowance:</span>
                  <span style="font-weight: 700; color: #1e293b;">📅 {{ employeeData.category.annualLeaveAllowance }} days</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748b;">Sick Allowance:</span>
                  <span style="font-weight: 700; color: #ef4444;">💊 {{ employeeData.category.sickLeaveAllowance }} days</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748b;">Accrual Rate:</span>
                  <span style="font-weight: 700; color: #1967D2;">+{{ employeeData.category.monthlyIncrement?.toFixed(2) }}d/month</span>
                </div>
                <p style="margin-top: 0.5rem; color: #64748b; font-style: italic; line-height: 1.3;">{{ employeeData.category.description }}</p>
              </div>
            </div>
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
    
    .kpi-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 1.25rem; }
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
    .personal-calendar.monthly { border: 1px solid var(--adp-border); border-radius: 8px; overflow: hidden; background: white; }
    .cal-row.header { display: grid; grid-template-columns: repeat(7, 1fr); background: #f8fafc; border-bottom: 1px solid var(--adp-border); width: 100%; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); width: 100%; }
    .cal-cell { padding: 0.5rem 0.2rem; text-align: center; border-right: 1px solid var(--adp-border); border-bottom: 1px solid var(--adp-border); position: relative; min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .cal-cell:nth-child(7n) { border-right: none; }
    .cal-cell.weekend { background-color: #f1f5f9 !important; }
    .cal-cell.weekend .day-num { color: #64748b; }
    .cal-cell.is-today { 
      border: 2.5px solid #1967D2 !important; 
      box-shadow: inset 0 0 0 1px #fff;
      z-index: 2;
    }
    .cal-cell.is-today .day-num {
      background: #1967D2;
      color: white;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      top: 2px;
      left: 4px;
      padding: 0;
    }
    .day-name { font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.02em; }
    .day-num { font-size: 0.7rem; font-weight: 700; color: #94a3b8; position: absolute; top: 4px; left: 6px; }
    .other-month { opacity: 0.3; }
    .day-status { margin-top: 14px; font-size: 0.85rem; text-align: center; line-height: 1; }
    .cal-nav { display: flex; gap: 0.4rem; }
    .nav-btn { width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--adp-border); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: #64748b; }
    .nav-btn:hover { background: #f1f5f9; color: var(--adp-red); }
    .badge-approved { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
    .badge-pending { background: #fef9c3; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
    .badge-rejected { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
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
  loadingAttendance: boolean = true;
  myLeaves: any[] = [];
  myAttendance: any[] = [];
  monthDays: any[] = [];
  navigationDate: Date = new Date();
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

  constructor(
    private http: HttpClient, 
    private notifService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('adp_user') || 'Employee';
    const userIdStr = localStorage.getItem('adp_user_id');
    
    const storedUser = localStorage.getItem('adp_user_full');
    if (storedUser && storedUser !== 'undefined') {
      try {
        this.employeeData = JSON.parse(storedUser);
        this.userName = this.employeeData.firstName + ' ' + this.employeeData.lastName;
        if (!this.userId && this.employeeData.id) this.userId = this.employeeData.id;
      } catch(e) {}
    }

    if (userIdStr) {
      this.userId = parseInt(userIdStr, 10);
      this.loadTodayAttendance(true);
      this.fetchEmployeeData();
      this.fetchHistory();
      this.generateMonthDays();
      this.pollInterval = setInterval(() => this.loadTodayAttendance(false), 30000);
    }
  }

  fetchHistory() {
    if (!this.userId) {
      console.warn('Cannot fetch history: No User ID found');
      return;
    }
    this.http.get<any[]>(`http://localhost:8085/api/employees/${this.userId}/leaves-history`).subscribe({
      next: (data) => {
        this.myLeaves = Array.isArray(data) ? data.sort((a,b) => b.id - a.id) : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Leaves fetch error:', err);
        this.notifService.show('Failed to load leave history.', 'error');
        this.cdr.detectChanges();
      }
    });
    this.http.get<any[]>(`http://localhost:8085/api/employees/${this.userId}/attendance-history`).subscribe({
      next: (data) => {
        this.myAttendance = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Attendance fetch error:', err);
        this.notifService.show('Failed to load attendance history.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  isWeekend(date: string): boolean {
    if (!date) return false;
    const parts = date.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay() === 0 || d.getDay() === 6;
  }

  generateMonthDays() {
    this.monthDays = [];
    const d = new Date(this.navigationDate.getFullYear(), this.navigationDate.getMonth(), 1);
    
    // Adjust to start of the week (Monday)
    let startOffset = d.getDay() - 1;
    if (startOffset === -1) startOffset = 6; // Sunday
    d.setDate(d.getDate() - startOffset);

    // Generate 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
        const dateStr = this.formatLocalDate(d);
        this.monthDays.push({
            date: dateStr,
            isCurrentMonth: d.getMonth() === this.navigationDate.getMonth(),
            isToday: dateStr === new Date().toISOString().split('T')[0]
        });
        d.setDate(d.getDate() + 1);
    }
  }

  formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  changeMonth(offset: number) {
    this.navigationDate.setMonth(this.navigationDate.getMonth() + offset);
    this.generateMonthDays();
  }

  getDayStats(dateStr: string) {
    const today = new Date().toISOString().split('T')[0];
    // Check for leaves first
    for (const req of this.myLeaves) {
        if (req.status === 'APPROVED' && dateStr >= req.startDate && dateStr <= req.endDate) {
            return { status: 'leave', type: req.type };
        }
    }
    
    // Check attendance
    for (const att of this.myAttendance) {
        if (att.workDate === dateStr) {
            return { status: 'worked' };
        }
    }
    
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]); // local date
    if (d.getDay() === 0 || d.getDay() === 6) return { status: 'weekend' };
    
    if (dateStr === today) return { status: 'none' };
    
    return dateStr > new Date().toISOString().split('T')[0] ? { status: 'future' } : { status: 'absent' };
  }

  getDayColor(dateStr: string) {
    const s = this.getDayStats(dateStr);
    if (s.status === 'leave') {
        if (s.type === 'SICK') return '#fee2e2';
        if (s.type === 'UNPAID') return '#fef3c7'; // Amber for Unpaid
        return '#dbeafe';
    }
    if (s.status === 'worked') return '#dcfce7';
    if (s.status === 'absent') return '#fef2f2';
    return 'white';
  }

  getDayLabel(dateStr: string) {
    if (this.isWeekend(dateStr)) return ''; 
    const s = this.getDayStats(dateStr);
    if (s.status === 'leave') {
        if (s.type === 'SICK') return '💊';
        if (s.type === 'UNPAID') return '💼';
        return '🌴';
    }
    if (s.status === 'worked') return '✅';
    if (s.status === 'absent') return '❌';
    return '';
  }

  getDayTitle(dateStr: string) {
    const s = this.getDayStats(dateStr);
    if (s.status === 'leave') return `On Leave: ${s.type}`;
    if (s.status === 'worked') return 'Worked day';
    if (s.status === 'absent') return 'Absent / No records';
    return '';
  }

  fetchEmployeeData() {
    if (!this.userId) return;
    this.http.get<any>(`http://localhost:8085/api/employees/${this.userId}/profile`).subscribe({
      next: (me) => {
        if (me) {
          this.employeeData = me;
          this.userName = me.firstName + ' ' + me.lastName;
          localStorage.setItem('adp_user_full', JSON.stringify(me));
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to sync employee data:', err);
        this.notifService.show('Profile sync failed.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    clearInterval(this.pollInterval);
  }

  loadTodayAttendance(isFirstLoad = false) {
    if (!this.userId) return;
    if (isFirstLoad) this.loadingAttendance = true;
    
    this.http.get<any>(`http://localhost:8085/api/employees/${this.userId}/attendance/today`).subscribe({
      next: (data) => {
        this.loadingAttendance = false;
        if (data) {
          // Normalize all timestamp fields
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
        this.cdr.detectChanges(); // Force UI update
      },
      error: () => { 
        this.today = null; 
        this.loadingAttendance = false; 
        this.cdr.detectChanges();
      }
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
    if (!this.userId || !this.employeeData) return;
    
    const form = event.target as HTMLFormElement;
    const payload = {
      startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
      endDate: (form.elements.namedItem('endDate') as HTMLInputElement).value,
      reason: (form.elements.namedItem('reason') as HTMLTextAreaElement).value,
      type: (form.elements.namedItem('type') as HTMLSelectElement).value
    };

    // Calculate requested days
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);

    let businessDays = 0;
    let current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    if (businessDays <= 0) {
      this.notifService.show('Invalid date range selected.', 'error');
      return;
    }

    // Check balance
    const currentBalance = payload.type === 'SICK' ? (this.employeeData.sickLeaveBalance || 0) : (this.employeeData.leaveBalance || 0);
    
    if (payload.type !== 'UNPAID' && businessDays > currentBalance) {
      this.notifService.show(`Insufficient Balance: You are requesting ${businessDays} business days but only have ${currentBalance.toFixed(1)} days available.`, 'error');
      return;
    }

    this.http.post(`http://localhost:8085/api/employees/${this.userId}/leaves`, payload).subscribe({
      next: () => { 
        this.notifService.show('Leave request submitted.', 'info'); 
        (event.target as HTMLFormElement).reset(); 
        this.fetchHistory(); // Refresh history
      },
      error: () => this.notifService.show('Failed to submit leave.', 'error')
    });
  }
}
