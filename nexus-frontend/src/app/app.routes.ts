import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { SetupComponent } from './setup/setup.component';
import { EmployeeComponent } from './employee/employee.component';
import { MainDashboardComponent } from './dashboard/dashboard.component';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { ManagerDashboardComponent } from './dashboard/manager-dashboard.component';
import { PerformanceReportComponent } from './performance/performance-report.component';
import { SuperAdminComponent } from './superadmin/superadmin.component';
import { RecruitmentComponent } from './recruitment/recruitment.component';
import { CareersComponent } from './careers/careers.component';
import { TrackComponent } from './careers/track.component';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { featureGuard } from './guards/feature.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'setup-account', component: SetupComponent },

  // Public careers — no auth
  { path: 'careers', component: CareersComponent },
  { path: 'careers/track', component: TrackComponent },

  // Authenticated area
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: MainDashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['HR_ADMIN'] }
      },
      {
        path: 'my-dashboard',
        component: EmployeeDashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['EMPLOYEE', 'MANAGER'] }
      },
      {
        path: 'manager-dashboard',
        component: ManagerDashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['MANAGER'] }
      },
      {
        path: 'employees',
        component: EmployeeComponent,
        canActivate: [roleGuard],
        data: { roles: ['HR_ADMIN'] }
      },
      {
        path: 'performance',
        component: PerformanceReportComponent,
        canActivate: [roleGuard, featureGuard],
        data: { roles: ['HR_ADMIN', 'MANAGER'], feature: 'performance' }
      },
      {
        path: 'recruitment',
        component: RecruitmentComponent,
        canActivate: [roleGuard, featureGuard],
        data: { roles: ['HR_ADMIN', 'MANAGER'], feature: 'recruitment' }
      },
      {
        path: 'superadmin',
        component: SuperAdminComponent,
        canActivate: [roleGuard],
        data: { roles: ['SUPERADMIN'] }
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
