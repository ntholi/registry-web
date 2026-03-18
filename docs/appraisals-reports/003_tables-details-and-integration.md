# Phase 3: Tables, Lecturer Details & Integration

> Lecturer ranking tables, expandable detail views (with multi-tab layouts), RadarChart, CriteriaBreakdown, nav config update, and old file cleanup.

---

## CriteriaBreakdown.tsx

Mantine `Accordion` grouped by section → category:
- Each criterion row: Criterion Text | Avg Rating | Rating Count
- Paper wrapper, title "Criteria Analysis"
- Sections: "Teaching Observation", "Assessments", "Other" (matching observation category section enum)

---

## Lecturer Tables

### SimpleLecturerTable.tsx
Mantine `Table` inside Paper (used in Overview tab):
- Columns: Rank | Lecturer | School | Feedback Avg | Observation Avg | Combined Avg
- Sortable by column headers (default: Combined Avg desc)
- No expandable rows, no click action
- Color-code averages (green/yellow/red)
- Searchable via input above table
- Top N with "Show All" toggle if >20

### FeedbackLecturerTable.tsx
Mantine `Table` inside Paper, with expandable rows (used in Student Feedback tab):
- Columns: Rank | Lecturer | School | Modules | Responses | Avg Rating | (per-category columns)
- Sortable by all numeric columns, searchable
- Row click/expand renders `FeedbackLecturerDetail` inline
- Expanded detail fetches lazily via `getFeedbackLecturerDetail(userId, filter)` using `useQuery`

### ObservationLecturerTable.tsx
Same pattern (used in Observation tab):
- Columns: Rank | Lecturer | School | Observations | Avg Score | (per-category columns)
- Expandable rows render `ObservationLecturerDetail`
- Lazy-fetches `getObservationLecturerDetail(userId, filter)` on expand

---

## Lecturer Detail Views

### FeedbackLecturerDetail.tsx
**Preserved from existing `LecturerExpandedDetail.tsx`** + new first tab. Rendered inside expanded table row.

**4 tabs:**

1. **Overview** (NEW — default):
   - `RadarChart` comparing feedback vs observation category scores
   - Summary badges: overall avg rating, module count, response count

2. **Questions** (PRESERVED):
   - Questions grouped by category, each category header shows avg badge
   - Each question: `QuestionRatingRow` card with:
     - Question text
     - Two progress bars: "Lecturer" (colored) vs "Overall" (gray)
     - Diff badge (+/- vs overall)
     - Response count

3. **Modules** (PRESERVED):
   - Striped table: Module Code | Module Name | Avg Rating (badge) | Responses | Class

4. **Comments** (PRESERVED):
   - Scrollable card list (max-h 400px)
   - Each card: module code+name header, class badge, comment text (pre-wrap)

### ObservationLecturerDetail.tsx
**New component**. Rendered inside expanded table row.

**4 tabs:**

1. **Overview** (default):
   - `RadarChart`: feedback categories overlaid with observation categories
   - Summary badges: overall avg score, observation count, acknowledgment status

2. **Observations**:
   - Accordion items, one per observation for this lecturer
   - Each: module name+code, cycle name, status badge, avg score
   - Qualitative fields (if not null): Strengths, Areas for Improvement, Recommendations, Training Area — labeled text blocks

3. **Criteria**:
   - Table grouped by section → category
   - Columns: Category | Criterion | This Lecturer's Avg | Overall Avg
   - Color-coded difference badges

4. **Feedback Cross-ref**:
   - Side-by-side comparison with student feedback data
   - Reuses data shape from `getFeedbackLecturerDetail(userId, filter)`
   - Renders: modules table, question breakdown, comments list
   - If no feedback data: "No student feedback data available" message

---

## RadarChart.tsx

Mantine `RadarChart`:
- Axes: category names (union of feedback + observation categories)
- Two series: "Student Feedback" (blue) + "Teaching Observation" (teal)
- Scale: 0–5
- If lecturer has no data for one source, that series is omitted
- Compact display for embedding inside detail rows
- Short category name labels

---

## Permission & Access Behavior

### Tab Visibility
`getReportAccessInfo()` returns `{ hasFullAccess, hasFeedbackAccess, hasObservationAccess }`.

- **Overview**: shown if user has at least one permission; missing source shows "No access" or zeros
- **Student Feedback**: shown only if `hasFeedbackAccess`
- **Teaching Observation**: shown only if `hasObservationAccess`

### Lecturer Self-View
If `hasFullAccess` is false:
- Title: "My Appraisal Results"
- Same tabs/components — data auto-scoped to user's userId by service layer
- Filter shows everything except Lecturer selector
- Tables show only the user's own row
- Detail auto-expanded for their row (or shown directly without click)

---

## Data Fetching — Detail Queries

### Query Keys
- `['appraisal-feedback-detail', userId, filter]` — feedback lecturer detail
- `['appraisal-observation-detail', userId, filter]` — observation lecturer detail

---

## Nav Config & Cleanup

### Update `appraisals.config.ts`
- Add top-level nav: Label "Reports", Icon `IconChartBar`, Href `/appraisals/reports`
- Permissions: `[{ resource: 'student-feedback-reports', action: 'read' }, { resource: 'teaching-observation-reports', action: 'read' }]`
- Remove old `Reports` child items from "Student Feedback" and "Teaching Observation" groups

### Delete Old Directories
After all components are working:
1. `src/app/appraisals/student-feedback/reports/` — entire tree
2. `src/app/appraisals/observation-reports/` — entire tree

---

## Implementation Checklist

- [ ] Read Mantine RadarChart docs
- [ ] `CriteriaBreakdown.tsx` — accordion per section/category/criterion
- [ ] `SimpleLecturerTable.tsx` — sortable/searchable ranking table
- [ ] `FeedbackLecturerTable.tsx` — expandable table with lazy detail fetch
- [ ] `ObservationLecturerTable.tsx` — expandable table with lazy detail fetch
- [ ] `FeedbackLecturerDetail.tsx` — 4-tab detail (preserve existing + new Overview tab)
- [ ] `ObservationLecturerDetail.tsx` — 4-tab detail (new)
- [ ] `RadarChart.tsx` — dual-series radar
- [ ] Wire tables into tab components (OverviewTab, StudentFeedbackTab, ObservationTab)
- [ ] Wire CriteriaBreakdown into ObservationTab
- [ ] Update `appraisals.config.ts` nav
- [ ] Delete old `student-feedback/reports/` and `observation-reports/` directories
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix`
