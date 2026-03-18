# Phase 2: Page Layout, Filters & Visualizations

> Page structure, Filter bar, Tab shell components, Stats cards, and all Chart/Heatmap components.

---

## Page (`page.tsx`)

A `'use client'` component.

### State
- Filter state via `useQueryStates` from `nuqs` (URL-synced).
- Active tab: `useState<'overview' | 'feedback' | 'observation'>('overview')`.

### Data Fetching
- `useQuery` for `getReportAccessInfo()` — determines which tabs to show.
- Tab-specific queries live inside each tab component (lazy — only fetch when active + filter applied).

### Layout
1. **Header**: "Appraisal Reports" (or "My Appraisal Results" for non-full-access), subtitle.
2. **Filter bar**: `<Filter />` below the header.
3. **Tabs**: Mantine `Tabs`. Values: 'overview', 'feedback', 'observation'. Conditionally rendered:
   - "Overview": always shown if user has at least one permission.
   - "Student Feedback": shown if `hasFeedbackAccess`.
   - "Teaching Observation": shown if `hasObservationAccess`.
4. **Tab panels**: Each renders its tab component, passing current filter.
5. **Empty states**: No filter → blue Alert. Filter applied but no data → yellow Alert.

---

## Filter.tsx

Same pattern as existing report filters, simplified (no moduleId):

- **Term** — Select, searchable, clearable, required (asterisk)
- **Cycle** — Select, depends on termId
- **Schools** — MultiSelect, code + name labels
- **Program** — Select, depends on schoolIds
- **Lecturer** — Select, searchable — **only shown when `hasFullAccess` is true**

Behaviors:
- Auto-selects active term on mount
- Auto-selects user's schools on mount
- Pushes state to URL via nuqs `useQueryStates`
- Calls `onFilterChange` callback on any value change

---

## Tab Components

### OverviewTab.tsx
Receives `filter` prop. `useQuery` → `getOverviewData(filter)`, enabled when `filter.termId` is truthy.

Layout:
1. `OverviewStats` — 4 stat cards
2. Row: `SchoolComparisonChart` (left) + `TrendChart` overlaid (right)
3. Row: `FeedbackHeatmap` (left) + `ObservationHeatmap` (right)
4. `SimpleLecturerTable` — basic rankings *(implemented in Phase 3)*

### StudentFeedbackTab.tsx
Receives `filter` prop. `useQuery` → `getFeedbackReportData(filter)`.

Layout:
1. `FeedbackStats` — 4 stat cards
2. `CategoryChart` for feedback categories
3. `TrendChart` — single line for feedback trend (replaces RatingHistogram)
4. `FeedbackLecturerTable` — expandable rows *(implemented in Phase 3)*

### ObservationTab.tsx
Receives `filter` prop. `useQuery` → `getObservationReportData(filter)`.

Layout:
1. `ObservationStats` — 4 stat cards
2. `CategoryChart` for observation categories (grouped by section)
3. `TrendChart` — single line for observation trend
4. `ObservationLecturerTable` — expandable rows *(implemented in Phase 3)*
5. `CriteriaBreakdown` *(implemented in Phase 3)*

---

## Stats Components

### OverviewStats.tsx
4 Mantine `Paper` cards in `Grid` (4 cols md+, 2 sm, 1 base):
- **Combined Average**: large number, 1 decimal, /5, color-coded (green >4, yellow 3-4, red <3)
- **Feedback Average**: same styling
- **Observation Average**: same styling
- **Lecturers Evaluated**: count with icon

### FeedbackStats.tsx
4-card layout:
- Total Responses (count)
- Average Rating (X.XX / 5)
- Response Rate (XX%)
- Lecturers Evaluated (count)

### ObservationStats.tsx
4-card layout:
- Total Observations (count)
- Average Score (X.XX / 5)
- Lecturers Evaluated (count)
- Acknowledgment Rate (XX%)

---

## Chart Components

### SchoolComparisonChart.tsx
Mantine `BarChart`:
- X-axis: school codes
- Two series: "Student Feedback" + "Teaching Observation" (grouped bars, not stacked)
- Values: avg rating per school
- Paper wrapper, title "School Comparison"

### TrendChart.tsx
Mantine `LineChart`:
- Props: `overlaid?: boolean`
  - Overlaid (overview): two lines — feedback + observation, different colors
  - Single (individual tabs): one line
- X-axis: term codes, Y-axis: 0–5 scale
- Paper wrapper, title "Score Trend"

### FeedbackHeatmap.tsx
Mantine `Heatmap`:
- Rows: schools (by code), Columns: student feedback categories
- Cell values: avg rating 1–5
- Color scale: red (1) → yellow (3) → green (5)
- Numeric value inside each cell
- Paper wrapper, title "Student Feedback by School"

### ObservationHeatmap.tsx
Same as FeedbackHeatmap:
- Columns: observation categories
- Title: "Observations by School"

### CategoryChart.tsx
Mantine `BarChart`:
- Horizontal bars, one per category
- Label: category name, Value: avg rating
- Reusable: accepts `data` prop with categoryName + avgRating
- For observation tab: optionally group by section
- Paper wrapper

---

## Chart Library Notes

All charts use `@mantine/charts`. Before implementing, read the relevant Mantine Charts docs:
- `BarChart` for grouped bars
- `LineChart` for multi-series
- `Heatmap` for heatmaps

Color scheme:
- Student Feedback series: `blue` palette
- Teaching Observation series: `teal` palette
- Combined/overview: `violet` or `indigo`
- All must work in dark mode

---

## Data Fetching Strategy

### Query Keys (for components in this phase)
- `['appraisal-report-access']` — access info
- `['appraisal-overview-data', filter]` — overview tab
- `['appraisal-feedback-data', filter]` — student feedback tab
- `['appraisal-observation-data', filter]` — observation tab
- `['feedback-cycles-by-term', termId]` — cycle options
- `['active-schools']` — school options
- `['programs-by-school', schoolIds]` — program options

### Caching
TanStack Query defaults. Tab switching reuses cached data. Stale time: 30s for report data.

---

## Implementation Checklist

- [ ] Read Mantine Heatmap docs
- [ ] Read Mantine BarChart docs (grouped bars)
- [ ] Read Mantine LineChart docs (multi-series)
- [ ] `page.tsx` — main page with tabs + filter + access query
- [ ] `Filter.tsx` — shared filter bar
- [ ] `OverviewTab.tsx` — overview tab shell + data query
- [ ] `StudentFeedbackTab.tsx` — feedback tab shell + data query
- [ ] `ObservationTab.tsx` — observation tab shell + data query
- [ ] `OverviewStats.tsx` — 4 stat cards
- [ ] `FeedbackStats.tsx` — 4 stat cards
- [ ] `ObservationStats.tsx` — 4 stat cards
- [ ] `SchoolComparisonChart.tsx` — grouped bar chart
- [ ] `TrendChart.tsx` — line chart (overlaid + single modes)
- [ ] `FeedbackHeatmap.tsx` — schools × categories heatmap
- [ ] `ObservationHeatmap.tsx` — schools × categories heatmap
- [ ] `CategoryChart.tsx` — horizontal bar chart
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix`
