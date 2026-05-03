import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private apiUrl = 'http://localhost:8085/api/performance';

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

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8085/api/departments');
  }
}
