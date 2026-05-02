import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [HttpClientModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(
    private router: Router, 
    private http: HttpClient,
    private notifService: NotificationService
  ) {}

  login(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    this.http.post('http://localhost:8085/api/auth/login', { email, password }).subscribe({
      next: (user: any) => {
        // Store session tokens and basic info
        localStorage.setItem('adp_role', user.role);
        localStorage.setItem('adp_user', user.firstName + ' ' + user.lastName);
        localStorage.setItem('adp_user_id', user.id.toString());
        
        // Store full user object for instant dashboard hydration
        localStorage.setItem('adp_user_full', JSON.stringify(user));
        
        this.notifService.show(`Welcome back, ${user.firstName}!`, 'success');
        
        if (user.role === 'HR_ADMIN') {
          this.router.navigate(['/dashboard']);
        } else if (user.role === 'MANAGER') {
          this.router.navigate(['/manager-dashboard']);
        } else {
          this.router.navigate(['/my-dashboard']);
        }
      },
      error: (err) => {
        this.notifService.show("Authentication Failed. Invalid email or password.", 'error');
      }
    });
  }
}

