# Error Handling Architecture

> Standardized error handling patterns for the Registry Web application.
> All server-to-client communication uses `ActionResult<T>` — no thrown errors leak to the UI.

## Problem Statement

The codebase currently uses **three inconsistent patterns** for error handling:

| Pattern | Modules | Risk |
|---------|---------|------|
| `ActionResult<T>` | `apply/` | ✅ Safe — errors are values |
| Direct throw | `academic/`, `finance/`, `registry/` | ⚠️ Errors can surface as _"An error occurred in the Server Components render"_ |
| Pass-through (no handling) | Simple CRUD modules | ❌ Unhandled errors crash the page |

Additionally:
- **No `error.tsx`** exists anywhere — unhandled errors show the default Next.js error screen.
- **`ListLayout`** ignores `useQuery` error states — failed fetches render silently.
- **`QueryClient`** has no global error handler.
- **`extractError()`** exists only in `src/app/apply/_lib/errors.ts` — not shared.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Mutation actions | `ActionResult<T>` via `wrapAction` helper |
| Query actions (client) | `ActionResult<T>` via `wrapAction` helper (ListLayout unwraps) |
| Query actions (RSC) | Keep throwing — `error.tsx` catches, pages use `notFound()` for null |
| Error boundaries | Root-level `error.tsx` only |
| ListLayout errors | Inline error state with retry button |
| DeleteButton/DetailsViewHeader | Detect `ActionResult` like Form does |
| `isActionResult` | Exported from `actionResult.ts` (shared utility) |
| StatusPage | Add optional `onRetry` prop for `error.tsx` |
| Migration strategy | Full migration sprint |
| User-facing messages | Show `error.message` directly |

---

## Architecture

### 1. The `ActionResult<T>` Type (existing)

**File**: `src/shared/lib/utils/actionResult.ts`

```ts
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function failure<T>(error: string): ActionResult<T> {
  return { success: false, error };
}
```

### 2. Shared `extractError` Utility (move from apply to shared)

**Move**: `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts`

```ts
export function extractError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
```

This utility converts any caught value into a user-facing string.

### 3. The `wrapAction` Helper (new)

**File**: `src/shared/lib/utils/actionResult.ts` (add to existing file)

```ts
export async function wrapAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(extractError(error));
  }
}
```

This eliminates the repetitive 7-line try/catch block in every action. Every mutation/client-query action reduces to a single return statement:

```ts
// Before (7 lines per action):
export async function createStudent(data: Input): Promise<ActionResult<Student>> {
  try {
    const student = await studentsService.create(data);
    return success(student);
  } catch (error) {
    return failure(extractError(error));
  }
}

// After (1 line per action):
export async function createStudent(data: Input): Promise<ActionResult<Student>> {
  return wrapAction(() => studentsService.create(data));
}
```

With ~104 action files, this saves hundreds of lines of boilerplate.

### 4. Shared `isActionResult` Type Guard (new)

**File**: `src/shared/lib/utils/actionResult.ts` (add to existing file)

```ts
export function isActionResult(value: unknown): value is ActionResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success: unknown }).success === 'boolean'
  );
}
```

Currently duplicated locally in `Form.tsx`. After extraction, `Form.tsx`, `ListLayout.tsx`, and `DeleteButton.tsx` all import from the same source.

---

## Patterns

### Pattern 1: Server Actions (Mutations)

**Every** mutation server action MUST return `ActionResult<T>`. Never throw from a mutation action.

```ts
// ✅ CORRECT — uses wrapAction helper
'use server';

import { wrapAction } from '@/shared/lib/utils/actionResult';
import type { ActionResult } from '@/shared/lib/utils/actionResult';

export async function createStudent(
  data: StudentInsert
): Promise<ActionResult<Student>> {
  return wrapAction(() => studentsService.create(data));
}
```

```ts
// ❌ WRONG — throws directly, can cause "Server Components render" error
export async function createStudent(data: StudentInsert) {
  return studentsService.create(data); // throws on failure
}
```

**Simple CRUD actions** using `BaseService` follow the same pattern:

```ts
'use server';

import { wrapAction } from '@/shared/lib/utils/actionResult';
import type { ActionResult } from '@/shared/lib/utils/actionResult';

export async function updateSponsor(
  id: number,
  data: Partial<SponsorInsert>
): Promise<ActionResult<Sponsor>> {
  return wrapAction(() => sponsorsService.update(id, data));
}

export async function deleteSponsor(
  id: number
): Promise<ActionResult<Sponsor>> {
  return wrapAction(() => sponsorsService.delete(id));
}
```

### Pattern 2: Server Actions (Queries for ListLayout)

`ListLayout` calls a `getData(page, search)` function. These use `wrapAction`:

```ts
export async function findAllStudents(
  page: number,
  search: string
): Promise<ActionResult<PaginatedResult<Student>>> {
  return wrapAction(() => studentsService.findAll({ page, search }));
}
```

**ListLayout** will need to be updated to unwrap `ActionResult` and show error states (see Step 3).

### Pattern 3: Server Actions (Queries for RSC Detail Pages)

GET actions called **only from RSC** (e.g. `getStudent` in `[id]/page.tsx`) do **NOT** need `ActionResult`. They keep throwing — `error.tsx` catches unexpected errors, and pages check for `null` → `notFound()`.

**Rationale**: RSC pages already have `error.tsx` as a safety net. Wrapping every GET in ActionResult just to unwrap it in the same server process is unnecessary ceremony. This avoids touching ~50+ RSC pages and their GET actions.

```ts
// actions.ts — RSC-only GET: no ActionResult needed
export async function getStudent(stdNo: string) {
  return studentsService.get(stdNo);
}

// [id]/page.tsx — same pattern as today
export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(id);

  if (!student) notFound();

  return <StudentDetails student={student} />;
}
```

- `null` check → `notFound()` for missing entities (existing pattern, no change).
- `error.tsx` catches any thrown errors (DB errors, connection issues, etc.).
- If a GET action is also called from the **client** (e.g. via TanStack Query), it MUST use `wrapAction`.

### Pattern 4: RSC Page Data Fetching

RSC pages keep their existing pattern — no changes needed:

```ts
const entity = await getEntity(id);
if (!entity) notFound();
return <EntityDetails entity={entity} />;
```

- Use `notFound()` when an entity is missing.
- Let `error.tsx` catch unexpected crashes.

---

## Implementation Plan

### Step 1: Move `extractError` to shared

- Move `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts`
- Update imports in `src/app/apply/` to use the new path.

### Step 2: Add `onRetry` prop to `StatusPage`

**File**: `src/shared/ui/StatusPage.tsx`

Add an optional `onRetry` prop that renders a "Try again" button:

```tsx
export interface StatusPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  showBack?: boolean;
  onRetry?: () => void;  // NEW
}
```

Render beside the existing buttons:
```tsx
{onRetry ? (
  <Button variant="filled" color={color} onClick={onRetry}>
    Try again
  </Button>
) : null}
```

### Step 3: Create root `error.tsx`

**File**: `src/app/error.tsx`

```tsx
'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import StatusPage from '@/shared/ui/StatusPage';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusPage
      title="Something went wrong"
      description={error.message}
      color="red"
      icon={<IconAlertTriangle size={32} />}
      showBack
      onRetry={reset}
    />
  );
}
```

### Step 4: Update `ListLayout` to handle errors

Add error state handling to `ListLayout` using `useQuery`'s `isError` and `error` fields:

```tsx
// Inside ListLayout, after the useQuery call:
if (isError) {
  return (
    <Center h="100%">
      <Stack align="center" gap="sm">
        <ThemeIcon size={48} radius="xl" variant="light" color="red">
          <IconAlertTriangle size={24} />
        </ThemeIcon>
        <Text c="dimmed" size="sm">Failed to load data</Text>
        <Button size="xs" variant="light" onClick={() => refetch()}>
          Retry
        </Button>
      </Stack>
    </Center>
  );
}
```

Additionally, `ListLayout`'s `getData` prop signature may need updating to support `ActionResult` unwrapping. Two options:

Unwrap inside `ListLayout`'s query function (backward compatible during migration):
```ts
import { isActionResult } from '@/shared/lib/utils/actionResult';

queryFn: async () => {
  const result = await getData(page, search);
  if (isActionResult(result)) {
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
  return result; // backward compat with non-ActionResult returns during migration
}
```

### Step 5: Update `DeleteButton` to handle `ActionResult`

**File**: `src/shared/ui/adease/DeleteButton.tsx`

`DeleteButton` (and `DetailsViewHeader` which forwards to it) expects `handleDelete: () => Promise<void>`. After migration, delete actions return `ActionResult`. The mutation's `onSuccess` must detect and unwrap it.

```tsx
import { isActionResult } from '@/shared/lib/utils/actionResult';

const mutation = useMutation({
  mutationFn: handleDelete,
  onSuccess: async (data) => {
    if (isActionResult(data)) {
      if (!data.success) {
        notifications.show({
          title: 'Error',
          message: data.error,
          color: 'red',
        });
        onError?.({ message: data.error } as Error);
        return;
      }
    }
    // existing success logic (invalidate queries, notify, navigate)
  },
});
```

The `handleDelete` prop type changes from `() => Promise<void>` to `() => Promise<void | ActionResult<unknown>>`.

**Also applies to**: `DetailsViewHeader.tsx` which passes `handleDelete` down to `DeleteButton`.

### Step 6: Update `Form.tsx` to use shared `isActionResult`

**File**: `src/shared/ui/adease/Form.tsx`

Remove the local `isActionResult` function and import from shared:

```ts
// Remove this local definition:
// function isActionResult(value: unknown): value is ActionResult<unknown> { ... }

// Replace with:
import { isActionResult } from '@/shared/lib/utils/actionResult';
```

### Step 7: Migrate all server actions

Every `actions.ts` across all modules gets wrapped with try/catch returning `ActionResult<T>`.

**Order of migration** (by module):
1. `src/app/academic/` — largest module, most actions
2. `src/app/registry/` — student records 
3. `src/app/finance/` — payments, sponsors
4. `src/app/admin/` — user management
5. `src/app/lms/` — Moodle integration
6. `src/app/timetable/` — scheduling
7. `src/app/library/` — library management
8. `src/app/admissions/` — admissions
9. `src/app/student-portal/` — student portal

**Which actions to wrap** (the key distinction):

| Action type | Called from | Wrap with `wrapAction`? |
|---|---|---|
| Mutations (create, update, delete) | Client (Form, DeleteButton) | ✅ Yes |
| Queries for ListLayout (findAll) | Client (useQuery) | ✅ Yes |
| GET for RSC pages (get, getById) | Server Component only | ❌ No — let error.tsx catch |
| GET used by both RSC and client | Both | ✅ Yes (client needs ActionResult) |

**Migration template**:

```ts
// Before:
export async function createThing(data: Input) {
  return thingService.create(data);
}

export async function findAllThings(page: number, search: string) {
  return thingService.findAll({ page, search });
}

// After:
export async function createThing(data: Input): Promise<ActionResult<Thing>> {
  return wrapAction(() => thingService.create(data));
}

export async function findAllThings(
  page: number, search: string
): Promise<ActionResult<PaginatedResult<Thing>>> {
  return wrapAction(() => thingService.findAll({ page, search }));
}

// RSC-only GET — NO CHANGE:
export async function getThing(id: number) {
  return thingService.get(id);
}
```

### Step 8: RSC pages — No changes needed

RSC pages that call GET actions keep their existing pattern. `error.tsx` is the safety net. No migration work required for `[id]/page.tsx` files.

---

## Services & Repositories: No Changes

The `BaseService` and `BaseRepository` layers continue to **throw** errors internally. This is correct — they are internal boundaries. The `actions.ts` layer is the **server-client boundary** where errors are caught and converted to `ActionResult<T>`.

```
[DB] → Repository (throws) → Service (throws) → Action (catches → ActionResult) → Client (reads result)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                                                             │
│  Form.tsx ──────────► checks isActionResult()               │
│  ListLayout.tsx ────► unwraps ActionResult or shows error   │
│  DeleteButton.tsx ──► checks isActionResult() in onSuccess  │
│  RSC page.tsx ──────► null check → notFound() (no change)   │
│                                                             │
│  error.tsx ─────────► catches unhandled RSC/render errors   │
│  not-found.tsx ─────► renders 404 UI                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ActionResult<T>
                             │
┌────────────────────────────┴────────────────────────────────┐
│             SERVER ACTIONS (mutations + client queries)       │
│                                                             │
│  Mutations/findAll:                                         │
│    return wrapAction(() => service.method());               │
│                                                             │
│  RSC-only GETs:                                             │
│    return service.get(id);  // throws → error.tsx catches   │
└────────────────────────────┬────────────────────────────────┘
                             │
                         throws
                             │
┌────────────────────────────┴────────────────────────────────┐
│               SERVICE (throws on failure)                    │
│               REPOSITORY (throws on failure)                 │
│               DATABASE                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary of Files to Create/Modify

| Action | File |
|--------|------|
| **Move** | `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts` |
| **Modify** | `src/shared/lib/utils/actionResult.ts` (add `wrapAction`, `isActionResult`) |
| **Modify** | `src/shared/ui/StatusPage.tsx` (add `onRetry` prop) |
| **Create** | `src/app/error.tsx` |
| **Modify** | `src/shared/ui/adease/ListLayout.tsx` (add error state + ActionResult unwrap) |
| **Modify** | `src/shared/ui/adease/DeleteButton.tsx` (detect ActionResult in onSuccess) |
| **Modify** | `src/shared/ui/adease/DetailsViewHeader.tsx` (update handleDelete type) |
| **Modify** | `src/shared/ui/adease/Form.tsx` (replace local isActionResult with shared import) |
| **Modify** | Mutation + findAll `_server/actions.ts` across all modules (wrap with `wrapAction`) |
| **No change** | RSC `page.tsx` files (keep existing null-check + notFound pattern) |
| **No change** | RSC-only GET actions (keep throwing) |
| **No change** | `src/core/platform/BaseService.ts` (internal, keeps throwing) |
| **No change** | `src/core/platform/BaseRepository.ts` (internal, keeps throwing) |

---

## Rules

1. **Every mutation action** (create, update, delete) MUST return `ActionResult<T>` via `wrapAction`.
2. **Every client-query action** (findAll for ListLayout) MUST return `ActionResult<T>` via `wrapAction`.
3. **RSC-only GET actions** (getEntity for `[id]/page.tsx`) keep throwing — `error.tsx` catches.
4. **Never throw** from a mutation/client-query action — always use `wrapAction`.
5. **Services and repositories** continue to throw — they are internal.
6. **RSC pages** check for `null` → `notFound()`. **`error.tsx`** catches unexpected crashes.
7. **`extractError()`** is the only way to convert caught errors to strings (used internally by `wrapAction`).
8. **`ListLayout`** unwraps `ActionResult` and shows inline error + retry on failure.
9. **`DeleteButton`** detects `ActionResult` in mutation onSuccess (same pattern as `Form`).
10. **`isActionResult`** is imported from `@/shared/lib/utils/actionResult` — never duplicated locally.
