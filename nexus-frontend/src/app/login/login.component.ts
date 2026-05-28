import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { SystemConfigService } from '../services/system-config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [HttpClientModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  get logoText()  { return this.configSvc.get('theme.logo_text', 'ADP'); }
  get logoBg()    { return this.configSvc.get('theme.logo_bg', '#D0271D'); }
  get logoImgUrl(){ return this.configSvc.get('theme.logo_image_url', ''); }
  get companyName(){ return this.configSvc.get('general.company_name', 'Nexus HCM'); }

  constructor(
    private router: Router,
    private http: HttpClient,
    private notifService: NotificationService,
    private configSvc: SystemConfigService
  ) {}

  login(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    this.http.post('http://localhost:8085/api/auth/login', { email, password }).subscribe({
      next: (user: any) => {
        localStorage.setItem('adp_role', user.role);
        localStorage.setItem('adp_user', user.firstName + ' ' + user.lastName);
        localStorage.setItem('adp_user_id', user.id.toString());
        localStorage.setItem('adp_user_full', JSON.stringify(user));

        this.notifService.show(`Welcome back, ${user.firstName}!`, 'success');

        if (user.role === 'SUPERUSER') {
          this.router.navigate(['/superuser']);
        } else if (user.role === 'HR_ADMIN') {
          this.router.navigate(['/dashboard']);
        } else if (user.role === 'MANAGER') {
          this.router.navigate(['/manager-dashboard']);
        } else {
          this.router.navigate(['/my-dashboard']);
        }
      },
      error: () => {
        this.notifService.show("Authentication Failed. Invalid email or password.", 'error');
      }
    });
  }
}
