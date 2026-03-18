# Unified Appraisal Reports — Session 4: Frontend (Tables, Details, Permissions, Strategy)

---

## 9. Components — Part 2: Tables, Details, Breakdown, Radar

### 9.13 CriteriaBreakdown.tsx
Mantine `Accordion` grouped by section first, then by category within each section:
- Each criterion row: Criterion Text | Avg Rating | Rating Count
- Paper wrapper with title "Criteria Analysis"
- Sections: "Teaching Observation", "Assessments", "Other" (matching the observation category section enum)

### 9.14 SimpleLecturerTable.tsx
A Mantine `Table` inside a Paper:
- Columns: Rank | Lecturer | School | Feedback Avg | Observation Avg | Combined Avg
- Sortable by clicking column headers (default: Combined Avg descending)
- No expandable rows, no click action, no detail modal
- Color-code the averages (green/yellow/red)
- Searchable via a search input above the table
- Shows top N lecturers with "Show All" toggle if >20

### 9.15 FeedbackLecturerTable.tsx
A Mantine `Table` inside a Paper, with expandable rows:
- Columns: Rank | Lecturer | School | Modules | Responses | Avg Rating | (per-category columns)
- Sortable by all numeric columns
- Searchable
- When a row is clicked/expanded, it renders `FeedbackLecturerDetail` inline below the row
- The expanded detail fetches data lazily via `getFeedbackLecturerDetail(userId, filter)` using `useQuery`

### 9.16 ObservationLecturerTable.tsx
Same pattern as FeedbackLecturerTable:
- Columns: Rank | Lecturer | School | Observations | Avg Score | (per-category columns)
- Expandable rows that render `ObservationLecturerDetail`
- Lazy-fetches `getObservationLecturerDetail(userId, filter)` on expand

### 9.17 FeedbackLecturerDetail.tsx
**Preserved from existing `LecturerExpandedDetail.tsx`** — the current component is carried over with its exact tab structure and UI, plus one new first tab:

Rendered inside an expanded table row. Content is organized in **4 tabs**:

1. **Overview tab** (NEW — first tab, default):
   - `RadarChart` component comparing this lecturer's feedback category scores vs observation category scores
   - Summary badges: overall avg rating, module count, response count

2. **Questions tab** (PRESERVED — existing):
   - Questions grouped by category, each category with a header showing category avg badge
   - Each question rendered as a `QuestionRatingRow` card with:
     - Question text
     - Two progress bars: "Lecturer" (colored by rating) vs "Overall" (gray)
     - Diff badge showing +/- compared to overall average
     - Response count

3. **Modules tab** (PRESERVED — existing):
   - Striped table: Module Code | Module Name | Avg Rating (badge) | Responses | Class

4. **Comments tab** (PRESERVED — existing):
   - Scrollable card list (max height 400px) of student comments
   - Each comment card: module code + name header, class badge, comment text (pre-wrap)

### 9.18 ObservationLecturerDetail.tsx
**New component** — rendered inside an expanded table row. Content organized in **4 tabs**:

1. **Overview tab** (default):
   - `RadarChart` component: feedback category scores overlaid with observation category scores
   - Summary badges: overall avg score, observation count, acknowledgment status

2. **Observations tab**:
   - Accordion items, one per observation for this lecturer
   - Each observation shows: Module name + code, Cycle name, Status badge, Avg score
   - Qualitative fields (if not null): Strengths, Areas for Improvement, Recommendations, Training Area — each as labeled text blocks

3. **Criteria tab**:
   - Table of all criteria grouped by section → category
   - Columns: Category | Criterion | This Lecturer's Avg | Overall Avg
   - Color-coded difference badges

4. **Feedback Cross-ref tab**:
   - Shows this lecturer's student feedback data for side-by-side comparison
   - Reuses the same data shape from `getFeedbackLecturerDetail(userId, filter)`
   - Renders: modules table (same as feedback detail), question breakdown (same as feedback detail), comments list
   - If no feedback data exists for this lecturer, show "No student feedback data available" message

### 9.19 RadarChart.tsx
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
- Same tabs, same components — data is automatically scoped to the user's own userId by the service layer
- Filter shows all fields except the Lecturer selector (which is only for full-access users)
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
- `BarChart` from `@mantine/charts` for bar charts
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
2. Repository (`_server/repository.ts`) — carry over queries from both old repos plus new ones (trend for feedback, heatmaps, school comparison, radar data, feedback cross-ref for observation detail)
3. Service (`_server/service.ts`) — permission gates and scoping
4. Actions (`_server/actions.ts`) — thin wrappers
5. Filter component
6. Stats components (3 variants)
7. Chart components (SchoolComparison, TrendChart, Heatmaps, CategoryChart, RadarChart)
8. CriteriaBreakdown component
9. Lecturer tables (Simple, Feedback, Observation)
10. FeedbackLecturerDetail (preserve existing + add Overview tab with RadarChart)
11. ObservationLecturerDetail (new — 4 tabs: Overview, Observations, Criteria, Feedback Cross-ref)
12. Tab components (Overview, StudentFeedback, Observation)
13. Main page.tsx
14. Update appraisals.config.ts nav
15. Delete old directories (after full testing)
16. Run `pnpm tsc --noEmit && pnpm lint:fix`

### Post-Implementation
- [ ] Verify all tabs load with data
- [ ] Verify lecturer self-view works
- [ ] Verify permission-based tab hiding
- [ ] Verify filter URL persistence
- [ ] Verify all charts render (light + dark mode)
- [ ] Verify heatmaps render correctly
- [ ] Verify lecturer detail expand/collapse
- [ ] Run type check and linting clean
