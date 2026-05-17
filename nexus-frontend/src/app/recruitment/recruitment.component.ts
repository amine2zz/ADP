import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../services/api.service';
import { NotificationService } from '../services/notification.service';

interface JobOffer {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  pipelineSteps: PipelineStep[];
}

interface PipelineStep {
  id: number;
  stepType: string;
  stepLabel: string;
  stepOrder: number;
  assignedManager: { id: number; firstName: string; lastName: string } | null;
}

interface Application {
  id: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  status: string;
  currentStepIndex: number;
  submittedAt: string;
  stepResults: StepResult[];
  jobOffer: { id: number; title: string };
}

interface StepResult {
  stepIndex: number;
  stepLabel: string;
  result: string;
  notes: string;
  evaluatedAt: string;
}

interface Employee { id: number; firstName: string; lastName: string; role: string; }

const STEP_TYPES = [
  { value: 'hr_interview', label: 'HR Interview' },
  { value: 'manager_interview', label: 'Manager Interview' },
  { value: 'technical_test', label: 'Technical Test' },
  { value: 'document_review', label: 'Document Review' },
  { value: 'custom', label: 'Custom Step' }
];

@Component({
  selector: 'app-recruitment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rec-wrap">
      <div class="rec-header">
        <h1>Recruitment</h1>
        <button class="btn-primary" (click)="openCreateOffer()">+ New Job Offer</button>
      </div>

      <div class="rec-tabs">
        <button [class.active]="view === 'offers'" (click)="view = 'offers'">Job Offers</button>
        <button [class.active]="view === 'applications'" (click)="view = 'applications'; loadAllApplications()">All Applications</button>
      </div>

      <!-- JOB OFFERS VIEW -->
      <div *ngIf="view === 'offers'">
        <div *ngIf="offers.length === 0" class="empty">No job offers yet.</div>
        <div class="offer-cards">
          <div *ngFor="let o of offers" class="offer-card">
            <div class="offer-top">
              <div>
                <h3>{{ o.title }}</h3>
                <span class="meta">{{ o.department }} · {{ o.location }}</span>
              </div>
              <span class="status-badge" [class]="'s-' + o.status.toLowerCase()">{{ o.status }}</span>
            </div>
            <p class="desc">{{ o.description | slice:0:120 }}{{ o.description?.length > 120 ? '…' : '' }}</p>
            <div class="offer-steps">
              <span *ngFor="let s of o.pipelineSteps; let i = index" class="step-chip">{{ i + 1 }}. {{ s.stepLabel || s.stepType }}</span>
              <span *ngIf="!o.pipelineSteps || o.pipelineSteps.length === 0" class="no-steps">No pipeline steps</span>
            </div>
            <div class="offer-actions">
              <button class="btn-sm" (click)="openPipeline(o)">Edit Pipeline</button>
              <button class="btn-sm" (click)="viewApplications(o)">Applications ({{ getAppCount(o.id) }})</button>
              <button *ngIf="o.status === 'DRAFT'" class="btn-sm btn-publish" (click)="publish(o)">Publish</button>
              <button *ngIf="o.status === 'PUBLISHED'" class="btn-sm btn-close" (click)="close(o)">Close</button>
              <button class="btn-sm btn-edit" (click)="editOffer(o)">Edit</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ALL APPLICATIONS VIEW -->
      <div *ngIf="view === 'applications'">
        <table class="app-table">
          <thead><tr><th>Applicant</th><th>Position</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of allApplications">
              <td>
                <div class="applicant-name">{{ a.applicantName }}</div>
                <div class="applicant-email">{{ a.applicantEmail }}</div>
              </td>
              <td>{{ a.jobOffer?.title }}</td>
              <td><span class="status-badge" [class]="'s-' + a.status.toLowerCase()">{{ a.status }}</span></td>
              <td>{{ a.submittedAt | date:'dd MMM yyyy' }}</td>
              <td>
                <button class="btn-sm" (click)="openApplicationDetail(a)">Review</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CREATE / EDIT OFFER MODAL -->
      <div *ngIf="showOfferModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ editingOffer ? 'Edit' : 'New' }} Job Offer</h2>
          <div class="form-grid">
            <label>Title <input [(ngModel)]="offerForm.title" placeholder="e.g. Frontend Engineer" /></label>
            <label>Department <input [(ngModel)]="offerForm.department" placeholder="e.g. Engineering" /></label>
            <label>Location <input [(ngModel)]="offerForm.location" placeholder="e.g. Tunis, Tunisia" /></label>
            <label class="full">Description
              <textarea [(ngModel)]="offerForm.description" rows="4" placeholder="Describe the role..."></textarea>
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveOffer()">{{ editingOffer ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>

      <!-- PIPELINE EDITOR MODAL -->
      <div *ngIf="showPipelineModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <h2>Pipeline — {{ selectedOffer?.title }}</h2>
          <div class="pipeline-steps">
            <div *ngFor="let s of pipelineSteps; let i = index" class="pipeline-step">
              <span class="step-num">{{ i + 1 }}</span>
              <div class="step-info">
                <strong>{{ s.stepLabel || s.stepType }}</strong>
                <span *ngIf="s.assignedManager">→ {{ s.assignedManager.firstName }} {{ s.assignedManager.lastName }}</span>
              </div>
              <button class="btn-sm btn-del" (click)="deleteStep(s)">✕</button>
            </div>
            <div *ngIf="pipelineSteps.length === 0" class="empty">No steps yet. Add one below.</div>
          </div>
          <div class="add-step-form">
            <h4>Add Step</h4>
            <div class="form-row">
              <select [(ngModel)]="newStep.stepType">
                <option *ngFor="let t of stepTypes" [value]="t.value">{{ t.label }}</option>
              </select>
              <input [(ngModel)]="newStep.stepLabel" placeholder="Custom label (optional)" />
              <select [(ngModel)]="newStep.assignedManagerId">
                <option value="">No manager assigned</option>
                <option *ngFor="let m of managers" [value]="m.id">{{ m.firstName }} {{ m.lastName }}</option>
              </select>
              <button class="btn-primary" (click)="addStep()">Add</button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- APPLICATIONS FOR OFFER MODAL -->
      <div *ngIf="showAppsModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <h2>Applications — {{ selectedOffer?.title }}</h2>
          <table class="app-table">
            <thead><tr><th>Applicant</th><th>Email</th><th>Status</th><th>Step</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let a of offerApplications">
                <td>{{ a.applicantName }}</td>
                <td>{{ a.applicantEmail }}</td>
                <td><span class="status-badge" [class]="'s-' + a.status.toLowerCase()">{{ a.status }}</span></td>
                <td>{{ a.currentStepIndex + 1 }} / {{ selectedOffer?.pipelineSteps?.length || '?' }}</td>
                <td>
                  <button class="btn-sm" (click)="openApplicationDetail(a)">Review</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- APPLICATION DETAIL MODAL -->
      <div *ngIf="showDetailModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <h2>Application — {{ selectedApp?.applicantName }}</h2>
          <div class="app-details" *ngIf="selectedApp">
            <div class="detail-row"><span>Email</span><strong>{{ selectedApp.applicantEmail }}</strong></div>
            <div class="detail-row"><span>Phone</span><strong>{{ selectedApp.applicantPhone }}</strong></div>
            <div class="detail-row"><span>Status</span><span class="status-badge" [class]="'s-' + selectedApp.status.toLowerCase()">{{ selectedApp.status }}</span></div>
          </div>

          <h4 style="margin-top:1.25rem">Step History</h4>
          <div *ngFor="let r of selectedApp?.stepResults" class="step-result">
            <span class="sr-label">{{ r.stepLabel }}</span>
            <span class="sr-result" [class]="'r-' + r.result.toLowerCase()">{{ r.result }}</span>
            <span class="sr-notes">{{ r.notes }}</span>
          </div>
          <div *ngIf="!selectedApp?.stepResults?.length" class="empty">No steps evaluated yet.</div>

          <!-- Advance step -->
          <div *ngIf="selectedApp?.status === 'PENDING' || selectedApp?.status === 'IN_PROGRESS'" class="advance-form">
            <h4>Evaluate Current Step</h4>
            <div class="form-row">
              <select [(ngModel)]="advanceResult"><option value="PASS">Pass</option><option value="FAIL">Fail</option></select>
              <input [(ngModel)]="advanceNotes" placeholder="Notes (optional)" />
              <button class="btn-primary" (click)="advanceStep()">Submit</button>
            </div>
          </div>

          <!-- Hire button -->
          <div *ngIf="canHire()" class="hire-section">
            <h4>Convert to Employee</h4>
            <p>This applicant passed all pipeline steps. You can now hire them.</p>
            <div class="form-grid">
              <label>Job Title <input [(ngModel)]="hireForm.jobTitle" /></label>
              <label>Department ID <input type="number" [(ngModel)]="hireForm.departmentId" /></label>
            </div>
            <button class="btn-hire" (click)="hire()">Hire & Create Employee Account</button>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rec-wrap { max-width: 1100px; margin: 0 auto; }
    .rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .rec-header h1 { margin: 0; font-size: 1.5rem; color: #1e293b; }

    .rec-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    .rec-tabs button { background: none; border: none; padding: 0.5rem 1.25rem; font-weight: 600; font-size: 0.85rem; color: #64748b; cursor: pointer; }
    .rec-tabs button.active { color: var(--adp-red, #cc0000); border-bottom: 2px solid var(--adp-red, #cc0000); margin-bottom: -2px; }

    .offer-cards { display: flex; flex-direction: column; gap: 1rem; }
    .offer-card { background: white; border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .offer-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .offer-top h3 { margin: 0; font-size: 1rem; color: #1e293b; }
    .meta { font-size: 0.8rem; color: #64748b; }
    .desc { font-size: 0.875rem; color: #475569; margin: 0.5rem 0; }

    .offer-steps { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.75rem 0; }
    .step-chip { background: #f1f5f9; color: #475569; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 99px; }
    .no-steps { color: #94a3b8; font-size: 0.8rem; font-style: italic; }

    .offer-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }

    .status-badge { padding: 0.2rem 0.65rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .s-draft { background: #f1f5f9; color: #475569; }
    .s-published { background: #dcfce7; color: #15803d; }
    .s-closed { background: #fee2e2; color: #dc2626; }
    .s-pending { background: #fef9c3; color: #a16207; }
    .s-in_progress { background: #dbeafe; color: #1d4ed8; }
    .s-hired { background: #dcfce7; color: #15803d; }
    .s-rejected { background: #fee2e2; color: #dc2626; }

    .btn-sm { background: #f1f5f9; border: 1px solid #e2e8f0; color: #374151; padding: 0.3rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .btn-sm:hover { background: #e2e8f0; }
    .btn-publish { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
    .btn-close { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
    .btn-edit { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
    .btn-del { background: #fee2e2; color: #dc2626; border: none; }
    .btn-primary { background: var(--adp-red, #cc0000); color: white; border: none; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
    .btn-cancel { background: #f1f5f9; color: #374151; border: 1px solid #e2e8f0; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
    .btn-hire { background: #15803d; color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 0.75rem; }

    .app-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .app-table th { padding: 0.75rem 1rem; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 0.78rem; text-transform: uppercase; color: #64748b; }
    .app-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .applicant-name { font-weight: 600; color: #1e293b; }
    .applicant-email { font-size: 0.8rem; color: #64748b; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: white; border-radius: 16px; padding: 2rem; width: 560px; max-width: 95vw; max-height: 85vh; overflow-y: auto; }
    .modal-wide { width: 780px; }
    .modal h2 { margin: 0 0 1.25rem; font-size: 1.1rem; color: #1e293b; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-grid label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: #374151; }
    .form-grid .full { grid-column: 1 / -1; }
    .form-grid input, .form-grid textarea, .form-grid select { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
    .form-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .form-row input, .form-row select { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; flex: 1; }

    .pipeline-steps { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .pipeline-step { display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; }
    .step-num { background: #1e293b; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .step-info { flex: 1; }
    .step-info strong { display: block; font-size: 0.875rem; color: #1e293b; }
    .step-info span { font-size: 0.78rem; color: #64748b; }
    .add-step-form { border-top: 1px solid #e2e8f0; padding-top: 1rem; }
    .add-step-form h4 { margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151; }

    .app-details { display: flex; flex-direction: column; gap: 0.5rem; }
    .detail-row { display: flex; gap: 1rem; align-items: center; font-size: 0.875rem; }
    .detail-row span:first-child { width: 80px; color: #64748b; font-size: 0.8rem; }

    .step-result { display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; }
    .sr-label { font-weight: 600; flex: 1; color: #1e293b; }
    .sr-result { padding: 0.15rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .r-pass { background: #dcfce7; color: #15803d; }
    .r-fail { background: #fee2e2; color: #dc2626; }
    .r-pending { background: #f1f5f9; color: #64748b; }
    .sr-notes { color: #94a3b8; font-size: 0.8rem; flex: 1; }

    .advance-form, .hire-section { border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1rem; }
    .advance-form h4, .hire-section h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }

    .empty { color: #94a3b8; font-style: italic; font-size: 0.875rem; padding: 0.5rem 0; }
  `]
})
export class RecruitmentComponent implements OnInit {
  view: 'offers' | 'applications' = 'offers';
  offers: JobOffer[] = [];
  allApplications: Application[] = [];
  offerApplications: Application[] = [];
  appCountMap: Record<number, number> = {};
  managers: Employee[] = [];
  pipelineSteps: PipelineStep[] = [];
  stepTypes = STEP_TYPES;

  showOfferModal = false;
  showPipelineModal = false;
  showAppsModal = false;
  showDetailModal = false;

  editingOffer: JobOffer | null = null;
  selectedOffer: JobOffer | null = null;
  selectedApp: Application | null = null;

  offerForm = { title: '', description: '', department: '', location: '' };
  newStep: any = { stepType: 'hr_interview', stepLabel: '', assignedManagerId: '' };
  advanceResult = 'PASS';
  advanceNotes = '';
  hireForm = { jobTitle: '', departmentId: '' };

  constructor(private http: HttpClient, private notif: NotificationService) {}

  ngOnInit() {
    this.loadOffers();
    this.loadManagers();
  }

  loadOffers() {
    this.http.get<JobOffer[]>(`${API_BASE}/recruitment/offers`).subscribe(data => {
      this.offers = data;
      this.loadApplicationCounts();
    });
  }

  loadManagers() {
    this.http.get<Employee[]>(`${API_BASE}/employees/managers`).subscribe(d => this.managers = d);
  }

  loadApplicationCounts() {
    this.http.get<Application[]>(`${API_BASE}/recruitment/applications`).subscribe(apps => {
      this.appCountMap = {};
      apps.forEach(a => {
        const id = a.jobOffer?.id;
        if (id) this.appCountMap[id] = (this.appCountMap[id] ?? 0) + 1;
      });
    });
  }

  loadAllApplications() {
    this.http.get<Application[]>(`${API_BASE}/recruitment/applications`).subscribe(d => this.allApplications = d);
  }

  getAppCount(offerId: number): number {
    return this.appCountMap[offerId] ?? 0;
  }

  openCreateOffer() {
    this.editingOffer = null;
    this.offerForm = { title: '', description: '', department: '', location: '' };
    this.showOfferModal = true;
  }

  editOffer(o: JobOffer) {
    this.editingOffer = o;
    this.offerForm = { title: o.title, description: o.description, department: o.department, location: o.location };
    this.showOfferModal = true;
  }

  saveOffer() {
    if (!this.offerForm.title) { this.notif.show('Title is required', 'error'); return; }
    const obs = this.editingOffer
      ? this.http.put<JobOffer>(`${API_BASE}/recruitment/offers/${this.editingOffer.id}`, this.offerForm)
      : this.http.post<JobOffer>(`${API_BASE}/recruitment/offers`, this.offerForm);
    obs.subscribe({
      next: () => { this.notif.show('Offer saved', 'success'); this.closeModal(); this.loadOffers(); },
      error: () => this.notif.show('Save failed', 'error')
    });
  }

  publish(o: JobOffer) {
    this.http.post(`${API_BASE}/recruitment/offers/${o.id}/publish`, {}).subscribe({
      next: () => { this.notif.show('Offer published', 'success'); this.loadOffers(); },
      error: () => this.notif.show('Publish failed', 'error')
    });
  }

  close(o: JobOffer) {
    this.http.post(`${API_BASE}/recruitment/offers/${o.id}/close`, {}).subscribe({
      next: () => { this.notif.show('Offer closed', 'success'); this.loadOffers(); },
      error: () => this.notif.show('Close failed', 'error')
    });
  }

  openPipeline(o: JobOffer) {
    this.selectedOffer = o;
    this.loadPipeline(o.id);
    this.showPipelineModal = true;
  }

  loadPipeline(offerId: number) {
    this.http.get<PipelineStep[]>(`${API_BASE}/recruitment/offers/${offerId}/pipeline`).subscribe(d => {
      this.pipelineSteps = d;
      if (this.selectedOffer) this.selectedOffer.pipelineSteps = d;
    });
  }

  addStep() {
    if (!this.newStep.stepType) return;
    const payload: any = {
      stepType: this.newStep.stepType,
      stepLabel: this.newStep.stepLabel || STEP_TYPES.find(t => t.value === this.newStep.stepType)?.label,
      stepOrder: this.pipelineSteps.length + 1
    };
    if (this.newStep.assignedManagerId) {
      payload.assignedManager = { id: Number(this.newStep.assignedManagerId) };
    }
    this.http.post(`${API_BASE}/recruitment/offers/${this.selectedOffer!.id}/pipeline`, payload).subscribe({
      next: () => { this.notif.show('Step added', 'success'); this.loadPipeline(this.selectedOffer!.id); this.newStep = { stepType: 'hr_interview', stepLabel: '', assignedManagerId: '' }; },
      error: () => this.notif.show('Add step failed', 'error')
    });
  }

  deleteStep(s: PipelineStep) {
    this.http.delete(`${API_BASE}/recruitment/pipeline/${s.id}`).subscribe({
      next: () => { this.notif.show('Step removed', 'success'); this.loadPipeline(this.selectedOffer!.id); },
      error: () => this.notif.show('Delete failed', 'error')
    });
  }

  viewApplications(o: JobOffer) {
    this.selectedOffer = o;
    this.http.get<Application[]>(`${API_BASE}/recruitment/offers/${o.id}/applications`).subscribe(d => {
      this.offerApplications = d;
      this.showAppsModal = true;
    });
  }

  openApplicationDetail(a: Application) {
    this.selectedApp = a;
    this.advanceResult = 'PASS';
    this.advanceNotes = '';
    this.showAppsModal = false;
    this.showDetailModal = true;
  }

  advanceStep() {
    if (!this.selectedApp) return;
    this.http.post<Application>(`${API_BASE}/recruitment/applications/${this.selectedApp.id}/advance`, {
      result: this.advanceResult, notes: this.advanceNotes
    }).subscribe({
      next: (updated) => {
        this.selectedApp = updated;
        this.notif.show(`Step recorded: ${this.advanceResult}`, 'success');
        this.advanceNotes = '';
        this.loadOffers();
      },
      error: () => this.notif.show('Advance failed', 'error')
    });
  }

  canHire(): boolean {
    if (!this.selectedApp || !this.selectedOffer) return false;
    const totalSteps = this.selectedOffer.pipelineSteps?.length ?? 0;
    return this.selectedApp.status === 'IN_PROGRESS' && this.selectedApp.currentStepIndex >= totalSteps;
  }

  hire() {
    if (!this.selectedApp) return;
    const payload: any = { jobTitle: this.hireForm.jobTitle };
    if (this.hireForm.departmentId) payload.department = { id: Number(this.hireForm.departmentId) };
    this.http.post<any>(`${API_BASE}/recruitment/applications/${this.selectedApp.id}/hire`, payload).subscribe({
      next: (emp) => {
        this.notif.show(`${emp.firstName} ${emp.lastName} hired! Setup email sent.`, 'success');
        this.closeModal();
        this.loadOffers();
      },
      error: () => this.notif.show('Hire failed', 'error')
    });
  }

  closeModal() {
    this.showOfferModal = false;
    this.showPipelineModal = false;
    this.showAppsModal = false;
    this.showDetailModal = false;
  }
}
