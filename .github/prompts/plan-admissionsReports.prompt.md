# Plan: Admissions Reports Module

Build 5 reports under a new "Reports" nav group in the Admissions module: **Application Summary**, **Applicant Demographics**, **Geographic Distribution** (custom SVG maps), **Program Demand**, and **Academic Qualifications**. Each report follows the established filter → repository → service → actions → charts/tables/export pattern from the existing enrollment reports.

## 1. Navigation Setup

- Add a `Reports` nav group with `children` to `src/app/admissions/admissions.config.ts`. Use `IconReportAnalytics` icon, `collapsed: true`, `roles: ['registry', 'marketing', 'admin']`. Children:
  - Application Summary → `/admissions/reports/application-summary`
  - Demographics → `/admissions/reports/demographics`
  - Geographic → `/admissions/reports/geographic`
  - Program Demand → `/admissions/reports/program-demand`
  - Academic Qualifications → `/admissions/reports/academic-qualifications`

## 2. Layout & Shared Infrastructure

- Create `src/app/admissions/reports/layout.tsx` — import `@mantine/charts/styles.css` and re-export dashboard layout (matching the pattern in `src/app/reports/layout.tsx`).
- Create `src/app/admissions/reports/_shared/types.ts` — shared `AdmissionReportFilter` interface with: `intakePeriodId`, `schoolIds`, `programId`, `programLevels`, `applicationStatuses`.
- Create `src/app/admissions/reports/_shared/AdmissionReportFilter.tsx` — shared `'use client'` filter component using `nuqs` (`useQueryStates`) with cascading dropdowns: Intake Period (via `findAllIntakePeriods`), School (via `getActiveSchools`), Program (via `getProgramsBySchoolIds`), Program Level, Application Status multiselect.
- Extract the duplicated `ReportCard` component from `src/app/reports/registry/student-enrollments/page.tsx` into `src/shared/ui/adease/ReportCard.tsx` and update existing usages to import from shared (addresses current duplication across 4 files).

## 3. Reports Hub Page

- Create `src/app/admissions/reports/page.tsx` — RSC page using shared `ReportCard` grid linking to the 5 reports with icons and descriptions.

## 4. Application Summary Report

**Purpose**: Application status breakdown by school/program, status distribution charts.

- **Repository**: `src/app/admissions/reports/application-summary/_server/repository.ts`
  - `getSummaryData(filter)` — JOIN `applications` → `applicants` → `programs` → `schools`, GROUP BY school/program/status, returning counts per status per school/program.
  - `getChartData(filter)` — Aggregated status distribution (overall donut + per-school stacked bar).
  - Single query with conditional aggregation (`count(*) filter (where status = ...)`) to avoid multiple DB hits.
- **Service**: `application-summary/_server/service.ts` — `withAuth` + `serviceWrapper` wrapper.
- **Actions**: `application-summary/_server/actions.ts` — `getApplicationSummary(filter)`, `getApplicationChartData(filter)`, `exportApplicationSummaryExcel(filter)`.
- **Excel**: `application-summary/_server/excel.ts` — ExcelJS workbook with summary sheet (school × status matrix) and detail sheet.
- **UI**: `application-summary/page.tsx` — `'use client'` with 2 tabs:
  - **Summary**: `Table` with rows per school/program, columns per status, totals row/column. Use `getApplicationStatusColor` from `src/shared/lib/utils/colors.ts` for status badges.
  - **Charts**: `DonutChart` for overall status split, `BarChart` (stacked) for per-school breakdown. Use `@mantine/charts`.
- **Components**: `SummaryTable.tsx`, `StatusCharts.tsx` in `_components/`.

## 5. Applicant Demographics Report

**Purpose**: Gender, nationality, age group analysis with school-level breakdowns.

- **Repository**: `demographics/_server/repository.ts`
  - `getDemographicsData(filter)` — JOIN `applications` → `applicants` (for gender, dateOfBirth, nationality, religion) → `programs` → `schools`. Single query returning raw rows for in-memory aggregation.
  - Aggregate functions: `aggregateByGender()`, `aggregateByNationality()`, `aggregateByAgeGroup()` — using `AGE_GROUPS` pattern from `src/app/reports/registry/student-enrollments/distribution/types.ts`. Age calculated from `dateOfBirth`.
  - `getBreakdownBySchool(filter)` — demographics distributions per school.
- **Service/Actions**: Same pattern. Actions: `getDemographicsOverview(filter)`, `getDemographicsBySchool(filter)`, `exportDemographicsExcel(filter)`.
- **Excel**: Demographics summary with gender/nationality/age sheets.
- **UI**: `demographics/page.tsx` — `'use client'` with tabs:
  - **Overview**: `DonutChart` for gender, `BarChart` for top nationalities, `BarChart` for age groups. Use `getGenderColor` from colors.ts.
  - **By School**: Cards per school showing mini charts for gender/nationality breakdown.
- **Components**: `OverviewCharts.tsx`, `SchoolBreakdown.tsx`.

## 6. Geographic Distribution Report

**Purpose**: Custom SVG maps of Southern Africa and Lesotho showing application density bubbles.

- **Repository**: `geographic/_server/repository.ts`
  - `getLocationData(filter)` — JOIN `applications` → `applicants` → `applicant_locations`, GROUP BY country/city/district, returning `{ country, city, district, latitude, longitude, count }`.
  - `getCountryAggregation(filter)` — count per country.
  - `getDistrictAggregation(filter)` — count per district (Lesotho-focused).
- **Service/Actions**: `getGeographicData(filter)`, `exportGeographicExcel(filter)`.
- **SVG Map Components**:
  - `geographic/_components/SouthernAfricaMap.tsx` — Custom SVG with paths for 9 countries (Lesotho, South Africa, Mozambique, Eswatini, Botswana, Zimbabwe, Namibia, Zambia, Malawi). Each country is a `<path>` with hover tooltips. Proportional semi-transparent `<circle>` bubbles positioned at country centroids, sized by application count. Clickable with `Popover` showing count/details.
  - `geographic/_components/LesothoMap.tsx` — Custom SVG with paths for all 10 Lesotho districts (Maseru, Berea, Leribe, Butha-Buthe, Mokhotlong, Thaba-Tseka, Qacha's Nek, Quthing, Mohale's Hoek, Mafeteng). Bubbles at district centroids + additional bubbles at major town coordinates.
  - `geographic/_components/MapLegend.tsx` — Shared legend showing bubble size scale.
  - SVG path data stored in `geographic/_lib/mapPaths.ts` — constants for country/district SVG `d` attributes and centroid coordinates.
  - Town coordinates in `geographic/_lib/lesothoTowns.ts` — lat/lng → SVG coordinate mappings for major towns.
- **Excel**: Location breakdown table export.
- **UI**: `geographic/page.tsx` — `'use client'` with 2 tabs:
  - **Southern Africa**: `SouthernAfricaMap` with filter controls.
  - **Lesotho**: `LesothoMap` with district + town bubbles.
  - Both tabs show a side `Table` with country/district counts.

## 7. Program Demand Report

**Purpose**: Most popular programs, first vs second choice comparison, demand by school.

- **Repository**: `program-demand/_server/repository.ts`
  - `getProgramDemand(filter)` — COUNT applications grouped by `firstChoiceProgramId` and `secondChoiceProgramId`, JOIN to `programs` → `schools`. Single query using UNION or conditional counts.
  - `getDemandBySchool(filter)` — aggregate demand per school.
- **Service/Actions**: `getProgramDemandData(filter)`, `exportProgramDemandExcel(filter)`.
- **Excel**: Program ranking sheet + school demand sheet.
- **UI**: `program-demand/page.tsx` — `'use client'` with tabs:
  - **Ranking**: Horizontal `BarChart` of top programs by total applications (first + second choice).
  - **First vs Second**: Grouped `BarChart` showing first-choice vs second-choice counts side-by-side per program.
  - **By School**: `DonutChart` or `PieChart` showing demand distribution across schools.
- **Components**: `ProgramRanking.tsx`, `ChoiceComparison.tsx`, `SchoolDemand.tsx`.

## 8. Academic Qualifications Report

**Purpose**: Certificate type distribution, grade analysis, result classifications.

- **Repository**: `academic-qualifications/_server/repository.ts`
  - `getCertificateTypeDistribution(filter)` — JOIN `academic_records` → `applicants` → `applications` (to respect filters) → `certificate_types`, GROUP BY certificate type.
  - `getGradeDistribution(filter)` — JOIN `subject_grades` → `academic_records` → filter chain, GROUP BY `standardGrade`.
  - `getResultClassification(filter)` — GROUP BY `resultClassification` from academic_records.
- **Service/Actions**: `getQualificationsData(filter)`, `exportQualificationsExcel(filter)`.
- **Excel**: Certificate, grade, and classification sheets.
- **UI**: `academic-qualifications/page.tsx` — `'use client'` with tabs:
  - **Certificates**: `DonutChart` for certificate type distribution + breakdown `Table`.
  - **Grades**: `BarChart` showing grade distribution (A* through U) with `getGradeColor` from colors.ts.
  - **Classifications**: `BarChart` or `DonutChart` for Distinction/Merit/Credit/Pass/Fail split.
- **Components**: `CertificateChart.tsx`, `GradeChart.tsx`, `ClassificationChart.tsx`.

## 9. File Structure Summary

```
src/app/admissions/reports/
├── layout.tsx                          # Chart styles import
├── page.tsx                            # Hub page with ReportCards
├── _shared/
│   ├── types.ts                        # AdmissionReportFilter interface
│   └── AdmissionReportFilter.tsx       # Shared filter component (nuqs)
├── application-summary/
│   ├── page.tsx
│   ├── _server/ (repository, service, actions, excel)
│   └── _components/ (SummaryTable, StatusCharts)
├── demographics/
│   ├── page.tsx
│   ├── _server/ (repository, service, actions, excel)
│   └── _components/ (OverviewCharts, SchoolBreakdown)
├── geographic/
│   ├── page.tsx
│   ├── _server/ (repository, service, actions, excel)
│   ├── _lib/ (mapPaths, lesothoTowns)
│   └── _components/ (SouthernAfricaMap, LesothoMap, MapLegend)
├── program-demand/
│   ├── page.tsx
│   ├── _server/ (repository, service, actions, excel)
│   └── _components/ (ProgramRanking, ChoiceComparison, SchoolDemand)
└── academic-qualifications/
    ├── page.tsx
    ├── _server/ (repository, service, actions, excel)
    └── _components/ (CertificateChart, GradeChart, ClassificationChart)
```

## 10. Shared Component Extraction (De-duplication)

- Extract `ReportCard` from the 4 duplicated locations into `src/shared/ui/adease/ReportCard.tsx`.
- Update the existing 4 usages to import from the shared location.
- Re-export from `src/shared/ui/adease/index.ts`.

## Verification

- Run `pnpm tsc --noEmit & pnpm lint:fix` after each major step.
- Verify each report loads correctly at its URL.
- Test filter interactions (cascading dropdowns, URL state persistence).
- Test Excel exports download correctly.
- Verify SVG maps render bubbles at correct coordinates.
- Test dark mode rendering for all charts and maps.

## Key Decisions

- Reports live under `/admissions/reports/...` (not under the global `/reports/` module) — keeps data ownership within the admissions module per architecture guidelines.
- Custom SVG maps instead of a map library — avoids adding a dependency, gives full control over Southern Africa + Lesotho rendering.
- Flat nav children under Reports group — each report is a direct child nav item for quick access.
- Per-report Excel exports — each report generates its own styled workbook.
- Shared filter component with `nuqs` — all 5 reports share the same filter bar for consistency.
