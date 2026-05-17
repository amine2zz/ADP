import { Component } from '@angular/core';
import { API_BASE } from '../services/api.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-init-admin',
  standalone: true,
  imports: [HttpClientModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-box">
        <div class="adp-login-header">
          <h1 class="logo-text">ADP</h1>
          <h2>System Bootstrapper</h2>
          <p style="color: var(--adp-dark-gray); font-size: 0.9rem;">Initialize the Master HR Admin Profile.</p>
          <div style="background: #FFF3E0; padding: 0.5rem; border-radius: 4px; border: 1px solid #FFE0B2; margin-top: 1rem; font-size: 0.75rem; color: #E65100;">
            Note: Default admin is usually pre-seeded as <strong>admin@adp.com</strong>.
          </div>
        </div>
        
        <form class="login-form" (submit)="createAdmin($event)">
          <div class="form-group">
            <label>Master Admin First Name</label>
            <input type="text" name="firstName" placeholder="Super" required>
          </div>
          <div class="form-group">
            <label>Master Admin Last Name</label>
            <input type="text" name="lastName" placeholder="Admin" required>
          </div>
          <div class="form-group">
            <label>Corporate Admin Email</label>
            <input type="email" name="email" placeholder="admin@adp.com" required>
          </div>
          <button type="submit" class="btn-primary login-btn">Deploy System Master</button>
        </form>
        <div style="text-align: center; margin-top: 1.5rem;">
          <a routerLink="/login" style="color: var(--adp-red); font-size: 0.85rem; font-weight: 600; text-decoration: none;">Already initialized? Go to Login</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.css']
})
export class InitAdminComponent {
  constructor(private http: HttpClient, private router: Router) {}

  createAdmin(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const payload = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      role: 'HR_ADMIN'
    };

    this.http.post('${API_BASE}/employees', payload).subscribe({
      next: () => {
        alert("HR Master Admin Created! Check Backend Console for the Setup Token!");
        this.router.navigate(['/login']);
      },
      error: (err) => alert("Initialization Failed or Email Taken. You can check the backend console logs. " + err.message)
    });
  }
}


