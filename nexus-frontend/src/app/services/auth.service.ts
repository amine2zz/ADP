import { Injectable } from '@angular/core';

export type UserRole = 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'SUPERADMIN' | '';

@Injectable({ providedIn: 'root' })
export class AuthService {

  getRole(): UserRole {
    return (localStorage.getItem('adp_role') ?? '') as UserRole;
  }

  getUserId(): string {
    return localStorage.getItem('adp_id') ?? '';
  }

  getUserName(): string {
    return localStorage.getItem('adp_user') ?? '';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('adp_id');
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.getRole());
  }

  login(employee: { id: number; firstName: string; lastName: string; role: string }) {
    localStorage.setItem('adp_id', String(employee.id));
    localStorage.setItem('adp_user', `${employee.firstName} ${employee.lastName}`);
    localStorage.setItem('adp_role', employee.role);
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
