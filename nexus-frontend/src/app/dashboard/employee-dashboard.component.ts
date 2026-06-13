import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';

const API = 'http://localhost:8085/api';

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
            <div class="preview-dot" [class.done]="today?.morningIn"  [class.active]="!today?.morningIn">1</div>
            <div class="preview-line" [class.done]="today?.lunchOut"></div>
            <div class="preview-dot" [class.done]="today?.lunchOut"   [class.active]="today?.morningIn && !today?.lunchOut">2</div>
            <div class="preview-line" [class.done]="today?.afternoonIn"></div>
            <div class="preview-dot" [class.done]="today?.afternoonIn" [class.active]="today?.lunchOut && !today?.afternoonIn">3</div>
            <div class="preview-line" [class.done]="today?.eveningOut"></div>
            <div class="preview-dot" [class.done]="today?.eveningOut"  [class.active]="today?.afternoonIn && !today?.eveningOut">4</div>
          </div>
        </div>

        <div class="kpi-card" style="--accent:#1967D2">
          <div class="kpi-icon" style="background:#dbeafe;color:#1967D2">📅</div>
          <div>
            <div class="kpi-title">Annual Leave</div>
            <div class="kpi-value">{{ employeeData?.leaveBalance?.toFixed(1) || '0.0' }}d</div>
            <div class="kpi-trend"><strong style="color:#1967D2">{{ employeeData?.category?.name || 'Standard' }}</strong></div>
          </div>
        </div>

        <div class="kpi-card" style="--accent:#ef4444">
          <div class="kpi-icon" style="background:#fee2e2;color:#ef4444">💊</div>
          <div>
            <div class="kpi-title">Sick Leave Bank</div>
            <div class="kpi-value">{{ employeeData?.sickLeaveBalance?.toFixed(1) || '0.0' }}d</div>
            <div class="kpi-trend">Remaining balance</div>
          </div>
        </div>

        <div class="kpi-card" style="--accent:#8b5cf6">
          <div class="kpi-icon" style="background:#ede9fe;color:#8b5cf6">💰</div>
          <div>
            <div class="kpi-title">Advances</div>
            <div class="kpi-value">{{ myAdvances.length }}</div>
            <div class="kpi-trend" [class.c-warn]="pendingAdvances>0">
              {{ pendingAdvances > 0 ? pendingAdvances+' pending' : 'All reviewed' }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Section Tabs ── -->
      <div class="section-tabs">
        <button [class.active]="section==='leave'"     (click)="section='leave'">
          📅 Leave &amp; Attendance
        </button>
        <button [class.active]="section==='advances'"  (click)="section='advances'; loadAdvances()">
          💰 Salary Advance
          <span class="tab-badge" *ngIf="pendingAdvances>0">{{ pendingAdvances }}</span>
        </button>
        <button [class.active]="section==='documents'" (click)="section='documents'">
          📄 My Documents
        </button>
        <button [class.active]="section==='onboarding'" (click)="section='onboarding'; loadOnboardingHistory()">
          🚀 My Onboarding
        </button>
      </div>

      <!-- ════ LEAVE & ATTENDANCE ════ -->
      <div *ngIf="section==='leave'" class="main-grid">
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
              <textarea name="reason" placeholder="Brief reason..." required style="height:80px;resize:none;"></textarea>
            </div>
            <button type="submit" class="btn-primary" style="width:100%">Submit Request</button>
          </form>

          <div style="margin-top:2rem">
            <h4 class="section-title" style="font-size:0.85rem;margin-bottom:0.75rem">My Leave Requests</h4>
            <div class="table-container" style="max-height:300px;overflow-y:auto;border:1px solid var(--adp-border);border-radius:6px">
              <table class="adp-table" style="font-size:0.75rem">
                <thead><tr><th>Dates</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let req of myLeaves">
                    <td>{{ req.startDate | date:'dd MMM' }} – {{ req.endDate | date:'dd MMM' }}</td>
                    <td>{{ req.type }}</td>
                    <td><span [class]="'badge-'+req.status.toLowerCase()">{{ req.status }}</span></td>
                  </tr>
                  <tr *ngIf="myLeaves.length===0">
                    <td colspan="3" style="text-align:center;padding:1rem;color:gray">No requests yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
            <h3 class="section-title" style="margin:0">📅 Attendance Calendar</h3>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <span style="font-size:0.8rem;font-weight:700;color:#64748b">{{ navigationDate | date:'MMMM yyyy' }}</span>
              <div class="cal-nav">
                <button (click)="changeMonth(-1)" class="nav-btn">‹</button>
                <button (click)="changeMonth(1)"  class="nav-btn">›</button>
              </div>
            </div>
          </div>

          <div class="personal-calendar monthly">
            <div class="cal-row header">
              <div class="cal-cell" *ngFor="let d of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']">
                <div class="day-name">{{ d }}</div>
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

          <div style="display:flex;gap:1rem;margin-top:0.75rem;font-size:0.65rem;font-weight:700;color:#64748b;justify-content:center;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#137333;border-radius:2px"></span> Worked</div>
            <div style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#1967D2;border-radius:2px"></span> Annual</div>
            <div style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px"></span> Sick</div>
            <div style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:#f59e0b;border-radius:2px"></span> Unpaid</div>
          </div>

          <!-- Profile info strip -->
          <div class="profile-list" style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--adp-border)">
            <div class="profile-row"><span class="profile-label">Email</span><span class="profile-val">{{ employeeData?.email || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Phone</span><span class="profile-val">{{ employeeData?.phoneNumber || '—' }}</span></div>
            <div class="profile-row"><span class="profile-label">Job Title</span><span class="profile-val">{{ employeeData?.jobTitle || 'Employee' }}</span></div>
            <div class="profile-row"><span class="profile-label">Manager</span><span class="profile-val">{{ employeeData?.manager ? employeeData.manager.firstName+' '+employeeData.manager.lastName : '—' }}</span></div>
            <div class="profile-row" *ngIf="employeeData?.category">
              <span class="profile-label">Leave Policy</span>
              <span class="profile-val" style="color:#1967D2;font-weight:700">{{ employeeData.category.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ════ SALARY ADVANCE ════ -->
      <div *ngIf="section==='advances'" class="advances-section">

        <div class="adv-info-banner">
          <span class="bi">💡</span>
          <div>
            <strong>Salary Advance Request</strong> — Submit a request for an advance on your salary.
            Your HR team will review it and respond within 2–3 business days.
          </div>
        </div>

        <div class="adv-grid">
          <!-- Request form -->
          <div class="card">
            <h3 class="section-title">💰 New Advance Request</h3>
            <div class="form-group">
              <label>Amount (TND)</label>
              <input type="number" class="adv-input" [(ngModel)]="advanceAmount"
                     min="100" step="50" placeholder="e.g. 500">
              <span class="field-hint">Minimum 100 TND · Max one request at a time</span>
            </div>
            <div class="form-group" style="margin-top:1rem">
              <label>Reason / Justification</label>
              <textarea class="adv-input" [(ngModel)]="advanceReason"
                        rows="4" placeholder="Briefly explain why you need this advance..."></textarea>
            </div>
            <button class="btn-primary" style="width:100%;margin-top:1rem"
                    (click)="submitAdvance()" [disabled]="advanceSubmitting">
              {{ advanceSubmitting ? '⏳ Submitting…' : '📤 Submit Request' }}
            </button>

            <!-- Rules -->
            <div class="adv-rules">
              <div class="rule-item">✅ Maximum one pending request at a time</div>
              <div class="rule-item">✅ Deducted from your next payroll cycle</div>
              <div class="rule-item">✅ HR approval required within 2–3 business days</div>
              <div class="rule-item">⚠️ Repeated requests may require management approval</div>
            </div>
          </div>

          <!-- History -->
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
              <h3 class="section-title" style="margin:0">📜 My Advance History</h3>
              <button class="refresh-btn" (click)="loadAdvances()" title="Refresh">↻</button>
            </div>

            <div *ngIf="myAdvances.length === 0" class="empty-state">
              <div style="font-size:2rem;margin-bottom:0.5rem">💰</div>
              <div>No advance requests yet</div>
            </div>

            <div *ngFor="let adv of myAdvances" class="adv-card" [ngClass]="'adv-'+adv.status.toLowerCase()">
              <div class="adv-card-top">
                <div>
                  <div class="adv-amount">{{ adv.amount | number:'1.0-0' }} TND</div>
                  <div class="adv-date">Requested: {{ adv.requestDate }}</div>
                </div>
                <div class="adv-status-wrap">
                  <span class="adv-status-badge" [ngClass]="'st-'+adv.status.toLowerCase()">
                    {{ adv.status }}
                  </span>
                  <button *ngIf="adv.status==='PENDING'" class="adv-cancel-btn"
                          (click)="cancelAdvance(adv.id)" title="Cancel request">✕</button>
                </div>
              </div>
              <div class="adv-reason">{{ adv.reason }}</div>
              <div class="adv-review" *ngIf="adv.reviewNotes">
                <span class="review-label">HR Notes:</span> {{ adv.reviewNotes }}
              </div>
              <div class="adv-reviewer" *ngIf="adv.reviewedBy">
                Reviewed by {{ adv.reviewedBy.firstName }} {{ adv.reviewedBy.lastName }}
                on {{ adv.reviewDate }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════ MY DOCUMENTS ════ -->
      <div *ngIf="section==='documents'" class="documents-section">

        <div class="docs-intro">
          <h3>📄 Official Documents</h3>
          <p>Generate and download your official HR documents as PDF files. All documents are generated instantly with your current data.</p>
        </div>

        <div class="docs-grid">

          <!-- Employment Certificate -->
          <div class="doc-card">
            <div class="doc-icon">📋</div>
            <div class="doc-info">
              <div class="doc-name">Employment Certificate</div>
              <div class="doc-desc">Official letter confirming your employment, position, department and start date. Accepted by banks, embassies and institutions.</div>
              <div class="doc-tags">
                <span>Official</span><span>Signed</span><span>Instant</span>
              </div>
            </div>
            <button class="btn-download" (click)="printDoc('employment-cert')">
              ⬇ Download PDF
            </button>
          </div>

          <!-- Salary Certificate -->
          <div class="doc-card">
            <div class="doc-icon">💵</div>
            <div class="doc-info">
              <div class="doc-name">Salary Certificate</div>
              <div class="doc-desc">Confirms your employment with salary details. Required for loan applications, rental agreements and visa requests.</div>
              <div class="doc-tags">
                <span>Confidential</span><span>Financial</span><span>Official</span>
              </div>
            </div>
            <button class="btn-download" (click)="printDoc('salary-cert')">
              ⬇ Download PDF
            </button>
          </div>

          <!-- Leave Balance Report -->
          <div class="doc-card">
            <div class="doc-icon">🌴</div>
            <div class="doc-info">
              <div class="doc-name">Leave Balance Report</div>
              <div class="doc-desc">Your current leave balances (annual + sick), leave policy details and full history of all requests.</div>
              <div class="doc-tags">
                <span>Leave</span><span>Balance</span><span>History</span>
              </div>
            </div>
            <button class="btn-download" (click)="printDoc('leave-balance')">
              ⬇ Download PDF
            </button>
          </div>

          <!-- Attendance Report -->
          <div class="doc-card">
            <div class="doc-icon">🗓️</div>
            <div class="doc-info">
              <div class="doc-name">Attendance Summary</div>
              <div class="doc-desc">Monthly attendance summary showing worked days, absences, leaves and daily check-in/check-out history.</div>
              <div class="doc-tags">
                <span>Attendance</span><span>Monthly</span><span>Detailed</span>
              </div>
            </div>
            <button class="btn-download" (click)="printDoc('attendance')">
              ⬇ Download PDF
            </button>
          </div>

          <!-- Advance History -->
          <div class="doc-card">
            <div class="doc-icon">💰</div>
            <div class="doc-info">
              <div class="doc-name">Salary Advance History</div>
              <div class="doc-desc">Full history of all salary advance requests including amounts, dates, approval status and HR notes.</div>
              <div class="doc-tags">
                <span>Advances</span><span>History</span><span>Financial</span>
              </div>
            </div>
            <button class="btn-download" (click)="printDoc('advances')">
              ⬇ Download PDF
            </button>
          </div>

          <!-- Employee Profile -->
          <div class="doc-card">
            <div class="doc-icon">👤</div>
            <div class="doc-info">
              <div class="doc-name">Employee Profile Card</div>
              <div class="doc-desc">Complete employee profile including personal information, professional details, and current HR status.</div>
              <div class="doc-tags">
                <span>Profile</span><span>HR Record</span><span>Complete</span>
              </div>
            </div>
            <button class="btn-download" (click)="printDoc('profile')">
              ⬇ Download PDF
            </button>
          </div>

        </div>

        <div class="docs-note">
          <span>ℹ️</span>
          All documents are generated from live data. A print/save dialog will open — choose "Save as PDF" in your browser's print dialog.
        </div>
      </div>

      <!-- ════ MY ONBOARDING ════ -->
      <div *ngIf="section==='onboarding'" class="main-grid">
        <div class="card">
          <h3 class="section-title">🚀 AI Onboarding Plan</h3>
          <p style="color:#64748b;font-size:0.85rem;margin-bottom:1rem;">
            Generate a personalized 30/60/90-day onboarding plan based on your role and department.
          </p>
          <button class="btn-primary" (click)="generateOnboardingPlan()" [disabled]="generatingPlan">
            {{ generatingPlan ? '⏳ Generating...' : '✨ Generate My Onboarding Plan' }}
          </button>

          <div *ngIf="onboardingError" style="margin-top:1rem;padding:0.75rem;background:#fee2e2;color:#991b1b;border-radius:6px;font-size:0.85rem;">
            {{ onboardingError }}
          </div>

          <div *ngIf="latestOnboardingPlan" style="margin-top:1.5rem;">
            <h4 class="section-title" style="font-size:0.85rem;">Latest Plan — {{ latestOnboardingPlan.generatedAt | date:'dd MMM yyyy, HH:mm' }}</h4>
            <div style="white-space:pre-wrap;font-size:0.85rem;color:#334155;background:#f8fafc;border:1px solid var(--adp-border);border-radius:6px;padding:1rem;line-height:1.6;">{{ latestOnboardingPlan.planText }}</div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title">📜 Plan History</h3>
          <div class="table-container" style="max-height:400px;overflow-y:auto;">
            <div *ngFor="let p of onboardingHistory" style="border:1px solid var(--adp-border);border-radius:6px;padding:0.75rem;margin-bottom:0.75rem;">
              <div style="font-size:0.75rem;color:#64748b;font-weight:700;margin-bottom:0.4rem;">{{ p.generatedAt | date:'dd MMM yyyy, HH:mm' }}</div>
              <div style="white-space:pre-wrap;font-size:0.8rem;color:#334155;line-height:1.5;">{{ p.planText }}</div>
            </div>
            <div *ngIf="onboardingHistory.length===0" style="text-align:center;padding:1rem;color:gray;font-size:0.85rem;">No onboarding plans generated yet.</div>
          </div>
        </div>
      </div>

      <!-- ═══ MODALS ═══ -->

      <!-- Attendance Modal -->
      <div class="modal-overlay" *ngIf="showAttendanceModal">
        <div class="modal-box att-modal">
          <div class="modal-header">
            <div>
              <h3>⏱ Today's Attendance</h3>
              <p style="font-size:0.8rem;color:#64748b;margin-top:2px">{{ todayDate }}</p>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <button class="refresh-btn" (click)="loadTodayAttendance()" title="Refresh">↻</button>
              <button class="modal-close" (click)="showAttendanceModal=false">&times;</button>
            </div>
          </div>

          <div class="att-modal-timer" *ngIf="activeTimer">
            <span class="timer-label">{{ activeTimer }}</span>
            <span class="timer-value">{{ elapsedDisplay }}</span>
          </div>

          <div class="punch-list">
            <div class="punch-item" [class.done]="today?.morningIn"  [class.active]="nextPunch==='MORNING_IN'">
              <div class="punch-num">1</div>
              <div class="punch-info">
                <div class="punch-label">Clock In</div>
                <div class="punch-sub">Start of work</div>
                <div class="punch-time" *ngIf="today?.morningIn">{{ today.morningIn | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn"     *ngIf="nextPunch==='MORNING_IN'"  (click)="punch('MORNING_IN')">Punch</button>
              <span class="punch-check"     *ngIf="today?.morningIn">✓</span>
            </div>
            <div class="punch-item" [class.done]="today?.lunchOut"   [class.active]="nextPunch==='LUNCH_OUT'">
              <div class="punch-num">2</div>
              <div class="punch-info">
                <div class="punch-label">Out for Lunch</div>
                <div class="punch-sub">Lunch break start</div>
                <div class="punch-time" *ngIf="today?.lunchOut">{{ today.lunchOut | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn"     *ngIf="nextPunch==='LUNCH_OUT'"   (click)="punch('LUNCH_OUT')">Punch</button>
              <span class="punch-check"     *ngIf="today?.lunchOut">✓</span>
            </div>
            <div class="punch-item" [class.done]="today?.afternoonIn" [class.active]="nextPunch==='AFTERNOON_IN'">
              <div class="punch-num">3</div>
              <div class="punch-info">
                <div class="punch-label">Back from Lunch</div>
                <div class="punch-sub">Afternoon start</div>
                <div class="punch-time" *ngIf="today?.afternoonIn">{{ today.afternoonIn | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn"     *ngIf="nextPunch==='AFTERNOON_IN'" (click)="punch('AFTERNOON_IN')">Punch</button>
              <span class="punch-check"     *ngIf="today?.afternoonIn">✓</span>
            </div>
            <div class="punch-item" [class.done]="today?.eveningOut"  [class.active]="nextPunch==='EVENING_OUT'">
              <div class="punch-num">4</div>
              <div class="punch-info">
                <div class="punch-label">Clock Out</div>
                <div class="punch-sub">End of work</div>
                <div class="punch-time" *ngIf="today?.eveningOut">{{ today.eveningOut | date:'HH:mm:ss' }}</div>
              </div>
              <button class="punch-btn out" *ngIf="nextPunch==='EVENING_OUT'"  (click)="punch('EVENING_OUT')">Punch</button>
              <span class="punch-check"     *ngIf="today?.eveningOut">✓</span>
            </div>
          </div>

          <div class="work-stats" *ngIf="today?.morningIn">
            <div class="stat-item"><div class="stat-label">🌅 Morning</div><div class="stat-value">{{ getMorningDuration() }}</div></div>
            <div class="stat-divider" *ngIf="today?.afternoonIn"></div>
            <div class="stat-item" *ngIf="today?.afternoonIn"><div class="stat-label">🌇 Afternoon</div><div class="stat-value">{{ getAfternoonDuration() }}</div></div>
            <div class="stat-divider"></div>
            <div class="stat-item total"><div class="stat-label">⏱ Total</div><div class="stat-value">{{ getLiveTotalDuration() }}</div></div>
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
            <button class="modal-close" (click)="showProfileModal=false">&times;</button>
          </div>
          <form (submit)="updateProfile($event)" style="display:flex;flex-direction:column;gap:1rem">
            <div class="form-row">
              <div class="form-group"><label>First Name</label><input type="text" name="firstName" [value]="employeeData?.firstName||''"></div>
              <div class="form-group"><label>Last Name</label><input type="text" name="lastName" [value]="employeeData?.lastName||''"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Phone</label><input type="text" name="phoneNumber" [value]="employeeData?.phoneNumber||''"></div>
              <div class="form-group"><label>CIN</label><input type="text" name="cin" [value]="employeeData?.cin||''"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Nationality</label><input type="text" name="nationality" [value]="employeeData?.nationality||''"></div>
              <div class="form-group"><label>Marital Status</label><input type="text" name="maritalStatus" [value]="employeeData?.maritalStatus||''"></div>
            </div>
            <div class="form-group"><label>Address</label><input type="text" name="address" [value]="employeeData?.address||''"></div>
            <div class="form-group"><label>Emergency Contact</label><input type="text" name="emergencyContact" [value]="employeeData?.emergencyContact||''"></div>
            <div style="display:flex;gap:0.75rem;margin-top:0.5rem">
              <button type="submit" class="btn-primary" style="flex:1">Save Changes</button>
              <button type="button" class="btn-secondary" style="flex:1" (click)="showProfileModal=false">Cancel</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .emp-dash { display:flex; flex-direction:column; gap:1.5rem; }

    /* Welcome */
    .welcome-banner { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); border-radius:var(--radius); padding:1.75rem 2rem; display:flex; justify-content:space-between; align-items:center; color:white; }
    .welcome-left { display:flex; align-items:center; gap:1.25rem; }
    .welcome-avatar { width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg,var(--adp-red),#ff6b6b); color:white; font-size:1.5rem; font-weight:800; display:flex; align-items:center; justify-content:center; }
    .welcome-banner h2 { color:white; font-size:1.4rem; margin-bottom:0.25rem; }
    .welcome-banner p  { color:rgba(255,255,255,0.65); font-size:0.875rem; }

    /* KPI */
    .kpi-grid { display:grid; grid-template-columns:1.2fr 1fr 1fr 1fr; gap:1.25rem; }
    .kpi-card { display:flex; align-items:center; gap:1rem; padding:1.25rem 1.5rem; }
    .kpi-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
    .c-warn { color:#d97706 !important; }

    /* Attendance card */
    .attendance-card { padding:1.25rem 1.5rem; transition:box-shadow 0.2s,transform 0.2s; }
    .attendance-card:hover { box-shadow:var(--shadow-md); transform:translateY(-1px); }
    .att-header { display:flex; align-items:center; gap:1rem; margin-bottom:1rem; }
    .att-icon   { font-size:1.5rem; }
    .att-date   { font-size:0.75rem; color:var(--adp-dark-gray); margin-top:2px; }
    .att-quick  { text-align:right; }
    .att-arrow  { font-size:1.4rem; color:var(--adp-dark-gray); margin-left:0.5rem; }
    .timer-label { display:block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--adp-dark-gray); }
    .timer-value { font-size:1.1rem; font-weight:800; color:var(--adp-red); font-variant-numeric:tabular-nums; }
    .att-punch-preview { display:flex; align-items:center; }
    .preview-dot  { width:28px; height:28px; border-radius:50%; background:var(--adp-border); color:var(--adp-dark-gray); font-size:0.72rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
    .preview-dot.done   { background:#16a34a; color:white; }
    .preview-dot.active { background:var(--adp-red); color:white; }
    .preview-line { flex:1; height:2px; background:var(--adp-border); transition:background 0.2s; }
    .preview-line.done  { background:#16a34a; }

    /* Section tabs */
    .section-tabs { display:flex; gap:0.25rem; background:white; border:1.5px solid var(--adp-border); border-radius:10px; padding:0.35rem; }
    .section-tabs button {
      flex:1; padding:0.6rem 1rem; background:none; border:none; border-radius:7px;
      font-size:0.83rem; font-weight:600; cursor:pointer; font-family:inherit; color:#64748b;
      transition:all 0.15s; position:relative; display:flex; align-items:center; justify-content:center; gap:0.4rem;
    }
    .section-tabs button:hover  { background:#f8fafc; color:#1e293b; }
    .section-tabs button.active { background:var(--adp-red); color:white; }
    .tab-badge { background:white; color:var(--adp-red); font-size:0.6rem; font-weight:900; padding:0.1rem 0.4rem; border-radius:10px; }

    /* Leave tab */
    .main-grid { display:grid; grid-template-columns:1.2fr 1fr; gap:1.5rem; }
    .leave-form { display:flex; flex-direction:column; gap:1rem; }
    .form-row   { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }

    /* Calendar */
    .personal-calendar.monthly { border:1px solid var(--adp-border); border-radius:8px; overflow:hidden; background:white; }
    .cal-row.header { display:grid; grid-template-columns:repeat(7,1fr); background:#f8fafc; border-bottom:1px solid var(--adp-border); }
    .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); }
    .cal-cell { padding:0.5rem 0.2rem; text-align:center; border-right:1px solid var(--adp-border); border-bottom:1px solid var(--adp-border); min-height:48px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
    .cal-cell:nth-child(7n) { border-right:none; }
    .cal-cell.weekend { background:#f1f5f9 !important; }
    .cal-cell.is-today { border:2.5px solid #1967D2 !important; z-index:2; }
    .day-name   { font-size:0.7rem; font-weight:800; color:#475569; text-transform:uppercase; }
    .day-num    { font-size:0.7rem; font-weight:700; color:#94a3b8; position:absolute; top:4px; left:6px; }
    .day-status { margin-top:14px; font-size:0.85rem; }
    .cal-nav    { display:flex; gap:0.4rem; }
    .nav-btn    { width:24px; height:24px; border-radius:4px; border:1px solid var(--adp-border); background:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1rem; color:#64748b; }
    .nav-btn:hover { background:#f1f5f9; color:var(--adp-red); }

    /* Profile strip */
    .profile-list  { display:flex; flex-direction:column; }
    .profile-row   { display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--adp-border); font-size:0.84rem; }
    .profile-row:last-child { border-bottom:none; }
    .profile-label { color:var(--adp-dark-gray); font-weight:600; font-size:0.78rem; text-transform:uppercase; }
    .profile-val   { color:var(--adp-charcoal); font-weight:500; text-align:right; max-width:60%; word-break:break-word; }

    /* Advance tab */
    .advances-section { display:flex; flex-direction:column; gap:1.25rem; }
    .adv-info-banner {
      display:flex; align-items:flex-start; gap:0.75rem;
      background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;
      padding:1rem 1.25rem; font-size:0.85rem; color:#1e40af;
    }
    .bi { font-size:1.25rem; flex-shrink:0; }
    .adv-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }

    .adv-input {
      width:100%; padding:0.55rem 0.75rem; border:1.5px solid var(--adp-border); border-radius:8px;
      font-size:0.9rem; font-family:inherit; outline:none; transition:border-color 0.15s;
    }
    .adv-input:focus { border-color:var(--adp-red); }
    .field-hint { font-size:0.68rem; color:#94a3b8; display:block; margin-top:0.3rem; }

    .adv-rules { margin-top:1.25rem; display:flex; flex-direction:column; gap:0.4rem; }
    .rule-item { font-size:0.78rem; color:#64748b; padding:0.3rem 0; border-bottom:1px solid #f1f5f9; }
    .rule-item:last-child { border-bottom:none; }

    .empty-state { text-align:center; padding:2.5rem; color:#94a3b8; font-size:0.88rem; }

    .adv-card {
      border:1.5px solid var(--adp-border); border-radius:10px;
      padding:1rem 1.25rem; margin-bottom:0.75rem;
      border-left-width:4px; border-left-color:#e2e8f0;
    }
    .adv-pending  { border-left-color:#f59e0b; background:#fffbeb; }
    .adv-approved { border-left-color:#22c55e; background:#f0fdf4; }
    .adv-rejected { border-left-color:#ef4444; background:#fff8f8; }
    .adv-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; }
    .adv-amount { font-size:1.15rem; font-weight:800; color:#1e293b; }
    .adv-date   { font-size:0.72rem; color:#64748b; margin-top:2px; }
    .adv-status-wrap { display:flex; align-items:center; gap:0.5rem; }
    .adv-status-badge { font-size:0.65rem; font-weight:800; text-transform:uppercase; padding:0.15rem 0.6rem; border-radius:20px; }
    .st-pending  { background:#fef3c7; color:#b45309; }
    .st-approved { background:#dcfce7; color:#166534; }
    .st-rejected { background:#fee2e2; color:#991b1b; }
    .adv-cancel-btn { background:none; border:1px solid #fca5a5; color:#ef4444; width:22px; height:22px; border-radius:5px; cursor:pointer; font-size:0.75rem; display:flex; align-items:center; justify-content:center; }
    .adv-cancel-btn:hover { background:#fee2e2; }
    .adv-reason  { font-size:0.8rem; color:#475569; margin-bottom:0.4rem; }
    .adv-review  { font-size:0.75rem; color:#64748b; background:#f8fafc; padding:0.4rem 0.65rem; border-radius:5px; margin-top:0.4rem; }
    .review-label { font-weight:700; }
    .adv-reviewer { font-size:0.65rem; color:#94a3b8; margin-top:0.3rem; }

    /* Documents tab */
    .documents-section { display:flex; flex-direction:column; gap:1.5rem; }
    .docs-intro h3 { font-size:1.1rem; font-weight:800; margin-bottom:0.3rem; }
    .docs-intro p  { color:#64748b; font-size:0.85rem; }
    .docs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
    .doc-card {
      background:white; border:1.5px solid var(--adp-border); border-radius:12px;
      padding:1.25rem; display:flex; flex-direction:column; gap:0.75rem;
      transition:border-color 0.15s,box-shadow 0.15s;
    }
    .doc-card:hover { border-color:var(--adp-red); box-shadow:0 4px 16px rgba(208,39,29,0.1); }
    .doc-icon { font-size:2rem; }
    .doc-info { flex:1; }
    .doc-name { font-weight:800; font-size:0.92rem; margin-bottom:0.35rem; }
    .doc-desc { font-size:0.78rem; color:#64748b; line-height:1.5; margin-bottom:0.5rem; }
    .doc-tags { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .doc-tags span { font-size:0.6rem; font-weight:700; text-transform:uppercase; background:#f1f5f9; color:#64748b; padding:0.1rem 0.5rem; border-radius:20px; }
    .btn-download {
      width:100%; padding:0.6rem; background:var(--adp-red); color:white;
      border:none; border-radius:8px; font-weight:700; font-size:0.82rem;
      cursor:pointer; font-family:inherit; transition:background 0.15s;
    }
    .btn-download:hover { background:var(--adp-red-dark,#b91c1c); }
    .docs-note {
      display:flex; align-items:center; gap:0.75rem;
      background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;
      padding:0.85rem 1.1rem; font-size:0.78rem; color:#64748b;
    }

    /* Attendance modal */
    .att-modal { width:460px; }
    .att-modal-timer { text-align:center; padding:0.75rem; background:var(--adp-light-gray); border-radius:8px; margin-bottom:1.25rem; }
    .att-modal-timer .timer-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--adp-dark-gray); }
    .att-modal-timer .timer-value { font-size:2rem; font-weight:800; color:var(--adp-red); display:block; margin-top:2px; }
    .punch-list { display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.25rem; }
    .punch-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border-radius:8px; border:1.5px solid var(--adp-border); background:#fafafa; transition:all 0.2s; }
    .punch-item.active { border-color:var(--adp-red); background:#fff5f5; }
    .punch-item.done   { border-color:#bbf7d0; background:#f0fdf4; }
    .punch-num  { width:24px; height:24px; border-radius:50%; background:var(--adp-border); color:var(--adp-dark-gray); font-size:0.75rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .punch-item.active .punch-num { background:var(--adp-red); color:white; }
    .punch-item.done   .punch-num { background:#16a34a; color:white; }
    .punch-info  { flex:1; }
    .punch-label { font-size:0.85rem; font-weight:700; color:var(--adp-charcoal); }
    .punch-sub   { font-size:0.75rem; color:var(--adp-dark-gray); }
    .punch-time  { font-size:0.8rem; font-weight:700; color:#16a34a; margin-top:2px; }
    .punch-btn   { padding:0.4rem 1rem; background:var(--adp-red); color:white; border:none; border-radius:6px; font-size:0.8rem; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
    .punch-btn:hover { transform:translateY(-1px); }
    .punch-btn.out { background:#1a1a2e; }
    .punch-check { color:#16a34a; font-size:1.1rem; font-weight:700; }
    .work-stats { display:flex; align-items:center; margin-bottom:1rem; background:var(--adp-light-gray); border-radius:8px; border:1px solid var(--adp-border); overflow:hidden; }
    .stat-item { flex:1; padding:0.65rem 1rem; text-align:center; }
    .stat-item.total { background:#1a1a2e; }
    .stat-item.total .stat-label,
    .stat-item.total .stat-value { color:white; }
    .stat-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--adp-dark-gray); margin-bottom:2px; }
    .stat-value { font-size:1rem; font-weight:800; color:var(--adp-charcoal); }
    .stat-divider { width:1px; height:36px; background:var(--adp-border); flex-shrink:0; }
    .att-summary { margin-top:0.75rem; padding:0.6rem 1rem; background:#f0fdf4; border-radius:6px; font-size:0.82rem; color:#15803d; border:1px solid #bbf7d0; }
    .refresh-btn { width:32px; height:32px; border-radius:6px; border:1.5px solid var(--adp-border); background:white; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; color:var(--adp-dark-gray); flex-shrink:0; }
    .refresh-btn:hover { border-color:var(--adp-red); color:var(--adp-red); transform:rotate(180deg); }

    /* Leave badges */
    .badge-approved { background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-weight:700; }
    .badge-pending  { background:#fef9c3; color:#854d0e; padding:2px 6px; border-radius:4px; font-weight:700; }
    .badge-rejected { background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-weight:700; }

    /* Section title */
    .section-title { font-size:1rem; font-weight:700; margin-bottom:1.25rem; color:var(--adp-charcoal); }
  `]
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  userName      = 'Employee';
  employeeData: any = {};
  showProfileModal   = false;
  showAttendanceModal= false;
  userId         = 0;
  today: any     = null;
  elapsedDisplay = '00:00:00';
  activeTimer    = '';
  totalWorked    = '';
  loadingAttendance = true;
  myLeaves: any[]     = [];
  myAttendance: any[] = [];
  monthDays: any[]    = [];
  navigationDate      = new Date();
  todayDate = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // ── New ──
  section         = 'leave'; // leave | advances | documents | onboarding
  myAdvances: any[] = [];
  advanceAmount   = 0;
  advanceReason   = '';
  advanceSubmitting = false;

  // ── AI Onboarding ──
  onboardingHistory: any[] = [];
  latestOnboardingPlan: any = null;
  generatingPlan = false;
  onboardingError = '';

  get pendingAdvances() { return this.myAdvances.filter(a => a.status === 'PENDING').length; }

  private timerInterval: any = null;
  private timerStart: Date | null = null;
  private pollInterval: any = null;

  get nextPunch(): string {
    if (!this.today || !this.today.morningIn) return 'MORNING_IN';
    if (!this.today.lunchOut)   return 'LUNCH_OUT';
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
    const userIdStr  = localStorage.getItem('adp_user_id');
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
      this.loadAdvances();
      this.generateMonthDays();
      this.pollInterval = setInterval(() => this.loadTodayAttendance(false), 30000);
    }
  }

  ngOnDestroy() { clearInterval(this.timerInterval); clearInterval(this.pollInterval); }

  // ── Advance methods ───────────────────────────────────────────
  loadAdvances() {
    if (!this.userId) return;
    this.http.get<any[]>(`${API}/advances/employee/${this.userId}`).subscribe({
      next: d => { this.myAdvances = d; this.cdr.detectChanges(); }
    });
  }

  loadOnboardingHistory() {
    if (!this.userId) return;
    this.http.get<any[]>(`${API}/ai/onboarding-plan/${this.userId}/history`).subscribe({
      next: d => {
        this.onboardingHistory = d;
        this.latestOnboardingPlan = d.length > 0 ? d[0] : null;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  generateOnboardingPlan() {
    if (!this.userId) return;
    this.generatingPlan = true;
    this.onboardingError = '';
    this.http.post<any>(`${API}/ai/onboarding-plan/${this.userId}`, {}).subscribe({
      next: plan => {
        this.generatingPlan = false;
        this.latestOnboardingPlan = plan;
        this.onboardingHistory = [plan, ...this.onboardingHistory];
        this.cdr.detectChanges();
      },
      error: err => {
        this.generatingPlan = false;
        this.onboardingError = err?.error?.error || 'Failed to generate onboarding plan.';
        this.cdr.detectChanges();
      }
    });
  }

  submitAdvance() {
    if (!this.advanceAmount || this.advanceAmount < 100) {
      this.notifService.show('Minimum advance amount is 100 TND.', 'error'); return;
    }
    if (!this.advanceReason.trim()) {
      this.notifService.show('Please provide a reason for the advance.', 'error'); return;
    }
    const hasPending = this.myAdvances.some(a => a.status === 'PENDING');
    if (hasPending) {
      this.notifService.show('You already have a pending advance request.', 'error'); return;
    }
    this.advanceSubmitting = true;
    this.http.post(`${API}/advances`, {
      employeeId: this.userId,
      amount: this.advanceAmount,
      reason: this.advanceReason
    }).subscribe({
      next: () => {
        this.notifService.show('Advance request submitted successfully!', 'success');
        this.advanceAmount   = 0;
        this.advanceReason   = '';
        this.advanceSubmitting = false;
        this.loadAdvances();
      },
      error: () => {
        this.notifService.show('Failed to submit advance request.', 'error');
        this.advanceSubmitting = false;
      }
    });
  }

  cancelAdvance(id: number) {
    if (!confirm('Cancel this advance request?')) return;
    this.http.delete(`${API}/advances/${id}`).subscribe({
      next: () => { this.notifService.show('Request cancelled.', 'info'); this.loadAdvances(); },
      error: () => this.notifService.show('Could not cancel — it may have already been reviewed.', 'error')
    });
  }

  // ── PDF Generation ────────────────────────────────────────────
  printDoc(type: string) {
    const emp     = this.employeeData || {};
    const company = localStorage.getItem('adp_company') ||
                    (document.documentElement.style.getPropertyValue('--company') || 'Nexus HCM');
    const today   = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
    const docNo   = `DOC-${Date.now().toString().slice(-8)}`;

    const header = (title: string, subtitle: string) => `
      <div class="doc-header">
        <div class="header-left">
          <div class="co-name">${company}</div>
          <div class="co-sub">Human Capital Management</div>
        </div>
        <div class="header-right">
          <div class="doc-badge">${title}</div>
          <div class="doc-ref">Ref: ${docNo}</div>
          <div class="doc-date">Date: ${today}</div>
        </div>
      </div>
      <div class="doc-subtitle">${subtitle}</div>
    `;

    const footer = () => `
      <div class="doc-footer">
        <div class="sig-section">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">HR Manager</div>
            <div class="sig-company">${company}</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-name">Director</div>
            <div class="sig-company">${company}</div>
          </div>
        </div>
        <div class="doc-legal">This document is computer-generated. Generated on ${today}.</div>
      </div>
    `;

    const empInfo = `
      <table class="info-table">
        <tr><td class="info-key">Full Name</td><td><strong>${emp.firstName || ''} ${emp.lastName || ''}</strong></td></tr>
        <tr><td class="info-key">Employee Code</td><td>${emp.employeeCode || '—'}</td></tr>
        <tr><td class="info-key">Email</td><td>${emp.email || '—'}</td></tr>
        <tr><td class="info-key">Job Title</td><td>${emp.jobTitle || 'Employee'}</td></tr>
        <tr><td class="info-key">Department</td><td>${emp.department?.name || '—'}</td></tr>
        <tr><td class="info-key">Status</td><td><strong>${emp.status || 'ACTIVE'}</strong></td></tr>
      </table>
    `;

    const css = `
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'Segoe UI', Arial, sans-serif; font-size:11pt; color:#1e293b; padding:30px 40px; background:white; }
      .doc-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:3px solid #1e293b; margin-bottom:20px; }
      .co-name  { font-size:18pt; font-weight:800; letter-spacing:1px; color:#1e293b; }
      .co-sub   { font-size:9pt; color:#64748b; margin-top:2px; }
      .doc-badge{ background:#1e293b; color:white; padding:4px 12px; border-radius:4px; font-weight:700; font-size:10pt; text-align:center; }
      .doc-ref  { font-size:8pt; color:#64748b; text-align:right; margin-top:4px; }
      .doc-date { font-size:8pt; color:#64748b; text-align:right; }
      .doc-subtitle { font-size:14pt; font-weight:700; text-align:center; padding:12px 0 20px; border-bottom:1px solid #e2e8f0; margin-bottom:20px; color:#1e293b; }
      p { margin:10px 0; line-height:1.7; }
      h3 { font-size:11pt; font-weight:700; margin:20px 0 8px; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:4px; }
      .info-table { width:100%; border-collapse:collapse; margin:12px 0; }
      .info-table td { padding:7px 10px; border:1px solid #e2e8f0; font-size:10pt; }
      .info-key { background:#f8fafc; font-weight:600; width:32%; color:#475569; }
      .data-table { width:100%; border-collapse:collapse; margin:12px 0; font-size:10pt; }
      .data-table th { background:#1e293b; color:white; padding:8px 10px; text-align:left; font-size:9pt; }
      .data-table td { padding:6px 10px; border-bottom:1px solid #f1f5f9; }
      .data-table tr:nth-child(even) td { background:#f8fafc; }
      .highlight-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:12px 16px; margin:12px 0; }
      .balance-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; }
      .bal-card { border:1px solid #e2e8f0; border-radius:6px; padding:12px; text-align:center; }
      .bal-num { font-size:22pt; font-weight:800; color:#1e293b; }
      .bal-label { font-size:9pt; color:#64748b; margin-top:2px; }
      .status-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:9pt; font-weight:700; }
      .badge-approved { background:#dcfce7; color:#166534; }
      .badge-pending  { background:#fef9c3; color:#854d0e; }
      .badge-rejected { background:#fee2e2; color:#991b1b; }
      .doc-footer { margin-top:50px; border-top:2px solid #1e293b; padding-top:20px; }
      .sig-section { display:flex; justify-content:space-around; margin-bottom:20px; }
      .sig-block  { text-align:center; }
      .sig-line   { width:180px; border-top:1px solid #1e293b; margin:0 auto 8px; }
      .sig-name   { font-weight:700; font-size:10pt; }
      .sig-company{ font-size:9pt; color:#64748b; }
      .doc-legal  { text-align:center; font-size:8pt; color:#94a3b8; font-style:italic; }
      @media print { body { padding:20px; } }
    `;

    let body = '';

    if (type === 'employment-cert') {
      body = `
        ${header('CERTIFICATE', 'CERTIFICATE OF EMPLOYMENT')}
        <p>To Whom It May Concern,</p>
        <p>This is to certify that the following individual is currently employed with <strong>${company}</strong>:</p>
        ${empInfo}
        <div class="highlight-box">
          <p style="margin:0">
            <strong>${emp.firstName || ''} ${emp.lastName || ''}</strong> has been employed with
            <strong>${company}</strong> since <strong>${emp.joiningDate || 'the date of joining'}</strong>
            and is currently serving in the capacity of <strong>${emp.jobTitle || 'Employee'}</strong>
            within the <strong>${emp.department?.name || 'assigned'}</strong> department.
          </p>
        </div>
        <p>Their employment status is currently <strong>ACTIVE</strong> and they are in good standing with the organization.</p>
        <p>This certificate is issued upon the request of the employee for official purposes. The company confirms the above information to be accurate as of the date of issue.</p>
        ${footer()}
      `;
    }

    else if (type === 'salary-cert') {
      body = `
        ${header('SALARY CERT.', 'SALARY CERTIFICATE')}
        <p>This is to certify that:</p>
        ${empInfo}
        <div class="highlight-box">
          <p style="margin:0">
            The above-named employee is currently in active employment with <strong>${company}</strong>
            as a <strong>${emp.jobTitle || 'Employee'}</strong> in the <strong>${emp.department?.name || 'assigned'}</strong> department.
            This certificate may be used for financial, administrative and official purposes.
          </p>
        </div>
        <p>This certificate is issued in good faith and confirms the employment status of the named individual as of <strong>${today}</strong>.</p>
        <p>For any clarification or verification, please contact the HR department at <strong>${company}</strong>.</p>
        ${footer()}
      `;
    }

    else if (type === 'leave-balance') {
      const leaveRows = this.myLeaves.slice(0, 15).map(l =>
        `<tr>
          <td>${l.startDate || '—'}</td>
          <td>${l.endDate || '—'}</td>
          <td>${l.type || '—'}</td>
          <td><span class="status-badge badge-${(l.status||'').toLowerCase()}">${l.status || '—'}</span></td>
        </tr>`
      ).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:12px">No leave requests found</td></tr>';

      body = `
        ${header('LEAVE REPORT', 'LEAVE BALANCE REPORT')}
        ${empInfo}
        <h3>Current Leave Balances</h3>
        <div class="balance-grid">
          <div class="bal-card">
            <div class="bal-num">${(emp.leaveBalance || 0).toFixed(1)}</div>
            <div class="bal-label">Annual Leave Days Remaining</div>
          </div>
          <div class="bal-card">
            <div class="bal-num">${(emp.sickLeaveBalance || 0).toFixed(1)}</div>
            <div class="bal-label">Sick Leave Days Remaining</div>
          </div>
        </div>
        ${emp.category ? `
          <h3>Leave Policy: ${emp.category.name}</h3>
          <table class="info-table">
            <tr><td class="info-key">Annual Allowance</td><td>${emp.category.annualLeaveAllowance} days/year</td></tr>
            <tr><td class="info-key">Sick Allowance</td><td>${emp.category.sickLeaveAllowance} days/year</td></tr>
            <tr><td class="info-key">Monthly Accrual</td><td>+${(emp.category.monthlyIncrement || 0).toFixed(2)} days/month</td></tr>
            <tr><td class="info-key">Description</td><td>${emp.category.description || '—'}</td></tr>
          </table>
        ` : ''}
        <h3>Recent Leave Requests</h3>
        <table class="data-table">
          <thead><tr><th>Start Date</th><th>End Date</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>${leaveRows}</tbody>
        </table>
        ${footer()}
      `;
    }

    else if (type === 'attendance') {
      const attRows = this.myAttendance.slice(0, 30).map(a =>
        `<tr>
          <td>${a.workDate || '—'}</td>
          <td>${a.morningIn ? this.fmtTime(a.morningIn) : '—'}</td>
          <td>${a.lunchOut ? this.fmtTime(a.lunchOut) : '—'}</td>
          <td>${a.afternoonIn ? this.fmtTime(a.afternoonIn) : '—'}</td>
          <td>${a.eveningOut ? this.fmtTime(a.eveningOut) : '—'}</td>
        </tr>`
      ).join('') || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:12px">No attendance records found</td></tr>';

      body = `
        ${header('ATTENDANCE', 'ATTENDANCE SUMMARY REPORT')}
        ${empInfo}
        <h3>Attendance Records — Last 30 Entries</h3>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Clock In</th><th>Lunch Out</th><th>Afternoon In</th><th>Clock Out</th></tr></thead>
          <tbody>${attRows}</tbody>
        </table>
        <div class="highlight-box" style="margin-top:16px">
          <p style="margin:0">Total records shown: <strong>${Math.min(this.myAttendance.length, 30)}</strong> of <strong>${this.myAttendance.length}</strong></p>
        </div>
        ${footer()}
      `;
    }

    else if (type === 'advances') {
      const advRows = this.myAdvances.map(a =>
        `<tr>
          <td>${a.requestDate || '—'}</td>
          <td>${(a.amount || 0).toLocaleString()} TND</td>
          <td>${a.reason || '—'}</td>
          <td><span class="status-badge badge-${(a.status||'').toLowerCase()}">${a.status}</span></td>
          <td>${a.reviewNotes || '—'}</td>
          <td>${a.reviewDate || '—'}</td>
        </tr>`
      ).join('') || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:12px">No advance requests found</td></tr>';

      body = `
        ${header('ADVANCES', 'SALARY ADVANCE HISTORY')}
        ${empInfo}
        <h3>Advance Request History</h3>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Amount</th><th>Reason</th><th>Status</th><th>HR Notes</th><th>Review Date</th></tr></thead>
          <tbody>${advRows}</tbody>
        </table>
        ${footer()}
      `;
    }

    else if (type === 'profile') {
      body = `
        ${header('PROFILE', 'EMPLOYEE PROFILE RECORD')}
        <h3>Personal Information</h3>
        <table class="info-table">
          <tr><td class="info-key">Full Name</td><td><strong>${emp.firstName || ''} ${emp.lastName || ''}</strong></td></tr>
          <tr><td class="info-key">Email</td><td>${emp.email || '—'}</td></tr>
          <tr><td class="info-key">Phone</td><td>${emp.phoneNumber || '—'}</td></tr>
          <tr><td class="info-key">CIN</td><td>${emp.cin || '—'}</td></tr>
          <tr><td class="info-key">Date of Birth</td><td>${emp.dateOfBirth || '—'}</td></tr>
          <tr><td class="info-key">Gender</td><td>${emp.gender || '—'}</td></tr>
          <tr><td class="info-key">Marital Status</td><td>${emp.maritalStatus || '—'}</td></tr>
          <tr><td class="info-key">Nationality</td><td>${emp.nationality || '—'}</td></tr>
          <tr><td class="info-key">Address</td><td>${emp.address || '—'}</td></tr>
          <tr><td class="info-key">Emergency Contact</td><td>${emp.emergencyContact || '—'}</td></tr>
        </table>
        <h3>Professional Information</h3>
        <table class="info-table">
          <tr><td class="info-key">Employee Code</td><td>${emp.employeeCode || '—'}</td></tr>
          <tr><td class="info-key">Job Title</td><td>${emp.jobTitle || 'Employee'}</td></tr>
          <tr><td class="info-key">Department</td><td>${emp.department?.name || '—'}</td></tr>
          <tr><td class="info-key">Role</td><td>${emp.role || '—'}</td></tr>
          <tr><td class="info-key">Status</td><td>${emp.status || '—'}</td></tr>
          <tr><td class="info-key">Joining Date</td><td>${emp.joiningDate || '—'}</td></tr>
          <tr><td class="info-key">Manager</td><td>${emp.manager ? emp.manager.firstName+' '+emp.manager.lastName : '—'}</td></tr>
          <tr><td class="info-key">Leave Balance</td><td>${(emp.leaveBalance||0).toFixed(1)} days annual / ${(emp.sickLeaveBalance||0).toFixed(1)} days sick</td></tr>
        </table>
        ${footer()}
      `;
    }

    const win = window.open('', '_blank', 'width=900,height=800');
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>${type}</title><style>${css}</style></head><body>${body}<script>window.onload=()=>window.print();</script></body></html>`);
      win.document.close();
    }
  }

  private fmtTime(val: any): string {
    if (!val) return '—';
    try {
      const ts = this.parseTs(val);
      if (!ts) return '—';
      return new Date(ts).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    } catch { return '—'; }
  }

  // ── Existing methods (unchanged) ─────────────────────────────
  fetchHistory() {
    if (!this.userId) return;
    this.http.get<any[]>(`${API}/employees/${this.userId}/leaves-history`).subscribe({
      next: d => { this.myLeaves = Array.isArray(d) ? d.sort((a,b)=>b.id-a.id) : []; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.http.get<any[]>(`${API}/employees/${this.userId}/attendance-history`).subscribe({
      next: d => { this.myAttendance = Array.isArray(d) ? d : []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  isWeekend(date: string): boolean {
    if (!date) return false;
    const p = date.split('-').map(Number);
    const d = new Date(p[0], p[1]-1, p[2]);
    return d.getDay()===0 || d.getDay()===6;
  }

  generateMonthDays() {
    this.monthDays = [];
    const d = new Date(this.navigationDate.getFullYear(), this.navigationDate.getMonth(), 1);
    let start = d.getDay()-1; if (start===-1) start=6;
    d.setDate(d.getDate()-start);
    for (let i=0;i<42;i++) {
      const ds = this.formatLocalDate(d);
      this.monthDays.push({ date:ds, isCurrentMonth:d.getMonth()===this.navigationDate.getMonth(), isToday:ds===new Date().toISOString().split('T')[0] });
      d.setDate(d.getDate()+1);
    }
  }

  formatLocalDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  changeMonth(offset: number) { this.navigationDate.setMonth(this.navigationDate.getMonth()+offset); this.generateMonthDays(); }

  getDayStats(dateStr: string) {
    const today = new Date().toISOString().split('T')[0];
    for (const req of this.myLeaves) {
      if (req.status==='APPROVED' && dateStr>=req.startDate && dateStr<=req.endDate) return { status:'leave', type:req.type };
    }
    for (const att of this.myAttendance) { if (att.workDate===dateStr) return { status:'worked' }; }
    const p = dateStr.split('-').map(Number);
    const d = new Date(p[0],p[1]-1,p[2]);
    if (d.getDay()===0||d.getDay()===6) return { status:'weekend' };
    if (dateStr===today) return { status:'none' };
    return dateStr>today ? { status:'future' } : { status:'absent' };
  }

  getDayColor(dateStr: string) {
    const s = this.getDayStats(dateStr);
    if (s.status==='leave') { if (s.type==='SICK') return '#fee2e2'; if (s.type==='UNPAID') return '#fef3c7'; return '#dbeafe'; }
    if (s.status==='worked') return '#dcfce7';
    if (s.status==='absent') return '#fef2f2';
    return 'white';
  }

  getDayLabel(dateStr: string) {
    if (this.isWeekend(dateStr)) return '';
    const s = this.getDayStats(dateStr);
    if (s.status==='leave') { if (s.type==='SICK') return '💊'; if (s.type==='UNPAID') return '💼'; return '🌴'; }
    if (s.status==='worked') return '✅';
    if (s.status==='absent') return '❌';
    return '';
  }

  getDayTitle(dateStr: string) {
    const s = this.getDayStats(dateStr);
    if (s.status==='leave') return `On Leave: ${s.type}`;
    if (s.status==='worked') return 'Worked day';
    if (s.status==='absent') return 'Absent / No records';
    return '';
  }

  fetchEmployeeData() {
    if (!this.userId) return;
    this.http.get<any>(`${API}/employees/${this.userId}/profile`).subscribe({
      next: me => { if (me) { this.employeeData=me; this.userName=me.firstName+' '+me.lastName; localStorage.setItem('adp_user_full',JSON.stringify(me)); this.cdr.detectChanges(); } },
      error: () => {}
    });
  }

  loadTodayAttendance(isFirstLoad = false) {
    if (!this.userId) return;
    if (isFirstLoad) this.loadingAttendance = true;
    this.http.get<any>(`${API}/employees/${this.userId}/attendance/today`).subscribe({
      next: data => {
        this.loadingAttendance = false;
        if (data) {
          this.today = { ...data, morningIn:this.parseTs(data.morningIn), lunchOut:this.parseTs(data.lunchOut), afternoonIn:this.parseTs(data.afternoonIn), eveningOut:this.parseTs(data.eveningOut) };
        } else { this.today = null; }
        this.restoreTimer();
        if (this.today?.eveningOut) this.calcTotalWorked();
        this.cdr.detectChanges();
      },
      error: () => { this.today=null; this.loadingAttendance=false; this.cdr.detectChanges(); }
    });
  }

  parseTs(val: any): string | null {
    if (!val) return null;
    if (Array.isArray(val)) { const [y,mo,d,h=0,mi=0,s=0]=val; return new Date(y,mo-1,d,h,mi,s).toISOString(); }
    if (typeof val==='string') return new Date(val.replace(' ','T')).toISOString();
    return null;
  }

  restoreTimer() {
    clearInterval(this.timerInterval);
    if (!this.today) return;
    const p = this.nextPunch;
    if (p==='LUNCH_OUT' && this.today.morningIn) { this.activeTimer='Morning session'; this.timerStart=new Date(this.today.morningIn); this.startTick(); }
    else if (p==='EVENING_OUT' && this.today.afternoonIn) { this.activeTimer='Afternoon session'; this.timerStart=new Date(this.today.afternoonIn); this.startTick(); }
    else { this.activeTimer=''; this.elapsedDisplay='00:00:00'; }
  }

  startTick() { this.tick(); this.timerInterval=setInterval(()=>this.tick(),1000); }

  tick() {
    if (!this.timerStart) return;
    const diff=Math.floor((Date.now()-this.timerStart.getTime())/1000);
    const h=Math.floor(diff/3600).toString().padStart(2,'0');
    const m=Math.floor((diff%3600)/60).toString().padStart(2,'0');
    const s=(diff%60).toString().padStart(2,'0');
    this.elapsedDisplay=`${h}:${m}:${s}`;
  }

  calcTotalWorked() {
    if (!this.today?.morningIn||!this.today?.eveningOut) return;
    let t=0;
    if (this.today.morningIn&&this.today.lunchOut) t+=(new Date(this.today.lunchOut).getTime()-new Date(this.today.morningIn).getTime())/1000;
    if (this.today.afternoonIn&&this.today.eveningOut) t+=(new Date(this.today.eveningOut).getTime()-new Date(this.today.afternoonIn).getTime())/1000;
    this.totalWorked=`${Math.floor(t/3600)}h ${Math.floor((t%3600)/60)}m`;
  }

  private fmtDuration(sec: number): string {
    if (sec<=0) return '0h 0m';
    const h=Math.floor(sec/3600); const m=Math.floor((sec%3600)/60); const s=Math.floor(sec%60);
    return h>0?`${h}h ${m}m`:`${m}m ${s}s`;
  }

  getMorningDuration(): string {
    if (!this.today?.morningIn) return '—';
    const end=this.today.lunchOut?new Date(this.today.lunchOut):new Date();
    return this.fmtDuration((end.getTime()-new Date(this.today.morningIn).getTime())/1000);
  }

  getAfternoonDuration(): string {
    if (!this.today?.afternoonIn) return '—';
    const end=this.today.eveningOut?new Date(this.today.eveningOut):new Date();
    return this.fmtDuration((end.getTime()-new Date(this.today.afternoonIn).getTime())/1000);
  }

  getLiveTotalDuration(): string {
    if (!this.today?.morningIn) return '—';
    let t=0;
    const mEnd=this.today.lunchOut?new Date(this.today.lunchOut):(!this.today.afternoonIn?new Date():null);
    if (mEnd) t+=(mEnd.getTime()-new Date(this.today.morningIn).getTime())/1000;
    if (this.today.afternoonIn) { const aEnd=this.today.eveningOut?new Date(this.today.eveningOut):new Date(); t+=(aEnd.getTime()-new Date(this.today.afternoonIn).getTime())/1000; }
    return this.fmtDuration(t);
  }

  punch(punchType: string) {
    if (!this.userId) return;
    this.http.post(`${API}/employees/${this.userId}/attendance`, { punchType }).subscribe({
      next: (data: any) => {
        this.today={ ...data, morningIn:this.parseTs(data.morningIn), lunchOut:this.parseTs(data.lunchOut), afternoonIn:this.parseTs(data.afternoonIn), eveningOut:this.parseTs(data.eveningOut) };
        const labels: any={ MORNING_IN:'Clocked in!', LUNCH_OUT:'Out for lunch', AFTERNOON_IN:'Back from lunch', EVENING_OUT:'Clocked out — great work today!' };
        this.notifService.show(labels[punchType]||'Punched!','success');
        this.restoreTimer();
        if (punchType==='EVENING_OUT') { clearInterval(this.timerInterval); this.activeTimer=''; this.calcTotalWorked(); }
      },
      error: () => this.notifService.show('Failed to record punch.','error')
    });
  }

  openProfileModal() { this.showProfileModal=true; }

  updateProfile(event: Event) {
    event.preventDefault();
    const form=event.target as HTMLFormElement;
    const p: any={
      firstName:(form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName:(form.elements.namedItem('lastName') as HTMLInputElement).value,
      cin:(form.elements.namedItem('cin') as HTMLInputElement).value,
      nationality:(form.elements.namedItem('nationality') as HTMLInputElement).value,
      maritalStatus:(form.elements.namedItem('maritalStatus') as HTMLInputElement).value,
      emergencyContact:(form.elements.namedItem('emergencyContact') as HTMLInputElement).value,
      phoneNumber:(form.elements.namedItem('phoneNumber') as HTMLInputElement).value,
      address:(form.elements.namedItem('address') as HTMLInputElement).value
    };
    if (this.userId) {
      this.http.put(`${API}/employees/${this.userId}`,p).subscribe({
        next: (u:any) => { this.showProfileModal=false; this.notifService.show('Profile updated!','success'); localStorage.setItem('adp_user_full',JSON.stringify(u)); this.employeeData=u; this.userName=u.firstName+' '+u.lastName; },
        error: () => this.notifService.show('Failed to update profile','error')
      });
    }
  }

  submitLeave(event: Event) {
    event.preventDefault();
    if (!this.userId||!this.employeeData) return;
    const form=event.target as HTMLFormElement;
    const p={ startDate:(form.elements.namedItem('startDate') as HTMLInputElement).value, endDate:(form.elements.namedItem('endDate') as HTMLInputElement).value, reason:(form.elements.namedItem('reason') as HTMLTextAreaElement).value, type:(form.elements.namedItem('type') as HTMLSelectElement).value };
    const s=new Date(p.startDate); const e=new Date(p.endDate);
    let bd=0; let c=new Date(s);
    while(c<=e){ const d=c.getDay(); if(d!==0&&d!==6)bd++; c.setDate(c.getDate()+1); }
    if (bd<=0) { this.notifService.show('Invalid date range.','error'); return; }
    const bal=p.type==='SICK'?(this.employeeData.sickLeaveBalance||0):(this.employeeData.leaveBalance||0);
    if (p.type!=='UNPAID'&&bd>bal) { this.notifService.show(`Insufficient balance: ${bd} days requested, ${bal.toFixed(1)} available.`,'error'); return; }
    this.http.post(`${API}/employees/${this.userId}/leaves`,p).subscribe({
      next: ()=>{ this.notifService.show('Leave request submitted!','info'); (event.target as HTMLFormElement).reset(); this.fetchHistory(); },
      error: ()=>this.notifService.show('Failed to submit leave.','error')
    });
  }
}
