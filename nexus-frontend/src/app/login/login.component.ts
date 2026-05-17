import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { API_BASE } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(
    private router: Router,
    private http: HttpClient,
    private notifService: NotificationService,
    private auth: AuthService
  ) {}

  login(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    this.http.post<any>(`${API_BASE}/auth/login`, { email, password }).subscribe({
      next: (user) => {
        this.auth.login(user);
        localStorage.setItem('adp_user_full', JSON.stringify(user));
        this.notifService.show(`Welcome back, ${user.firstName}!`, 'success');

        if (user.role === 'SUPERADMIN') {
          this.router.navigate(['/superadmin']);
        } else if (user.role === 'HR_ADMIN') {
          this.router.navigate(['/dashboard']);
        } else if (user.role === 'MANAGER') {
          this.router.navigate(['/manager-dashboard']);
        } else {
          this.router.navigate(['/my-dashboard']);
        }
      },
      error: () => {
        this.notifService.show('Authentication Failed. Invalid email or password.', 'error');
      }
    });
  }
}

