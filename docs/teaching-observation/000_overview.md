# Teaching Observation — Implementation Plan

> PRL Report feature within the `appraisals` module for evaluating lecturer teaching performance via classroom observations.

## Overview

Academic Program Leaders observe lecturers during class sessions and rate them on configurable criteria across three sections: **Teaching Observation** (8 categories), **Assessments** (3 KPIs), and **Other** (1 KPI). Observations are tied to **feedback cycles** (shared with student feedback) and scoped to a specific **assigned module**. Lecturers can view submitted observations and acknowledge them.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Feature name | Teaching Observation |
| Observer role | Academic Program Leaders only |
| Observation scope | Per assigned module (specific module + class) |
| Tied to | Shared feedback cycles (renamed from `studentFeedbackCycles`) |
| Criteria | Fully configurable (admin/HR managed) |
| Sub-criteria/descriptors | Guidance text only (not separately rated) |
| Rating scale | Fixed 1–5 (Unsatisfactory → Excellent) |
| Sections | Unified table with a `section` enum (`teaching_observation`, `assessments`, `other`) |
| Remarks | Separate fields: strengths, improvements, recommendations |
| Training area | Free text field |
| Signatures | Acknowledgment workflow (observer submits → lecturer acknowledges) |
| Status workflow | Draft → Submitted → Acknowledged |
| Lecturer visibility | After submission |
| Scoring | Auto-calculated on-the-fly (category avg, section avg, overall) |
| Anonymity | Not anonymous (observer identity known) |
| Cycle date enforcement | Soft warning only |
| Multi-obs per cycle | One per assigned module per cycle (unique constraint) |
| Observer assignment | Self-select via form with dropdowns (school-scoped) |
| Campus field | Skipped (single campus) |
| Form UX | Single form with accordion sections |
| Notifications | In-app notifications |
| PDF export | Matching PRL form layout |

## Plan Documents

| Part | Title | Description |
|------|-------|-------------|
| [001](001_cycles_refactoring.md) | Cycles Refactoring | Prerequisite: move and rename shared cycles |
| [002](002_schema_and_permissions.md) | Schema & Permissions | Database tables, relations, indexes, and permission resources |
| [003](003_criteria_management.md) | Criteria Management | Admin UI for categories + criteria CRUD, seed data |
| [004](004_observation_workflow.md) | Observation Workflow | CRUD, form, draft/submit/acknowledge, notifications |
| [005](005_reports_and_export.md) | Reports & Export | Analytics dashboard, PDF export, Excel export |

## File Structure (All New Files)

```
src/app/appraisals/
├── teaching-observations/
│   ├── _schema/
│   │   ├── observationCategories.ts
│   │   ├── observationCriteria.ts
│   │   ├── observations.ts
│   │   ├── observationRatings.ts
│   │   └── relations.ts
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   ├── ObservationForm.tsx
│   │   ├── RatingInput.tsx
│   │   ├── ObservationDetail.tsx
│   │   └── AcknowledgeButton.tsx
│   ├── _lib/
│   │   └── types.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── edit/page.tsx
├── observation-criteria/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   ├── CriteriaManager.tsx
│   │   ├── CategoryForm.tsx
│   │   └── CriterionForm.tsx
│   ├── layout.tsx
│   └── page.tsx
├── observation-reports/
│   ├── _server/
│   │   ├── actions.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   └── pdf.ts
│   ├── _components/
│   │   ├── Filter.tsx
│   │   ├── OverviewStats.tsx
│   │   ├── CategoryChart.tsx
│   │   ├── LecturerTable.tsx
│   │   ├── TrendChart.tsx
│   │   ├── ExportButton.tsx
│   │   └── PdfExportButton.tsx
│   ├── _lib/
│   │   └── types.ts
│   └── page.tsx
```

## Navigation

Add to `appraisals.config.ts` as a separate top-level nav group alongside "Student Feedback":

```
Teaching Observation
├── Observations   → /appraisals/teaching-observations
├── Criteria       → /appraisals/observation-criteria
└── Reports        → /appraisals/observation-reports
```

Roles: `academic`, `admin`, `human_resource`

## Activity Logging

Add to `appraisals/_lib/activities.ts`:

| Activity Type | Trigger |
|---------------|---------|
| `teaching_observation_created` | Observation INSERT |
| `teaching_observation_updated` | Observation UPDATE |
| `teaching_observation_deleted` | Observation DELETE |
| `observation_criteria_created` | Criterion INSERT |
| `observation_criteria_updated` | Criterion UPDATE |
| `observation_criteria_deleted` | Criterion DELETE |
