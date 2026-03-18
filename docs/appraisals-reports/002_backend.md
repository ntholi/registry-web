# Unified Appraisal Reports — Session 2: Backend (Repository, Service, Actions)

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

7. **lecturerRankings**: Two queries — one for feedback avg per lecturer, one for observation avg per lecturer. Merge by userId. Calculate combinedAvg as `(feedbackAvg + observationAvg) / 2`. Sort descending by combinedAvg. If a lecturer only has data from one source, the missing source contributes 0 and combined = that source's score alone.

Compose all sub-results into the `OverviewData` type and return.

### Method: `getFeedbackReportData(filter)`
Purpose: Fetch all data for the Student Feedback tab.

Carried over from old `StudentFeedbackReportRepository`, minus `getModulesForFilter` (module filter removed) and minus `getQuestionBreakdown` / `getRatingDistribution` (moved to per-lecturer detail):

1. **getOverviewStats** — totalResponses, avgRating, responseRate (from passphrase used%), lecturersEvaluated
2. **getCategoryAverages** — grouped by studentFeedbackCategory, ordered by sortOrder
3. **getFeedbackTrendData** (NEW) — grouped by feedbackCycles.termId and terms.code. Query studentFeedbackResponses → passphrases → feedbackCycles → terms. avgRating and responseCount per term. Replaces RatingHistogram.
4. **getLecturerRankings** — same complex query: per-lecturer avgRating, plus per-category averages as a Record. Includes moduleCount and responseCount.

Run 1–4 in parallel via `Promise.all` and return the composed result.

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
**Preserved from existing** `getLecturerDetail` — returns modules[], questions[], comments[] for one lecturer, exactly matching the current `LecturerExpandedDetail` component's data contract.

**New addition**: radar data sub-query — fetch observation category averages for this same lecturer (by userId) so the radar chart can compare feedback categories vs observation categories.

Radar data query: For the given userId, query observationRatings → observationCriteria → observationCategories, grouped by category. Return categoryName + avgRating. Then also query studentFeedbackResponses for this lecturer grouped by studentFeedbackCategory. The radar chart component will overlay both series.

### Method: `getObservationLecturerDetail(userId, filter)`
New method for the observation 4-tab detail:
- **observations[]**: Query observations for this lecturer (via assignedModules.userId), join modules and feedbackCycles for names. Return observation id, moduleName, moduleCode, cycleName, avg score (from observationRatings for that observation), status, and qualitative fields (strengths, improvements, recommendations, trainingArea).
- **criteriaScores[]**: Query observationRatings for this lecturer, grouped by criterion. Returns criterionId, criterionText, categoryName, section, avgRating.
- **radarData**: Same radar data as above (both sources), so the radar chart renders identically.
- **feedbackCrossRef**: Reuse the same queries from `getFeedbackLecturerDetail` to fetch this lecturer's feedback modules[], questions[], comments[]. Returned as part of the detail response.

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
