## Step 2 — Categories & Questions CRUD (Admin Features)

### Big Picture: Academic Feedback / Lecturer Evaluation Module

This is a **two-part system** for anonymous lecturer evaluation at a university:

1. **Admin module** at `/academic/feedback` (nested inside the existing `academic` module dashboard) — where academic managers and admins manage feedback question categories, questions, evaluation periods, and passphrase distribution.
2. **Public student page** at `/feedback` (top-level, no auth, standalone layout) — where students enter a BIP39-style 3-word passphrase (e.g., "tiger moon river") to anonymously evaluate lecturers on their class modules using a 1–5 star rating wizard.

**How it works end-to-end:**
- Admins create **categories** (e.g., "Teaching Quality") and **questions** (e.g., "Is the lecturer always on time?") organized by category. ← **This step handles this.**
- Admins create a **feedback period** tied to an academic term with a date range. (Step 3)
- For each period, admins **generate passphrases** per class. Each class gets `studentCount + 10%` unique 3-word BIP39 passphrases printed for distribution. (Step 3)
- Students go to `/feedback`, enter their passphrase, and rate each lecturer/module combo for their class via a wizard. (Step 4)
- **Anonymity**: `feedbackResponses` stores only `passphraseId` (links to a class, not a student). No student identifiers stored.
- All active questions apply globally to every evaluation period (no per-period question selection).

**Schema relationships:**
```
feedbackCategories ─1:N─── feedbackQuestions       ← This step builds CRUD for these two
feedbackPeriods ───1:N─── feedbackPassphrases       (Step 3)
feedbackPassphrases ──N:1── structureSemesters       (Step 3)
feedbackPeriods ───N:1─── terms                      (Step 3)
feedbackResponses ──N:1── feedbackPassphrases        (Step 4)
feedbackResponses ──N:1── assignedModules            (Step 4)
feedbackResponses ──N:1── feedbackQuestions           (Step 4)
```

**The full implementation is split into 4 steps:**
1. **Step 1** (done): Foundation — all 5 schemas, relations, barrel exports, BIP39 utility, navigation config, feedback layout with tabs, migration
2. **Step 2 (this step)**: Categories & Questions — standard CRUD admin features
3. **Step 3**: Periods & Passphrase Management — period CRUD + passphrase generation + print
4. **Step 4**: Public Feedback Wizard — the `/feedback` student-facing page

---

**Goal for this step**: Build the full CRUD admin interfaces for feedback categories and feedback questions. These are standard ListLayout + DetailsView + Form features following existing codebase patterns.

**Prerequisites (completed in Step 1)**:
- All 5 feedback schemas exist: `feedbackCategories`, `feedbackQuestions`, `feedbackPeriods`, `feedbackPassphrases`, `feedbackResponses`
- Relations files exist for all schemas
- `src/app/academic/_database/index.ts` barrel export includes all feedback schemas
- `src/app/academic/feedback/layout.tsx` exists with tabs for Categories, Questions, Periods
- `src/app/academic/feedback/page.tsx` redirects to `/academic/feedback/categories`
- Navigation entry exists in `academic.config.ts`

---

### Part A: Feedback Categories CRUD

Categories are simple name-only entities (e.g., "Teaching Quality", "Communication", "Professionalism").

#### A1. Repository

**File**: `src/app/academic/feedback/categories/_server/repository.ts`

```ts
import { db, feedbackCategories } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class FeedbackCategoryRepository extends BaseRepository<
  typeof feedbackCategories,
  'id'
> {
  constructor() {
    super(feedbackCategories, feedbackCategories.id);
  }
}

export const feedbackCategoryRepository = new FeedbackCategoryRepository();
```

Standard `BaseRepository` pattern — no custom methods needed. The base class provides `query()`, `findById()`, `create()`, `update()`, `delete()`.

#### A2. Service

**File**: `src/app/academic/feedback/categories/_server/service.ts`

```ts
import type { feedbackCategories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import FeedbackCategoryRepository from './repository';

class FeedbackCategoryService extends BaseService<typeof feedbackCategories, 'id'> {
  constructor() {
    super(new FeedbackCategoryRepository(), {
      findAllRoles: ['academic', 'admin'],
      byIdRoles: ['academic', 'admin'],
      createRoles: ['academic', 'admin'],
      updateRoles: ['academic', 'admin'],
      deleteRoles: ['academic', 'admin'],
    });
  }
}

export const feedbackCategoriesService = serviceWrapper(
  FeedbackCategoryService,
  'FeedbackCategoriesService'
);
```

Roles: `['academic', 'admin']` — both academic managers and admins can manage categories.

#### A3. Actions

**File**: `src/app/academic/feedback/categories/_server/actions.ts`

```ts
'use server';

import type { feedbackCategories } from '@/core/database';
import { feedbackCategoriesService as service } from './service';

type Category = typeof feedbackCategories.$inferInsert;

export async function getCategories(page = 1, search = '') {
  return service.findAll({
    page,
    search: search.trim(),
    searchColumns: ['name'],
  });
}

export async function getCategory(id: number) {
  return service.get(id);
}

export async function createCategory(data: Category) {
  return service.create(data);
}

export async function updateCategory(id: number, data: Category) {
  return service.update(id, data);
}

export async function deleteCategory(id: number) {
  return service.delete(id);
}

export async function getAllCategories() {
  return service.getAll();
}
```

The `getAllCategories()` action is needed by the Questions feature (Step 2 Part B) for the category dropdown.

#### A4. Form Component

**File**: `src/app/academic/feedback/categories/_components/Form.tsx`

- Client component (`'use client'`)
- Import `feedbackCategories` from `@academic/_database`
- Use `Form` from `@/shared/ui/adease`
- Use `createInsertSchema` from `drizzle-zod` for validation
- Fields: `name` (TextInput, required)
- On success: navigate to `/academic/feedback/categories/${id}`
- Query key: `['feedback-categories']`

Follow exactly the pattern from `src/app/academic/modules/_components/Form.tsx`:

```tsx
'use client';

import { feedbackCategories } from '@academic/_database';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Category = typeof feedbackCategories.$inferInsert;

type Props = {
  onSubmit: (values: Category) => Promise<Category>;
  defaultValues?: Category;
  title?: string;
};

export default function CategoryForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();

  return (
    <Form
      title={title}
      action={onSubmit}
      queryKey={['feedback-categories']}
      schema={createInsertSchema(feedbackCategories)}
      defaultValues={defaultValues}
      onSuccess={({ id }) => {
        router.push(`/academic/feedback/categories/${id}`);
      }}
    >
      {(form) => (
        <TextInput label="Name" {...form.getInputProps('name')} />
      )}
    </Form>
  );
}
```

#### A5. Pages

**File**: `src/app/academic/feedback/categories/layout.tsx`

```tsx
'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getCategories } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path="/academic/feedback/categories"
      queryKey={['feedback-categories']}
      getData={getCategories}
      actionIcons={[<NewLink key="new-link" href="/academic/feedback/categories/new" />]}
      renderItem={(it) => <ListItem id={it.id} label={it.name} />}
    >
      {children}
    </ListLayout>
  );
}
```

**File**: `src/app/academic/feedback/categories/page.tsx`
- Render `<NothingSelected title="Categories" />`

**File**: `src/app/academic/feedback/categories/new/page.tsx`
- Render `<Form title="Create Category" onSubmit={createCategory} />`

**File**: `src/app/academic/feedback/categories/[id]/page.tsx`
- Server component, async
- Fetch category with `getCategory(id)`
- Render `DetailsView` with `DetailsViewHeader` (title "Category", queryKey `['feedback-categories']`, handleDelete) and `DetailsViewBody` with `FieldView` for name
- Use `deleteCategory` in the delete handler

**File**: `src/app/academic/feedback/categories/[id]/edit/page.tsx`
- Server component, async
- Fetch category, render Form with `defaultValues` and `updateCategory`

---

### Part B: Feedback Questions CRUD

Questions belong to categories, have a text body, and an active/inactive toggle.

#### B1. Repository

**File**: `src/app/academic/feedback/questions/_server/repository.ts`

```ts
import { eq } from 'drizzle-orm';
import { db, feedbackQuestions, feedbackCategories } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class FeedbackQuestionRepository extends BaseRepository<
  typeof feedbackQuestions,
  'id'
> {
  constructor() {
    super(feedbackQuestions, feedbackQuestions.id);
  }

  override async findById(id: number) {
    return db.query.feedbackQuestions.findFirst({
      where: eq(feedbackQuestions.id, id),
      with: { category: true },
    });
  }
}

export const feedbackQuestionRepository = new FeedbackQuestionRepository();
```

The `findById` override joins the category so the detail page can display category name.

#### B2. Service

**File**: `src/app/academic/feedback/questions/_server/service.ts`

```ts
import type { feedbackQuestions } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import FeedbackQuestionRepository from './repository';

class FeedbackQuestionService extends BaseService<typeof feedbackQuestions, 'id'> {
  constructor() {
    super(new FeedbackQuestionRepository(), {
      findAllRoles: ['academic', 'admin'],
      byIdRoles: ['academic', 'admin'],
      createRoles: ['academic', 'admin'],
      updateRoles: ['academic', 'admin'],
      deleteRoles: ['academic', 'admin'],
    });
  }

  override async get(id: number) {
    return withAuth(
      async () => (this.repository as FeedbackQuestionRepository).findById(id),
      ['academic', 'admin']
    );
  }
}

export const feedbackQuestionsService = serviceWrapper(
  FeedbackQuestionService,
  'FeedbackQuestionsService'
);
```

#### B3. Actions

**File**: `src/app/academic/feedback/questions/_server/actions.ts`

```ts
'use server';

import type { feedbackQuestions } from '@/core/database';
import { feedbackQuestionsService as service } from './service';

type Question = typeof feedbackQuestions.$inferInsert;

export async function getQuestions(page = 1, search = '') {
  return service.findAll({
    page,
    search: search.trim(),
    searchColumns: ['text'],
  });
}

export async function getQuestion(id: number) {
  return service.get(id);
}

export async function createQuestion(data: Question) {
  return service.create(data);
}

export async function updateQuestion(id: number, data: Question) {
  return service.update(id, data);
}

export async function deleteQuestion(id: number) {
  return service.delete(id);
}
```

#### B4. Form Component

**File**: `src/app/academic/feedback/questions/_components/Form.tsx`

- Client component (`'use client'`)
- Import `feedbackQuestions` from `@academic/_database`
- Fields:
  - `categoryId` — `Select` component, populated via TanStack Query calling `getAllCategories()` from `../../categories/_server/actions`
  - `text` — `Textarea` for the question body
  - `active` — `Switch` component (default true)
- Use `Form` from `@/shared/ui/adease`
- Query key: `['feedback-questions']`
- On success: navigate to `/academic/feedback/questions/${id}`

For the category select, use `useQuery` with key `['feedback-categories-all']` to fetch `getAllCategories()` and map to `{ value: String(id), label: name }`.

#### B5. Pages

**File**: `src/app/academic/feedback/questions/layout.tsx`

```tsx
'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getQuestions } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ListLayout
      path="/academic/feedback/questions"
      queryKey={['feedback-questions']}
      getData={getQuestions}
      actionIcons={[<NewLink key="new-link" href="/academic/feedback/questions/new" />]}
      renderItem={(it) => (
        <ListItem id={it.id} label={it.text} description={it.active ? 'Active' : 'Inactive'} />
      )}
    >
      {children}
    </ListLayout>
  );
}
```

**File**: `src/app/academic/feedback/questions/page.tsx`
- Render `<NothingSelected title="Questions" />`

**File**: `src/app/academic/feedback/questions/new/page.tsx`
- Render `<Form title="Create Question" onSubmit={createQuestion} />`

**File**: `src/app/academic/feedback/questions/[id]/page.tsx`
- Server component, async
- Fetch question with `getQuestion(id)` (returns question with category relation)
- Render `DetailsView` with:
  - `FieldView` for category name (from the joined relation)
  - `FieldView` for question text
  - `FieldView` for active status (display "Active" / "Inactive" or use a badge)
- Delete handler using `deleteQuestion`

**File**: `src/app/academic/feedback/questions/[id]/edit/page.tsx`
- Server component, async
- Fetch question, render Form with `defaultValues` and `updateQuestion`

---

### Verification

Run `pnpm tsc --noEmit & pnpm lint:fix` and fix any issues until clean.

### Codebase Patterns Reference

- **Repository**: Extends `BaseRepository<typeof table, 'id'>`, constructor calls `super(table, table.id)`. Server code CAN import from `@/core/database`.
- **Service**: Extends `BaseService<typeof table, 'id'>`, constructor calls `super(new Repository(), { roles config })`. Export via `serviceWrapper()`.
- **Actions**: `'use server'` directive, thin wrappers around service methods.
- **Form**: Client component using `Form` from `@/shared/ui/adease`, `createInsertSchema` from `drizzle-zod`, `useRouter` from `nextjs-toploader/app`.
- **Layout**: Client component using `ListLayout` with `getData`, `queryKey`, `path`, `renderItem`.
- **Detail page**: Server component using `DetailsView`, `DetailsViewHeader`, `DetailsViewBody`, `FieldView`.
- **Edit page**: Server component fetching data, rendering Form with `defaultValues`.
- **New page**: Server component rendering Form with `onSubmit={createAction}`.
- **NothingSelected page**: `page.tsx` at list root showing empty state.
- **Top-level exports**: Use `function` declarations, never arrow functions.
- **No code comments**.
- **Schema imports in client code**: Use `@academic/_database`, never `@/core/database`.
