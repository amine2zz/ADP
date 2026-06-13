import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';
import { SystemConfigService } from '../services/system-config.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, HttpClientModule],
  template: `
    <div class="app-layout">
      <header class="adp-header">
        <div class="logo-section">
          <img *ngIf="logoImageUrl" [src]="logoImageUrl" style="height:32px;border-radius:4px;" alt="logo">
          <div *ngIf="!logoImageUrl" class="adp-logo-badge" [style.background]="logoBgColor">{{ logoText }}</div>
          <div class="logo-divider"></div>
          <span class="app-title">{{ companyName }}</span>
          <button class="logo-refresh-btn" [class.spinning]="refreshingConfig"
                  title="Refresh branding & settings" (click)="refreshConfig()">↻</button>
        </div>
        <nav class="main-nav">
          <a [routerLink]="dashboardLink" routerLinkActive="active">Dashboard</a>
          <a *ngIf="isAdmin && feat_employeeMgmt" routerLink="/employees" routerLinkActive="active">Employees</a>
          <a *ngIf="isAdmin && feat_orgChart" routerLink="/org-chart" routerLinkActive="active">Org Chart</a>
          <a *ngIf="(isAdmin || isManager) && feat_performance" routerLink="/performance" routerLinkActive="active">Performance</a>
          <a *ngIf="isAdmin" routerLink="/job-board" routerLinkActive="active">Job Board</a>
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
        <span>© {{ currentYear }} ADP ES Tunisie · {{ companyName }}</span>
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
      background: var(--adp-header-bg, white);
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
    .logo-refresh-btn {
      background: none; border: none; cursor: pointer; padding: 0.2rem;
      font-size: 1rem; line-height: 1; color: var(--adp-dark-gray);
      border-radius: 6px; transition: color 0.2s, background 0.2s;
    }
    .logo-refresh-btn:hover { color: var(--adp-red); background: var(--adp-red-light); }
    .logo-refresh-btn.spinning { animation: logo-spin 0.7s linear infinite; }
    @keyframes logo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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

  currentYear = new Date().getFullYear();

  // Theme
  companyName: string = 'Nexus HCM';
  logoText: string = 'ADP';
  logoBgColor: string = '#D0271D';
  logoImageUrl: string = '';

  // Feature flags
  feat_performance: boolean = true;
  feat_orgChart: boolean = true;
  feat_employeeMgmt: boolean = true;

  refreshingConfig = false;

  constructor(
    private notifService: NotificationService,
    private configSvc: SystemConfigService,
    private http: HttpClient,
    private router: Router
  ) {
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

    // Load + apply latest config (refreshes on every layout init)
    this.configSvc.load(this.http).then(() => this.applyConfig());

    // Keep branding/feature flags in sync automatically as the user
    // navigates between pages, without a full reload.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.configSvc.load(this.http).then(() => this.applyConfig());
    });
  }

  refreshConfig() {
    if (this.refreshingConfig) return;
    this.refreshingConfig = true;
    this.configSvc.load(this.http)
      .then(() => this.applyConfig())
      .finally(() => setTimeout(() => this.refreshingConfig = false, 400));
  }

  private applyConfig() {
    this.companyName  = this.configSvc.get('general.company_name', 'Nexus HCM');
    this.logoText     = this.configSvc.get('theme.logo_text', 'ADP');
    this.logoBgColor  = this.configSvc.get('theme.logo_bg', '#D0271D');
    this.logoImageUrl = this.configSvc.get('theme.logo_image_url', '');

    this.feat_performance  = this.configSvc.isEnabled('performance');
    this.feat_orgChart     = this.configSvc.isEnabled('org_chart');
    this.feat_employeeMgmt = this.configSvc.isEnabled('employee_mgmt');
  }

  hideNotification() {
    this.notifService.hide();
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
