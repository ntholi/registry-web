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

| Step | File                        | Description                                                |
| ---- | --------------------------- | ---------------------------------------------------------- |
| 1    | `001_database-schema.md`    | Database tables, enums, relations, and migration            |
| 2    | `002_backend-logic.md`      | Repository, Service, Actions, and approval business logic   |
| 3    | `003_ui-and-pages.md`       | UI components, pages, navigation, and list/detail views     |

## Database Entities

```
┌──────────────────────────┐
│   student_status_apps    │    (Main application table)
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
│   student_status_approvals   │   (One per approval step)
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
src/app/registry/student-status/
├── _schema/
│   ├── studentStatusApps.ts          # Main application table + enums
│   ├── studentStatusApprovals.ts     # Approval step table + enum
│   └── relations.ts                  # Drizzle relations
├── _server/
│   ├── repository.ts                 # Database queries
│   ├── service.ts                    # Business logic + auth
│   └── actions.ts                    # Server actions
├── _components/
│   ├── Form.tsx                      # Create/edit application form
│   ├── ApprovalPanel.tsx             # Approval actions for approvers
│   └── StatusTimeline.tsx            # Visual timeline of approval steps
├── index.ts                          # Re-exports
├── layout.tsx                        # ListLayout wrapper
├── page.tsx                          # List page
├── new/
│   └── page.tsx                      # New application page
└── [id]/
    └── page.tsx                      # Application detail page
```

## Business Rules

| # | Rule                                                                                           |
|---|------------------------------------------------------------------------------------------------|
| 1 | Only `registry` and `admin` roles can create applications                                      |
| 2 | A student cannot have two pending applications of the same type simultaneously                  |
| 3 | Reinstatement can only be created for students with status `Withdrawn`/`Terminated` or semester `Deferred`   |
| 4 | Form auto-fills current active term but allows override                                        |
| 5 | Any single rejection from any approver rejects the entire application                          |
| 6 | When all required approvals pass: auto-update student/semester status (except reinstatement)    |
| 7 | Pending applications can be cancelled by registry/admin before full approval                   |
| 8 | Full application history is maintained per student                                             |

## Access Control

| Role              | Position                        | Permissions                                  |
| ----------------- | ------------------------------- | -------------------------------------------- |
| `registry`        | —                               | Create, view all, cancel                     |
| `admin`           | —                               | Create, view all, cancel                     |
| `academic`        | `year_leader`                   | Approve/reject (Year Leader step)            |
| `academic`        | `manager` or `program_leader`   | Approve/reject (Manager/PL step)             |
| `student_services`| —                               | Approve/reject (Counselling step)            |
| `finance`         | —                               | Approve/reject (Finance step)                |

## Execution Order

1. **Step 1 — Database Schema**: Must be completed first. Creates tables, enums, and generates migration.
2. **Step 2 — Backend Logic**: Depends on Step 1. Creates repository, service, and server actions.
3. **Step 3 — UI & Pages**: Depends on Step 2. Creates all UI components, pages, and navigation config.

## Validation Command

```bash
pnpm tsc --noEmit && pnpm lint:fix
```
