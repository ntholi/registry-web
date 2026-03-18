# Phase 1: Backend — Types, Repository, Service, Actions ✅

> **Status: COMPLETED**
>
> **Note**: Three minor extensions are needed to preserve existing student feedback UI. These should be applied at the start of Phase 2:
> 1. Add `moduleId?: number` to `ReportFilter` + update `buildFeedbackConditions()` to filter by it
> 2. Add `ratingDistribution: RatingDistribution[]` to `FeedbackReportData` + expose query in `getFeedbackReportData()`
> 3. Add `questionBreakdown: QuestionBreakdownItem[]` to `FeedbackReportData` + expose existing private `getQuestionBreakdown()` in `getFeedbackReportData()`

---

## Types (`_lib/types.ts`)

### Unified Filter
- `termId?: number`
- `cycleId?: string`
- `schoolIds?: number[]`
- `programId?: number`
- `lecturerId?: string` — only visible when `hasFullAccess` is true

### Overview Data
- `combinedAvg: number` — average of feedbackAvg and observationAvg
- `feedbackAvg: number`
- `observationAvg: number`
- `lecturersEvaluated: number`
- `schoolComparison: SchoolComparisonItem[]` — schoolId, schoolCode, schoolName, feedbackAvg, observationAvg
- `trendData: TrendPoint[]` — termId, termCode, feedbackAvg, observationAvg
- `feedbackHeatmap: HeatmapCell[]` — schoolId, schoolCode, categoryId, categoryName, avgRating
- `observationHeatmap: HeatmapCell[]` — same shape
- `lecturerRankings: OverviewLecturerRanking[]` — userId, lecturerName, schoolCode, feedbackAvg, observationAvg, combinedAvg

### Student Feedback Report Data
- `overview: FeedbackOverviewStats` — totalResponses, avgRating, responseRate, lecturersEvaluated
- `categoryAverages: CategoryAverage[]` — categoryId, categoryName, avgRating, responseCount, sortOrder
- `trendData: FeedbackTrendPoint[]` — termId, termCode, avgRating, responseCount
- `lecturerRankings: FeedbackLecturerRanking[]` — userId, lecturerName, schoolCode, schoolName, moduleCount, responseCount, avgRating, categoryAverages (Record<string, number>)

### Teaching Observation Report Data
- `overview: ObservationOverviewStats` — totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate
- `categoryAverages: ObservationCategoryAverage[]` — categoryId, categoryName, section, avgRating, ratingCount, sortOrder
- `trendData: ObservationTrendPoint[]` — termId, termCode, avgScore, observationCount
- `lecturerRankings: ObservationLecturerRanking[]` — userId, lecturerName, schoolCode, schoolName, observationCount, avgScore, categoryAverages (Record<string, number>)
- `criteriaBreakdown: CriterionBreakdownItem[]` — criterionId, criterionText, categoryId, categoryName, section, avgRating, ratingCount

### Lecturer Detail Types

**Feedback Lecturer Detail**:
- userId, lecturerName, schoolCode, avgRating
- `modules[]` — moduleCode, moduleName, avgRating, responseCount, className
- `questions[]` — questionId, questionText, categoryName, avgRating, overallAvgRating, responseCount, distribution[]
- `comments[]` — moduleCode, moduleName, className, comment
- `radarData` — array of { category, feedbackScore, observationScore }

**Observation Lecturer Detail**:
- userId, lecturerName, schoolCode, avgScore
- `observations[]` — observationId, moduleName, moduleCode, cycleName, avgScore, status, strengths, improvements, recommendations, trainingArea
- `criteriaScores[]` — criterionId, criterionText, categoryName, section, avgRating
- `radarData` — same shape as feedback radar
- `feedbackCrossRef` — reuses Feedback Lecturer Detail data shape

### Shared Sub-types
- `RatingDistribution` — rating, count, percentage
- `HeatmapCell` — schoolId, schoolCode, categoryId, categoryName, avgRating
- `TrendPoint` — termId, termCode, feedbackAvg, observationAvg
- `CycleOption` — id, name

---

## Repository (`_server/repository.ts`)

### `buildFilterConditions(filter)`
Takes unified filter → returns Drizzle conditions array.

### `getOverviewData(filter)`
Runs 7 sub-queries in `Promise.all`:
1. **feedbackAvg** — avg(rating) from studentFeedbackResponses + distinct lecturer count
2. **observationAvg** — avg(rating) from observationRatings where status in ('submitted','acknowledged')
3. **schoolComparison** — two queries grouped by school, merged by schoolId
4. **trendData** — two queries grouped by term, merged by termId
5. **feedbackHeatmap** — grouped by school × studentFeedbackCategory
6. **observationHeatmap** — grouped by school × observationCategory
7. **lecturerRankings** — two queries merged by userId, combinedAvg = average of both

### `getFeedbackReportData(filter)`
4 sub-queries in `Promise.all`:
1. getOverviewStats — totalResponses, avgRating, responseRate, lecturersEvaluated
2. getCategoryAverages — grouped by category, ordered by sortOrder
3. getFeedbackTrendData — grouped by term (replaces RatingHistogram)
4. getLecturerRankings — per-lecturer with per-category Record

### `getObservationReportData(filter)`
5 sub-queries in `Promise.all`:
1. getOverviewStats — totalObservations, avgScore, lecturersEvaluated, acknowledgmentRate
2. getCategoryAverages — grouped by category+section
3. getObservationTrendData — grouped by term
4. getLecturerRankings — per-lecturer with per-category Record
5. getCriteriaBreakdown — per-criterion avgRating with category/section

### `getFeedbackLecturerDetail(userId, filter)`
Preserved from existing + new radar data sub-query (observation category averages for same lecturer).

### `getObservationLecturerDetail(userId, filter)`
New method: observations[], criteriaScores[], radarData, feedbackCrossRef.

### `getCyclesByTerm(termId)`
Returns `{ id, name }[]` from feedbackCycles.

---

## Service (`_server/service.ts`)

### Access Control
- `hasFullAccess(session)` — admin/HR or has 'update' on either report resource
- `hasFeedbackAccess(session)` — has student-feedback-reports read
- `hasObservationAccess(session)` — has teaching-observation-reports read
- Non-full-access: filter auto-scoped to `lecturerId: session.user.id`

### Methods
All wrap repository calls with `withPermission`:
- `getOverviewData(filter)` — requires at least one report permission
- `getFeedbackReportData(filter)` — requires feedback read
- `getObservationReportData(filter)` — requires observation read
- `getFeedbackLecturerDetail(userId, filter)` — full-access can view others; self-view otherwise
- `getObservationLecturerDetail(userId, filter)` — same rules
- `getCyclesByTerm(termId)` — any report permission
- `getAccessInfo()` — returns `{ hasFullAccess, hasFeedbackAccess, hasObservationAccess }`

---

## Actions (`_server/actions.ts`)

Thin `'use server'` wrappers — one per service method:
- `getOverviewData(filter)`
- `getFeedbackReportData(filter)`
- `getObservationReportData(filter)`
- `getFeedbackLecturerDetail(userId, filter)`
- `getObservationLecturerDetail(userId, filter)`
- `getCyclesByTerm(termId)`
- `getReportAccessInfo()`
