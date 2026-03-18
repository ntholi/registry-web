# Unified Appraisal Reports — Implementation Plan

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
    ├── Filter.tsx                    # Shared filter bar
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
    ├── RatingHistogram.tsx           # 1–5 star distribution
    ├── QuestionBreakdown.tsx         # Per-question analysis
    ├── CriteriaBreakdown.tsx         # Per-criterion analysis
    ├── SimpleLecturerTable.tsx       # Overview tab: no expandable detail
    ├── FeedbackLecturerTable.tsx     # Feedback tab: with expandable detail
    ├── ObservationLecturerTable.tsx  # Observation tab: with expandable detail
    ├── FeedbackLecturerDetail.tsx    # Expanded row detail for feedback
    ├── ObservationLecturerDetail.tsx # Expanded row detail for observation
    └── RadarChart.tsx                # Radar in lecturer detail modals
```

---

## 3. Files to Delete

Delete these entire directory trees after the unified feature is complete:

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
- `lecturerId?: string`

No `moduleId` — the module filter is removed entirely.

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
- `ratingDistribution: RatingDistribution[]` — rating (1–5), count, percentage
- `trendData: FeedbackTrendPoint[]` — termId, termCode, avgRating, responseCount
- `lecturerRankings: FeedbackLecturerRanking[]` — userId, lecturerName, schoolCode, schoolName, moduleCount, responseCount, avgRating, categoryAverages (Record<string, number>)
- `questionBreakdown: QuestionBreakdownItem[]` — questionId, questionText, categoryId, categoryName, categorySortOrder, questionSortOrder, avgRating, responseCount, distribution[]

### Teaching Observation Report Data
An interface for the Observation tab:
- `overview: ObservationOverviewStats` — totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate
- `categoryAverages: ObservationCategoryAverage[]` — categoryId, categoryName, section, avgRating, ratingCount, sortOrder
- `trendData: ObservationTrendPoint[]` — termId, termCode, avgScore, observationCount
- `lecturerRankings: ObservationLecturerRanking[]` — userId, lecturerName, schoolCode, schoolName, observationCount, avgScore, categoryAverages (Record<string, number>)
- `criteriaBreakdown: CriterionBreakdownItem[]` — criterionId, criterionText, categoryId, categoryName, section, avgRating, ratingCount

### Lecturer Detail Types

**Feedback Lecturer Detail** (shown when expanding a row in the feedback table):
- userId, lecturerName, schoolCode, avgRating
- `modules[]` — moduleCode, moduleName, avgRating, responseCount, className
- `questions[]` — questionId, questionText, categoryName, avgRating, overallAvgRating, responseCount, distribution[]
- `comments[]` — moduleCode, moduleName, className, comment
- `radarData` — array of { category, feedbackScore, observationScore } for the radar chart

**Observation Lecturer Detail** (shown when expanding a row in the observation table):
- userId, lecturerName, schoolCode, avgScore
- `observations[]` — observationId, moduleName, moduleCode, cycleName, avgScore, status, strengths, improvements, recommendations, trainingArea
- `criteriaScores[]` — criterionId, criterionText, categoryName, section, avgRating
- `radarData` — same shape as feedback radar for comparison

### Shared Sub-types
- `RatingDistribution` — rating: number, count: number, percentage: number
- `HeatmapCell` — schoolId: number, schoolCode: string, categoryId: string, categoryName: string, avgRating: number
- `TrendPoint` — termId: number, termCode: string, feedbackAvg: number, observationAvg: number
- `CycleOption` — id: string, name: string

---

## 5. Repository (`_server/repository.ts`)

This file is the only one that imports `db` and performs SQL queries. It contains a single class that combines and replaces the queries from both old repositories.

### Shared Helper: `buildFilterConditions(filter)`
Takes the unified filter and returns an array of Drizzle conditions. Largely the same pattern as existing repositories — join feedbackCycles for termId, use schoolIds/programId/lecturerId filters.

### Method: `getOverviewData(filter)`
Purpose: Fetch all data for the Overview tab in a single call or minimal parallel calls.

**Sub-queries** (run in parallel via `Promise.all`):

1. **feedbackAvg**: Query `studentFeedbackResponses` → joins through passphrases → feedbackCycles → structureSemesters → programs → schools. `SELECT avg(rating)` where rating is not null. Apply filter conditions. Also count distinct lecturers.

2. **observationAvg**: Query `observationRatings` → joins through observations → feedbackCycles → assignedModules → semesterModules → programs → schools. `SELECT avg(rating)` where status in ('submitted','acknowledged') and rating not null. Apply filter conditions.

3. **schoolComparison**: Two queries (one per source), grouped by school. Each returns schoolId, schoolCode, schoolName, avg rating. Merge the two result sets in JS by schoolId — for each school, produce an object with both feedbackAvg and observationAvg. Schools missing from one source get 0.

4. **trendData**: Two queries (one per source), grouped by `feedbackCycles.termId` and `terms.code`. Returns termId, termCode, avgRating per source. Merge in JS by termId into a single array with both feedbackAvg and observationAvg per term.

5. **feedbackHeatmap**: Query student_feedback_responses grouped by (school, studentFeedbackCategory). Returns schoolCode, categoryName, avgRating. One row per school×category cell.

6. **observationHeatmap**: Query observation_ratings grouped by (school, observationCategory). Returns schoolCode, categoryName, avgRating. One row per school×category cell.

7. **lecturerRankings**: Two queries — one for feedback avg per lecturer, one for observation avg per lecturer. Merge by userId. Calculate combinedAvg as `(feedbackAvg + observationAvg) / 2`. Sort descending by combinedAvg. If a lecturer only has data from one source, the missing source contributes 0 and combined = that source's score alone (or we could omit — decision: include with disclaimer).

Compose all sub-results into the `OverviewData` type and return.

### Method: `getFeedbackReportData(filter)`
Purpose: Fetch all data for the Student Feedback tab.

This is essentially the same set of queries that the old `StudentFeedbackReportRepository` had, minus the `getModulesForFilter` (module filter removed):

1. **getOverviewStats** — totalResponses, avgRating, responseRate (from passphrase used%), lecturersEvaluated
2. **getCategoryAverages** — grouped by studentFeedbackCategory, ordered by sortOrder
3. **getRatingDistribution** — grouped by rating 1–5, with counts and percentages
4. **getFeedbackTrendData** (NEW) — grouped by feedbackCycles.termId and terms.code. Query studentFeedbackResponses → passphrases → feedbackCycles → terms. avgRating and responseCount per term. This is a new query that didn't exist in the old student feedback reports.
5. **getLecturerRankings** — same complex query: per-lecturer avgRating, plus per-category averages as a Record. Includes moduleCount and responseCount.
6. **getQuestionBreakdown** — per-question avgRating and distribution array

Run 1–6 in parallel via `Promise.all` and return the composed result.

### Method: `getObservationReportData(filter)`
Purpose: Fetch all data for the Teaching Observation tab.

Same queries as old `ObservationReportRepository`:

1. **getOverviewStats** — totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate
2. **getCategoryAverages** — grouped by observationCategory and section, ordered by section then sortOrder
3. **getObservationTrendData** — grouped by term (already existed)
4. **getLecturerRankings** — per-lecturer avgScore, plus per-category averages, observationCount
5. **getCriteriaBreakdown** (was unused in old UI, now exposed) — per-criterion avgRating and ratingCount, with categoryName and section

Run 1–5 in parallel via `Promise.all` and return.

### Method: `getFeedbackLecturerDetail(userId, filter)`
Exactly the same as old `getLecturerDetail`: returns modules[], questions[], comments[] for one lecturer. **Plus** add a sub-query for radar data: fetch observation category averages for this same lecturer (by userId) so the radar chart can compare feedback categories vs observation categories.

Radar data query: For the given userId, query observationRatings → observationCriteria → observationCategories, grouped by category. Return categoryName + avgRating. Then also query studentFeedbackResponses for this lecturer grouped by studentFeedbackCategory. The radar chart component will overlay both series.

### Method: `getObservationLecturerDetail(userId, filter)`
New method that mirrors the feedback detail pattern:
- **observations[]**: Query observations for this lecturer (via assignedModules.userId), join modules and feedbackCycles for names. Return observation id, moduleName, moduleCode, cycleName, avg score (from observationRatings for that observation), status, and qualitative fields (strengths, improvements, recommendations, trainingArea).
- **criteriaScores[]**: Query observationRatings for this lecturer, grouped by criterion. Returns criterionId, criterionText, categoryName, section, avgRating.
- **radarData**: Same radar data as above (both sources), so the radar chart renders identically.

### Method: `getCyclesByTerm(termId)`
Same as both old repos — returns `{ id, name }[]` from feedbackCycles where termId matches.

---

## 6. Service (`_server/service.ts`)

### Access Control Logic

The service checks the user's session to determine access level:

1. **`hasFullAccess(session)`**: Returns true if user.role is 'admin' or 'human_resource', OR if they have the 'update' action on either report permission. These users see all lecturers' data.

2. **`hasFeedbackAccess(session)`**: Returns true if user has 'student-feedback-reports' → 'read' permission, OR is admin/HR.

3. **`hasObservationAccess(session)`**: Returns true if user has 'teaching-observation-reports' → 'read' permission, OR is admin/HR.

4. **Lecturer self-scoping**: If user does NOT have full access, the filter is modified to include `lecturerId: session.user.id` so they only see their own data.

### Methods

Each method wraps the repository call with `withPermission`. The permission requirement is: user must have at least one of the two report-read permissions.

- **`getOverviewData(filter)`** — calls `repository.getOverviewData(scopedFilter)`. Permission: requires at least one report permission.
- **`getFeedbackReportData(filter)`** — calls `repository.getFeedbackReportData(scopedFilter)`. Permission: 'student-feedback-reports' → 'read'.
- **`getObservationReportData(filter)`** — calls `repository.getObservationReportData(scopedFilter)`. Permission: 'teaching-observation-reports' → 'read'.
- **`getFeedbackLecturerDetail(userId, filter)`** — only full-access users can view other lecturers; non-full-access users can only request their own userId. Permission: 'student-feedback-reports' → 'read'.
- **`getObservationLecturerDetail(userId, filter)`** — same access rules. Permission: 'teaching-observation-reports' → 'read'.
- **`getCyclesByTerm(termId)`** — any report permission.
- **`getAccessInfo()`** — returns `{ hasFullAccess, hasFeedbackAccess, hasObservationAccess }` to the client so tabs can be shown/hidden.

---

## 7. Actions (`_server/actions.ts`)

Thin `'use server'` wrappers. One function per service method:

- `getOverviewData(filter)` → `service.getOverviewData(filter)`
- `getFeedbackReportData(filter)` → `service.getFeedbackReportData(filter)`
- `getObservationReportData(filter)` → `service.getObservationReportData(filter)`
- `getFeedbackLecturerDetail(userId, filter)` → `service.getFeedbackLecturerDetail(userId, filter)`
- `getObservationLecturerDetail(userId, filter)` → `service.getObservationLecturerDetail(userId, filter)`
- `getCyclesByTerm(termId)` → `service.getCyclesByTerm(termId)`
- `getReportAccessInfo()` → `service.getAccessInfo()`

---

## 8. Page (`page.tsx`)

A `'use client'` component structured as follows:

### State
- Filter state managed via `useQueryStates` from `nuqs` (URL-synced), same pattern as existing filters.
- Active tab state: `useState<'overview' | 'feedback' | 'observation'>('overview')`.

### Data Fetching
- One `useQuery` for `getReportAccessInfo()` — determines which tabs to show.
- Tab-specific queries are lazy-loaded inside each tab component (only fetched when that tab is active and filter is applied).

### Layout
1. **Header**: Title "Appraisal Reports" (or "My Appraisal Results" for non-full-access users), subtitle text.
2. **Filter bar**: The shared `Filter` component, placed below the header.
3. **Tabs**: Mantine `Tabs` component. Each tab's value maps to 'overview', 'feedback', 'observation'. Tabs are conditionally rendered based on `accessInfo`:
   - "Overview" tab: always shown if user has at least one permission.
   - "Student Feedback" tab: shown if `hasFeedbackAccess`.
   - "Teaching Observation" tab: shown if `hasObservationAccess`.
4. **Tab panels**: Each panel renders its corresponding tab component, passing the current filter.
5. **Empty states**: If no filter applied, show blue Alert. If filter applied but no data, show yellow Alert.

---

## 9. Components — Detailed Specifications

### 9.1 Filter.tsx
Same pattern as existing report filters, but simplified:
- Term selector (Select, searchable, clearable, required — with asterisk)
- Cycle selector (Select, depends on termId)
- Schools multi-select (MultiSelect, with code + name)
- Program selector (Select, depends on schoolIds)
- Lecturer selector (Select, only shown when hasFullAccess is true)
- Auto-selects active term on mount
- Auto-selects user's schools on mount
- Pushes state to URL via nuqs `useQueryStates`
- Calls `onFilterChange` callback whenever any filter value changes
- If `hideAdvanced` is true, only show Term selector (for lecturers with self-view)

### 9.2 OverviewTab.tsx
Receives `filter` prop. Uses `useQuery` to call `getOverviewData(filter)`, enabled when filter.termId is truthy.

Layout:
1. `OverviewStats` — 4 stat cards
2. Row of 2 charts: `SchoolComparisonChart` (left) + `TrendChart` with overlaid lines (right)
3. Row of 2 heatmaps: `FeedbackHeatmap` (left) + `ObservationHeatmap` (right)
4. `SimpleLecturerTable` — basic rankings table

### 9.3 StudentFeedbackTab.tsx
Receives `filter` prop. Uses `useQuery` to call `getFeedbackReportData(filter)`, enabled when filter.termId is truthy.

Layout:
1. `FeedbackStats` — 4 stat cards (totalResponses, avgRating, responseRate, lecturersEvaluated)
2. Row of 2 charts: `CategoryChart` for feedback categories (left) + `RatingHistogram` (right)
3. `TrendChart` — single line for feedback trend across terms
4. `FeedbackLecturerTable` — sortable, with expandable rows that show `FeedbackLecturerDetail`
5. `QuestionBreakdown` — per-question analysis with accordions grouped by category

### 9.4 ObservationTab.tsx
Receives `filter` prop. Uses `useQuery` to call `getObservationReportData(filter)`, enabled when filter.termId is truthy.

Layout:
1. `ObservationStats` — 4 stat cards (totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate)
2. `CategoryChart` for observation categories (grouped/colored by section)
3. `TrendChart` — single line for observation trend across terms
4. `ObservationLecturerTable` — sortable, with expandable rows that show `ObservationLecturerDetail`
5. `CriteriaBreakdown` — per-criterion analysis, grouped by category/section with accordions

### 9.5 OverviewStats.tsx
Renders 4 Mantine `Paper` cards in a `Grid` (4 columns on md+, 2 on sm, 1 on base):
- **Combined Average**: Large number with 1 decimal, rating out of 5, color-coded (green >4, yellow 3-4, red <3).
- **Feedback Average**: Same styling.
- **Observation Average**: Same styling.
- **Lecturers Evaluated**: Count with icon.

### 9.6 FeedbackStats.tsx
Same 4-card layout pattern:
- Total Responses (count)
- Average Rating (X.XX / 5)
- Response Rate (XX%)
- Lecturers Evaluated (count)

### 9.7 ObservationStats.tsx
Same 4-card layout pattern:
- Total Observations (count)
- Average Score (X.XX / 5)
- Lecturers Evaluated (count)
- Acknowledgment Rate (XX%)

### 9.8 SchoolComparisonChart.tsx
A Mantine `BarChart` component:
- X-axis: school codes
- Two data series: "Student Feedback" (one color) and "Teaching Observation" (another color)
- Values: average rating per school
- Bar chart with grouped bars (not stacked)
- Paper wrapper with title "School Comparison"
- Responsive sizing

### 9.9 TrendChart.tsx
A Mantine `LineChart` component:
- Props accept an `overlaid?: boolean` flag
  - When overlaid (overview tab): two lines — "Student Feedback" and "Teaching Observation" — with different colors
  - When single (individual tabs): one line for that source only
- X-axis: term codes
- Y-axis: average rating (0–5 scale)
- Paper wrapper with title "Score Trend"
- Data series use `dataKey` to reference the correct field names

### 9.10 FeedbackHeatmap.tsx
A Mantine `Heatmap` component (from `@mantine/charts`):
- Rows: schools (labeled by code)
- Columns: student feedback categories (labeled by name)
- Cell values: average rating (1–5)
- Color scale: red (1) → yellow (3) → green (5)
- Paper wrapper with title "Student Feedback by School"
- Display the numeric value inside each cell

### 9.11 ObservationHeatmap.tsx
Same structure as FeedbackHeatmap but:
- Columns: observation categories
- Data: observation category averages per school
- Title: "Observations by School"

### 9.12 CategoryChart.tsx
A Mantine `BarChart` component:
- Horizontal bars, one per category
- Label: category name, Value: avg rating
- Color intensity based on value
- Paper wrapper
- Reusable: accepts `data` prop with categoryName + avgRating
- For observation tab: optionally group by section with visual separators

### 9.13 RatingHistogram.tsx
A Mantine `BarChart` component:
- 5 bars for ratings 1–5
- Each bar labeled "1 Star" through "5 Stars"
- Values: count of responses
- Each bar has a different shade color (red for 1, orange for 2, yellow for 3, light green for 4, green for 5)
- Percentage label inside or above bar
- Paper wrapper with title "Rating Distribution"

### 9.14 QuestionBreakdown.tsx
Structure: Mantine `Accordion` grouped by category.
- Each accordion item = one feedback category
- Inside each category: a table/list of questions with columns: Question Text | Avg Rating | Responses | Rating Distribution (mini bar chart or colored segments)
- Rating distribution shown as small inline segments (proportional width for 1-5 stars)
- Sortable by avg rating
- Paper wrapper with title "Question Analysis"

### 9.15 CriteriaBreakdown.tsx
Same structure as QuestionBreakdown but:
- Accordion items grouped by section first, then by category within each section
- Each criterion row: Criterion Text | Avg Rating | Rating Count
- No distribution (observation ratings don't have per-criterion distribution in the current schema, but we can compute it)
- Paper wrapper with title "Criteria Analysis"
- Sections: "Teaching Observation", "Assessments", "Other" (matching the observation category section enum)

### 9.16 SimpleLecturerTable.tsx
A Mantine `Table` inside a Paper:
- Columns: Rank | Lecturer | School | Feedback Avg | Observation Avg | Combined Avg
- Sortable by clicking column headers (default: Combined Avg descending)
- No expandable rows, no click action, no detail modal
- Color-code the averages (green/yellow/red)
- Searchable via a search input above the table
- Shows top N lecturers with "Show All" toggle if >20

### 9.17 FeedbackLecturerTable.tsx
A Mantine `Table` inside a Paper, with expandable rows:
- Columns: Rank | Lecturer | School | Modules | Responses | Avg Rating | (per-category columns)
- Sortable by all numeric columns
- Searchable
- When a row is clicked/expanded, it renders `FeedbackLecturerDetail` inline below the row
- The expanded detail fetches data lazily via `getFeedbackLecturerDetail(userId, filter)` using `useQuery`

### 9.18 ObservationLecturerTable.tsx
Same pattern as FeedbackLecturerTable:
- Columns: Rank | Lecturer | School | Observations | Avg Score | (per-category columns)
- Expandable rows that render `ObservationLecturerDetail`
- Lazy-fetches `getObservationLecturerDetail(userId, filter)` on expand

### 9.19 FeedbackLecturerDetail.tsx
Rendered inside an expanded table row. Content:

1. **Header**: Lecturer name, school, overall avg rating (large badge)
2. **Radar Chart** (`RadarChart` component): Comparing this lecturer's feedback category scores vs observation category scores
3. **Modules section**: Table of modules taught — Module Code | Module Name | Class | Avg Rating | Responses
4. **Per-Question section**: Accordion by category showing each question's avg for this lecturer vs overall avg
5. **Comments section**: List of student comments with module and class context, ordered newest first. Displayed in Mantine `Blockquote` or similar styled container.

### 9.20 ObservationLecturerDetail.tsx
Rendered inside an expanded table row. Content:

1. **Header**: Lecturer name, school, overall avg score (large badge)
2. **Radar Chart**: Same comparison as feedback detail — feedback category scores overlaid with observation category scores
3. **Observations section**: Accordion items per observation. Each shows:
   - Module name + code, Cycle name, Status badge, Avg score
   - Qualitative fields (if not null): Strengths, Areas for Improvement, Recommendations, Training Area — each as labeled text blocks
4. **Criteria Scores section**: Table of all criteria with Category | Criterion | This Lecturer's Avg | Overall Avg

### 9.21 RadarChart.tsx
A Mantine `RadarChart` component:
- Axes: category names (the union of feedback and observation categories)
- Two data series: "Student Feedback" (one color) and "Teaching Observation" (another color)
- Each axis goes from 0 to 5
- If a lecturer has no data for one source, that series is omitted
- Small, compact display suitable for embedding inside a detail row
- Label each axis with short category names

---

## 10. Permission & Access Behavior

### Tab Visibility
On page load, `getReportAccessInfo()` returns:
- `hasFullAccess: boolean` — admin/HR/has update permission
- `hasFeedbackAccess: boolean` — has student-feedback-reports read permission
- `hasObservationAccess: boolean` — has teaching-observation-reports read permission

Tab rendering rules:
- **Overview**: Shown if user has at least one permission. If missing one source, that source's data shows "No access" or zeros.
- **Student Feedback**: Shown only if `hasFeedbackAccess` is true.
- **Teaching Observation**: Shown only if `hasObservationAccess` is true.

### Lecturer Self-View
If `hasFullAccess` is false:
- Title changes to "My Appraisal Results"
- Filter hides advanced fields (only Term shown via `hideAdvanced=true` on Filter)
- Lecturer tables show only the user's own row
- Lecturer detail is auto-expanded for their row (or shown directly without needing to click)

---

## 11. Data Fetching Strategy

### Per-Tab Lazy Loading
Each tab component manages its own `useQuery`. Data is only fetched when:
1. The tab is active (current tab === this tab)
2. The filter has at least `termId` set

This prevents unnecessary API calls when switching tabs.

### Query Keys
- `['appraisal-report-access']` — access info
- `['appraisal-overview-data', filter]` — overview tab
- `['appraisal-feedback-data', filter]` — student feedback tab
- `['appraisal-observation-data', filter]` — observation tab
- `['appraisal-feedback-detail', userId, filter]` — feedback lecturer detail
- `['appraisal-observation-detail', userId, filter]` — observation lecturer detail
- `['feedback-cycles-by-term', termId]` — cycle options
- `['active-schools']` — school options
- `['programs-by-school', schoolIds]` — program options

### Caching
TanStack Query default caching applies. Tab switching re-uses cached data. Stale time can be set to 30s for report data.

---

## 12. Chart Library Details

All charts use **Mantine Charts** (`@mantine/charts`) which wraps Recharts:
- `BarChart` from `@mantine/charts` for bar charts and histograms
- `LineChart` from `@mantine/charts` for trend lines
- `RadarChart` from `@mantine/charts` for radar comparison
- `Heatmap` from `@mantine/charts` for heatmaps

Before implementing any chart, read the relevant Mantine Charts documentation URL listed in `copilot-instructions.md`.

Color scheme considerations:
- Use Mantine theme colors (e.g., `blue.6`, `teal.6`, `orange.6`, `red.6`, `green.6`)
- Student Feedback series: `blue` palette
- Teaching Observation series: `teal` palette
- Combined/overview: neutral `violet` or `indigo`
- All colors must work in dark mode

---

## 13. Migration Checklist

### Pre-Implementation
- [ ] Read Mantine Heatmap docs (confirm API)
- [ ] Read Mantine RadarChart docs (confirm API)
- [ ] Read Mantine BarChart docs for grouped bars
- [ ] Read Mantine LineChart docs for multi-series

### Implementation Order
1. Types (`_lib/types.ts`)
2. Repository (`_server/repository.ts`) — carry over queries from both old repos plus new ones (trend for feedback, heatmaps, school comparison, radar data)
3. Service (`_server/service.ts`) — permission gates and scoping
4. Actions (`_server/actions.ts`) — thin wrappers
5. Filter component
6. Stats components (3 variants)
7. Chart components (SchoolComparison, TrendChart, Heatmaps, CategoryChart, RatingHistogram, RadarChart)
8. Breakdown components (QuestionBreakdown, CriteriaBreakdown)
9. Lecturer tables (Simple, Feedback, Observation)
10. Lecturer detail components (Feedback, Observation)
11. Tab components (Overview, StudentFeedback, Observation)
12. Main page.tsx
13. Update appraisals.config.ts nav
14. Delete old directories
15. Run `pnpm tsc --noEmit && pnpm lint:fix`

### Post-Implementation
- [ ] Verify all tabs load with data
- [ ] Verify lecturer self-view works
- [ ] Verify permission-based tab hiding
- [ ] Verify filter URL persistence
- [ ] Verify all charts render (light + dark mode)
- [ ] Verify heatmaps render correctly
- [ ] Verify lecturer detail expand/collapse
- [ ] Run type check and linting clean
