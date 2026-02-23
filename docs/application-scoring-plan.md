# Application Scoring & Ranking System

## Overview

Add a scoring system that assigns 3 scores (0–7 scale) to each application:

1. **Overall academic score** — average of all best grades across all subjects/classifications
2. **First-choice program score** — average of only entry-requirement-relevant subjects for the first-choice program
3. **Second-choice program score** — same for second choice

Scores are stored in a new `application_scores` table, recalculated whenever an application, academic record, or subject grade changes. Rankings are derived at query time via `ORDER BY score DESC, applicationDate ASC`.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Score scope | Program-specific + overall | 3 scores: universal + per-program-choice |
| Calculation method | Average grade approach | Prevents bias toward students with more subjects |
| Score scale | 0–7 | Aligns with existing `StandardGrade` rank values (A\*=7 to U=0) |
| Storage | Score only (rank at query time) | Avoids cascading recalculations across all applications |
| Tie-breaking | Application date (first-come, first-served) | Simple, deterministic |
| Score storage | Separate `application_scores` table | Cleaner separation, one row per application |
| Ineligible applicants | Score = 0 | Distinguishes from "not yet calculated" (`null`) |

---

## Classification → 0–7 Mapping

| Classification | Score |
|---|---|
| Distinction | 7.00 |
| Merit | 5.25 |
| Credit | 3.50 |
| Pass | 1.75 |
| Fail | 0.00 |

---

## Score Algorithm Summary

| Record Type | Overall Score | Program Score |
|---|---|---|
| Subject-grades | Average of ALL best grades (0–7 each) | Average of only subjects in program's entry requirement |
| Classification | Best classification scaled to 0–7 | Best matching classification scaled to 0–7 |
| Mixed (same LQF) | Higher of the two calculations | Per program's requirement type |
| Ineligible for program | N/A | `0` |
| No records | `null` | `null` |

---

## Implementation Steps

### Step 1: Create `applicationScores` schema

New file: `src/app/admissions/applications/_schema/applicationScores.ts`

Table `application_scores`:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | nanoid |
| `applicationId` | text FK → `applications.id` | CASCADE, **unique** (one score row per application) |
| `overallScore` | real, nullable | Range 0–7, average of ALL best subject grades or scaled classification |
| `firstChoiceScore` | real, nullable | Average of only subjects relevant to first-choice program's entry requirements; `null` if no entry requirement found |
| `secondChoiceScore` | real, nullable | Same for second choice |
| `calculatedAt` | timestamp | When scores were last computed |

Add relations in the existing `relations.ts` linking back to `applications`.

### Step 2: Add barrel export

Update `src/app/admissions/_database/index.ts` to re-export `applicationScores`.

### Step 3: Generate migration

Run `pnpm db:generate` to create the migration SQL for the new table.

### Step 4: Refactor shared grading utilities

Extract shared constants and helper functions from `src/app/admissions/applicants/_lib/eligibility.ts` into `src/app/admissions/_lib/grading.ts`:

- `gradeRanks` (A\*=7 to U=0)
- `classificationRanks` (Distinction=4 to Fail=0)
- `getHighestLqfRecords(records)`
- `getHighestLqfLevel(records)`
- `getBestSubjectGrades(records)`
- `gradeRank(grade)`
- `isGradeAtLeast(grade, minimum)`
- `filterRecognizedRecords(records, recognizedSchools)`
- `meetsEntryRules(rules, records)`
- Related helper functions

Update `eligibility.ts` to import from the shared module instead of defining locally.

### Step 5: Create scoring logic module

New file: `src/app/admissions/applications/_lib/scoring.ts`

Three core functions:

#### `calculateOverallScore(academicRecords)` → `number | null`

1. Get highest-LQF-level records (reuse `getHighestLqfRecords`)
2. For **subject-grade** type records: call `getBestSubjectGrades()`, compute average of all grade rank values (0–7)
3. For **classification** type records: take best classification, scale to 0–7 (`Distinction=7.0, Merit=5.25, Credit=3.5, Pass=1.75, Fail=0`)
4. If both types exist at same LQF level: take the higher of the two scores
5. Return `null` if no valid records

#### `calculateProgramScore(academicRecords, programId, entryRequirements, recognizedSchools)` → `number | null`

1. Find the entry requirement for this `programId` at the applicant's highest LQF level
2. If no entry requirement exists → return `null`
3. If requirement type is `subject-grades`: extract only the subjects/groups listed in the requirement rules, get applicant's best grades for those specific subjects, compute average
4. If requirement type is `classification`: find matching records by course name, get best classification, scale to 0–7
5. If applicant doesn't meet the minimum entry requirements (reuse `meetsEntryRules`) → return `0`
6. Apply LQF ≥ 5 recognized-school filtering where applicable

#### `calculateAllScores(applicationId)` — orchestrator

1. Fetch application with `applicantId`, `firstChoiceProgramId`, `secondChoiceProgramId`
2. Fetch applicant's academic records (with certificate types, subject grades, subjects)
3. Fetch relevant entry requirements for both program choices
4. Fetch recognized schools list
5. Call `calculateOverallScore` and `calculateProgramScore` for each choice
6. Return `{ overallScore, firstChoiceScore, secondChoiceScore }`

### Step 6: Add score repository methods

In `src/app/admissions/applications/_server/repository.ts`, add:

- `upsertScores(applicationId, { overallScore, firstChoiceScore, secondChoiceScore })` — insert or update (on conflict `applicationId`) the `application_scores` row
- `getScores(applicationId)` → fetch the scores row
- `recalculateScoresForApplicant(applicantId)` — find all applications for this applicant and recalculate each one (used when academic records change)

Update `findById()` to join `application_scores` so scores are included in application detail views.

Update `search()` to optionally sort by score (for ranked listing).

### Step 7: Add score service methods

In `src/app/admissions/applications/_server/service.ts`, add:

- `recalculateScores(applicationId)` — calls scoring logic, then `upsertScores`
- `recalculateScoresForApplicant(applicantId)` — recalculates all of an applicant's applications

Integrate into existing flows:

- `create()`: after creating the application, call `recalculateScores`
- `createOrUpdate()`: same
- The `update()` from `BaseService` should trigger recalculation if program choices changed

### Step 8: Add score actions

In `src/app/admissions/applications/_server/actions.ts`, add:

- `recalculateApplicationScores(applicationId)` — manual recalculation action
- `getApplicationScores(applicationId)` — fetch scores

### Step 9: Trigger recalculation from academic records

In the academic records module's service/actions:

- After `create`, `update`, or `delete` of an academic record: call `recalculateScoresForApplicant(applicantId)` by importing the action from the applications module
- After `create`, `update`, or `delete` of a subject grade: resolve the `applicantId` via the academic record, then call `recalculateScoresForApplicant`

This ensures scores stay current when qualifications change.

### Step 10: Update application list UI for ranking

In the applications list page/component:

- Show `overallScore`, `firstChoiceScore`, `secondChoiceScore` columns
- Default sort by score descending, then `applicationDate` ascending (tie-break)
- Add filter/sort option to rank by first-choice score or overall score

### Step 11: Update application detail view

In `src/app/admissions/applications/[id]/page.tsx`, display:

- Overall Score badge/field
- First Choice Score with program name
- Second Choice Score with program name
- "Last calculated" timestamp
- Manual "Recalculate" button

---

## Verification Checklist

1. Run `pnpm db:generate` to create migration
2. Run `pnpm tsc --noEmit & pnpm lint:fix` to verify type safety
3. Manual test: create an applicant with academic records, submit an application, verify scores are computed
4. Test score recalculation when academic records are updated
5. Verify ranking order in the applications list view
