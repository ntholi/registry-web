## Plan: Academic Feedback / Lecturer Evaluation Module

**TL;DR**: Build a two-part system: (1) an admin module at `/academic/feedback` within the existing academic module for managing feedback questions, categories, evaluation periods, and passphrase generation/distribution; (2) a public student-facing page at `/feedback` where students enter a BIP39-style 3-word passphrase to anonymously evaluate lecturers on their class modules using a 1–5 star rating wizard. Passphrases are one-time-use, link to a studentClass (not a student), and are generated manually per class (with +10% buffer). Students can resume where they left off. No reports in this phase.

**Key Decisions Made**:
- Admin route: `/academic/feedback` (nested under existing academic module)
- Entity names: `feedback_questions`, `feedback_categories`, `feedback_periods`
- Passphrases: BIP39-style 3-word (e.g., "tiger moon river"), one-time-use
- Rating: 1–5 star scale; comments optional
- Students can skip modules entirely (can choose not to give feedback for a module/lecturer); can resume with same passphrase
- Periods: date-based auto open/close, term-scoped
- Question bank: global (all active questions apply to every period)
- Passphrase generation: manual trigger, per class, grouped by school
- Anonymity: no student identifiers stored in responses
- Lecturers: shown from `assignedModules` for the term; rate each separately
- Access: admin + academic managers manage; lecturers can view own results
- Student UX: step-by-step wizard (auto-advance through modules)
- `/feedback` layout: fully standalone (no shared chrome)
- Reports: deferred to a later phase

---

### Phase 1: Schema Design (5 tables)

1. **Create `feedbackCategories` table** in `src/app/academic/feedback/categories/_schema/feedbackCategories.ts`
   - Columns: `id` (serial PK), `name` (text, not null), `createdAt` (timestamp)
   - Example: "Teaching Quality", "Communication", "Professionalism"

2. **Create `feedbackQuestions` table** in `src/app/academic/feedback/questions/_schema/feedbackQuestions.ts`
   - Columns: `id` (serial PK), `categoryId` (FK → `feedbackCategories.id`, cascade), `text` (text, not null, the question itself), `active` (boolean, default true), `createdAt` (timestamp)
   - Example: "Is the lecturer always on time for class?"

3. **Create `feedbackPeriods` table** in `src/app/academic/feedback/periods/_schema/feedbackPeriods.ts`
   - Columns: `id` (serial PK), `name` (text, not null, e.g., "Mid-Semester 2025-02 Evaluation"), `termId` (FK → `terms.id`), `startDate` (text, `YYYY-MM-DD`), `endDate` (text, `YYYY-MM-DD`), `createdAt` (timestamp)
   - The period is "open" when `now()` is between `startDate` and `endDate`

4. **Create `feedbackPassphrases` table** in `src/app/academic/feedback/periods/_schema/feedbackPassphrases.ts`
   - Columns: `id` (serial PK), `periodId` (FK → `feedbackPeriods.id`, cascade), `structureSemesterId` (FK → `structureSemesters.id`), `passphrase` (text, unique, not null — the 3-word BIP39 phrase), `used` (boolean, default false), `usedAt` (timestamp, nullable), `createdAt` (timestamp)
   - A passphrase connects to a **class** (via `structureSemesterId`) not a student
   - Index on `passphrase` for fast lookup; index on `periodId` + `structureSemesterId`

5. **Create `feedbackResponses` table** in `src/app/academic/feedback/_schema/feedbackResponses.ts`
   - Columns: `id` (serial PK), `passphraseId` (FK → `feedbackPassphrases.id`, cascade), `assignedModuleId` (FK → `assignedModules.id` — identifies the module+lecturer combo), `questionId` (FK → `feedbackQuestions.id`), `rating` (integer, 1–5, not null), `comment` (text, nullable), `createdAt` (timestamp)
   - Unique constraint on `(passphraseId, assignedModuleId, questionId)` — prevents duplicate ratings
   - **No student identifiers stored** — only the passphrase which links to a class

6. **Create relations files** alongside each schema — standard Drizzle relation pattern per existing conventions

7. **Update `_database/index.ts`** barrel export at `src/app/academic/_database/index.ts` — re-export new schemas alongside existing academic schemas

### Phase 2: BIP39 Word List Utility

8. **Create passphrase generator** at `src/app/academic/feedback/_shared/lib/passphrase.ts`
   - Include a curated subset of the BIP39 English word list (2048 words — common, simple, unambiguous English words)
   - Function `generatePassphrase()` returns 3 random words joined by spaces (e.g., "tiger moon river")
   - Function `generateUniquePassphrases(count: number, existing: Set<string>)` generates `count` unique passphrases avoiding collisions with `existing`

### Phase 3: Admin Feature — Categories (CRUD)

9. **Scaffold `/academic/feedback/categories`** with standard pattern:
   - `_server/repository.ts`, `_server/service.ts`, `_server/actions.ts`
   - `_components/Form.tsx` — simple form with `name` field
   - `page.tsx` (list), `[id]/page.tsx` (details), `[id]/edit/page.tsx`, `new/page.tsx`
   - Uses `ListLayout`, `DetailsView`, `Form` from adease
   - Roles: `['admin', 'academic']` — further restricted by position (manager, program_leader) via `isVisible` or `withAuth`

### Phase 4: Admin Feature — Questions (CRUD)

10. **Scaffold `/academic/feedback/questions`** with standard pattern:
    - `_server/repository.ts`, `_server/service.ts`, `_server/actions.ts`
    - `_components/Form.tsx` — fields: `categoryId` (select from categories), `text` (textarea), `active` (switch)
    - `page.tsx` (list grouped by category), `[id]/page.tsx`, `[id]/edit/page.tsx`, `new/page.tsx`
    - List should show question text + category badge + active/inactive status

### Phase 5: Admin Feature — Periods (CRUD + Passphrase Management)

11. **Scaffold `/academic/feedback/periods`** with standard pattern:
    - `_server/repository.ts` — includes `getClassesForTerm(termId)` method that queries `studentSemesters` → `structureSemesters` → `structures` → `programs` → `schools` to get active classes grouped by school, with student counts
    - `_server/service.ts`, `_server/actions.ts`
    - `_components/Form.tsx` — fields: `name`, `termId` (select from terms), `startDate`, `endDate`
    - `page.tsx` (list showing period name, term, status indicator), `[id]/page.tsx` (details + class management), `[id]/edit/page.tsx`, `new/page.tsx`

12. **Build passphrase generation UI** on the period detail page `[id]/page.tsx`:
    - Show classes grouped by school (using `getStudentClassName()` for display)
    - Each class shows: class name, student count, passphrase count (generated/used/remaining)
    - "Generate Passphrases" button per class: generates `studentCount + ceil(studentCount * 0.1)` unique 3-word passphrases
    - "Print Passphrases" button per class: opens a printable page with passphrases formatted as cut-out slips, including period name and simple instructions ("Go to [URL]/feedback and enter your passphrase")

### Phase 6: Public Student Feedback Page (`/feedback`)

13. **Create `/feedback` route** at `src/app/feedback/` — top-level, NOT inside academic module
    - `layout.tsx` — fully standalone layout, no auth, no sidebar, minimal branding (university logo + title)
    - `page.tsx` — the main feedback wizard

14. **Build the student-facing feedback wizard** (client component):
    - **Step 1 — Passphrase Entry**: centered card with 3 text inputs (one per word) or a single input. "Enter your passphrase to begin." Button: "Start Evaluation"
    - **Server action `validatePassphrase(passphrase)`**: looks up passphrase → checks period is currently open (date range) → checks not already fully used → returns: class info, list of assigned modules with lecturer names for that term, existing partial responses (if any for resume)
    - **Step 2 — Module/Lecturer Wizard**: shows progress "Evaluating 2/6" with module name + lecturer name. For each module-lecturer combo:
      - Display all active questions grouped by category
      - Star rating (1–5) per question (required)
      - Optional comment textarea per question
      - "Next" button advances to next module/lecturer; "Skip" skips this module/lecturer
    - **Server action `submitModuleEvaluation(passphraseId, assignedModuleId, ratings[])`**: saves responses for one module/lecturer combo. Validates passphrase is still valid.
    - **Step 3 — Completion**: "Thank you for your feedback!" message. If all modules rated or all skipped, mark passphrase as `used = true`.
    - **Resume flow**: if passphrase already has partial responses, skip to the first unevaluated module/lecturer

15. **Handle the "used" passphrase logic**:
    - Passphrase is marked `used = true` + `usedAt = now()` only when the student has either rated or explicitly skipped ALL module/lecturer combos
    - If the student closes the browser mid-way, the passphrase remains `used = false` and they can re-enter it to continue

### Phase 7: Navigation & Config

16. **Add feedback to academic navigation** in `src/app/academic/academic.config.ts`:
    - Add nav item: `{ label: 'Feedback', href: '/academic/feedback', icon: IconMessageStar or IconMessages, roles: ['academic', 'admin'] }`
    - Sub-items or tabs within the feedback module for Categories, Questions, Periods

17. **Create `layout.tsx`** for `src/app/academic/feedback/layout.tsx` — standard layout that renders children, possibly with tabs for the three sub-features

### Phase 8: Lecturer Self-View (Deferred)

18. **Build lecturer view** — when a user with role `academic` and position `lecturer` navigates to `/academic/feedback`, show them a read-only view of their own aggregated feedback results (average ratings per question, per period). This is out-of-scope for the initial phase per your decision to defer reports, but the access control and routing should be prepared.

---

### Schema Relationships Summary

```
feedbackCategories ─1:N─── feedbackQuestions
feedbackPeriods ───1:N─── feedbackPassphrases
feedbackPassphrases ──N:1── structureSemesters (class identity)
feedbackPeriods ───N:1─── terms
feedbackResponses ──N:1── feedbackPassphrases
feedbackResponses ──N:1── assignedModules (module + lecturer)
feedbackResponses ──N:1── feedbackQuestions
```

### Verification

- Run `pnpm tsc --noEmit & pnpm lint:fix` after each phase
- After schema: run `pnpm db:generate --custom` to create migration
- Test passphrase generation: verify uniqueness and collision resistance
- Test the full flow: create category → question → period → generate passphrases → open `/feedback` → enter passphrase → rate → resume → complete
- Verify anonymity: inspect `feedbackResponses` table to confirm no student identifiers

### Open Items (Deferred)

- Reports/analytics dashboard for aggregated results
- Lecturer self-view of own evaluation results
- CSV export of results
- Passphrase regeneration for lost codes
