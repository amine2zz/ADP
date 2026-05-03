import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PerformanceService } from '../services/performance.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-performance-report',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="performance-container">
      <header class="header">
        <h1>Performance & Activity Report</h1>
        <p>Monitor employee ratings and worked hours</p>
      </header>

      <div class="tabs" *ngIf="userRole === 'HR_ADMIN'">
        <button [class.active]="activeTab === 'reports'" (click)="activeTab = 'reports'">
          Performance Reports
        </button>
        <button [class.active]="activeTab === 'launch'" (click)="activeTab = 'launch'">
          Launch Monthly Survey
        </button>
      </div>

      <!-- Tab Content: Reports -->
      <div *ngIf="activeTab === 'reports'" class="tab-content">
        <div class="filters">
          <div class="filter-group">
            <label>Period</label>
            <div style="display: flex; gap: 1rem; align-items: center; position: relative;">
              <button class="btn btn-sm btn-outline" (click)="changePeriod(-1)">←</button>
              <div style="position: relative; display: flex; align-items: center; justify-content: center; min-width: 140px;">
                <span class="period-display">{{ formatDisplayPeriod(filterPeriod) }}</span>
                <input type="month" class="period-display-input hidden-input" [(ngModel)]="filterPeriod" (change)="loadReports()">
              </div>
              <button class="btn btn-sm btn-outline" (click)="changePeriod(1)">→</button>
            </div>
          </div>
          <div class="filter-group" *ngIf="userRole === 'HR_ADMIN'">
            <label>Department</label>
            <select [(ngModel)]="filterDept" (change)="loadReports()">
              <option [value]="undefined">All Departments</option>
              <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Period</th>
                <th>Avg. Rating</th>
                <th (click)="sortReports('workedHours')" style="cursor: pointer">
                  Worked Hours ↕
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let report of reports">
                <td>{{ report.employeeName }}</td>
                <td>{{ report.departmentName }}</td>
                <td>{{ report.period }}</td>
                <td>
                  <div class="rating-cell">
                    <span [class]="getRatingClass(report.averageRating)">{{ report.averageRating || 'N/A' }}</span>
                    <div class="stars" *ngIf="report.averageRating">
                      <i class="star" *ngFor="let s of [1,2,3,4,5]" [class.filled]="report.averageRating >= s">★</i>
                    </div>
                  </div>
                </td>
                <td><strong>{{ report.totalWorkedHours }}h</strong></td>
                <td>
                  <span class="badge" [class.badge-completed]="report.status === 'COMPLETED'" 
                        [class.badge-pending]="report.status === 'PENDING'">
                    {{ report.status }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline" (click)="viewDetails(report)">View Details</button>
                  <button class="btn btn-sm btn-primary" style="margin-left: 0.5rem" 
                          *ngIf="userRole === 'MANAGER' && report.status !== 'COMPLETED'" 
                          (click)="startEvaluation(report)">
                    Evaluate
                  </button>
                  <button class="btn btn-sm btn-primary" style="margin-left: 0.5rem" 
                          *ngIf="userRole === 'HR_ADMIN'" 
                          (click)="editEvaluation(report)">
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="reports.length === 0" class="empty-state">
            No employees found for the selected criteria.
          </div>
        </div>
      </div>

      <!-- Tab Content: Launch -->
      <div *ngIf="activeTab === 'launch'" class="tab-content">
        <div class="card launch-card">
          <h2>Launch New Monthly Evaluation</h2>
          <p>This will generate pending evaluations for all employees to be completed by their managers.</p>
          <div class="launch-form">
            <div class="input-group">
              <label>Target Period</label>
              <input type="month" [(ngModel)]="launchPeriod">
            </div>
            <button class="btn btn-hero" (click)="launchMonthly()">Initialize Survey</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Evaluation Modal -->
    <div class="modal" *ngIf="activeEvaluation" (click)="activeEvaluation = null">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <header>
          <h2>Evaluate {{ activeEvaluation.employee.firstName }} {{ activeEvaluation.employee.lastName }}</h2>
          <button (click)="activeEvaluation = null" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </header>
        <span class="badge badge-pending" style="margin-bottom: 1.5rem; display: inline-block;">Period: {{ activeEvaluation.period }}</span>
        
        <div class="survey-form">
          <div class="question-row" *ngFor="let q of questions">
            <label>{{ q.text.replace('(employee name)', activeEvaluation.employee.firstName) }}</label>
            <div class="rating-options">
              <label *ngFor="let r of ratingOptions" class="rating-btn">
                <input type="radio" [name]="'q_' + activeEvaluation.id + '_' + q.id" [value]="r.value" 
                       (change)="setRating(activeEvaluation.id, q.id, r.value)">
                <span>{{ r.label }}</span>
              </label>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" (click)="submitEvaluation(activeEvaluation)">Submit Evaluation</button>
        </div>
      </div>
    </div>

    <!-- Modal for details -->
    <div class="modal" *ngIf="selectedReport" (click)="selectedReport = null">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <header>
          <h2>Report Details: {{ selectedReport.employeeName }}</h2>
          <button (click)="selectedReport = null">&times;</button>
        </header>
        <div class="details-grid">
            <div class="detail-item">
                <label>Period</label>
                <span>{{ selectedReport.period }}</span>
            </div>
            <div class="detail-item">
                <label>Worked Hours</label>
                <span>{{ selectedReport.totalWorkedHours }} hours</span>
            </div>
            <div class="detail-item">
                <label>Average Rating</label>
                <span>{{ selectedReport.averageRating }} / 5.0</span>
            </div>
        </div>
        <div class="responses-list">
            <h3>Survey Responses</h3>
            <div class="response-card" *ngFor="let res of selectedReport.responses">
                <p>{{ res.questionText }}</p>
                <div class="rating-display">
                    <span class="rating-label">{{ res.rating }}</span>
                    <span class="rating-val">({{ res.ratingValue }}/5)</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .performance-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2.25rem;
      font-weight: 800;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }

    .header p {
      color: #64748b;
      font-size: 1.1rem;
    }

    .tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .tabs button {
      padding: 0.75rem 1.5rem;
      border: none;
      background: none;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .tabs button.active {
      background: #f1f5f9;
      color: #2563eb;
    }

    .card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid #f1f5f9;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .survey-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .question-row label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 500;
    }

    .rating-options {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .rating-btn {
      position: relative;
      cursor: pointer;
    }

    .rating-btn input {
      position: absolute;
      opacity: 0;
    }

    .rating-btn span {
      display: inline-block;
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 2rem;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .rating-btn input:checked + span {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .filters {
      display: flex;
      gap: 2rem;
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      align-items: center;
    }

    .period-display {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
      pointer-events: none;
    }

    .period-display-input.hidden-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .filter-group input, .filter-group select {
      padding: 0.5rem;
      border-radius: 0.4rem;
      border: 1px solid #cbd5e1;
    }

    .table-container {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .report-table th {
      background: #f8fafc;
      padding: 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .report-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-pending { background: #fef9c3; color: #854d0e; }
    .badge-completed { background: #dcfce7; color: #166534; }

    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }

    .btn-hero {
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: white;
        font-size: 1.1rem;
        padding: 1rem 2rem;
    }

    .rating-cell {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .stars { color: #e2e8f0; }
    .star.filled { color: #f59e0b; }

    .modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 1.5rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-content header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 1rem;
        margin-bottom: 2rem;
    }

    .detail-item label {
        display: block;
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
    }

    .detail-item span {
        font-weight: 700;
        font-size: 1.1rem;
    }

    .response-card {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
    }

    .rating-display {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
    }

    .rating-label { font-weight: 600; color: #2563eb; }
  `]
})
export class PerformanceReportComponent implements OnInit {
  activeTab: string = 'reports';
  userRole: string = '';
  currentUser: any = null;

  questions: any[] = [];
  pendingEvaluations: any[] = [];
  reports: any[] = [];
  departments: any[] = [];
  
  ratingOptions = [
    { label: 'Strongly Disagree', value: 'STRONGLY_DISAGREE' },
    { label: 'Disagree', value: 'DISAGREE' },
    { label: 'Neutral', value: 'NEUTRAL' },
    { label: 'Agree', value: 'AGREE' },
    { label: 'Strongly Agree', value: 'STRONGLY_AGREE' }
  ];

  // Filters
  filterPeriod: string = new Date().toISOString().substring(0, 7);
  filterDept: number | undefined;
  launchPeriod: string = new Date().toISOString().substring(0, 7);

  changePeriod(offset: number) {
    const date = new Date(this.filterPeriod + '-01');
    date.setMonth(date.getMonth() + offset);
    this.filterPeriod = date.toISOString().substring(0, 7);
    this.loadReports();
  }

  formatDisplayPeriod(period: string): string {
    if (!period) return '';
    const date = new Date(period + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  selectedReport: any = null;
  activeEvaluation: any = null;
  evaluationResponses: Map<number, Map<number, string>> = new Map();

  constructor(
    private perfService: PerformanceService,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    // Read directly from adp_role which is guaranteed to be set by login
    const role = localStorage.getItem('adp_role');
    this.userRole = (role || '').toUpperCase().trim();
    
    // Fallback to HR_ADMIN if empty (for testing) or keep it if you want strictness.
    // Given the user expects MANAGER features, let's ensure it reads correctly.
    const userId = localStorage.getItem('adp_user_id');
    this.currentUser = { id: Number(userId) };

    const userStr = localStorage.getItem('adp_user_full');
    if (userStr) {
      try {
         this.currentUser = JSON.parse(userStr);
         if (!this.userRole && this.currentUser.role) {
             this.userRole = this.currentUser.role.toUpperCase().trim();
         }
      } catch (e) {}
    }

    if (this.userRole === 'MANAGER') this.activeTab = 'reports';

    this.loadInitialData();
  }

  loadInitialData() {
    this.perfService.getQuestions().subscribe(q => this.questions = q);
    
    if (this.userRole === 'MANAGER') {
      this.perfService.getPendingEvaluations(this.currentUser.id).subscribe(ev => {
        this.pendingEvaluations = ev;
      });
    }

    this.loadReports();
    this.perfService.getDepartments().subscribe(d => this.departments = d);
  }

  loadReports() {
    const managerId = this.userRole === 'MANAGER' ? this.currentUser.id : undefined;
    this.perfService.getReports(this.filterDept, this.filterPeriod, managerId).subscribe(r => {
      this.reports = r;
      // Sort by hours by default (descending)
      this.sortReports('workedHours');
    });
  }

  sortDirection: boolean = true;
  sortReports(column: string) {
    this.sortDirection = !this.sortDirection;
    this.reports.sort((a, b) => {
      if (column === 'workedHours') {
        return this.sortDirection ? b.totalWorkedHours - a.totalWorkedHours : a.totalWorkedHours - b.totalWorkedHours;
      }
      return 0;
    });
  }

  startEvaluation(report: any) {
    // If it's a virtual report (no evaluationId), we create it first
    if (!report.evaluationId) {
      this.perfService.launchEvaluations(report.period).subscribe(() => {
        // After launching, we find the real evaluationId
        this.perfService.getPendingEvaluations(this.currentUser.id).subscribe(evs => {
          const realEval = evs.find(e => e.employee.id === report.employeeId);
          if (realEval) this.openSurvey(realEval);
        });
      });
    } else {
      // It's already a real evaluation
      this.openSurvey({
        id: report.evaluationId,
        employee: { firstName: report.employeeName.split(' ')[0], lastName: report.employeeName.split(' ')[1] },
        period: report.period
      });
    }
  }

  private openSurvey(evalObj: any) {
    this.activeEvaluation = evalObj;
  }

  setRating(evalId: number, questionId: number, rating: string) {
    if (!this.evaluationResponses.has(evalId)) {
      this.evaluationResponses.set(evalId, new Map());
    }
    this.evaluationResponses.get(evalId)!.set(questionId, rating);
  }

  submitEvaluation(evaluation: any) {
    const responsesMap = this.evaluationResponses.get(evaluation.id);
    if (!responsesMap || responsesMap.size < this.questions.length) {
      this.notifService.show('Please answer all questions', 'error');
      return;
    }

    const payload = Array.from(responsesMap.entries()).map(([qId, rating]) => ({
      question: { id: qId },
      rating: rating
    }));

    const isAdmin = this.userRole === 'HR_ADMIN';
    this.perfService.submitEvaluation(evaluation.id, payload, isAdmin).subscribe(() => {
      this.notifService.show('Evaluation submitted successfully', 'success');
      this.pendingEvaluations = this.pendingEvaluations.filter(e => e.id !== evaluation.id);
      this.activeEvaluation = null;
      this.loadReports();
    });
  }

  launchMonthly() {
    if (!this.launchPeriod) {
      this.notifService.show('Please select a period', 'error');
      return;
    }
    this.perfService.launchEvaluations(this.launchPeriod).subscribe(res => {
      this.notifService.show(`Launched ${res.length} evaluations`, 'success');
      this.loadReports();
    });
  }

  getRatingClass(val: number): string {
    if (!val) return '';
    if (val >= 4) return 'text-success';
    if (val >= 3) return 'text-warning';
    return 'text-danger';
  }

  viewDetails(report: any) {
    this.selectedReport = report;
  }

  editEvaluation(report: any) {
    // We reuse the pending evaluation logic but for a completed one
    // Map report data back to a 'pseudo' evaluation object
    const pseudoEval = {
      id: report.evaluationId || this.findEvalId(report), 
      employee: { firstName: report.employeeName.split(' ')[0], lastName: report.employeeName.split(' ')[1] },
      period: report.period
    };
    
    // Switch to evaluations modal and populate it
    this.activeEvaluation = pseudoEval;
    
    // Pre-fill existing ratings
    if (report.responses) {
      report.responses.forEach((res: any) => {
        const qId = this.questions.find(q => q.text === res.questionText)?.id;
        if (qId) this.setRating(pseudoEval.id, qId, res.rating);
      });
    }
  }

  private findEvalId(report: any): number {
    // This is a fallback if evaluationId is not in DTO
    return 0; // Should be handled by DTO
  }
}
