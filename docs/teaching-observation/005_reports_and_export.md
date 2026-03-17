# Part 5: Reports & Export

> Analytics dashboard, scoring aggregation, PDF export matching PRL form, and Excel export.

## Feature Path

```
src/app/appraisals/observation-reports/
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   ├── actions.ts
│   └── pdf.ts
├── _components/
│   ├── Filter.tsx
│   ├── OverviewStats.tsx
│   ├── CategoryChart.tsx
│   ├── LecturerTable.tsx
│   ├── TrendChart.tsx
│   ├── ExportButton.tsx
│   └── PdfExportButton.tsx
├── _lib/
│   └── types.ts
└── page.tsx
```

## Access

- **Permission**: `teaching-observation-reports` with `read`
- **Who**: Academic Manager, Academic Program Leader, Academic Principal Lecturer, Academic Admin, HR Manager
- **Scoping**: Non-admin users see only data for schools they belong to

---

## Scoring Aggregation

All scores are calculated on-the-fly in queries (not stored in the DB).

### Rating Scale Reference

| Rating | Label |
|--------|-------|
| 1 | Unsatisfactory performance |
| 2 | Performance not fully satisfactory |
| 3 | Satisfactory performance |
| 4 | Above satisfactory performance |
| 5 | Excellent performance |

### Aggregation Levels

| Level | Calculation |
|-------|-------------|
| **Criterion score** | The raw `rating` (1–5) |
| **Category average** | `AVG(rating)` of all criteria in the category for an observation |
| **Section average** | `AVG(rating)` of all criteria in the section for an observation |
| **Overall score** | `AVG(rating)` of all criteria across all sections for an observation |
| **Lecturer average** | `AVG(overall_score)` across all observations for a lecturer in a given filter scope |
| **School average** | `AVG(overall_score)` across all observations in a school |

### SQL Aggregation Query (Example: Lecturer ranking)

```sql
SELECT
  u.id AS lecturer_id,
  u.name AS lecturer_name,
  COUNT(o.id) AS observation_count,
  ROUND(AVG(r.rating)::numeric, 2) AS avg_score
FROM observations o
JOIN assigned_modules am ON am.id = o.assigned_module_id
JOIN "user" u ON u.id = am.user_id
JOIN observation_ratings r ON r.observation_id = o.id
WHERE o.status IN ('submitted', 'acknowledged')
  AND o.cycle_id = :cycleId                    -- optional filter
GROUP BY u.id, u.name
ORDER BY avg_score DESC;
```

### SQL Aggregation Query (Example: Category averages)

```sql
SELECT
  oc.id AS category_id,
  oc.name AS category_name,
  oc.section,
  ROUND(AVG(r.rating)::numeric, 2) AS avg_rating
FROM observation_ratings r
JOIN observation_criteria cr ON cr.id = r.criterion_id
JOIN observation_categories oc ON oc.id = cr.category_id
JOIN observations o ON o.id = r.observation_id
WHERE o.status IN ('submitted', 'acknowledged')
  AND o.cycle_id = :cycleId
GROUP BY oc.id, oc.name, oc.section
ORDER BY oc.section, oc.sort_order;
```

---

## Repository

`ObservationReportsRepository` — read-only repository for analytics queries.

### Key Methods

| Method | Description |
|--------|-------------|
| `getOverviewStats(filters)` | Total observations, average score, observations by status, total lecturers evaluated |
| `getCategoryAverages(filters)` | Average rating per category, grouped by section |
| `getLecturerRankings(filters)` | All lecturers ranked by average score with observation count |
| `getLecturerHistory(lecturerId, filters)` | All observations for a specific lecturer with scores |
| `getTrendData(filters)` | Average scores per term for trend line charts |
| `getCategoryWeaknesses(filters)` | Categories with lowest average scores (identify training needs) |
| `getDetailedExportData(filters)` | Full denormalized data for Excel export |

### Filter Shape

```typescript
type ReportFilters = {
  cycleId?: string;
  termId?: number;
  schoolId?: number;
  programId?: number;
  lecturerId?: string;
  status?: ('submitted' | 'acknowledged')[];
};
```

---

## Service

`ObservationReportsService` wraps repository with permission checks. All methods require `{ 'teaching-observation-reports': ['read'] }`.

For school-scoped access: the service calls `getUserSchoolIds(session.user.id)` and passes school IDs to the repository as an additional filter.

---

## Actions

```typescript
'use server';

export async function getOverviewStats(filters: ReportFilters)
export async function getCategoryAverages(filters: ReportFilters)
export async function getLecturerRankings(filters: ReportFilters)
export async function getLecturerHistory(lecturerId: string, filters: ReportFilters)
export async function getTrendData(filters: ReportFilters)
export async function exportObservationsExcel(filters: ReportFilters)
export async function exportObservationPdf(observationId: string)
```

---

## UI Components

### `Filter.tsx`

Filter bar at the top of the reports page. Dropdowns:
- **Term** — Select (from getAllTerms)
- **Cycle** — Select (filtered by selected term)
- **School** — Select (user's schools)
- **Lecturer** — Select (optional, filtered by school)

State managed via URL search params (like student feedback reports).

### `OverviewStats.tsx`

Four `Paper` stat cards in a `SimpleGrid`:
- **Total Observations** — count of submitted + acknowledged
- **Average Score** — overall average across all observations (with rating label)
- **Lecturers Evaluated** — distinct lecturer count
- **Acknowledgment Rate** — % of submitted observations that are acknowledged

### `CategoryChart.tsx`

Horizontal bar chart showing average rating per category.

- Uses Mantine `BarChart` component
- Categories on Y-axis, average score (0–5) on X-axis
- Color-coded by section (e.g., blue for teaching observation, green for assessments, orange for other)
- Reference line at 3.0 (satisfactory threshold)

### `LecturerTable.tsx`

Sortable table of lecturers with:
- Lecturer name
- School
- Number of observations
- Average score (with color indicator: red < 2, yellow 2–3, green ≥ 4)
- Trend indicator (up/down/stable vs previous term)

Click a lecturer row to expand or navigate to their detailed history.

### `TrendChart.tsx`

Line chart showing average scores over terms.

- Uses Mantine `LineChart` component
- X-axis: terms (chronological)
- Y-axis: average score (1–5)
- Can show:
  - Overall average (default)
  - Per-category lines (toggle)
  - Per-lecturer line (when filtered)
- Reference line at 3.0

### `ExportButton.tsx`

Excel export button. Triggers server action that:
1. Fetches `getDetailedExportData(filters)`
2. Builds Excel file with sheets:
   - **Summary** — overview stats
   - **Lecturer Scores** — one row per lecturer with category averages
   - **Detailed Ratings** — one row per observation per criterion
3. Returns file as download

### `PdfExportButton.tsx`

PDF export button on individual observation detail pages. Generates a PDF matching the original PRL Report form.

---

## PDF Generation (`pdf.ts`)

Generate a PDF that visually matches the original PRL Report form from the university.

### Layout

| Area | Content |
|------|---------|
| **Header** | University logo (Limkokwing), "FMG008 FACULTY MANAGEMENT – HUMAN RESOURCE DEPARTMENT", "PRL REPORT" title, subtitle text |
| **Info Table** | Campus: Maseru, Person Observed: [lecturer name], Faculty: [school name], Programme: [program name], Semester: [term name], Module Code: [code], Module Name: [name], Evaluated By: [observer name], Designation: Academic Program Leader |
| **Rating Scale** | Table showing 1–5 rating descriptions |
| **Section 1** | Each category as a bordered section, each criterion with rating filled (shaded cell or ✓) |
| **Section 2** | Assessment KPIs with ratings |
| **Section 3** | Other KPIs with ratings |
| **PRL Remarks** | Strengths, areas for improvement, recommendations |
| **Identified Training Area** | Free text content |
| **Signatures** | Observer's Name + Date, Lecturer's Name + Date (if acknowledged) |

### Implementation Options

1. **React-pdf** (`@react-pdf/renderer`) — render React components to PDF
2. **jsPDF** with templates — lower-level PDF building
3. **Puppeteer/Playwright** — render HTML to PDF (heavyweight, good fidelity)

Recommended: **React-pdf** — fits the React ecosystem, can closely match the original form layout, and runs server-side.

### Key Requirements

- University logo embedded (read from `public/` assets)
- Exact table structure matching the paper form
- Ratings displayed as filled/unfilled cells (1–5 columns)
- Page breaks between sections if content is long
- Footer with page numbers

---

## Reports Page Layout

The reports page (`page.tsx`) is a single RSC page (not a ListLayout). Structure:

```
┌─────────────────────────────────────┐
│  Filter.tsx (Term, Cycle, School)   │
├─────────────────────────────────────┤
│  OverviewStats.tsx  (4 stat cards)  │
├───────────────────┬─────────────────┤
│  CategoryChart    │  TrendChart     │
│  (bar chart)      │  (line chart)   │
├───────────────────┴─────────────────┤
│  LecturerTable.tsx                  │
│  (sortable, expandable rows)        │
├─────────────────────────────────────┤
│  ExportButton.tsx                   │
└─────────────────────────────────────┘
```

### Data Fetching

The page is a server component. On initial load:
1. Fetch default filters (latest term, latest cycle)
2. Fetch overview stats, category averages, lecturer rankings, trend data in parallel
3. Pass data as props to client components

Filter changes trigger TanStack Query refetches on the client.

---

## Navigation

Add to `appraisals.config.ts` under the "Teaching Observation" nav group:

```typescript
{
  label: 'Reports',
  href: '/appraisals/observation-reports',
  icon: IconChartBar,
  permissions: [
    { resource: 'teaching-observation-reports', action: 'read' },
  ],
}
```
