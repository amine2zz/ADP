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
    <div class="dashboard-wrapper">
      <div class="dash-welcome">
        <h2>Welcome back, {{ userName }}!</h2>
        <p>Manage your profile, view your team, and track your requests.</p>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card" style="border-top: 4px solid var(--adp-red);">
          <div class="kpi-title">Clock Status</div>
          <div class="kpi-value">{{ isClockedIn ? 'Clocked In' : 'Clocked Out' }}</div>
          <button class="btn-primary" style="margin-top: 1rem; width: 100%;" (click)="toggleClock()">
            {{ isClockedIn ? 'Clock Out' : 'Clock In' }}
          </button>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #1967D2);">
          <div class="kpi-title">My Leaves</div>
          <div class="kpi-value">12 Days</div>
          <div class="kpi-trend">Remaining balance</div>
        </div>
        <div class="kpi-card" style="border-top: 4px solid #137333;">
          <div class="kpi-title">Benefits</div>
          <div class="kpi-value">Active</div>
          <div class="kpi-trend">Fully Enrolled</div>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-card">
          <h3>Request Time Off</h3>
          <form class="provision-form" (submit)="submitLeave($event)">
              <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                  <div style="flex: 1;">
                      <label style="font-size: 0.8rem; font-weight: 600;">Start Date</label>
                      <input type="date" name="startDate" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--adp-border);">
                  </div>
                  <div style="flex: 1;">
                      <label style="font-size: 0.8rem; font-weight: 600;">End Date</label>
                      <input type="date" name="endDate" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--adp-border);">
                  </div>
              </div>
              <div style="margin-bottom: 1rem;">
                  <label style="font-size: 0.8rem; font-weight: 600;">Type</label>
                  <select name="type" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--adp-border);">
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
              </div>
              <textarea name="reason" placeholder="Reason for leave..." required style="width: 100%; padding: 0.5rem; border: 1px solid var(--adp-border); height: 80px; margin-bottom: 1rem;"></textarea>
              <button type="submit" class="btn-primary" style="width: 100%;">Submit Request</button>
          </form>
        </div>

        <div class="chart-card">
          <h3>Employee Quick Links</h3>
          <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
             <button class="btn-primary" style="width: 100%; text-align: left; background-color: var(--adp-white); color: var(--adp-charcoal); border: 1px solid var(--adp-border);">Request Leave</button>
             <button class="btn-primary" style="width: 100%; text-align: left; background-color: var(--adp-white); color: var(--adp-charcoal); border: 1px solid var(--adp-border);">View Payslips</button>
             <button (click)="openProfileModal()" class="btn-primary" style="width: 100%; text-align: left; background-color: var(--adp-white); color: var(--adp-charcoal); border: 1px solid var(--adp-border);">Update Profile</button>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div class="modal" *ngIf="showProfileModal" style="position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index: 1000;">
        <div class="card" style="width: 500px; max-height: 90vh; overflow-y: auto;">
          <h3 style="margin-bottom: 1.5rem;">My Profile</h3>
          <form (submit)="updateProfile($event)" class="provision-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div><label style="font-size: 0.8rem; font-weight: 600;">First Name</label><input type="text" name="firstName" [ngModel]="employeeData?.firstName" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;"></div>
            <div><label style="font-size: 0.8rem; font-weight: 600;">Last Name</label><input type="text" name="lastName" [ngModel]="employeeData?.lastName" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;"></div>
            <div><label style="font-size: 0.8rem; font-weight: 600;">CIN</label><input type="text" name="cin" [ngModel]="employeeData?.cin" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;"></div>
            <div><label style="font-size: 0.8rem; font-weight: 600;">Nationality</label><input type="text" name="nationality" [ngModel]="employeeData?.nationality" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;"></div>
            <div><label style="font-size: 0.8rem; font-weight: 600;">Marital Status</label><input type="text" name="maritalStatus" [ngModel]="employeeData?.maritalStatus" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;"></div>
            <div><label style="font-size: 0.8rem; font-weight: 600;">Emergency Contact</label><input type="text" name="emergencyContact" [ngModel]="employeeData?.emergencyContact" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;"></div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="btn-primary" style="flex: 1;">Save Changes</button>
              <button type="button" class="btn-primary" style="flex: 1; background: #e0e0e0; color: #333;" (click)="showProfileModal = false">Cancel</button>
            </div>
          </form>
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
    .kpi-value { font-size: 2rem; font-weight: 700; color: var(--adp-charcoal); margin: 0.5rem 0; }
    .kpi-trend { font-size: 0.85rem; color: var(--adp-dark-gray); }
    .charts-section { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    .chart-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .activity-feed { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1.25rem;}
    .activity-feed li { display: flex; gap: 1rem; align-items: flex-start; }
    .activity-icon { width: 32px; height: 32px; border-radius: 50%; color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; }
    .activity-text { font-size: 0.9rem; line-height: 1.4; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
    // Parse userId exactly as passed by login module
    const userIdStr = localStorage.getItem('adp_user_id');
    if (userIdStr) {
        this.userId = parseInt(userIdStr, 10);
    }
    
    // Also try to restore full profile data if available
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
      emergencyContact: (form.elements.namedItem('emergencyContact') as HTMLInputElement).value
    };

    if (this.userId) {
        this.http.put(`http://localhost:8085/api/employees/${this.userId}`, payload).subscribe({
        next: (updatedObj) => {
            this.showProfileModal = false;
            this.notifService.show("Profile Updated Successfully", "success");
            localStorage.setItem('adp_user_full', JSON.stringify(updatedObj));
            this.employeeData = updatedObj;
            this.userName = this.employeeData.firstName;
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
