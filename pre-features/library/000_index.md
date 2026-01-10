# Library Management Module - Implementation Plan

## Overview

A minimal yet complete library management system for Limkokwing University, enabling book catalog management, loan processing, fine tracking, digital resource management, and student portal access.

---

## Features Summary

| Feature | Admin/Librarian | Student Portal |
|---------|-----------------|----------------|
| Books Management | ✅ Full CRUD | 👁️ View Only |
| Authors Management | ✅ Full CRUD | - |
| Categories Management | ✅ Full CRUD | - |
| Loan Processing | ✅ Issue/Return/Renew | 👁️ View Own |
| Fines Management | ✅ View/Record Payment | 👁️ View Own |
| Digital Resources | ✅ Full CRUD + Upload | 👁️ View/Download |
| External Libraries | ✅ Full CRUD | 👁️ View |
| Reports | ✅ All Reports + Export | - |

---

## Implementation Steps

### Phase 1: Database Schema (Steps 001-003)

| Step | Title | Description |
|------|-------|-------------|
| [001](001_database-schema-foundation.md) | Database Schema Foundation | Core tables: books, authors, categories, junction tables |
| [002](002_digital-resources-external-libraries.md) | Digital Resources & External Libraries | Digital resources storage, external library links |
| [003](003_loans-fines-schema.md) | Loans & Fines Schema | Loans, renewals, fines tables with finance integration |

### Phase 2: Core Features (Steps 004-006)

| Step | Title | Description |
|------|-------|-------------|
| [004](004_books-feature-crud.md) | Books Feature (CRUD) | Books, Authors, Categories with Google Books API |
| [005](005_loans-management-feature.md) | Loans Management | Issue, return, renew books with student search |
| [006](006_fines-digital-resources.md) | Fines & Digital Resources | Fine calculation, file uploads, external libraries |

### Phase 3: Reporting & Portal (Steps 007-008)

| Step | Title | Description |
|------|-------|-------------|
| [007](007_reports.md) | Reports | Popular books, overdue, history, inventory with export |
| [008](008_student-portal-integration.md) | Student Portal Integration | Student-facing views for all features |

---

## Technology Stack

- **Frontend:** React 19, Mantine v8, TanStack Query v5
- **Backend:** Next.js 16 (App Router), Server Actions
- **Database:** PostgreSQL with Drizzle ORM
- **Storage:** Cloudflare R2 (via existing integration)
- **External API:** Google Books API (cover images)

---

## Database Entities

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   authors   │────<│ bookAuthors  │>────│    books    │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐            │
                    │bookCategories│>───────────┤
                    └──────┬───────┘            │
                           │                    │
                    ┌──────┴──────┐            │
                    │  categories │            │
                    └─────────────┘            │
                                               │
                         ┌─────────────────────┘
                         │
                    ┌────┴────────┐
                    │ bookCopies  │
                    └──────┬──────┘
                           │
┌──────────────┐   ┌──────┴──────┐   ┌─────────────┐
│   students   │──<│    loans    │>──│    users    │
└──────┬───────┘   └──────┬──────┘   └─────────────┘
       │                  │
       │           ┌──────┴──────┐
       │           │loanRenewals │
       │           └─────────────┘
       │                  │
       │           ┌──────┴──────┐     ┌─────────────────┐
       └──────────<│    fines    │>────│ paymentReceipts │
                   └─────────────┘     └─────────────────┘

┌──────────────────┐     ┌───────────────────┐
│ digitalResources │────>│      users        │
└──────────────────┘     └───────────────────┘

┌──────────────────┐
│externalLibraries │
└──────────────────┘
```

---

## Directory Structure (Final)

```
src/app/library/
├── layout.tsx
├── library.config.ts
├── _database/
│   ├── schema/
│   │   ├── enums.ts
│   │   ├── books.ts
│   │   ├── authors.ts
│   │   ├── categories.ts
│   │   ├── resources.ts
│   │   ├── external.ts
│   │   ├── loans.ts
│   │   └── fines.ts
│   ├── relations.ts
│   └── index.ts
├── _lib/
│   └── google-books.ts
├── _server/
│   └── portal-actions.ts
├── books/
├── authors/
├── categories/
├── loans/
├── fines/
├── resources/
├── external-libraries/
└── reports/

src/app/student-portal/library/
├── layout.tsx
├── page.tsx
├── books/
├── my-loans/
├── resources/
└── external-libraries/
```

---

## Business Rules

| Rule | Description |
|------|-------------|
| Fine Rate | 1 M (Maluti) per day overdue |
| Loan Period | Set by librarian (no default) |
| Renewals | Unlimited, no restrictions |
| Max Books | No limit per student |
| File Size | 10MB maximum for uploads |
| Members | All students are automatic members |

---

## Access Control

| Role | Access |
|------|--------|
| Admin | Full access to all features |
| Librarian | Full access to all features |
| Student | Portal view only (own data) |

---

## Execution Order

1. Complete Steps 001-003 first (database must exist before features)
2. Steps 004-006 can be done sequentially
3. Step 007 requires Steps 004-006 complete
4. Step 008 can be done after Step 006 (reports not required for portal)

---

## Validation Command

After each step, run:
```bash
pnpm tsc --noEmit && pnpm lint:fix
```

When all steps complete:
```bash
pnpm exec echo 'Done'
```
