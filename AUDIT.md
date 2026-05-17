# Codebase Audit — ADP Nexus HCM

> Generated: 2026-05-17 | Branch: claude/sad-curran-2df570

---

## 1. Architecture Overview

| Layer | Stack | Version |
|-------|-------|---------|
| Backend | Spring Boot (Java) | 4.0.5 / Java 17 |
| Frontend | Angular (TypeScript) | 21.2.0 / TS 5.9 |
| Database | MySQL | (local, port 3306) |
| Build | Maven (BE), Angular CLI (FE) | — |

---

## 2. Database Tables

| Table | Columns | Notes |
|-------|---------|-------|
| `employee` | 22 | Core entity. Has `situation` column never populated. |
| `department` | 6 | Has `location`, `budget_code` never used in any service. |
| `employee_category` | 6 | `sick_leave_allowance` added via schema-patch runner at boot. |
| `performance_evaluation` | 7 | — |
| `evaluation_response` | 4 | — |
| `performance_question` | 3 | — |
| `leave_request` | 8 | `reason` column defined but never displayed or queried. |
| `attendance` | 6 | — |
| `operation_history` | 5 | `timestamp` never queried. Actor is a plain email string — no FK. |

---

## 3. API Routes (38 endpoints)

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | Returns employee entity |

### Employee Management
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/employees` | Returns all; no pagination |
| GET | `/api/employees/{id}` | — |
| GET | `/api/employees/{id}/profile` | — |
| POST | `/api/employees` | No duplicate email guard at service level |
| POST | `/api/employees/setup` | Activation token flow |
| PUT | `/api/employees/{id}` | Direct entity update |
| PATCH | `/api/employees/{id}/manager` | Assign manager |
| GET | `/api/employees/managers` | Loads all employees, filters in memory |
| GET | `/api/manager/{id}/subordinates` | — |
| POST | `/api/employees/{id}/leaves` | Submit leave request |
| POST | `/api/employees/{id}/attendance` | Log attendance punch |
| GET | `/api/employees/{id}/attendance/today` | — |
| GET | `/api/employees/{id}/leaves-history` | — |
| GET | `/api/employees/{id}/attendance-history` | — |

### HR Management
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/hr/history` | Returns all rows, no filter/pagination |
| GET | `/api/hr/all-leaves` | — |
| GET | `/api/hr/all-attendance` | — |
| GET | `/api/hr/manager/{id}/leaves` | — |
| GET | `/api/hr/manager/{id}/attendance` | — |
| POST | `/api/hr/leaves/{id}/approve` | — |
| POST | `/api/hr/leaves/{id}/reject` | — |
| POST | `/api/hr/attendance` | Create/save attendance |
| PUT | `/api/hr/attendance/{id}` | — |
| GET | `/api/hr/categories` | — |
| POST | `/api/hr/categories` | — |
| PUT | `/api/hr/categories/{id}` | — |
| DELETE | `/api/hr/categories/{id}` | — |

### Department
| Method | Path |
|--------|------|
| GET | `/api/departments` |
| POST | `/api/departments` |
| GET | `/api/departments/{id}` |
| PUT | `/api/departments/{id}` |

### Performance
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/performance/questions` | — |
| GET | `/api/performance/pending/{managerId}` | — |
| POST | `/api/performance/submit/{evalId}` | — |
| POST | `/api/performance/launch` | No duplicate period guard |
| GET | `/api/performance/history/employee/{id}` | — |
| GET | `/api/performance/history/team/{managerId}` | — |
| GET | `/api/performance/reports` | Calculates worked hours from attendance; incomplete impl |

### Dashboard
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/dashboard/metrics` | Loads ALL employees into memory for stream aggregation |

---

## 4. Frontend Components

| Component | Route | Role Guard |
|-----------|-------|-----------|
| `LoginComponent` | `/login` | Public |
| `SetupComponent` | `/setup-account` | Public (token-based) |
| `InitAdminComponent` | `/init-admin` | None — effectively dead |
| `MainDashboardComponent` | `/dashboard` | `HR_ADMIN` (frontend only) |
| `EmployeeDashboardComponent` | `/my-dashboard` | `EMPLOYEE` (frontend only) |
| `ManagerDashboardComponent` | `/manager-dashboard` | `MANAGER` (frontend only) |
| `EmployeeComponent` | `/employees` | `HR_ADMIN` (frontend only) |
| `PerformanceReportComponent` | `/performance` | `HR_ADMIN`/`MANAGER` (frontend only) |
| `LayoutComponent` | (shell) | Reads `localStorage` |

---

## 5. Services & Utilities

### Backend Services
| Service | Responsibility |
|---------|---------------|
| `EmployeeService` | Create, activate, authenticate, update employees |
| `HRManagementService` | Leave requests, attendance, audit logging |
| `PerformanceService` | Evaluations, questions, reports |
| `DepartmentService` | CRUD for departments |
| `LeaveAccrualService` | Monthly cron: increments leave balances |
| `EmailService` | **Stub only** — console-logs instead of sending email |

### Frontend Services
| Service | Responsibility |
|---------|---------------|
| `PerformanceService` | HTTP calls for performance APIs |
| `NotificationService` | BehaviorSubject toast system (5s auto-hide) |

---

## 6. Dead Code

| Artifact | Location | Reason |
|----------|----------|--------|
| `DataSeeder.java` | `config/DataSeeder.java` | Defined but never triggered; app uses `init.sql` |
| `InitAdminComponent` | `init-admin/` | Routed but no code path leads to it |
| `DepartmentRepository.findByName()` | `DepartmentRepository.java` | Declared, never called |
| `OperationHistory` filters | `OperationHistoryRepository` | Only `findAll()` used |
| `chart.js` dependency | `package.json` | Imported but zero chart components exist |

---

## 7. Duplicate Logic

| Duplication | Locations | Fix |
|-------------|-----------|-----|
| Weekday counting for leave balance deduction | `HRManagementService.updateLeaveStatus()` | Extract to `LeaveUtils.countWeekdays()` |
| Employee field null-check update pattern | Both `updateEmployee()` and `updateEmployeeFromMap()` | Consolidate into one method |
| Manager filter (load all, stream filter) | `getManagers()`, `getSubordinates()` | Add repository queries |

---

## 8. Inconsistent Naming

| Issue | Severity |
|-------|----------|
| Some controllers return raw Entity; others wrap in `ResponseEntity` | Medium |
| Leave types are plain strings (`"ANNUAL"`, `"SICK"`) — no Java enum | Low |
| `SetupRequest.java` named wrong (is really AccountActivationRequest) | Low |
| All HTTP calls in frontend hardcode `http://localhost:8085` | High |

---

## 9. Unused Database Columns

| Column | Table | Impact |
|--------|-------|--------|
| `situation` | `employee` | Written in entity, never set or displayed |
| `location` | `department` | In DDL, never referenced |
| `budget_code` | `department` | In DDL, never referenced |
| `reason` | `leave_request` | In entity, never queried or shown in UI |

---

## 10. Security Issues

| Issue | Severity |
|-------|---------|
| `anyRequest().permitAll()` — zero RBAC on any route | **Critical** |
| Role stored only in `localStorage` — trivially spoofable | **Critical** |
| No JWT or session token on requests | **High** |
| No route guards in Angular (`canActivate`) | **High** |
| Email service stubs — welcome/activation emails never sent | Medium |

---

## 11. Data Integrity Issues

| Issue | Location |
|-------|----------|
| Duplicate category inserts between `init.sql` and `seed_categories.sql` | SQL scripts |
| No cascade delete protection on department → employee FK | Schema |
| `performance/launch` has no guard against duplicate periods | `PerformanceService.launchMonthlyEvaluation()` |
| `GET /api/dashboard/metrics` loads all employees — no pagination | `DashboardController` |

---

## 12. What's Missing (required by spec)

| Feature | Status |
|---------|--------|
| Feature flag system (`features_config` table + guards) | **Missing** |
| SuperAdmin role and `/superadmin` area | **Missing** |
| Recruitment module (job offers, pipelines, applications) | **Missing** |
| Public `/careers` page + applicant tracking | **Missing** |
| Hire → Employee conversion flow | **Missing** |
| Label customisation (rename UI strings) | **Missing** |
| RBAC on every API route | **Missing** |
| Angular route guards | **Missing** |
| Global error response standard `{ error, code, details? }` | **Missing** |
| API base URL configuration (no hardcoding) | **Missing** |

---

## 13. Implementation Plan

### Phase 1 — Feature Flags (prerequisite for everything)
- DB: `features_config` table
- Backend: entity, repo, service, controller (`/api/features`)
- Frontend: `FeatureFlagService`, `useFeature()` pipe, boot-time cache

### Phase 2 — Auth Hardening
- Backend: JWT filter + role-based `@PreAuthorize` on all routes
- Frontend: `AuthService`, route guards (`AuthGuard`, `RoleGuard`, `FeatureGuard`)
- Remove `anyRequest().permitAll()`

### Phase 3 — SuperAdmin Module
- New role `SUPERADMIN`
- Backend: system config, label overrides, user management endpoints
- Frontend: `/superadmin` area with feature toggle, labels, config, users

### Phase 4 — Recruitment Module
- Backend: job offers, pipeline steps, applications, step results, hire conversion
- Frontend: HR recruitment management UI, manager interview UI

### Phase 5 — Public Careers Page
- Backend: public (no-auth) endpoints for listing offers and submitting applications
- Frontend: `/careers` (public), `/careers/track` (token-based)

### Phase 6 — Refactoring
- Remove dead code
- Extract `LeaveUtils`
- Standardise error responses
- Replace hardcoded API URLs
- Add repository-level queries replacing in-memory filtering
