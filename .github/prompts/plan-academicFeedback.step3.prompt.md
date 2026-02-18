## Step 3 — Periods CRUD & Passphrase Management (Admin Feature)

### Big Picture: Academic Feedback / Lecturer Evaluation Module

This is a **two-part system** for anonymous lecturer evaluation at a university:

1. **Admin module** at `/academic/feedback` (nested inside the existing `academic` module dashboard) — where academic managers and admins manage feedback question categories, questions, evaluation periods, and passphrase distribution.
2. **Public student page** at `/feedback` (top-level, no auth, standalone layout) — where students enter a BIP39-style 3-word passphrase (e.g., "tiger moon river") to anonymously evaluate lecturers on their class modules using a 1–5 star rating wizard.

**How it works end-to-end:**
- Admins create categories and questions (done in Step 2).
- Admins create a **feedback period** tied to an academic term with a date range. ← **This step handles this.**
- For each period, admins **generate passphrases** per class (structureSemester). Each class gets `studentCount + 10% buffer` unique 3-word BIP39 passphrases. Passphrases are printed as cut-out slips and physically distributed. ← **This step handles this.**
- Students go to `/feedback`, enter their passphrase, and rate each lecturer/module combo. (Step 4)
- **Anonymity**: passphrases link to a class (`structureSemesterId`), NOT to a student. No student identifiers stored.
- Passphrases are one-time-use: marked `used = true` only after the student finishes (rates or skips all modules).
- A period is "open" when `startDate <= today <= endDate` (dates are `YYYY-MM-DD` text, lexicographic comparison works).

**Schema relationships:**
```
feedbackCategories ─1:N─── feedbackQuestions         (Step 2 — done)
feedbackPeriods ───1:N─── feedbackPassphrases         ← This step builds CRUD + generation for these
feedbackPassphrases ──N:1── structureSemesters         ← Passphrases link to classes
feedbackPeriods ───N:1─── terms                        ← Period is scoped to a term
feedbackResponses ──N:1── feedbackPassphrases          (Step 4)
feedbackResponses ──N:1── assignedModules              (Step 4)
feedbackResponses ──N:1── feedbackQuestions             (Step 4)
```

**The full implementation is split into 4 steps:**
1. **Step 1** (done): Foundation — all 5 schemas, relations, barrel exports, BIP39 utility, navigation, layout, migration
2. **Step 2** (done): Categories & Questions CRUD
3. **Step 3 (this step)**: Periods & Passphrase Management — period CRUD + class listing + passphrase generation + printable slips
4. **Step 4**: Public Feedback Wizard — the `/feedback` student-facing page

**What Step 1 created that this step uses:**
- `feedbackPeriods` table: `{ id, name, termId (FK→terms), startDate, endDate, createdAt }`
- `feedbackPassphrases` table: `{ id, periodId (FK→feedbackPeriods), structureSemesterId (FK→structureSemesters), passphrase (unique), used (bool), usedAt, createdAt }`
- BIP39 utility at `src/app/academic/feedback/_shared/lib/passphrase.ts` with:
  - `generatePassphrase()` → returns a 3-word string
  - `generateUniquePassphrases(count, existing: Set<string>)` → returns array of unique passphrases

---

**Goal for this step**: Build the feedback periods CRUD with passphrase generation and printing. This is the most complex admin feature — it manages evaluation periods, generates BIP39 passphrases per class, and provides a printable passphrase slip view.

**Prerequisites (completed in Steps 1–2)**:
- All 5 feedback schemas exist: `feedbackCategories`, `feedbackQuestions`, `feedbackPeriods`, `feedbackPassphrases`, `feedbackResponses`
- Relations and barrel exports are in place
- BIP39 passphrase utility exists at `src/app/academic/feedback/_shared/lib/passphrase.ts` with `generatePassphrase()` and `generateUniquePassphrases(count, existing)` functions
- Categories CRUD is functional at `/academic/feedback/categories`
- Questions CRUD is functional at `/academic/feedback/questions`
- The feedback layout with tabs exists at `src/app/academic/feedback/layout.tsx`

---

### 1. Repository

**File**: `src/app/academic/feedback/periods/_server/repository.ts`

Standard `BaseRepository` pattern plus custom methods for period management.

```ts
import { db, feedbackPeriods, feedbackPassphrases } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
```

Extends `BaseRepository<typeof feedbackPeriods, 'id'>`.

**Required methods beyond base CRUD:**

#### `findById(id: number)` override
- Use `db.query.feedbackPeriods.findFirst()` with `with: { term: true }` to join the term relation.

#### `getClassesForTerm(termId: number)`
- This is a critical query that finds all active classes (structureSemesters) for a given term.
- Logic: Query `studentSemesters` where `termCode` matches the term's code, join through `structureSemesters` → `structures` → `programs` → `schools`.
- Group results by school, then by structureSemester (class).
- For each class, return: `structureSemesterId`, class display info (the `structureSemester` row with its structure/program/school chain), and `studentCount` (count of studentSemesters in that class for that term).
- The query should be a **single query** joining all necessary tables. Avoid multiple separate queries.
- Reference tables:
  - `studentSemesters` (`src/app/registry/students/_schema/studentSemesters.ts`): has `termCode`, `structureSemesterId`, `studentProgramId`
  - `structureSemesters` (`src/app/academic/structures/_schema/structureSemesters.ts`): has `structureId`, `semesterNumber`, `name`
  - `structures` (`src/app/academic/structures/_schema/structures.ts`): has `programId`
  - `programs` (`src/app/academic/schools/_schema/programs.ts`): has `code`, `name`, `schoolId`
  - `schools` (`src/app/academic/schools/_schema/schools.ts`): has `code`, `name`
  - `terms` (`src/app/registry/terms/_schema/terms.ts`): has `code`, `name`

#### `getPassphraseStats(periodId: number)`
- For a given period, return passphrase statistics grouped by `structureSemesterId`.
- For each class: total count, used count, remaining count.
- Single query using `count()` with `CASE WHEN used = true` or similar aggregation.

#### `getExistingPassphrases(periodId: number)`
- Return all existing passphrases for a period as a `Set<string>` — used by the generation function to avoid collisions.

#### `createPassphrases(passphrases: { periodId: number; structureSemesterId: number; passphrase: string }[])`
- Bulk insert passphrases using `db.insert(feedbackPassphrases).values(passphrases)`.

#### `getPassphrasesForClass(periodId: number, structureSemesterId: number)`
- Return all passphrases for a specific class in a period (for the print view).
- Select only the `passphrase` column, ordered by `id`.

---

### 2. Service

**File**: `src/app/academic/feedback/periods/_server/service.ts`

Extends `BaseService<typeof feedbackPeriods, 'id'>`. Roles: `['academic', 'admin']` for all operations.

**Required methods beyond base:**

#### `getClassesForTerm(termId: number)`
- Wraps repository method with `withAuth(['academic', 'admin'])`

#### `getPassphraseStats(periodId: number)`
- Wraps repository method with `withAuth(['academic', 'admin'])`

#### `generatePassphrases(periodId: number, structureSemesterId: number, studentCount: number)`
- Protected by `withAuth(['academic', 'admin'])`
- Calculate count: `studentCount + Math.ceil(studentCount * 0.1)` (10% buffer)
- Fetch existing passphrases via `repository.getExistingPassphrases(periodId)`
- Call `generateUniquePassphrases(count, existing)` from `../../_shared/lib/passphrase`
- Call `repository.createPassphrases(...)` to bulk insert
- Return the count generated

#### `getPassphrasesForClass(periodId: number, structureSemesterId: number)`
- Wraps repository method with `withAuth(['academic', 'admin'])`

---

### 3. Actions

**File**: `src/app/academic/feedback/periods/_server/actions.ts`

```ts
'use server';
```

Standard CRUD actions plus:

- `getPeriods(page, search)` — list with search on `name`
- `getPeriod(id)` — get by ID (returns period with term)
- `createPeriod(data)` — create
- `updatePeriod(id, data)` — update
- `deletePeriod(id)` — delete
- `getClassesForTerm(termId: number)` — get classes grouped by school for passphrase generation UI
- `getPassphraseStats(periodId: number)` — get passphrase stats per class
- `generatePassphrases(periodId: number, structureSemesterId: number, studentCount: number)` — trigger generation
- `getPassphrasesForClass(periodId: number, structureSemesterId: number)` — for print view

Also need an action to get available terms for the period form:

- `getTerms()` — import and call the existing `findAllTerms` action from `@registry/terms/_server/actions` (or a similar existing action that returns terms). Search the codebase for the terms actions file to find the right import.

---

### 4. Form Component

**File**: `src/app/academic/feedback/periods/_components/Form.tsx`

- Client component (`'use client'`)
- Import `feedbackPeriods` from `@academic/_database`
- Fields:
  - `name` — `TextInput` (e.g., "Mid-Semester 2025-02 Evaluation")
  - `termId` — `Select`, populated via TanStack Query fetching available terms
  - `startDate` — Mantine `DateInput` or `TextInput` with date format `YYYY-MM-DD`
  - `endDate` — Mantine `DateInput` or `TextInput` with date format `YYYY-MM-DD`
- Use `Form` from `@/shared/ui/adease`
- Query key: `['feedback-periods']`
- On success: navigate to `/academic/feedback/periods/${id}`

For date inputs, follow the codebase convention of storing dates as `YYYY-MM-DD` text strings. Use Mantine's `DatePickerInput` if available, or plain `TextInput` with type="date".

---

### 5. Period Detail Page (with Passphrase Management)

**File**: `src/app/academic/feedback/periods/[id]/page.tsx`

This is the most complex page. It shows period details AND the passphrase management UI.

**Layout:**

```
┌─────────────────────────────────────────────┐
│ DetailsViewHeader: "Period" [Edit] [Delete] │
├─────────────────────────────────────────────┤
│ FieldView: Name                              │
│ FieldView: Term                              │
│ FieldView: Start Date — End Date             │
│ FieldView: Status (Open/Closed based on     │
│            current date vs start/end)        │
├─────────────────────────────────────────────┤
│ Passphrase Management Section               │
│                                              │
│ 📋 School of Design                           │
│ ┌─────────────────────────────────────────┐ │
│ │ DITY1S1 | 45 students | 50/3/47 codes  │ │
│ │ [Generate] [Print]                       │ │
│ ├─────────────────────────────────────────┤ │
│ │ DITY1S2 | 38 students | 0/0/0 codes    │ │
│ │ [Generate]                               │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ 📋 School of Technology                       │
│ ┌─────────────────────────────────────────┐ │
│ │ BSCS2S1 | 52 students | 58/10/48 codes │ │
│ │ [Generate] [Print]                       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Implementation approach:**

The top section (period details) should be a **server component** using `DetailsView`, `DetailsViewBody`, `FieldView`.

The passphrase management section should be a **client component** (separate component file) that:
1. Uses TanStack Query to fetch `getClassesForTerm(period.termId)` and `getPassphraseStats(period.id)`
2. Groups classes by school
3. For each class, shows:
   - Class name (use `getStudentClassName()` from `@/shared/lib/utils/utils` — this function takes a structureSemester-like object with program code and semester info)
   - Student count
   - Passphrase stats: `generated / used / remaining`
4. "Generate Passphrases" button: calls `generatePassphrases(periodId, structureSemesterId, studentCount)` action, then invalidates the stats query
5. "Print Passphrases" button (only shown when passphrases exist): opens a new window/dialog with printable passphrase slips

**File**: `src/app/academic/feedback/periods/_components/PassphraseManager.tsx`
- Client component handling the class list, generation, and print triggers

**File**: `src/app/academic/feedback/periods/_components/PassphraseSlips.tsx` (or use a modal/new page)
- Printable view of passphrase slips for a class
- Each slip contains: period name, passphrase (e.g., "tiger moon river"), and instruction text "Go to [URL]/feedback and enter your passphrase"
- Format as a grid of cut-out slips suitable for printing and cutting
- Use `@media print` friendly styles or a simple Mantine-based layout with borders

---

### 6. Other Period Pages

**File**: `src/app/academic/feedback/periods/layout.tsx`
- `ListLayout` with `getData={getPeriods}`, `queryKey={['feedback-periods']}`
- `renderItem` shows period name and a status indicator (e.g., badge showing "Open"/"Closed"/"Upcoming" based on dates)
- `NewLink` to `/academic/feedback/periods/new`

**File**: `src/app/academic/feedback/periods/page.tsx`
- `<NothingSelected title="Periods" />`

**File**: `src/app/academic/feedback/periods/new/page.tsx`
- Render Form with `onSubmit={createPeriod}`

**File**: `src/app/academic/feedback/periods/[id]/edit/page.tsx`
- Server component, fetch period, render Form with `defaultValues` and `updatePeriod`

---

### Key Implementation Notes

1. **Single query for classes**: The `getClassesForTerm` query is performance-critical. Use a single SQL query with joins, not multiple sequential queries. The result should be shaped for the UI: classes grouped by school name.

2. **Class name display**: Use `getStudentClassName()` from `@/shared/lib/utils/utils`. This function expects a structureSemester-like object. Search the codebase for usage examples — it's used extensively in the timetable module.

3. **Period status logic**: A period is:
   - "Upcoming" if `today < startDate`
   - "Open" if `startDate <= today <= endDate`
   - "Closed" if `today > endDate`
   Use the `YYYY-MM-DD` string comparison (lexicographic comparison works for this format).

4. **Passphrase generation buffer**: Generate `studentCount + Math.ceil(studentCount * 0.1)` passphrases (10% extra).

5. **Print view**: Should be clean, minimal — designed for printing and cutting into slips. Each slip should be roughly the size of a business card.

---

### Existing Schema References

- `terms` table: `src/app/registry/terms/_schema/terms.ts` — `{ id, code, name, year, startDate, endDate, isActive, semester }`
- `studentSemesters` table: `src/app/registry/students/_schema/studentSemesters.ts` — `{ id, termCode, structureSemesterId, status, studentProgramId }`
- `structureSemesters` table: `src/app/academic/structures/_schema/structureSemesters.ts` — `{ id, structureId, semesterNumber, name, totalCredits }`
- `structures` table: `src/app/academic/structures/_schema/structures.ts` — has `programId`
- `programs` table: `src/app/academic/schools/_schema/programs.ts` — has `code`, `name`, `schoolId`
- `schools` table: `src/app/academic/schools/_schema/schools.ts` — has `code`, `name`

### Verification

Run `pnpm tsc --noEmit & pnpm lint:fix` and fix any issues until clean.

### Codebase Patterns Reference

- **Repository**: Extends `BaseRepository<typeof table, 'id'>`. Server code imports from `@/core/database`.
- **Service**: Extends `BaseService<typeof table, 'id'>`, export via `serviceWrapper()`. Use `withAuth()` for custom methods.
- **Actions**: `'use server'` directive, thin wrappers.
- **Form**: Client component, `Form` from adease, `createInsertSchema` from `drizzle-zod`.
- **Layout**: Client component, `ListLayout` from adease.
- **Detail page**: Server component, `DetailsView` + `DetailsViewHeader` + `DetailsViewBody` + `FieldView`.
- **Top-level exports**: `function` declarations only (no arrow functions).
- **No code comments**.
- **Client schema imports**: Use `@academic/_database`.
