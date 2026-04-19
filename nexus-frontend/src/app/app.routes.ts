import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { SetupComponent } from './setup/setup.component';
import { EmployeeComponent } from './employee/employee.component';
import { InitAdminComponent } from './init-admin/init-admin.component';
import { MainDashboardComponent } from './dashboard/dashboard.component';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { ManagerDashboardComponent } from './dashboard/manager-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'setup-account', component: SetupComponent },
  { path: 'init-admin', component: InitAdminComponent },
  { 
    path: '', 
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: MainDashboardComponent },
      { path: 'my-dashboard', component: EmployeeDashboardComponent },
      { path: 'manager-dashboard', component: ManagerDashboardComponent },
      { path: 'employees', component: EmployeeComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
