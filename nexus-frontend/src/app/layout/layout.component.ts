import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-layout">
      <!-- Enterprise Header -->
      <header class="adp-header">
        <div class="logo-section">
          <div class="adp-logo-css">ADP</div>
          <span class="app-title">Nexus HCM</span>
        </div>
        <nav class="main-nav">
          <ul>
            <li><a [routerLink]="dashboardLink" routerLinkActive="active">Dashboard</a></li>
            <li *ngIf="isAdmin"><a routerLink="/employees" routerLinkActive="active">Employees</a></li>
            <li *ngIf="isManager"><a routerLink="/my-dashboard" routerLinkActive="active">My Profile</a></li>
          </ul>
        </nav>
        <div class="user-actions">
          <div class="user-profile">
            <span class="user-name">{{ userName }}</span>
            <div class="avatar">{{ userInitial }}</div>
            <button class="logout-btn" (click)="logout()">Sign Out</button>
          </div>
        </div>
      </header>

      <!-- Main Body -->
      <main class="main-content">
        <div class="content-limiter">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Toast Notification -->
      <div class="notification-toast" *ngIf="notification$ | async as note" [class.show]="note.show" [ngClass]="note.type">
        <div class="toast-content">
          <span class="toast-icon">
            <i *ngIf="note.type === 'success'">✓</i>
            <i *ngIf="note.type === 'error'">!</i>
            <i *ngIf="note.type === 'info'">i</i>
          </span>
          <span class="toast-message">{{ note.message }}</span>
          <button class="toast-close" (click)="hideNotification()">×</button>
        </div>
      </div>

      <!-- Footer -->
      <footer class="adp-footer">
        <div class="footer-limiter">
          <p>&copy; 2026 Automatic Data Processing, Inc. | Nexus HCM Platform</p>
          <div class="footer-links">
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
            <a>HR Support Desk</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; flex-direction: column; min-height: 100vh; background: var(--adp-light-gray); }
    .adp-header { background-color: var(--adp-white); border-bottom: 3px solid var(--adp-red); padding: 0 2rem; height: 70px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 10px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100; }
    .logo-section { display: flex; align-items: center; gap: 1.5rem; }
    .adp-logo-css { background-color: var(--adp-red); color: white; font-weight: 900; font-size: 1.2rem; padding: 0.2rem 0.6rem; border-radius: 2px; letter-spacing: -1px; }
    .app-title { font-weight: 700; font-size: 1.3rem; color: var(--adp-charcoal); border-left: 2px solid var(--adp-border); padding-left: 1.5rem; }
    .main-nav ul { display: flex; list-style: none; gap: 2.5rem; margin: 0;}
    .main-nav a { color: var(--adp-dark-gray); font-weight: 600; text-transform: uppercase; font-size: 0.85rem; padding: 1.5rem 0; text-decoration: none; border-bottom: 3px solid transparent; transition: 0.2s;}
    .main-nav a:hover, .main-nav a.active { color: var(--adp-red); border-bottom-color: var(--adp-red); }
    .user-profile { display: flex; align-items: center; gap: 1rem; }
    .user-name { font-size: 0.9rem; font-weight: 600; }
    .avatar { background-color: var(--adp-dark-gray); color: white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .logout-btn { margin-left: 1rem; background: transparent; border: 1.5px solid var(--adp-red); color: var(--adp-red); padding: 0.4rem 1rem; border-radius: 4px; font-weight: 600; cursor: pointer; }
    .logout-btn:hover { background: var(--adp-red); color: white; }
    .main-content { flex: 1; display: flex; justify-content: center; padding: 2rem; }
    .content-limiter { width: 100%; max-width: 1280px; }
    .adp-footer { background-color: var(--adp-charcoal); color: white; padding: 1.5rem 2rem; font-size: 0.85rem; }
    .footer-limiter { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
    .footer-links { display: flex; gap: 1.5rem; }
    
    /* Notification Toast Styles */
    .notification-toast { position: fixed; top: 20px; right: -400px; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 1000; background: white; transition: right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border-left: 5px solid var(--adp-red); min-width: 300px;}
    .notification-toast.show { right: 20px; }
    .notification-toast.success { border-left-color: #137333; }
    .notification-toast.error { border-left-color: var(--adp-red); }
    .notification-toast.info { border-left-color: #1967D2; }
    .toast-content { display: flex; align-items: center; gap: 1rem; }
    .toast-icon { font-style: normal; font-weight: bold; font-size: 1.2rem; }
    .success .toast-icon { color: #137333; }
    .error .toast-icon { color: var(--adp-red); }
    .info .toast-icon { color: #1967D2; }
    .toast-message { font-size: 0.9rem; color: var(--adp-charcoal); font-weight: 500; }
    .toast-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--adp-dark-gray); margin-left: auto; }
  `]
})
export class LayoutComponent implements OnInit {
  isAdmin: boolean = false;
  isManager: boolean = false;
  userName: string = 'User';
  userInitial: string = 'U';
  dashboardLink: string = '/dashboard';
  notification$;

  constructor(private notifService: NotificationService) {
    this.notification$ = this.notifService.notification$;
  }

  ngOnInit() {
    const role = localStorage.getItem('adp_role');
    this.isAdmin = role === 'HR_ADMIN';
    this.isManager = role === 'MANAGER';
    this.userName = localStorage.getItem('adp_user') || 'User';
    this.userInitial = this.userName.charAt(0).toUpperCase();

    if (role === 'EMPLOYEE' || role === 'MANAGER') {
       // Note: For managers, dashboardLink points to Manager Console, but they have a separate "My Profile" link
       this.dashboardLink = role === 'MANAGER' ? '/manager-dashboard' : '/my-dashboard';
    } else {
       this.dashboardLink = '/dashboard';
    }
  }

  hideNotification() {
    this.notifService.hide();
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}

