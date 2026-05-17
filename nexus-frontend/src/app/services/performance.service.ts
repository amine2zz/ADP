import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private apiUrl = `${API_BASE}/performance`;

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/questions`);
  }

  getPendingEvaluations(managerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending/${managerId}`);
  }

  submitEvaluation(evalId: number, responses: any[], isAdmin: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit/${evalId}?isAdmin=${isAdmin}`, responses);
  }

  launchEvaluations(period: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/launch?period=${period}`, {});
  }

  getReports(deptId?: number, period?: string, managerId?: number): Observable<any[]> {
    let params: string[] = [];
    if (deptId) params.push(`deptId=${deptId}`);
    if (period) params.push(`period=${period}`);
    if (managerId) params.push(`managerId=${managerId}`);
    let url = `${this.apiUrl}/reports`;
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.get<any[]>(url);
  }

  getEmployeeHistory(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/employee/${employeeId}`);
  }

  getTeamHistory(managerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/team/${managerId}`);
  }

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/departments`);
  }
}
