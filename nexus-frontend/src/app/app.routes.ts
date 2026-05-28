import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { SetupComponent } from './setup/setup.component';
import { EmployeeComponent } from './employee/employee.component';
import { InitAdminComponent } from './init-admin/init-admin.component';
import { MainDashboardComponent } from './dashboard/dashboard.component';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { ManagerDashboardComponent } from './dashboard/manager-dashboard.component';
import { PerformanceReportComponent } from './performance/performance-report.component';
import { QuickSetupComponent } from './quick-setup/quick-setup.component';
import { OrgChartComponent } from './org-chart/org-chart.component';
import { SuperuserDashboardComponent } from './superuser/superuser-dashboard.component';
import { CareersComponent } from './careers/careers.component';
import { JobBoardComponent } from './job-board/job-board.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'careers', component: CareersComponent },
  { path: 'setup-account', component: SetupComponent },
  { path: 'init-admin', component: InitAdminComponent },
  { path: 'quick-setup', component: QuickSetupComponent },
  { path: 'superuser', component: SuperuserDashboardComponent },
  { path: 'test-runner', redirectTo: 'superuser', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: MainDashboardComponent },
      { path: 'my-dashboard', component: EmployeeDashboardComponent },
      { path: 'manager-dashboard', component: ManagerDashboardComponent },
      { path: 'employees', component: EmployeeComponent },
      { path: 'org-chart', component: OrgChartComponent },
      { path: 'performance', component: PerformanceReportComponent },
      { path: 'job-board', component: JobBoardComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
