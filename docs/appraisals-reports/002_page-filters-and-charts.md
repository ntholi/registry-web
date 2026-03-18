# Phase 2: Page Shell, Filters & Charts

> Unified page structure, Filter bar, Tab shells, all Stats cards, and all Chart/Heatmap/Breakdown visuals.
> Student feedback visuals are **carried over** from the existing page with minimal adaptation.

---

## Pre-Work: Backend Extensions

Before building UI, apply 3 minor extensions to the Phase 1 backend (see [001_backend.md](001_backend.md) note):

1. **`ReportFilter`** — add `moduleId?: number`
2. **`buildFeedbackConditions()`** — handle `moduleId` filter
3. **`FeedbackReportData`** — add `ratingDistribution` and `questionBreakdown` fields
4. **`getFeedbackReportData()`** — include `getRatingDistribution()` and `getQuestionBreakdown()` in `Promise.all`
5. **Service + Actions** — expose `getModulesForFilter(filter)` (query: distinct modules matching filter, same as existing `student-feedback/reports/_server/repository.ts`)

---

## Page (`page.tsx`)

`'use client'` component.

### State
- Filter state via `useQueryStates` from `nuqs` (URL-synced)
- Active tab: `useState<'overview' | 'feedback' | 'observation'>('overview')`

### Data Fetching
- `useQuery` for `getReportAccessInfo()` — determines tab visibility

### Layout
1. **Header**: "Appraisal Reports" (or "My Appraisal Results" for non-full-access)
2. **Filter bar**: `<Filter />` below header
3. **Tabs**: Mantine `Tabs`:
   - "Overview": shown if user has at least one permission
   - "Student Feedback": shown if `hasFeedbackAccess`
   - "Teaching Observation": shown if `hasObservationAccess`
4. **Tab panels**: Each renders its tab component, passing current filter
5. **Empty states**: No filter → blue Alert. Filter + no data → yellow Alert

---

## Filter.tsx

**Carried over** from existing `student-feedback/reports/_components/Filter.tsx` with additions.

Fields:
- **Term** — Select, searchable, clearable, required (asterisk)
- **Cycle** — Select, depends on termId
- **Schools** — MultiSelect, code + name labels
- **Program** — Select, depends on schoolIds
- **Module** — Select, depends on filter (carried over from student feedback — **only shown when feedback tab is active**)
- **Lecturer** — Select, searchable (**only shown when `hasFullAccess` is true**)

Behaviors (preserved from existing):
- Auto-selects active term on mount
- Auto-selects user's schools on mount (if non-full-access)
- Reset: changing schoolIds resets program/module; changing termId resets cycle
- URL state via `useQueryStates`

New prop: `activeTab` — controls whether Module field is shown (only for 'feedback' tab).

---

## Tab Shells

### OverviewTab.tsx
Receives `filter` prop. `useQuery` → `getOverviewData(filter)`, enabled when `filter.termId` truthy.

Layout:
1. `OverviewStats` — 4 combined stat cards
2. Row: `SchoolComparisonChart` (left) + `TrendChart` overlaid (right)
3. Row: `FeedbackHeatmap` (left) + `ObservationHeatmap` (right)
4. `SimpleLecturerTable` — combined rankings *(implemented in Phase 3)*

### StudentFeedbackTab.tsx
Receives `filter` prop. `useQuery` → `getFeedbackReportData(filter)`, enabled when `filter.termId` truthy.

Layout (**matches existing page exactly**):
1. `FeedbackOverviewStats` — 4 stat cards (carried over)
2. `FeedbackCategoryChart` — RadarChart (carried over)
3. `RatingHistogram` — bar chart of 1–5 star distribution (carried over, unchanged)
4. `QuestionBreakdown` — accordion per category with stacked bars (carried over, unchanged)
5. `FeedbackLecturerTable` — expandable rows *(implemented in Phase 3)*
6. `FeedbackExportButton` — Excel export *(carried over in Phase 3)*

### ObservationTab.tsx
Receives `filter` prop. `useQuery` → `getObservationReportData(filter)`, enabled when `filter.termId` truthy.

Layout (**matches existing observation page**):
1. `ObservationOverviewStats` — 4 stat cards (carried over)
2. `ObservationCategoryChart` — vertical BarChart with section colors (carried over)
3. `TrendChart` — single line for observation trend (carried over)
4. `ObservationLecturerTable` — *(implemented in Phase 3, enhanced with expandable rows)*
5. `CriteriaBreakdown` — *(implemented in Phase 3)*
6. `ObservationExportButton` — Excel export *(carried over in Phase 3)*

---

## Stats Components

### OverviewStats.tsx (NEW)
4 Mantine `Paper` cards in `Grid` (4 cols md+, 2 sm, 1 base):
- **Combined Average**: large number, 1 decimal, /5, color-coded (green >4, yellow 3-4, red <3)
- **Feedback Average**: same styling
- **Observation Average**: same styling
- **Lecturers Evaluated**: count with icon

### FeedbackOverviewStats.tsx (CARRIED OVER)
**Source**: `student-feedback/reports/_components/OverviewStats.tsx` — carry over with minimal prop renaming.

4-card layout:
- Total Responses (blue, IconMessageDots)
- Average Rating (color-coded, IconStar)
- Response Rate (cyan, IconPercentage)
- Lecturers Evaluated (violet, IconUsers)

### ObservationOverviewStats.tsx (CARRIED OVER)
**Source**: `observation-reports/_components/OverviewStats.tsx` — carry over with minimal prop renaming.

4-card layout:
- Total Observations (IconEye)
- Average Score (color-coded, IconStar)
- Lecturers Evaluated (IconUsers)
- Acknowledgment Rate (IconCheck)

---

## Chart Components

### FeedbackCategoryChart.tsx (CARRIED OVER)
**Source**: `student-feedback/reports/_components/CategoryChart.tsx` — carry over unchanged.
- Mantine `RadarChart` with polar grid
- Single series "rating" with blue.4 color, 20% opacity
- Axes: feedback categories, scale 0–5

### ObservationCategoryChart.tsx (CARRIED OVER)
**Source**: `observation-reports/_components/CategoryChart.tsx` — carry over unchanged.
- Mantine `BarChart` (vertical)
- Section-based colors: teaching_observation=blue, assessments=green, other=orange
- Reference line at y=3 "Satisfactory"

### RatingHistogram.tsx (CARRIED OVER — UNCHANGED)
**Source**: `student-feedback/reports/_components/RatingHistogram.tsx` — carry over as-is.
- Mantine `BarChart` with 1–5 star distribution
- Colors: red.6 (1★), orange.5 (2★), yellow.5 (3★), teal.5 (4★), green.6 (5★)

### QuestionBreakdown.tsx (CARRIED OVER — UNCHANGED)
**Source**: `student-feedback/reports/_components/QuestionBreakdown.tsx` — carry over as-is.
- Accordion grouped by category
- Per-question stacked horizontal bar chart (1–5 rating distribution)
- Category header with avg badge

### SchoolComparisonChart.tsx (NEW)
Mantine `BarChart`:
- X-axis: school codes
- Two grouped series: "Student Feedback" (blue) + "Teaching Observation" (teal)
- Paper wrapper, title "School Comparison"

### TrendChart.tsx (CARRIED OVER + ENHANCED)
**Source**: `observation-reports/_components/TrendChart.tsx` — carry over and add overlaid mode.

Props: `overlaid?: boolean`
- Overlaid (overview tab): two lines — feedback (blue) + observation (teal)
- Single (individual tabs): one line for that source
- X-axis: term codes, Y-axis: 0–5
- Reference line at 3 "Satisfactory"
- Paper wrapper, title "Score Trend"

### FeedbackHeatmap.tsx (NEW)
Mantine `Heatmap`:
- Rows: schools (by code), Columns: student feedback categories
- Cell values: avg rating 1–5
- Color scale: red (1) → yellow (3) → green (5)
- Numeric value in each cell
- Paper wrapper, title "Student Feedback by School"

### ObservationHeatmap.tsx (NEW)
Same as FeedbackHeatmap:
- Columns: observation categories
- Title: "Observations by School"

---

## Data Fetching Strategy

### Query Keys
- `['appraisal-report-access']` — access info
- `['appraisal-overview-data', filter]` — overview tab
- `['appraisal-feedback-data', filter]` — student feedback tab
- `['appraisal-observation-data', filter]` — observation tab
- `['feedback-cycles-by-term', termId]` — cycle options
- `['active-schools']` — school options
- `['programs-by-school', schoolIds]` — program options
- `['modules-for-filter', filter]` — module options (feedback tab only)

### Per-Tab Lazy Loading
Each tab manages its own `useQuery`. Data only fetched when tab is active + `termId` set. Tab switching reuses cached data (stale time: 30s).

---

## Implementation Checklist

- [ ] Backend extensions: add `moduleId` to filter, `ratingDistribution` + `questionBreakdown` to feedback data, `getModulesForFilter` action
- [ ] Read Mantine Heatmap docs
- [ ] Read Mantine BarChart docs (grouped bars)
- [ ] Read Mantine LineChart docs (multi-series)
- [ ] `page.tsx` — unified page with tabs, filter, access query
- [ ] `Filter.tsx` — carry over from student-feedback + add activeTab-conditional Module/Lecturer fields
- [ ] `OverviewTab.tsx` — overview tab shell + data query
- [ ] `StudentFeedbackTab.tsx` — feedback tab shell (wires carried-over components)
- [ ] `ObservationTab.tsx` — observation tab shell (wires carried-over + new components)
- [ ] `OverviewStats.tsx` — NEW combined 4 stat cards
- [ ] `FeedbackOverviewStats.tsx` — carry over from student-feedback OverviewStats
- [ ] `ObservationOverviewStats.tsx` — carry over from observation-reports OverviewStats
- [ ] `FeedbackCategoryChart.tsx` — carry over RadarChart from student-feedback
- [ ] `ObservationCategoryChart.tsx` — carry over BarChart from observation-reports
- [ ] `RatingHistogram.tsx` — carry over unchanged from student-feedback
- [ ] `QuestionBreakdown.tsx` — carry over unchanged from student-feedback
- [ ] `SchoolComparisonChart.tsx` — NEW grouped bar chart
- [ ] `TrendChart.tsx` — carry over from observation-reports + add overlaid mode
- [ ] `FeedbackHeatmap.tsx` — NEW heatmap
- [ ] `ObservationHeatmap.tsx` — NEW heatmap
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix`
