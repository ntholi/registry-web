# Unified Appraisal Reports — Session 1: Overview & Structure

> Replaces: `student-feedback/reports/` and `observation-reports/`

---

## 1. Navigation & Routing

### Nav Item
- Add a **top-level** nav entry in `appraisals.config.ts` directly below the "Cycles" item, before the "Student Feedback" collapsible group.
- Label: **Reports**
- Icon: `IconChartBar`
- Href: `/appraisals/reports`
- Roles: `['academic', 'admin', 'human_resource']`
- Permissions: `[{ resource: 'student-feedback-reports', action: 'read' }, { resource: 'teaching-observation-reports', action: 'read' }]` — user needs at least one of these to see the nav item.

### Remove Old Nav Items
- Remove the `Reports` child under "Student Feedback" (`/appraisals/student-feedback/reports`).
- Remove the `Reports` child under "Teaching Observation" (`/appraisals/observation-reports`).

### Route
- Single page at `src/app/appraisals/reports/page.tsx` — a `'use client'` component.
- No layout.tsx needed (inherits from `appraisals/layout.tsx`).

---

## 2. Directory Structure

```
src/app/appraisals/reports/
├── page.tsx                          # Main page: filter + tabs
├── _lib/
│   └── types.ts                      # All TypeScript interfaces
├── _server/
│   ├── repository.ts                 # All database queries
│   ├── service.ts                    # Permission-gated orchestration
│   └── actions.ts                    # Server actions (thin wrappers)
└── _components/
    ├── Filter.tsx                    # Shared filter bar (lecturer filter for full-access)
    ├── OverviewTab.tsx               # Overview tab content
    ├── StudentFeedbackTab.tsx        # Student Feedback tab content
    ├── ObservationTab.tsx            # Teaching Observation tab content
    ├── OverviewStats.tsx             # 4 stats cards for overview
    ├── FeedbackStats.tsx             # Stats cards for student feedback tab
    ├── ObservationStats.tsx          # Stats cards for observation tab
    ├── SchoolComparisonChart.tsx     # Side-by-side bar chart
    ├── TrendChart.tsx                # Line chart (single or overlaid)
    ├── FeedbackHeatmap.tsx           # Schools × feedback categories
    ├── ObservationHeatmap.tsx        # Schools × observation categories
    ├── CategoryChart.tsx             # Bar chart for category averages
    ├── CriteriaBreakdown.tsx         # Per-criterion analysis
    ├── SimpleLecturerTable.tsx       # Overview tab: no expandable detail
    ├── FeedbackLecturerTable.tsx     # Feedback tab: with expandable detail
    ├── ObservationLecturerTable.tsx  # Observation tab: with expandable detail
    ├── FeedbackLecturerDetail.tsx    # Expanded row for feedback (preserved from existing)
    ├── ObservationLecturerDetail.tsx # Expanded row for observation (new, 4 tabs)
    └── RadarChart.tsx                # Radar in lecturer detail views
```

> **Removed**: `RatingHistogram.tsx` (replaced by feedback trend chart), `QuestionBreakdown.tsx` (moved into `FeedbackLecturerDetail`).
> **No exports**: Export functionality (Excel/PDF) is intentionally excluded from this unified page.

---

## 3. Files to Delete

Delete these entire directory trees **after** the unified feature is fully implemented and tested:

1. `src/app/appraisals/student-feedback/reports/` — everything inside: `page.tsx`, `_server/`, `_lib/`, `_components/`
2. `src/app/appraisals/observation-reports/` — everything inside: `page.tsx`, `_server/`, `_lib/`, `_components/`

---

## 4. Types (`_lib/types.ts`)

### Unified Filter
A single filter interface used by all tabs:
- `termId?: number`
- `cycleId?: string`
- `schoolIds?: number[]`
- `programId?: number`
- `lecturerId?: string` — searchable Select in filter bar, **only visible** when `hasFullAccess` is true

No `moduleId` — the module filter is removed entirely. Replaced by the `lecturerId` filter for full-access users.

### Overview Data
An interface holding the overview tab's data:
- `combinedAvg: number` — simple average of feedbackAvg and observationAvg
- `feedbackAvg: number`
- `observationAvg: number`
- `lecturersEvaluated: number`
- `schoolComparison: SchoolComparisonItem[]` — array where each item has: schoolId, schoolCode, schoolName, feedbackAvg, observationAvg
- `trendData: TrendPoint[]` — array where each item has: termId, termCode, feedbackAvg, observationAvg (both lines on one chart)
- `feedbackHeatmap: HeatmapCell[]` — array with: schoolId, schoolCode, categoryId, categoryName, avgRating
- `observationHeatmap: HeatmapCell[]` — same shape but for observation categories
- `lecturerRankings: OverviewLecturerRanking[]` — array with: userId, lecturerName, schoolCode, feedbackAvg, observationAvg, combinedAvg

### Student Feedback Report Data
An interface for the Student Feedback tab:
- `overview: FeedbackOverviewStats` — totalResponses, avgRating, responseRate, lecturersEvaluated
- `categoryAverages: CategoryAverage[]` — categoryId, categoryName, avgRating, responseCount, sortOrder
- `trendData: FeedbackTrendPoint[]` — termId, termCode, avgRating, responseCount (**new** — replaces RatingHistogram)
- `lecturerRankings: FeedbackLecturerRanking[]` — userId, lecturerName, schoolCode, schoolName, moduleCount, responseCount, avgRating, categoryAverages (Record<string, number>)

> **Removed from page-level data**: `ratingDistribution` and `questionBreakdown` — question breakdown now lives exclusively inside the per-lecturer expanded detail.

### Teaching Observation Report Data
An interface for the Observation tab:
- `overview: ObservationOverviewStats` — totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate
- `categoryAverages: ObservationCategoryAverage[]` — categoryId, categoryName, section, avgRating, ratingCount, sortOrder
- `trendData: ObservationTrendPoint[]` — termId, termCode, avgScore, observationCount
- `lecturerRankings: ObservationLecturerRanking[]` — userId, lecturerName, schoolCode, schoolName, observationCount, avgScore, categoryAverages (Record<string, number>)
- `criteriaBreakdown: CriterionBreakdownItem[]` — criterionId, criterionText, categoryId, categoryName, section, avgRating, ratingCount

### Lecturer Detail Types

**Feedback Lecturer Detail** (preserved from existing `LecturerExpandedDetail`):
- userId, lecturerName, schoolCode, avgRating
- `modules[]` — moduleCode, moduleName, avgRating, responseCount, className
- `questions[]` — questionId, questionText, categoryName, avgRating, overallAvgRating, responseCount, distribution[]
- `comments[]` — moduleCode, moduleName, className, comment
- `radarData` — array of { category, feedbackScore, observationScore } for the radar chart (**new** addition to existing type)

**Observation Lecturer Detail** (new — 4-tab design):
- userId, lecturerName, schoolCode, avgScore
- `observations[]` — observationId, moduleName, moduleCode, cycleName, avgScore, status, strengths, improvements, recommendations, trainingArea
- `criteriaScores[]` — criterionId, criterionText, categoryName, section, avgRating
- `radarData` — same shape as feedback radar for comparison
- `feedbackCrossRef` — reuses the Feedback Lecturer Detail data for this same user (modules[], questions[], comments[])

### Shared Sub-types
- `RatingDistribution` — rating: number, count: number, percentage: number
- `HeatmapCell` — schoolId: number, schoolCode: string, categoryId: string, categoryName: string, avgRating: number
- `TrendPoint` — termId: number, termCode: string, feedbackAvg: number, observationAvg: number
- `CycleOption` — id: string, name: string
