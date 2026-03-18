# Phase 3: Lecturer Rankings & Detail Views

> Lecturer ranking tables, expandable detail views, RadarChart, CriteriaBreakdown, Export buttons, nav config, and cleanup.
> Student feedback table + detail are **carried over** from the existing page. Observation gets new expandable detail views.

---

## Lecturer Tables

### SimpleLecturerTable.tsx (NEW)
Used in Overview tab. Mantine `Table` inside Paper:
- Columns: Rank | Lecturer | School | Feedback Avg | Observation Avg | Combined Avg
- Sortable by column headers (default: Combined Avg desc)
- No expandable rows, no click action
- Color-code averages (green >4, yellow 3–4, red <3)
- Searchable via input above table
- Top N with "Show All" toggle if >20

### FeedbackLecturerTable.tsx (CARRIED OVER)
**Source**: `student-feedback/reports/_components/LecturerTable.tsx` — carry over with minimal adaptation.

Mantine `Table` inside Paper, with expandable rows:
- Columns: Rank | Lecturer | School | Modules | Responses | Avg Rating | (per-category columns)
- Sortable by all numeric columns (default: avgRating desc)
- Searchable
- Row click/expand renders `FeedbackLecturerDetail` inline
- Expanded detail fetches lazily via `getFeedbackLecturerDetail(userId, filter)` using `useQuery`

**Changes from original**: Import path for the detail component + action changes. Core logic unchanged.

### ObservationLecturerTable.tsx (CARRIED OVER + ENHANCED)
**Source**: `observation-reports/_components/LecturerTable.tsx` — carry over and add expandable rows.

Mantine `Table` inside Paper:
- Columns: Rank | Lecturer | School | Observations | Avg Score | (per-category columns)
- Sortable by all numeric columns (preserved from existing)
- **NEW**: Expandable rows that render `ObservationLecturerDetail`
- Lazy-fetches `getObservationLecturerDetail(userId, filter)` on expand

---

## Lecturer Detail Views

### FeedbackLecturerDetail.tsx (CARRIED OVER + 1 NEW TAB)
**Source**: `student-feedback/reports/_components/LecturerExpandedDetail.tsx` — carry over the existing 3 tabs and prepend 1 new tab.

Rendered inside expanded table row. **4 tabs:**

1. **Overview** (NEW — default tab):
   - `RadarChart` comparing this lecturer's feedback vs observation category scores
   - Summary badges: overall avg rating, module count, response count

2. **Questions** (PRESERVED — unchanged):
   - Questions grouped by category, each category header shows avg badge
   - Each question: card with question text, two progress bars ("Lecturer" colored vs "Overall" gray), diff badge, response count

3. **Modules** (PRESERVED — unchanged):
   - Striped table: Module Code | Module Name | Avg Rating (badge) | Responses | Class

4. **Comments** (PRESERVED — unchanged):
   - Scrollable card list (max-h 400px)
   - Each card: module code+name header, class badge, comment text (pre-wrap)

### ObservationLecturerDetail.tsx (NEW)
New component. Rendered inside expanded table row. **4 tabs:**

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
   - Side-by-side comparison using this lecturer's student feedback data
   - Reuses data shape from `getFeedbackLecturerDetail(userId, filter)` (returned as `feedbackCrossRef` in observation detail response)
   - Renders: modules table, question breakdown, comments list (same layout as feedback detail)
   - If no feedback data: "No student feedback data available" message

---

## RadarChart.tsx (NEW)

Mantine `RadarChart`:
- Axes: category names (union of feedback + observation categories)
- Two series: "Student Feedback" (blue) + "Teaching Observation" (teal)
- Scale: 0–5
- If lecturer has no data for one source, that series is omitted
- Compact display for embedding inside detail rows
- Short category name labels

---

## CriteriaBreakdown.tsx (NEW)

Used in Observation tab. Mantine `Accordion` grouped by section → category:
- Each criterion row: Criterion Text | Avg Rating | Rating Count
- Paper wrapper, title "Criteria Analysis"
- Sections: "Teaching Observation", "Assessments", "Other" (matching observation category section enum)

---

## Export Buttons

### FeedbackExportButton.tsx (CARRIED OVER)
**Source**: `student-feedback/reports/_components/ExportButton.tsx` + `_server/excel.ts` — carry over.
- Calls export action, converts base64 → blob → download
- Success/error toast

### ObservationExportButton.tsx (CARRIED OVER)
**Source**: `observation-reports/_components/ExportButton.tsx` + `_server/excel.ts` — carry over.
- Same pattern as feedback export

**Note**: The excel generation logic (`excel.ts`) from both old modules must be carried into the new `_server/` folder (or a `_lib/` export utility). The server actions to trigger them must be added to `actions.ts`.

---

## Nav Config & Cleanup

### Update `appraisals.config.ts`
- Add top-level nav: Label "Reports", Icon `IconChartBar`, Href `/appraisals/reports`
- Permissions: `[{ resource: 'student-feedback-reports', action: 'read' }, { resource: 'teaching-observation-reports', action: 'read' }]`
- Remove old `Reports` child items from "Student Feedback" and "Teaching Observation" groups

### Delete Old Directories
After all components are working and tested:
1. `src/app/appraisals/student-feedback/reports/` — entire tree
2. `src/app/appraisals/observation-reports/` — entire tree

---

## Permission & Self-View Behavior

### Lecturer Self-View
If `hasFullAccess` is false:
- Title: "My Appraisal Results"
- Same tabs/components — data auto-scoped by service layer
- Filter shows everything except Lecturer selector
- Tables show only the user's own row
- Detail auto-expanded for their row (or shown directly)

---

## Implementation Checklist

- [ ] Read Mantine RadarChart docs
- [ ] `SimpleLecturerTable.tsx` — NEW sortable/searchable combined ranking table
- [ ] `FeedbackLecturerTable.tsx` — carry over from student-feedback LecturerTable
- [ ] `FeedbackLecturerDetail.tsx` — carry over LecturerExpandedDetail + prepend new Overview tab with RadarChart
- [ ] `ObservationLecturerTable.tsx` — carry over from observation-reports LecturerTable + add expandable rows
- [ ] `ObservationLecturerDetail.tsx` — NEW 4-tab detail view
- [ ] `RadarChart.tsx` — NEW dual-series radar component
- [ ] `CriteriaBreakdown.tsx` — NEW accordion per section/category/criterion
- [ ] `FeedbackExportButton.tsx` — carry over from student-feedback + excel.ts
- [ ] `ObservationExportButton.tsx` — carry over from observation-reports + excel.ts
- [ ] Wire SimpleLecturerTable into OverviewTab
- [ ] Wire FeedbackLecturerTable + FeedbackExportButton into StudentFeedbackTab
- [ ] Wire ObservationLecturerTable + ObservationExportButton + CriteriaBreakdown into ObservationTab
- [ ] Update `appraisals.config.ts` nav
- [ ] Delete old `student-feedback/reports/` and `observation-reports/` directories
- [ ] Run `pnpm tsc --noEmit && pnpm lint:fix`
