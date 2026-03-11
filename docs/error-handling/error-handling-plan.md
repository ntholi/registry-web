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
- **No `global-error.tsx`** — root layout failures produce a white screen with no recovery UI.
- **`ListLayout`** ignores `useQuery` error states — failed fetches render silently as empty lists.
- **`QueryClient`** has no global error handler — no default toast on failed mutations.
- **`extractError()`** exists only in `src/app/apply/_lib/errors.ts` — not shared.
- **No server-side error logging** at the action boundary — errors are lost.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Mutation actions | `ActionResult<T, AppError>` via `wrapAction` helper |
| Query actions (client) | `ActionResult<T, AppError>` via `wrapAction` helper (ListLayout unwraps) |
| Query actions (RSC) | Keep throwing — `error.tsx` catches, pages use `notFound()` for null |
| Shared result contract | Full structured `AppError` type (`message`, `code`, `status`, `fieldErrors`) |
| Error boundaries | Root-level `error.tsx` + **mandatory `global-error.tsx`** |
| ListLayout errors | Inline error state with retry button + `ActionResult` unwrapping |
| DeleteButton/DetailsViewHeader | Detect `ActionResult` like Form does |
| `isActionResult` | Exported from `actionResult.ts` (shared utility) |
| StatusPage | Add `onRetry` prop for error boundaries |
| QueryClient | Add `defaultOptions.mutations.onError` for global mutation error toasts |
| Error logging | `wrapAction` logs errors server-side via `createServiceLogger` before sanitizing |
| Message sanitization | Never show raw thrown messages; `extractError` maps known DB codes to safe messages |
| Migration strategy | Full sprint: shared infrastructure first, then all ~104 action files module by module |
| `not-found.tsx` | Already exists ✅ — uses `StatusPage` |
| User-facing messages | Always sanitized. Technical details logged server-side only |

---

## Architecture

### 1. The `ActionResult<T, E>` Type

**File**: `src/shared/lib/utils/actionResult.ts`

```ts
export interface AppError {
  message: string;
  code?: string;
  status?: 'failed' | 'error' | 'validation' | 'unauthorized' | 'not_found';
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function failure<T>(error: AppError | string): ActionResult<T> {
  const normalized = typeof error === 'string' ? { message: error } : error;
  return { success: false, error: normalized };
}
```

The full `AppError` shape supports:
- `message` — user-safe text shown in toasts/UI
- `code` — programmatic error code (e.g. `'UNIQUE_VIOLATION'`, `'NOT_FOUND'`, `'UNAUTHORIZED'`) for conditional client logic
- `status` — semantic status category for UI decisions
- `fieldErrors` — per-field validation errors (complements Zod for server-side validation scenarios like unique constraint violations on specific fields)

### 2. Shared `extractError` Utility (move from apply to shared)

**Move**: `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts`

```ts
import type { AppError } from './actionResult';

const PG_ERROR_MAP: Record<string, (detail?: string) => AppError> = {
  '23505': (detail) => ({
    message: detail?.includes('Key')
      ? `A record with this value already exists`
      : 'A duplicate record was detected',
    code: 'UNIQUE_VIOLATION',
    status: 'validation',
  }),
  '23503': () => ({
    message: 'This record is referenced by other data and cannot be modified',
    code: 'FK_VIOLATION',
    status: 'error',
  }),
  '23502': () => ({
    message: 'A required field is missing',
    code: 'NOT_NULL_VIOLATION',
    status: 'validation',
  }),
};

function isPostgresError(
  error: unknown
): error is Error & { code: string; detail?: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

export function extractError(error: unknown): AppError {
  if (isPostgresError(error) && PG_ERROR_MAP[error.code]) {
    return PG_ERROR_MAP[error.code](error.detail);
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes('connect') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('timeout')
    ) {
      return {
        message: 'Service temporarily unavailable. Please try again.',
        code: 'SERVICE_UNAVAILABLE',
        status: 'error',
      };
    }
    return { message: msg || 'An unexpected error occurred' };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'An unexpected error occurred' };
}
```

Key improvements over the original:
- **PostgreSQL error code mapping**: Translates constraint violations (23505, 23503, 23502) into user-friendly messages instead of leaking raw DB messages like `duplicate key value violates unique constraint "students_pkey"`.
- **Connection error detection**: Network/timeout errors get a generic "service unavailable" message.
- **Structured output**: Returns `AppError` with `code` and `status` for programmatic handling.

### 3. The `wrapAction` Helper (new)

**File**: `src/shared/lib/utils/actionResult.ts` (add to existing file)

```ts
import { createServiceLogger } from '@/core/platform/logger';
import { extractError } from './extractError';

const actionLogger = createServiceLogger('ServerAction');

export async function wrapAction<T>(
  fn: () => Promise<T>,
  options?: { mapError?: (error: unknown) => AppError }
): Promise<ActionResult<T>> {
  try {
    return success(await fn());
  } catch (error) {
    actionLogger.error('Action failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return failure(options?.mapError?.(error) ?? extractError(error));
  }
}
```

Critical additions over the original plan:
- **Server-side logging**: Every caught error is logged via the existing `createServiceLogger` before being sanitized. This ensures no errors are silently swallowed — the raw technical error (including stack trace) is preserved in server logs while only a safe message reaches the client.
- **Optional `mapError`**: Domain-specific normalization for modules that need custom error mapping (e.g., payment flows, timetable planning).

Usage remains identical:

```ts
export async function createStudent(data: Input): Promise<ActionResult<Student>> {
  return wrapAction(() => studentsService.create(data));
}
```

### 4. Shared `isActionResult` Type Guard & Helpers

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

export function getActionErrorMessage(error: AppError | string): string {
  return typeof error === 'string' ? error : error.message;
}
```

All consumers (`Form.tsx`, `ListLayout.tsx`, `DeleteButton.tsx`) import from this single source.

---

## Patterns

### Pattern 1: Server Actions (Mutations)

**Every** mutation server action MUST return `ActionResult<T>`. Never throw from a mutation action.

```ts
'use server';

import { wrapAction } from '@/shared/lib/utils/actionResult';
import type { ActionResult } from '@/shared/lib/utils/actionResult';

export async function createStudent(
  data: StudentInsert
): Promise<ActionResult<Student>> {
  return wrapAction(() => studentsService.create(data));
}

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

`ListLayout` unwraps `ActionResult` internally and shows error states on failure.

### Pattern 3: Server Actions (Queries for RSC Detail Pages)

GET actions called **only from RSC** (e.g. `getStudent` in `[id]/page.tsx`) do **NOT** need `ActionResult`. They keep throwing — `error.tsx` catches unexpected errors, and pages check for `null` → `notFound()`.

**Rationale**: RSC pages already have `error.tsx` as a safety net. Wrapping every GET in ActionResult just to unwrap it in the same server process is unnecessary ceremony.

```ts
export async function getStudent(stdNo: string) {
  return studentsService.get(stdNo);
}

// [id]/page.tsx
export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();
  return <StudentDetails student={student} />;
}
```

If a GET is needed by **both RSC and client**, split into two exports:

```ts
export async function getStudent(stdNo: string) {
  return studentsService.get(stdNo);
}

export async function getStudentForClient(
  stdNo: string
): Promise<ActionResult<Student | null>> {
  return wrapAction(() => studentsService.get(stdNo));
}
```

### Pattern 4: RSC Page Data Fetching

RSC pages keep their existing pattern — no changes needed:

```ts
const entity = await getEntity(id);
if (!entity) notFound();
return <EntityDetails entity={entity} />;
```

---

## Implementation Plan

### Step 1: Create shared `extractError`

**Move** `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts`

Upgrade to the smart `extractError` with PostgreSQL error code mapping (see Section 2 above).

Update all imports in `src/app/apply/` to use `@/shared/lib/utils/extractError`.

### Step 2: Upgrade `actionResult.ts`

**File**: `src/shared/lib/utils/actionResult.ts`

Replace the current minimal file with the full version containing:
- `AppError` interface (with `message`, `code`, `status`, `fieldErrors`)
- `ActionResult<T, E = AppError>` type
- `success<T>()` and `failure<T>()` helpers
- `wrapAction<T>()` with server-side logging via `createServiceLogger`
- `isActionResult()` type guard
- `getActionErrorMessage()` helper

### Step 3: Add `onRetry` prop to `StatusPage`

**File**: `src/shared/ui/StatusPage.tsx`

```tsx
export interface StatusPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  showBack?: boolean;
  onRetry?: () => void;
}
```

### Step 4: Create `error.tsx` (root error boundary)

**File**: `src/app/error.tsx`

```tsx
'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import StatusPage from '@/shared/ui/StatusPage';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusPage
      title="Something went wrong"
      description="An unexpected error occurred. Please try again."
      color="red"
      icon={<IconAlertTriangle size={32} />}
      showBack
      onRetry={reset}
    />
  );
}
```

**CRITICAL**: The `description` is a **hardcoded generic message**, NOT `error.message`. In production, Next.js digests errors — `error.message` is often empty, generic, or contains internal details (SQL errors, stack traces). Showing it directly is both a UX and security anti-pattern.

The `error` param is accepted but intentionally unused in the UI. The raw error with its digest is available in server logs (Next.js logs it automatically).

### Step 5: Create `global-error.tsx` (MANDATORY)

**File**: `src/app/global-error.tsx`

```tsx
'use client';

import {
  Button,
  Center,
  Container,
  Group,
  MantineProvider,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider defaultColorScheme="dark">
          <Center h="100dvh">
            <Container size="xs">
              <Stack align="center" gap="md">
                <ThemeIcon size={64} radius="xl" variant="light" color="red">
                  <IconAlertTriangle size={32} />
                </ThemeIcon>
                <Title order={1} ta="center" size="h2">
                  Something went wrong
                </Title>
                <Text c="dimmed" ta="center">
                  An unexpected error occurred. Please try again.
                </Text>
                <Group mt="sm">
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconArrowLeft size="1.2rem" />}
                    onClick={() => window.location.reload()}
                  >
                    Reload page
                  </Button>
                  <Button color="red" onClick={reset}>
                    Try again
                  </Button>
                </Group>
              </Stack>
            </Container>
          </Center>
        </MantineProvider>
      </body>
    </html>
  );
}
```

**Why mandatory**: `error.tsx` does NOT catch errors thrown in the root `layout.tsx`. Without `global-error.tsx`, root layout failures produce a completely blank white screen. `global-error.tsx` replaces the entire document (including `<html>` and `<body>`) so it must include its own `MantineProvider` since the root layout's providers are not available.

### Step 6: Configure `QueryClient` global mutation error handler

**File**: `src/app/providers.tsx`

```ts
import { notifications } from '@mantine/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        notifications.show({
          title: 'Error',
          message: error.message || 'An unexpected error occurred',
          color: 'red',
        });
      },
    },
  },
});
```

This provides a safety net for any mutation that throws without its own `onError` handler. Components like `Form` and `DeleteButton` that handle errors explicitly will override this default. This eliminates silent mutation failures across the app.

### Step 7: Update `ListLayout` to handle errors

**File**: `src/shared/ui/adease/ListLayout.tsx`

Two changes:

**a) ActionResult unwrapping in `queryFn`** (backward compatible):
```ts
import {
  isActionResult,
  getActionErrorMessage,
} from '@/shared/lib/utils/actionResult';

queryFn: async () => {
  const result = await getData(page, search);
  if (isActionResult(result)) {
    if (!result.success) throw new Error(getActionErrorMessage(result.error));
    return result.data;
  }
  return result;
}
```

**b) Error state rendering**:
```tsx
const { isLoading, isError, refetch, data = ... } = useQuery({ ... });

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

The error state replaces only the list panel content — not the entire layout — so the user retains navigation context.

### Step 8: Update `DeleteButton` to handle `ActionResult`

**File**: `src/shared/ui/adease/DeleteButton.tsx`

Update `handleDelete` prop type:
```ts
handleDelete: () => Promise<void | ActionResult<unknown>>;
```

Update mutation `onSuccess`:
```tsx
import {
  isActionResult,
  getActionErrorMessage,
} from '@/shared/lib/utils/actionResult';

const mutation = useMutation({
  mutationFn: handleDelete,
  onSuccess: async (data) => {
    if (isActionResult(data)) {
      if (!data.success) {
        notifications.show({
          title: 'Error',
          message: getActionErrorMessage(data.error),
          color: 'red',
        });
        onError?.(new Error(getActionErrorMessage(data.error)));
        return;
      }
    }
    // existing success logic
  },
});
```

**Also update**: `DetailsViewHeader.tsx` which forwards `handleDelete`.

### Step 9: Update `Form.tsx` to use shared `isActionResult`

**File**: `src/shared/ui/adease/Form.tsx`

Remove the local `isActionResult` function. Import from shared:

```ts
import {
  isActionResult,
  getActionErrorMessage,
} from '@/shared/lib/utils/actionResult';
```

Update the `onSuccess` handler to use `getActionErrorMessage` for the error message display.

### Step 10: Migrate ALL server actions (full sprint)

Migrate every `_server/actions.ts` file across all modules.

**Order** (by module size and criticality):
1. `src/app/academic/` — largest module, most actions
2. `src/app/registry/` — student records
3. `src/app/finance/` — payments, sponsors
4. `src/app/admin/` — user management
5. `src/app/admissions/` — admissions (already partially wrapped)
6. `src/app/lms/` — Moodle integration
7. `src/app/timetable/` — scheduling
8. `src/app/library/` — library management
9. `src/app/student-portal/` — student portal

**Which actions to wrap**:

| Action type | Called from | Wrap with `wrapAction`? |
|---|---|---|
| Mutations (create, update, delete) | Client (Form, DeleteButton) | ✅ Yes |
| Queries for ListLayout (findAll) | Client (useQuery) | ✅ Yes |
| GET for RSC pages (get, getById) | Server Component only | ❌ No — let error.tsx catch |
| GET used by both RSC and client | Both | Split into throwing RSC getter + wrapped client getter |

**Migration template per action file**:

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
  page: number,
  search: string
): Promise<ActionResult<PaginatedResult<Thing>>> {
  return wrapAction(() => thingService.findAll({ page, search }));
}

// RSC-only GET — NO CHANGE:
export async function getThing(id: number) {
  return thingService.get(id);
}
```

### Step 11: RSC pages — No changes needed

RSC pages that call GET actions keep their existing pattern. `error.tsx` is the safety net.

---

## Services & Repositories: No Changes

The `BaseService` and `BaseRepository` layers continue to **throw** errors internally. This is correct — they are internal boundaries. The `actions.ts` layer is the **server-client boundary** where errors are caught, logged, and converted to `ActionResult<T>`.

```
[DB] → Repository (throws) → Service (throws) → Action (catches → logs → ActionResult) → Client (reads result)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                 │
│                                                                 │
│  Form.tsx ──────────► checks isActionResult() → toast on error  │
│  ListLayout.tsx ────► unwraps ActionResult → inline error+retry │
│  DeleteButton.tsx ──► checks isActionResult() in onSuccess      │
│  RSC page.tsx ──────► null check → notFound() (no change)       │
│                                                                 │
│  QueryClient ───────► global mutations.onError → fallback toast │
│  error.tsx ─────────► catches RSC/render errors → generic msg   │
│  global-error.tsx ──► catches root layout errors → full page    │
│  not-found.tsx ─────► renders styled 404 UI (already exists)    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ActionResult<T, AppError>
                             │
┌────────────────────────────┴────────────────────────────────────┐
│             SERVER ACTIONS (mutations + client queries)          │
│                                                                 │
│  wrapAction:                                                    │
│    1. Execute fn()                                              │
│    2. On error: LOG via createServiceLogger (raw error + stack) │
│    3. On error: extractError → sanitize → AppError              │
│    4. Return ActionResult<T>                                    │
│                                                                 │
│  RSC-only GETs:                                                 │
│    return service.get(id);  // throws → error.tsx catches       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                         throws
                             │
┌────────────────────────────┴────────────────────────────────────┐
│               SERVICE (throws on failure)                        │
│               REPOSITORY (throws on failure)                     │
│               DATABASE (PostgreSQL via Drizzle)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary of Files to Create/Modify

| Action | File |
|--------|------|
| **Move + Upgrade** | `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts` (with PG error mapping) |
| **Rewrite** | `src/shared/lib/utils/actionResult.ts` (full `AppError`, `wrapAction` with logging, `isActionResult`, `getActionErrorMessage`) |
| **Modify** | `src/shared/ui/StatusPage.tsx` (add `onRetry` prop) |
| **Create** | `src/app/error.tsx` (generic message, never shows raw `error.message`) |
| **Create** | `src/app/global-error.tsx` (mandatory — catches root layout errors) |
| **Modify** | `src/app/providers.tsx` (add `mutations.onError` to `QueryClient`) |
| **Modify** | `src/shared/ui/adease/ListLayout.tsx` (add error state + ActionResult unwrap) |
| **Modify** | `src/shared/ui/adease/DeleteButton.tsx` (detect ActionResult in onSuccess) |
| **Modify** | `src/shared/ui/adease/DetailsViewHeader.tsx` (update handleDelete type) |
| **Modify** | `src/shared/ui/adease/Form.tsx` (replace local isActionResult with shared import) |
| **Modify** | ALL mutation + findAll `_server/actions.ts` across all modules (wrap with `wrapAction`) |
| **No change** | RSC `page.tsx` files (keep existing null-check + notFound pattern) |
| **No change** | RSC-only GET actions (keep throwing) |
| **No change** | `src/core/platform/BaseService.ts` (internal, keeps throwing) |
| **No change** | `src/core/platform/BaseRepository.ts` (internal, keeps throwing) |
| **No change** | `src/app/not-found.tsx` (already exists and uses StatusPage) |

---

## Rules

1. **Every mutation action** (create, update, delete) MUST return `ActionResult<T>` via `wrapAction`.
2. **Every client-query action** (findAll for ListLayout) MUST return `ActionResult<T>` via `wrapAction`.
3. **RSC-only GET actions** (getEntity for `[id]/page.tsx`) keep throwing — `error.tsx` catches.
4. **GETs used by both RSC and client** MUST be split into two actions, not overloaded into one union-heavy API.
5. **Never throw** from a mutation/client-query action — always use `wrapAction`.
6. **Services and repositories** continue to throw — they are internal.
7. **RSC pages** check for `null` → `notFound()`. **`error.tsx`** catches unexpected crashes.
8. **`extractError()`** is the only shared normalization point — maps PostgreSQL error codes to safe messages.
9. **`wrapAction()`** always logs the raw error server-side before sanitizing for the client.
10. **User-facing messages** are always sanitized. `error.tsx` and `global-error.tsx` show generic messages, never `error.message`.
11. **`ListLayout`** unwraps `ActionResult` and shows inline error + retry on failure.
12. **`DeleteButton`** detects `ActionResult` in mutation `onSuccess` (same pattern as `Form`).
13. **`isActionResult`** is imported from `@/shared/lib/utils/actionResult` — never duplicated locally.
14. **`QueryClient`** has a global `mutations.onError` handler as a fallback safety net.
15. **`global-error.tsx`** is mandatory — it catches root layout errors that `error.tsx` cannot.
