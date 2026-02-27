# Student Status — Implementation Plan

## Overview

A unified feature under the Registry module for managing student status change applications: **Withdrawal**, **Deferment**, and **Reinstatement**. Each application type follows a multi-step parallel approval workflow involving academic staff, student services, and finance (except reinstatement, which only requires academic + finance approval).

When a withdrawal or deferment application is fully approved, the system automatically updates the student's enrollment status (`students.status`) and semester status (`studentSemesters.status`). Reinstatement approval does **not** trigger any automatic status changes—registry staff handles reactivation manually.

## Feature Summary

| Capability                        | Admin / Registry Staff                                  |
| --------------------------------- | ------------------------------------------------------- |
| Create Application                | ✅ Registry + Admin roles                                |
| View All Applications             | ✅ Registry + Admin roles                                |
| View Application Detail           | ✅ Registry + Admin + Approver roles                     |
| Approve / Reject (Year Leader)    | ✅ Academic role with `year_leader` position              |
| Approve / Reject (Manager / PL)   | ✅ Academic role with `manager` or `program_leader` pos.  |
| Approve / Reject (Counselling)    | ✅ `student_services` role                                |
| Approve / Reject (Finance)        | ✅ `finance` role                                         |
| Cancel Pending Application        | ✅ Registry + Admin roles                                |
| View Application History          | ✅ Full history per student                               |
| Auto-Update Status on Approval    | ✅ Withdrawal & Deferment only                            |

## Application Types

| Type            | Purpose                                           | Auto Side Effects on Approval                                      |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| **Withdrawal**  | Student exits permanently                         | `students.status` → `Withdrawn`, active semester → `Withdrawn`     |
| **Deferment**   | Student pauses (semester-level), intends to return | Active semester status → `Deferred`                                |
| **Reinstatement** | Withdrawn/Deferred/Terminated student returns    | None (manual reactivation by registry)                             |

## Justification Options

| Type            | Options                                                                              |
| --------------- | ------------------------------------------------------------------------------------ |
| Withdrawal      | Medical, Transfer, Financial, Employment, Other                                      |
| Deferment       | Medical, Transfer, Financial, Employment, Other                                      |
| Reinstatement   | After termination/withdrawal, After deferment, To pick up failed modules, Upgrading qualification, Other |

## Approval Workflow

### Withdrawal & Deferment
Four parallel approval steps (can happen in any order):

```
┌──────────────────┐   ┌────────────────────────────┐   ┌──────────────────────┐   ┌─────────────┐
│   Year Leader    │   │ Manager / Programme Leader  │   │  Student Services    │   │   Finance   │
│  (academic +     │   │  (academic + manager or     │   │  (student_services   │   │  (finance   │
│   year_leader)   │   │   program_leader position)  │   │   role)              │   │   role)     │
└────────┬─────────┘   └─────────────┬──────────────┘   └──────────┬───────────┘   └──────┬──────┘
         │                           │                             │                      │
         └───────────────────────────┴─────────────────────────────┴──────────────────────┘
                                              │
                                    All Approved? ──→ Auto-update statuses
                                    Any Rejected? ──→ Application Rejected
```

### Reinstatement
Two parallel approval steps only:

```
┌────────────────────────────┐   ┌─────────────┐
│ Manager / Programme Leader  │   │   Finance   │
│  (academic + manager or     │   │  (finance   │
│   program_leader position)  │   │   role)     │
└─────────────┬──────────────┘   └──────┬──────┘
              │                         │
              └─────────────────────────┘
                          │
                All Approved? ──→ No auto-update
                Any Rejected? ──→ Application Rejected
```

## Implementation Steps

| Step | File                                         | Description                                                       |
| ---- | -------------------------------------------- | ----------------------------------------------------------------- |
| 1    | `001_database-schema.md`                     | Database tables, enums, relations, and migration                  |
| 2    | `002_repository.md`                          | Repository class with all database query methods                  |
| 3    | `003_service-and-approval-workflow.md`        | Service layer, business logic, authorization, side effects        |
| 4    | `004_server-actions-and-integration.md`       | Server action wrappers, activity types, cross-module integration  |
| 5    | `005_ui-components-pages-and-navigation.md`   | UI components, pages, routes, navigation, color/status mappings   |

## Database Entities

```
┌──────────────────────────┐
│     student_statuses     │    (Main application table)
│──────────────────────────│
│ id (PK)                  │
│ stdNo (FK → students)    │
│ type (enum)              │
│ status (enum)            │
│ justification (enum)     │
│ notes (text)             │
│ termCode (text)          │
│ semesterId (FK, req W/D) │
│ createdBy (FK → users)   │
│ createdAt                │
│ updatedAt                │
└──────────┬───────────────┘
           │ 1:N
           ▼
┌──────────────────────────────┐
│  student_status_approvals    │    (One per approval step)
│──────────────────────────────│
│ id (PK)                      │
│ applicationId (FK)           │
│ approverRole (enum)          │
│ status (enum)                │
│ respondedBy (FK → users)     │
│ message (text)               │
│ respondedAt                  │
│ createdAt                    │
└──────────────────────────────┘
```

## Directory Structure (Final)

```
src/app/registry/student-statuses/
├── _schema/
│   ├── studentStatuses.ts          # Main table + type/status/justification enums
│   ├── studentStatusApprovals.ts   # Approval table + approval role/status enums
│   └── relations.ts                # Drizzle relation definitions
├── _server/
│   ├── repository.ts               # Database queries for both tables
│   ├── service.ts                  # Business logic, auth, approval workflow
│   └── actions.ts                  # Server action wrappers
├── _components/
│   ├── Form.tsx                    # Application creation form
│   ├── ApprovalPanel.tsx           # Approval steps with action buttons
│   └── StatusTimeline.tsx          # Visual timeline of application progress
├── _lib/
│   └── types.ts                    # Type exports
├── new/
│   └── page.tsx                    # Create application page
├── [id]/
│   └── page.tsx                    # Application detail page
├── layout.tsx                      # ListLayout wrapper
├── page.tsx                        # NothingSelected page
└── index.ts                        # Re-exports
```

## Business Rules

| Rule                                           | Description                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| No duplicate pending applications              | A student cannot have two pending applications of the same type                            |
| Semester required for W/D                      | Withdrawal and Deferment require a `semesterId`                                            |
| Reinstatement eligibility                      | Only for students with status Withdrawn/Terminated or a Deferred/Withdrawn semester        |
| Single rejection rejects application           | Any single approver rejecting sets the entire application to `rejected`                    |
| Auto side effects on full approval             | Withdrawal → student + semester status updated; Deferment → semester status updated        |
| Reinstatement has no auto side effects         | Registry staff manually reactivates the student after reinstatement approval               |
| Cancellation only for pending                  | Only `pending` applications can be cancelled                                               |

## Access Control

| Role / Position                     | Permissions                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| `admin`, `registry`                 | Create, view all, cancel, full list access                   |
| `academic` + `year_leader`          | Approve/reject year_leader step; view relevant applications  |
| `academic` + `manager`/`program_leader` | Approve/reject program_leader step; view relevant applications |
| `student_services`                  | Approve/reject student_services step; view relevant applications |
| `finance`                           | Approve/reject finance step; view relevant applications      |

## Execution Order

| Step | Dependencies       | Notes                              |
| ---- | ------------------ | ---------------------------------- |
| 1    | None               | Schema must be created first       |
| 2    | Step 1             | Repository needs schema            |
| 3    | Steps 1, 2         | Service needs repository           |
| 4    | Steps 1, 2, 3      | Actions wrap service methods       |
| 5    | Steps 1–4          | UI consumes actions and types      |

## Validation Command

After each step, run:
```bash
pnpm tsc --noEmit && pnpm lint:fix
```
