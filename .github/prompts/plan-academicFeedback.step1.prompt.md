## Step 1 — Foundation: Schemas, BIP39 Utility, Navigation & Layout

### Big Picture: Academic Feedback / Lecturer Evaluation Module

This is a **two-part system** for anonymous lecturer evaluation at a university:

1. **Admin module** at `/academic/feedback` (nested inside the existing `academic` module dashboard) — where academic managers and admins manage feedback question categories, questions, evaluation periods, and passphrase distribution.
2. **Public student page** at `/feedback` (top-level, no auth, standalone layout) — where students enter a BIP39-style 3-word passphrase (e.g., "tiger moon river") to anonymously evaluate lecturers on their class modules using a 1–5 star rating wizard.

**How it works end-to-end:**
- Admins create **categories** (e.g., "Teaching Quality") and **questions** (e.g., "Is the lecturer always on time?") organized by category.
- Admins create a **feedback period** tied to an academic term with a date range.
- For each period, admins **generate passphrases** per class (structureSemester). Each class gets `studentCount + 10%` unique 3-word BIP39 passphrases. These are printed and physically distributed to students.
- Students go to `/feedback`, enter their passphrase, and are shown a step-by-step wizard to rate each lecturer/module combo assigned to their class for that term.
- Students rate using 1–5 stars per question, can optionally add comments, can skip modules, and can resume if they close the browser mid-way.
- **Anonymity is guaranteed**: `feedbackResponses` stores only `passphraseId` (which links to a class, not a student). No student identifiers are ever stored.
- Passphrases are one-time-use: marked `used = true` only after all modules are rated or skipped.

**The full implementation is split into 4 steps:**
1. **Step 1 (this step)**: Foundation — schemas, relations, BIP39 utility, navigation, layout
2. **Step 2**: Categories & Questions — standard CRUD admin features
3. **Step 3**: Periods & Passphrase Management — period CRUD + passphrase generation + print
4. **Step 4**: Public Feedback Wizard — the `/feedback` student-facing page

**Schema relationships:**
```
feedbackCategories ─1:N─── feedbackQuestions
feedbackPeriods ───1:N─── feedbackPassphrases
feedbackPassphrases ──N:1── structureSemesters (class identity)
feedbackPeriods ───N:1─── terms
feedbackResponses ──N:1── feedbackPassphrases
feedbackResponses ──N:1── assignedModules (module + lecturer)
feedbackResponses ──N:1── feedbackQuestions
```

---

**Goal for this step**: Create all 5 database tables with relations, the BIP39 passphrase utility, update barrel exports, add feedback to academic navigation, and create the feedback layout with tabs. Generate the database migration at the end.

**Context**: This is the first step. Nothing exists yet. This step establishes the entire data model and routing skeleton so subsequent steps can build CRUD features and the public wizard on top of a solid foundation.

---

### 1. Create `feedbackCategories` schema

**File**: `src/app/academic/feedback/categories/_schema/feedbackCategories.ts`

```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feedbackCategories = pgTable('feedback_categories', {
  id: serial().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp().defaultNow(),
});
```

Examples of categories: "Teaching Quality", "Communication", "Professionalism".

---

### 2. Create `feedbackQuestions` schema

**File**: `src/app/academic/feedback/questions/_schema/feedbackQuestions.ts`

```ts
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { feedbackCategories } from '../../categories/_schema/feedbackCategories';

export const feedbackQuestions = pgTable('feedback_questions', {
  id: serial().primaryKey(),
  categoryId: integer()
    .references(() => feedbackCategories.id, { onDelete: 'cascade' })
    .notNull(),
  text: text().notNull(),
  active: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow(),
});
```

**Important**: Schema files must NOT import from `@/core/database`. They import from specific module paths (as shown above).

---

### 3. Create `feedbackPeriods` schema

**File**: `src/app/academic/feedback/periods/_schema/feedbackPeriods.ts`

```ts
import { terms } from '@registry/terms/_schema/terms';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feedbackPeriods = pgTable('feedback_periods', {
  id: serial().primaryKey(),
  name: text().notNull(),
  termId: integer()
    .references(() => terms.id)
    .notNull(),
  startDate: text().notNull(),
  endDate: text().notNull(),
  createdAt: timestamp().defaultNow(),
});
```

- `startDate` and `endDate` are `YYYY-MM-DD` text columns (consistent with codebase convention for dates).
- A period is "open" when `now()` falls between `startDate` and `endDate`.

---

### 4. Create `feedbackPassphrases` schema

**File**: `src/app/academic/feedback/periods/_schema/feedbackPassphrases.ts`

```ts
import { structureSemesters } from '@academic/structures/_schema/structureSemesters';
import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { feedbackPeriods } from './feedbackPeriods';

export const feedbackPassphrases = pgTable(
  'feedback_passphrases',
  {
    id: serial().primaryKey(),
    periodId: integer()
      .references(() => feedbackPeriods.id, { onDelete: 'cascade' })
      .notNull(),
    structureSemesterId: integer()
      .references(() => structureSemesters.id)
      .notNull(),
    passphrase: text().notNull().unique(),
    used: boolean().notNull().default(false),
    usedAt: timestamp(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    passphraseIdx: index('idx_feedback_passphrases_passphrase').on(table.passphrase),
    periodClassIdx: index('idx_feedback_passphrases_period_class').on(table.periodId, table.structureSemesterId),
  })
);
```

- A passphrase links to a **class** (`structureSemesterId`) NOT to a student.
- `used` becomes `true` only when the student finishes (rated or skipped all modules).

---

### 5. Create `feedbackResponses` schema

**File**: `src/app/academic/feedback/_schema/feedbackResponses.ts`

```ts
import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { feedbackPassphrases } from '../periods/_schema/feedbackPassphrases';
import { feedbackQuestions } from '../questions/_schema/feedbackQuestions';

export const feedbackResponses = pgTable(
  'feedback_responses',
  {
    id: serial().primaryKey(),
    passphraseId: integer()
      .references(() => feedbackPassphrases.id, { onDelete: 'cascade' })
      .notNull(),
    assignedModuleId: integer()
      .references(() => assignedModules.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: integer()
      .references(() => feedbackQuestions.id)
      .notNull(),
    rating: integer().notNull(),
    comment: text(),
    createdAt: timestamp().defaultNow(),
  },
  (table) => ({
    uniqueResponse: unique().on(table.passphraseId, table.assignedModuleId, table.questionId),
  })
);
```

- **No student identifiers stored** — only the passphrase which links to a class.
- `rating` is 1–5 integer.
- Unique constraint prevents duplicate ratings for the same question on the same module by the same passphrase.

---

### 6. Create relations files

Create a `relations.ts` file alongside each schema group.

**File**: `src/app/academic/feedback/categories/_schema/relations.ts`
- `feedbackCategories` has many `feedbackQuestions`

**File**: `src/app/academic/feedback/questions/_schema/relations.ts`
- `feedbackQuestions` belongs to `feedbackCategories`
- `feedbackQuestions` has many `feedbackResponses`

**File**: `src/app/academic/feedback/periods/_schema/relations.ts`
- `feedbackPeriods` belongs to `terms`, has many `feedbackPassphrases`
- `feedbackPassphrases` belongs to `feedbackPeriods`, belongs to `structureSemesters`, has many `feedbackResponses`

**File**: `src/app/academic/feedback/_schema/relations.ts`
- `feedbackResponses` belongs to `feedbackPassphrases`, `assignedModules`, `feedbackQuestions`

Use the standard Drizzle `relations()` pattern used throughout the codebase. Import schemas from their specific module paths (NOT from `@/core/database`).

---

### 7. Update `_database/index.ts` barrel export

**File**: `src/app/academic/_database/index.ts`

Add re-exports for all new schemas and their relations at the end of the existing exports:

```ts
export * from '../feedback/_schema/feedbackResponses';
export * from '../feedback/_schema/relations';
export * from '../feedback/categories/_schema/feedbackCategories';
export * from '../feedback/categories/_schema/relations';
export * from '../feedback/questions/_schema/feedbackQuestions';
export * from '../feedback/questions/_schema/relations';
export * from '../feedback/periods/_schema/feedbackPeriods';
export * from '../feedback/periods/_schema/feedbackPassphrases';
export * from '../feedback/periods/_schema/relations';
```

Also check if `src/core/database/index.ts` has a wildcard re-export of `@academic/_database` or if the new schemas need to be added there too. Follow the existing pattern.

---

### 8. Create BIP39 passphrase utility

**File**: `src/app/academic/feedback/_shared/lib/passphrase.ts`

- Include a curated BIP39 English word list (the standard 2048 words). You can find a copy at https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt — embed the full array directly in the file as a `const wordList: string[]`.
- Implement:

```ts
function generatePassphrase(): string
```
Returns 3 random words joined by spaces (e.g., `"tiger moon river"`). Use `crypto.getRandomValues` for secure randomness.

```ts
function generateUniquePassphrases(count: number, existing: Set<string>): string[]
```
Generates `count` unique passphrases, avoiding collisions with `existing`. Throws if unable to generate enough unique passphrases after reasonable retries.

Both functions should be top-level `export function` declarations (no arrow functions at top level per codebase rules).

---

### 9. Add feedback to academic navigation

**File**: `src/app/academic/academic.config.ts`

Add a new navigation item to the `dashboard` array:

```ts
{
  label: 'Feedback',
  href: '/academic/feedback',
  icon: IconMessageStar, // from @tabler/icons-react
  roles: ['academic', 'admin'],
  isVisible: (session) => {
    const position = session?.user?.position;
    return !!(position && ['manager', 'admin', 'program_leader'].includes(position));
  },
},
```

Import `IconMessageStar` (or `IconMessages` if `IconMessageStar` is not available) from `@tabler/icons-react`.

---

### 10. Create feedback module layout with tabs

**File**: `src/app/academic/feedback/layout.tsx`

Create a layout that renders **tabs** for the three admin sub-features: Categories, Questions, Periods. Use Mantine `Tabs` component. The tabs should navigate between:
- `/academic/feedback/categories` — "Categories"
- `/academic/feedback/questions` — "Questions"  
- `/academic/feedback/periods` — "Periods"

Use `usePathname()` to determine the active tab. Render `{children}` below the tabs.

This is a **client component** (`'use client'`).

Also create a redirect page:

**File**: `src/app/academic/feedback/page.tsx`

This should redirect to `/academic/feedback/categories` (use `redirect()` from `next/navigation`).

---

### 11. Generate database migration

Run `pnpm db:generate --custom` to create the migration file for all 5 new tables. Do NOT manually create `.sql` migration files.

---

### Verification

Run `pnpm tsc --noEmit & pnpm lint:fix` and fix any issues until clean.

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

### Existing Schema References (for FK targets)

- `terms` table: `src/app/registry/terms/_schema/terms.ts` — `id: serial().primaryKey()`, `code: text()`, `name: text()`, etc.
- `structureSemesters` table: `src/app/academic/structures/_schema/structureSemesters.ts` — `id: serial().primaryKey()`, `structureId`, `semesterNumber`, `name`, `totalCredits`.
- `assignedModules` table: `src/app/academic/assigned-modules/_schema/assignedModules.ts` — `id: serial().primaryKey()`, `termId`, `userId`, `semesterModuleId`, etc.

### Codebase Patterns to Follow

- **Schema files** NEVER import from `@/core/database`. Use specific module paths.
- **One table per file**, filename matches the export in camelCase.
- **Relations** in separate `relations.ts` files alongside schemas.
- **Top-level exports** use `function` declarations, never arrow functions.
- **No code comments**.
- **Mantine v8** only for UI, no custom CSS.
