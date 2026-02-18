## Step 4 — Public Student Feedback Wizard (`/feedback`)

### Big Picture: Academic Feedback / Lecturer Evaluation Module

This is a **two-part system** for anonymous lecturer evaluation at a university:

1. **Admin module** at `/academic/feedback` (nested inside the existing `academic` module dashboard) — where academic managers and admins manage feedback question categories, questions, evaluation periods, and passphrase distribution. **Fully built in Steps 1–3.**
2. **Public student page** at `/feedback` (top-level, no auth, standalone layout) — where students enter a BIP39-style 3-word passphrase to anonymously evaluate lecturers on their class modules using a 1–5 star rating wizard. ← **This step builds this.**

**How it works end-to-end:**
- Admins have already created categories (e.g., "Teaching Quality"), questions (e.g., "Is the lecturer always on time?"), a feedback period tied to a term, and generated passphrases for each class.
- Each passphrase is a unique 3-word BIP39 phrase (e.g., "tiger moon river"). Passphrases were printed as slips and physically distributed to students in class.
- A student goes to `/feedback`, enters their passphrase, and is shown a step-by-step wizard.
- The wizard determines which module/lecturer combos the student should rate by:
  1. The passphrase links to a `structureSemesterId` (class) and a `periodId`
  2. The period links to a `termId`
  3. Query `assignedModules` where `termId` matches and the `semesterModule` belongs to that `structureSemester` — these are the module+lecturer combos
- For each module/lecturer, the student sees all active questions grouped by category, rates each 1–5 stars, and can optionally add comments.
- Students can **skip** modules they don't want to rate.
- Students can **resume**: if they close the browser mid-way, their partial responses are saved and they can re-enter the same passphrase to continue from where they left off.
- Once all modules are rated or skipped, the passphrase is marked `used = true`.
- **Anonymity is guaranteed**: `feedbackResponses` stores only `passphraseId` (links to a class, not a student). No student identifiers are ever stored.

**Schema relationships:**
```
feedbackCategories ─1:N─── feedbackQuestions         (built in Steps 1–2)
feedbackPeriods ───1:N─── feedbackPassphrases         (built in Steps 1, 3)
feedbackPassphrases ──N:1── structureSemesters         (class identity)
feedbackPeriods ───N:1─── terms                        (term scoping)
feedbackResponses ──N:1── feedbackPassphrases          ← This step writes to this
feedbackResponses ──N:1── assignedModules              ← This step reads this
feedbackResponses ──N:1── feedbackQuestions             ← This step reads this
```

**The full implementation is split into 4 steps:**
1. **Step 1** (done): Foundation — all 5 schemas, relations, barrel exports, BIP39 utility, navigation, layout, migration
2. **Step 2** (done): Categories & Questions CRUD
3. **Step 3** (done): Periods CRUD + passphrase generation per class + printable slips
4. **Step 4 (this step)**: Public Feedback Wizard — the `/feedback` student-facing page

**What previous steps created that this step uses:**
- `feedbackPassphrases` table: `{ id, periodId, structureSemesterId, passphrase (unique), used (bool), usedAt }`
- `feedbackPeriods` table: `{ id, name, termId, startDate, endDate }` — open when `startDate <= today <= endDate`
- `feedbackResponses` table: `{ id, passphraseId, assignedModuleId, questionId, rating (1–5), comment }` with unique constraint on `(passphraseId, assignedModuleId, questionId)`
- `feedbackQuestions` table: `{ id, categoryId, text, active }` — all active questions apply globally
- `feedbackCategories` table: `{ id, name }` — used to group questions in the UI
- `assignedModules` table (pre-existing): `{ id, termId, userId (lecturer), semesterModuleId, active }` — identifies module+lecturer combos

---

**Goal for this step**: Build the public-facing student feedback page at `/feedback`. This is a fully standalone page (no auth, no sidebar) where students enter a BIP39 passphrase and rate their lecturers through a step-by-step wizard. Students can resume partial evaluations and skip modules they don't want to rate.

**Prerequisites (completed in Steps 1–3)**:
- All 5 feedback schemas exist and have migrations applied: `feedbackCategories`, `feedbackQuestions`, `feedbackPeriods`, `feedbackPassphrases`, `feedbackResponses`
- All relations and barrel exports are in place
- BIP39 passphrase utility exists at `src/app/academic/feedback/_shared/lib/passphrase.ts`
- Admin features are complete: Categories CRUD, Questions CRUD, Periods CRUD with passphrase generation
- Passphrases have been generated for classes via the admin UI and are stored in `feedbackPassphrases` table.

**Key tables involved**:
- `feedbackPassphrases`: `{ id, periodId, structureSemesterId, passphrase, used, usedAt }` — links to a class, not a student
- `feedbackPeriods`: `{ id, name, termId, startDate, endDate }` — period is "open" when today is between startDate and endDate
- `feedbackResponses`: `{ id, passphraseId, assignedModuleId, questionId, rating, comment }` — no student identifiers
- `feedbackQuestions`: `{ id, categoryId, text, active }` — all active questions apply globally
- `feedbackCategories`: `{ id, name }` — group questions by category
- `assignedModules`: `{ id, termId, userId, semesterModuleId }` — identifies module+lecturer combos for the term

---

### 1. Create the `/feedback` route with standalone layout

**File**: `src/app/feedback/layout.tsx`

This is a **fully standalone layout** — no authentication, no sidebar, no dashboard shell. Minimal branding only.

- Do NOT import or re-export from `src/app/dashboard/layout.tsx`
- Simple centered layout with:
  - University logo at the top (use existing logo from `public/images/` — search for it)
  - Title: "Academic Feedback" or "Lecturer Evaluation"
  - Clean, minimal, professional design
  - Optimized for both desktop and mobile
- Use Mantine components (Container, Stack, etc.)
- This is a **server component** (no `'use client'` needed for the layout itself)

**File**: `src/app/feedback/page.tsx`

This is the main feedback wizard — a **client component** (`'use client'`).

---

### 2. Server Actions for the Feedback Wizard

**File**: `src/app/feedback/_server/actions.ts`

These actions do NOT require authentication (the passphrase IS the auth mechanism).

#### `validatePassphrase(passphrase: string)`

Validates the passphrase and returns everything needed for the wizard.

Logic:
1. Look up the passphrase in `feedbackPassphrases` (case-insensitive, trimmed)
2. If not found → return error: "Invalid passphrase"
3. If found, check the linked `feedbackPeriod`:
   - If today < `startDate` → return error: "This evaluation period has not started yet"
   - If today > `endDate` → return error: "This evaluation period has ended"
4. If `used === true` → return error: "This passphrase has already been used"
5. Fetch the assigned modules for the term:
   - The passphrase links to a `structureSemesterId` (class)
   - The period links to a `termId`
   - Query `assignedModules` where `termId = period.termId` and the `semesterModuleId` belongs to the class's structure semester
   - Join to get: lecturer name (from `users` table via `userId`), module name (from `semesterModules` → `modules`)
   - This identifies which module+lecturer combos the student should rate
6. Fetch any existing `feedbackResponses` for this `passphraseId` (for resume flow)
7. Fetch all active `feedbackQuestions` with their categories

Return shape:
```ts
{
  success: true;
  data: {
    passphraseId: number;
    periodName: string;
    modules: Array<{
      assignedModuleId: number;
      moduleName: string;
      moduleCode: string;
      lecturerName: string;
      alreadyRated: boolean;
    }>;
    questions: Array<{
      id: number;
      categoryId: number;
      categoryName: string;
      text: string;
    }>;
  };
} | {
  success: false;
  error: string;
}
```

**Important query notes:**
- The passphrase's `structureSemesterId` identifies a class. The `assignedModules` table has `semesterModuleId` which references `semesterModules`. The `semesterModules` table has a `structureSemesterId` (check this — or it may go through the structure). You need to find assigned modules where the semester module belongs to the same structureSemester as the passphrase's class.
- Actually, `assignedModules.semesterModuleId` → `semesterModules.id`. The `semesterModules` table is at `src/app/academic/semester-modules/_schema/semesterModules.ts`. Check its schema to understand the join path to `structureSemesters`.
- To find the modules for a class: join `assignedModules` → `semesterModules` where `semesterModules.structureSemesterId = passphrase.structureSemesterId` AND `assignedModules.termId = period.termId`.
- Use a single query with joins. Do NOT make multiple sequential database calls.

#### `submitModuleEvaluation(data: { passphraseId: number; assignedModuleId: number; ratings: Array<{ questionId: number; rating: number; comment?: string }> })`

Saves responses for one module/lecturer combo.

Logic:
1. Validate the passphrase still exists and is not `used`
2. Validate the period is still open
3. Insert all ratings into `feedbackResponses` using a single bulk insert
4. Use `onConflictDoUpdate` on the unique constraint `(passphraseId, assignedModuleId, questionId)` to handle re-submissions (resume flow)
5. Return success

#### `skipModule(passphraseId: number, assignedModuleId: number)`

Records that a module was skipped. This can be a no-op on the database (we just don't store responses for skipped modules). The wizard tracks skips client-side.

Alternatively, you may choose not to need this action at all — the wizard can track skips purely in client state.

#### `completeEvaluation(passphraseId: number)`

Marks the passphrase as used.

Logic:
1. Update `feedbackPassphrases` set `used = true`, `usedAt = now()` where `id = passphraseId`
2. Return success

---

### 3. Repository for Feedback Wizard

**File**: `src/app/feedback/_server/repository.ts`

This repository handles the read/write operations needed by the wizard actions. It can import from `@/core/database`.

Methods needed:
- `findPassphrase(passphrase: string)` — lookup by passphrase text (case-insensitive), join period
- `getModulesForClass(termId: number, structureSemesterId: number)` — query assignedModules with joins
- `getActiveQuestions()` — all active questions with categories
- `getExistingResponses(passphraseId: number)` — check which modules already have responses
- `saveResponses(responses: Array<{passphraseId, assignedModuleId, questionId, rating, comment?}>)` — bulk upsert
- `markPassphraseUsed(passphraseId: number)` — update used flag

**Note**: This does NOT extend BaseRepository since it's a custom repository serving the public wizard, not a standard CRUD feature. Use raw `db` queries.

---

### 4. The Feedback Wizard UI

**File**: `src/app/feedback/page.tsx`

Client component (`'use client'`). This is a multi-step wizard.

#### Step 1 — Passphrase Entry

- Centered card UI
- Title: "Lecturer Evaluation"
- Subtitle: "Enter your passphrase to begin"
- Input: single `TextInput` where the student types their 3-word passphrase (e.g., "tiger moon river")
  - Alternatively, 3 separate inputs — but a single input is simpler and more user-friendly
- Button: "Start Evaluation"
- On submit: call `validatePassphrase(passphrase)`
  - If error: show error message (Mantine `Alert` or notification)
  - If success: transition to Step 2 with the returned data

#### Step 2 — Module/Lecturer Rating Wizard

- Shows progress indicator: "Evaluating 2 of 6" with a `Progress` bar or `Stepper`
- For each module/lecturer combo (skip already-rated ones from resume flow):
  - Header: Module name + Module code
  - Subtitle: Lecturer name
  - Questions grouped by category:
    - Category heading (e.g., "Teaching Quality")
    - For each question in that category:
      - Question text
      - Star rating component (1–5 stars, required) — use Mantine `Rating` component
      - Optional comment `Textarea` (collapsed by default or small)
  - Footer buttons:
    - "Skip" — skip this module/lecturer (move to next)
    - "Next" / "Submit" — validate all ratings are filled (1–5), call `submitModuleEvaluation()`, then advance

- **Auto-advance**: after submitting/skipping, automatically move to the next unrated module
- **Resume flow**: if the passphrase already has partial responses, start from the first unrated module

#### Step 3 — Completion

- "Thank you for your feedback!" message
- Simple, clean completion card
- Call `completeEvaluation(passphraseId)` to mark the passphrase as used
- No navigation away needed — the student can close the tab

#### State Management

Use `useState` for wizard state:
```ts
type WizardState =
  | { step: 'passphrase' }
  | { step: 'rating'; data: ValidatedData; currentIndex: number; skipped: Set<number> }
  | { step: 'complete' };
```

Use `useMutation` from TanStack Query for the submit actions to handle loading/error states.

---

### 5. Star Rating Component

If Mantine's built-in `Rating` component is sufficient, use it directly. It provides a 1–5 star rating out of the box.

Usage:
```tsx
<Rating value={rating} onChange={setRating} count={5} size="lg" />
```

If you need a custom component with half-stars or different styling, create it at `src/app/feedback/_components/StarRating.tsx`. But prefer Mantine's `Rating` component.

---

### 6. Component Organization

Suggested file structure:

```
src/app/feedback/
├── layout.tsx              # Standalone layout (no auth)
├── page.tsx                # Main wizard (client component)
├── _server/
│   ├── repository.ts       # Database queries for wizard
│   └── actions.ts          # Server actions (no auth required)
└── _components/
    ├── PassphraseEntry.tsx  # Step 1 UI
    ├── ModuleRating.tsx     # Step 2 - single module rating view
    └── CompletionView.tsx   # Step 3 UI
```

Break the wizard into sub-components for maintainability. The `page.tsx` manages the wizard state and renders the appropriate step component.

---

### 7. Key Implementation Details

#### Anonymity
- **No student identifiers** are ever stored in `feedbackResponses`
- The passphrase links to a class (`structureSemesterId`), not an individual student
- The server actions do NOT require authentication — the passphrase is the access control

#### Passphrase Lifecycle
1. Generated by admin → `used = false`
2. Student enters it → validated, wizard begins
3. Student rates/skips ALL modules → `used = true`, `usedAt = now()`
4. If student closes browser mid-way → `used` stays `false`, can re-enter to resume
5. If student re-enters a used passphrase → error "already used"

#### Resume Flow
When `validatePassphrase` is called for a passphrase that has partial responses:
- The `modules` array in the response includes `alreadyRated: true/false` for each
- The wizard UI skips to the first `alreadyRated: false` module
- The student can still go back to review (optional — simpler to just skip)

#### Date Comparison for Period Status
Dates are stored as `YYYY-MM-DD` text. To check if a period is open:
```ts
const today = new Date().toISOString().split('T')[0]; // "2026-02-18"
const isOpen = today >= period.startDate && today <= period.endDate;
```

#### Handling `assignedModules` → Module/Lecturer Resolution
- `assignedModules.userId` → join `users` table to get lecturer name
- `assignedModules.semesterModuleId` → join `semesterModules` → `modules` to get module code and name
- Filter where `assignedModules.termId = period.termId` AND module belongs to the class
- Check the `semesterModules` schema to understand the join: `semesterModules` likely has a reference to `structureSemesters` or to the `modules` table. Query the schema file at `src/app/academic/semester-modules/_schema/semesterModules.ts`.

---

### 8. Mobile Responsiveness

The `/feedback` page must work well on mobile since students may use their phones:
- Use `Container size="sm"` for centered content
- Star ratings should be large enough for touch (`size="lg"`)
- Questions should stack vertically
- Progress indicator should be visible but compact

---

### Existing Schema References

- `feedbackPassphrases`: `src/app/academic/feedback/periods/_schema/feedbackPassphrases.ts`
- `feedbackPeriods`: `src/app/academic/feedback/periods/_schema/feedbackPeriods.ts`
- `feedbackResponses`: `src/app/academic/feedback/_schema/feedbackResponses.ts`
- `feedbackQuestions`: `src/app/academic/feedback/questions/_schema/feedbackQuestions.ts`
- `feedbackCategories`: `src/app/academic/feedback/categories/_schema/feedbackCategories.ts`
- `assignedModules`: `src/app/academic/assigned-modules/_schema/assignedModules.ts` — `{ id, termId, userId, semesterModuleId, active }`
- `semesterModules`: `src/app/academic/semester-modules/_schema/semesterModules.ts` — check for `structureSemesterId` or other FK
- `modules`: `src/app/academic/modules/_schema/modules.ts` — `{ id, code, name, status }`
- `users`: `src/app/auth/users/_schema/users.ts` — has `name` or `displayName`
- `terms`: `src/app/registry/terms/_schema/terms.ts` — `{ id, code, name }`

### Verification

Run `pnpm tsc --noEmit & pnpm lint:fix` and fix any issues until clean.

### Codebase Patterns Reference

- **Server actions** without auth: still use `'use server'` directive but do NOT wrap in `withAuth()`.
- **Repository**: imports from `@/core/database`.
- **Client components**: `'use client'` directive, use TanStack Query for data fetching/mutations.
- **Top-level exports**: `function` declarations only (no arrow functions).
- **No code comments**.
- **No `useEffect` for data fetching** — use TanStack Query.
- **No custom CSS** — Mantine v8 only.
- **No dynamic imports** — all imports must be static at the top of the file.
