import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
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
        <div class="kpi-card" style="--accent: #D0271D">
          <div class="kpi-icon" style="background:#fee2e2; color:#D0271D">⏱</div>
          <div>
            <div class="kpi-title">Clock Status</div>
            <div class="kpi-value" style="font-size:1.4rem">{{ isClockedIn ? '🟢 Clocked In' : '🔴 Clocked Out' }}</div>
          </div>
          <button class="clock-btn" [class.out]="isClockedIn" (click)="toggleClock()">
            {{ isClockedIn ? 'Clock Out' : 'Clock In' }}
          </button>
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
        <!-- Leave Request Form -->
        <div class="card">
          <h3 class="section-title">📋 Request Time Off</h3>
          <form class="leave-form" (submit)="submitLeave($event)">
            <div class="form-row">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" name="startDate" required>
              </div>
              <div class="form-group">
                <label>End Date</label>
                <input type="date" name="endDate" required>
              </div>
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
              <textarea name="reason" placeholder="Brief reason for your leave request..." required style="height:80px; resize:none;"></textarea>
            </div>
            <button type="submit" class="btn-primary" style="width:100%">Submit Request</button>
          </form>
        </div>

        <!-- Profile Summary -->
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

    .welcome-banner {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: var(--radius);
      padding: 1.75rem 2rem;
      display: flex; justify-content: space-between; align-items: center;
      color: white;
    }
    .welcome-left { display: flex; align-items: center; gap: 1.25rem; }
    .welcome-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, var(--adp-red), #ff6b6b);
      color: white; font-size: 1.5rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .welcome-banner h2 { color: white; font-size: 1.4rem; margin-bottom: 0.25rem; }
    .welcome-banner p { color: rgba(255,255,255,0.65); font-size: 0.875rem; }

    .kpi-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; }
    .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }

    .clock-btn {
      margin-left: auto;
      padding: 0.5rem 1.1rem;
      border: none; border-radius: 6px;
      font-weight: 700; font-size: 0.8rem;
      cursor: pointer; transition: all 0.2s;
      background: var(--adp-red); color: white;
    }
    .clock-btn.out { background: #64748b; }
    .clock-btn:hover { opacity: 0.85; transform: translateY(-1px); }

    .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; }

    .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--adp-charcoal); }

    .leave-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .profile-list { display: flex; flex-direction: column; gap: 0; }
    .profile-row { display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--adp-border); font-size: 0.85rem; }
    .profile-row:last-child { border-bottom: none; }
    .profile-label { color: var(--adp-dark-gray); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .profile-val { color: var(--adp-charcoal); font-weight: 500; text-align: right; max-width: 60%; word-break: break-word; }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  userName: string = 'Employee';
  isClockedIn: boolean = false;
  employeeData: any = {};
  showProfileModal: boolean = false;
  userId: number = 0;

  constructor(
    private http: HttpClient,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('adp_user') || 'Employee';
    const userIdStr = localStorage.getItem('adp_user_id');
    if (userIdStr) {
      this.userId = parseInt(userIdStr, 10);
      // Always fetch fresh data from API
      this.http.get<any>(`http://localhost:8085/api/employees`).subscribe({
        next: (employees: any[]) => {
          const me = employees.find((e: any) => e.id === this.userId);
          if (me) {
            this.employeeData = me;
            this.userName = me.firstName + ' ' + me.lastName;
            localStorage.setItem('adp_user_full', JSON.stringify(me));
          }
        }
      });
    }
    const storedUser = localStorage.getItem('adp_user_full');
    if (storedUser && storedUser !== 'undefined') {
      this.employeeData = JSON.parse(storedUser);
    }
  }

  openProfileModal() {
    this.showProfileModal = true;
  }

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
            this.notifService.show("Profile Updated Successfully", "success");
            localStorage.setItem('adp_user_full', JSON.stringify(updatedObj));
            this.employeeData = updatedObj;
            this.userName = updatedObj.firstName + ' ' + updatedObj.lastName;
        },
        error: () => this.notifService.show("Failed to update profile", "error")
        });
    }
  }

  toggleClock() {
    this.isClockedIn = !this.isClockedIn;
    const body = { clockIn: this.isClockedIn };
    
    if (this.userId) {
        this.http.post(`http://localhost:8085/api/employees/${this.userId}/attendance`, body).subscribe({
            next: () => {
                const action = this.isClockedIn ? 'Clocked In' : 'Clocked Out';
                this.notifService.show(`Successfully ${action}!`, 'success');
            },
            error: () => {
                this.isClockedIn = !this.isClockedIn; // Revert visually
                this.notifService.show("Failed to log attendance.", 'error');
            }
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
        next: () => {
            this.notifService.show("Leave request submitted securely.", 'info');
            form.reset();
        },
        error: () => this.notifService.show("System error submitting leave.", 'error')
    });
  }
}
