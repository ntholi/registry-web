# Unified Appraisal Reports — Session 3: Frontend (Page, Filter, Tabs, Stats, Charts)

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

## 9. Components — Part 1: Filter, Tabs, Stats, Charts

### 9.1 Filter.tsx
Same pattern as existing report filters, but simplified (no moduleId):
- Term selector (Select, searchable, clearable, required — with asterisk)
- Cycle selector (Select, depends on termId)
- Schools multi-select (MultiSelect, with code + name)
- Program selector (Select, depends on schoolIds)
- Lecturer selector (Select, searchable — **only shown when `hasFullAccess` is true**)
- Auto-selects active term on mount
- Auto-selects user's schools on mount
- Pushes state to URL via nuqs `useQueryStates`
- Calls `onFilterChange` callback whenever any filter value changes
- Self-view users (non-full-access): same tabs, same components, data auto-scoped to their userId by the service layer. Filter shows all fields except Lecturer selector.

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
2. `CategoryChart` for feedback categories
3. `TrendChart` — single line for feedback trend across terms (replaces RatingHistogram)
4. `FeedbackLecturerTable` — sortable, with expandable rows showing `FeedbackLecturerDetail`

> **Removed**: standalone `QuestionBreakdown` section — question analysis now lives exclusively inside each lecturer's expanded detail row.

### 9.4 ObservationTab.tsx
Receives `filter` prop. Uses `useQuery` to call `getObservationReportData(filter)`, enabled when filter.termId is truthy.

Layout:
1. `ObservationStats` — 4 stat cards (totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate)
2. `CategoryChart` for observation categories (grouped/colored by section)
3. `TrendChart` — single line for observation trend across terms
4. `ObservationLecturerTable` — sortable, with expandable rows showing `ObservationLecturerDetail`
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
