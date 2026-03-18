# Unified Appraisal Reports — Overview

> Replaces: `student-feedback/reports/` and `observation-reports/` with a single unified reporting page.

## Goal

A single page at `/appraisals/reports` with 3 tabs — **Overview**, **Student Feedback**, **Teaching Observation** — combining data from both appraisal sources. Lecturers see their own data; admins/HR see all lecturers with a lecturer filter.

### Key Principle: Preserve Student Feedback UI

The existing **Student Feedback** reports page (`student-feedback/reports/`) is mature and well-tested. Its components — Filter, OverviewStats, CategoryChart (RadarChart), RatingHistogram, QuestionBreakdown, LecturerTable, LecturerExpandedDetail, ExportButton — must be **carried over with minimal changes**. The unified page wraps them in a tab, not replaces them.
---

## Implementation Phases

| Phase | File | Description | Status |
|-------|------|-------------|--------|
| 1 | [001_backend.md](001_backend.md) | Types, Repository, Service, Actions | ✅ Done |
| 2 | [002_page-filters-and-charts.md](002_page-filters-and-charts.md) | Unified page shell, Filter, Tab shells, Stats cards, all Charts/Heatmaps, carried-over feedback visuals | ⬜ Not started |
| 3 | [003_lecturer-rankings-and-details.md](003_lecturer-rankings-and-details.md) | Lecturer tables, Lecturer detail views (carried over + new), RadarChart, CriteriaBreakdown, nav config, cleanup | ⬜ Not started |

---

## Directory Structure

```
src/app/appraisals/reports/
├── page.tsx
├── _lib/
│   └── types.ts                      # Already implemented (Phase 1)
├── _server/
│   ├── repository.ts                 # Already implemented (Phase 1)
│   ├── service.ts                    # Already implemented (Phase 1)
│   └── actions.ts                    # Already implemented (Phase 1)
└── _components/
    ├── Filter.tsx                    # Carried over from student-feedback (+ observation fields)
    ├── OverviewTab.tsx               # NEW — overview tab content
    ├── StudentFeedbackTab.tsx        # Wires carried-over student feedback components
    ├── ObservationTab.tsx            # Wires carried-over + new observation components
    ├── OverviewStats.tsx             # NEW — combined 4 stat cards
    ├── FeedbackOverviewStats.tsx     # Carried over from student-feedback OverviewStats
    ├── ObservationOverviewStats.tsx  # Carried over from observation-reports OverviewStats
    ├── SchoolComparisonChart.tsx     # NEW — side-by-side bar chart
    ├── TrendChart.tsx                # Carried over from observation-reports (+ overlaid mode)
    ├── FeedbackHeatmap.tsx           # NEW — schools × feedback categories
    ├── ObservationHeatmap.tsx        # NEW — schools × observation categories
    ├── FeedbackCategoryChart.tsx     # Carried over from student-feedback CategoryChart (RadarChart)
    ├── ObservationCategoryChart.tsx  # Carried over from observation-reports CategoryChart (BarChart)
    ├── RatingHistogram.tsx           # Carried over from student-feedback (unchanged)
    ├── QuestionBreakdown.tsx         # Carried over from student-feedback (unchanged)
    ├── CriteriaBreakdown.tsx         # NEW — per-criterion analysis with accordion
    ├── SimpleLecturerTable.tsx       # NEW — overview tab combined rankings
    ├── FeedbackLecturerTable.tsx     # Carried over from student-feedback LecturerTable
    ├── FeedbackLecturerDetail.tsx    # Carried over from student-feedback LecturerExpandedDetail (+ overview tab)
    ├── ObservationLecturerTable.tsx  # Carried over from observation-reports LecturerTable (+ expandable)
    ├── ObservationLecturerDetail.tsx # NEW — 4-tab observation detail view
    ├── RadarChart.tsx                # NEW — dual-series radar for cross-comparison
    ├── FeedbackExportButton.tsx      # Carried over from student-feedback ExportButton
    └── ObservationExportButton.tsx   # Carried over from observation-reports ExportButton
```

---

## Navigation

- Add top-level nav item in `appraisals.config.ts` below "Cycles": Label **Reports**, Icon `IconChartBar`, Href `/appraisals/reports`
- Roles: `['academic', 'admin', 'human_resource']`
- Permissions: `[{ resource: 'student-feedback-reports', action: 'read' }, { resource: 'teaching-observation-reports', action: 'read' }]`
- Remove old `Reports` nav items from "Student Feedback" and "Teaching Observation" groups

## Files to Delete (after full implementation)

1. `src/app/appraisals/student-feedback/reports/` — entire directory
2. `src/app/appraisals/observation-reports/` — entire directory

## Permission Model

- **Full access**: admin, human_resource, or has 'update' on either report resource → sees all lecturers, gets lecturer filter
- **Feedback access**: has 'student-feedback-reports' → 'read'
- **Observation access**: has 'teaching-observation-reports' → 'read'
- **Self-view**: non-full-access users see only their own data, title becomes "My Appraisal Results"

## Backend Gaps (minor extensions to Phase 1)

The Phase 1 backend dropped some fields from the existing student feedback reports. These must be restored:

1. **`ratingDistribution`** — Add to `FeedbackReportData` type and `getFeedbackReportData()` repository method. Query: count responses grouped by rating (1–5) with percentage.
2. **`questionBreakdown`** — Add to `FeedbackReportData` type and `getFeedbackReportData()` repository method. Query: per-question aggregation with rating distribution (already exists as private `getQuestionBreakdown()` in repository).
3. **`moduleId`** — Add to `ReportFilter` type. Used by student feedback filter only. Condition builder needs to filter by module when set.
