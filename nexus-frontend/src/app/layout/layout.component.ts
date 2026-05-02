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
      <header class="adp-header">
        <div class="logo-section">
          <div class="adp-logo-badge">ADP</div>
          <div class="logo-divider"></div>
          <span class="app-title">Nexus HCM</span>
        </div>
        <nav class="main-nav">
          <a [routerLink]="dashboardLink" routerLinkActive="active">Dashboard</a>
          <a *ngIf="isAdmin" routerLink="/employees" routerLinkActive="active">Employees</a>
          <a *ngIf="isManager" routerLink="/my-dashboard" routerLinkActive="active">My Profile</a>
        </nav>
        <div class="user-section">
          <div class="user-info">
            <div class="avatar">{{ userInitial }}</div>
            <div class="user-details">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </header>

      <main class="main-content">
        <div class="content-limiter">
          <router-outlet></router-outlet>
        </div>
      </main>

      <div class="toast" *ngIf="notification$ | async as note" [class.show]="note.show" [ngClass]="note.type">
        <div class="toast-icon-wrap">
          <span *ngIf="note.type === 'success'">✓</span>
          <span *ngIf="note.type === 'error'">✕</span>
          <span *ngIf="note.type === 'info'">i</span>
        </div>
        <span class="toast-msg">{{ note.message }}</span>
        <button class="toast-close" (click)="hideNotification()">×</button>
      </div>

      <footer class="adp-footer">
        <span>© 2025 ADP ES Tunisie · Nexus HCM Platform</span>
        <div class="footer-links">
          <a>Privacy Policy</a>
          <a>Terms of Service</a>
          <a>HR Support</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; flex-direction: column; min-height: 100vh; background: var(--adp-light-gray); }

    .adp-header {
      background: white;
      border-bottom: 1px solid var(--adp-border);
      padding: 0 2rem;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 8px rgba(0,0,0,0.06);
      position: sticky; top: 0; z-index: 100;
    }

    .logo-section { display: flex; align-items: center; gap: 1rem; }
    .adp-logo-badge { background: var(--adp-red); color: white; font-weight: 900; font-size: 1rem; padding: 0.3rem 0.65rem; border-radius: 6px; letter-spacing: -0.5px; }
    .logo-divider { width: 1px; height: 24px; background: var(--adp-border); }
    .app-title { font-weight: 700; font-size: 1.1rem; color: var(--adp-charcoal); }

    .main-nav { display: flex; gap: 0.25rem; }
    .main-nav a {
      color: var(--adp-dark-gray);
      font-weight: 600;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .main-nav a:hover { color: var(--adp-red); background: var(--adp-red-light); }
    .main-nav a.active { color: var(--adp-red); background: var(--adp-red-light); }

    .user-section { display: flex; align-items: center; gap: 1rem; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { background: linear-gradient(135deg, var(--adp-red), #ff6b6b); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 0.85rem; font-weight: 700; color: var(--adp-charcoal); line-height: 1.2; }
    .user-role { font-size: 0.7rem; color: var(--adp-dark-gray); text-transform: uppercase; letter-spacing: 0.05em; }
    .logout-btn { background: transparent; border: 1.5px solid var(--adp-border); color: var(--adp-dark-gray); padding: 0.4rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
    .logout-btn:hover { border-color: var(--adp-red); color: var(--adp-red); background: var(--adp-red-light); }

    .main-content { flex: 1; padding: 2rem; }
    .content-limiter { max-width: 1280px; margin: 0 auto; }

    .adp-footer { background: var(--adp-charcoal); color: rgba(255,255,255,0.6); padding: 1.25rem 2rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { color: rgba(255,255,255,0.5); cursor: pointer; transition: color 0.2s; }
    .footer-links a:hover { color: white; }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; right: -420px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      padding: 1rem 1.25rem;
      display: flex; align-items: center; gap: 0.75rem;
      min-width: 320px; max-width: 400px;
      z-index: 9999;
      transition: right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      border-left: 4px solid var(--adp-red);
    }
    .toast.show { right: 24px; }
    .toast.success { border-left-color: #16a34a; }
    .toast.error { border-left-color: var(--adp-red); }
    .toast.info { border-left-color: var(--adp-blue); }
    .toast-icon-wrap { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .success .toast-icon-wrap { background: #dcfce7; color: #16a34a; }
    .error .toast-icon-wrap { background: #fee2e2; color: var(--adp-red); }
    .info .toast-icon-wrap { background: #dbeafe; color: var(--adp-blue); }
    .toast-msg { font-size: 0.875rem; font-weight: 500; color: var(--adp-charcoal); flex: 1; }
    .toast-close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #94a3b8; line-height: 1; padding: 0; }
    .toast-close:hover { color: var(--adp-charcoal); }
  `]
})
export class LayoutComponent implements OnInit {
  isAdmin: boolean = false;
  isManager: boolean = false;
  userName: string = 'User';
  userInitial: string = 'U';
  userRole: string = '';
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
    this.userRole = (role || '').replace('_', ' ');
    this.dashboardLink = role === 'MANAGER' ? '/manager-dashboard' : role === 'EMPLOYEE' ? '/my-dashboard' : '/dashboard';
  }

  hideNotification() {
    this.notifService.hide();
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}

