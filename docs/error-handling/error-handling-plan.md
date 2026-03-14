# Error Handling Architecture

> Standardized error handling patterns for the Registry Web application.
> **Every** server action returns `ActionResult<T>` — no thrown errors leak to the UI, ever.

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
- RSC pages that call throwing server actions produce the **"An error occurred in the Server Components render. The specific message is omitted in production builds..."** error — a generic, unhelpful message that swallows actual context.

---

## Decisions

| Decision | Choice |
|----------|--------|
| **ALL server actions** | Return `ActionResult<T, AppError>` via `createAction` builder — mutations, queries, RSC GETs, everything |
| Action builder pattern | Composable `createAction().handler(fn)` pipeline (inspired by next-safe-action) |
| Input validation | Stays in Form/service layer (no Zod at action boundary) |
| Shared result contract | Full structured `AppError` type (`message`, `code`, `status`, `fieldErrors`) |
| Error boundaries | Root-level `error.tsx` + **mandatory `global-error.tsx`** (safety net only) |
| ListLayout errors | Inline error state with retry button + `ActionResult` unwrapping |
| DeleteButton/DetailsViewHeader | Detect `ActionResult` like Form does |
| `isActionResult` | Exported from `actionResult.ts` (shared utility) |
| StatusPage | Add `onRetry` prop for error boundaries |
| QueryClient | Add `defaultOptions.mutations.onError` for global mutation error toasts |
| Error logging | `createAction` logs errors server-side via `createServiceLogger` before sanitizing |
| Message sanitization | Never show raw thrown messages; `extractError` maps known DB/integration codes to safe messages |
| Error coverage | PostgreSQL, Moodle, file upload, rate limiting, network errors — all mapped |
| Migration strategy | Full sprint: shared infrastructure first, then all ~104 action files simultaneously |
| RSC page pattern | `const { data } = await getEntity(id); if (!data) notFound();` — unwraps ActionResult |
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

This is the **single normalization point** for all error types in the system. It maps known error patterns to safe, user-friendly `AppError` objects while preserving programmatic `code` fields for conditional UI logic.

```ts
import type { AppError } from './actionResult';

const PG_ERROR_MAP: Record<string, (detail?: string) => AppError> = {
  '23505': (detail) => ({
    message: detail?.includes('Key')
      ? 'A record with this value already exists'
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
  '23514': () => ({
    message: 'The value provided is out of the allowed range',
    code: 'CHECK_VIOLATION',
    status: 'validation',
  }),
  '42P01': () => ({
    message: 'A system configuration error occurred. Please contact support.',
    code: 'UNDEFINED_TABLE',
    status: 'error',
  }),
  '57014': () => ({
    message: 'The operation took too long. Please try again.',
    code: 'QUERY_CANCELED',
    status: 'error',
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

function isMoodleError(
  error: unknown
): error is Error & { exception: string; errorcode?: string } {
  return (
    error instanceof Error &&
    'exception' in error &&
    typeof (error as { exception: unknown }).exception === 'string'
  );
}

export function extractError(error: unknown): AppError {
  // PostgreSQL errors
  if (isPostgresError(error) && PG_ERROR_MAP[error.code]) {
    return PG_ERROR_MAP[error.code](error.detail);
  }

  // Moodle API errors
  if (isMoodleError(error)) {
    return {
      message: 'An error occurred communicating with the LMS. Please try again.',
      code: 'MOODLE_ERROR',
      status: 'error',
    };
  }

  if (error instanceof Error) {
    const msg = error.message;

    // Network / connection errors
    if (
      msg.includes('connect') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('timeout') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('socket hang up')
    ) {
      return {
        message: 'Service temporarily unavailable. Please try again.',
        code: 'SERVICE_UNAVAILABLE',
        status: 'error',
      };
    }

    // Rate limiting (from auth or external APIs)
    if (
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('429')
    ) {
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
        status: 'error',
      };
    }

    // File upload errors
    if (
      msg.includes('file too large') ||
      msg.includes('payload too large') ||
      msg.includes('LIMIT_FILE_SIZE')
    ) {
      return {
        message: 'The file is too large. Please upload a smaller file.',
        code: 'FILE_TOO_LARGE',
        status: 'validation',
      };
    }

    if (
      msg.includes('unsupported') && msg.includes('type') ||
      msg.includes('invalid file') ||
      msg.includes('LIMIT_UNEXPECTED_FILE')
    ) {
      return {
        message: 'This file type is not supported.',
        code: 'INVALID_FILE_TYPE',
        status: 'validation',
      };
    }

    // R2/S3 storage errors
    if (
      msg.includes('NoSuchKey') ||
      msg.includes('AccessDenied') ||
      msg.includes('NoSuchBucket')
    ) {
      return {
        message: 'A file storage error occurred. Please try again.',
        code: 'STORAGE_ERROR',
        status: 'error',
      };
    }

    // Return the error message as-is for known business logic errors
    // (e.g., "Sponsor with name X not found", "Module not found")
    return { message: msg || 'An unexpected error occurred' };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: 'An unexpected error occurred' };
}
```

Coverage:
- **PostgreSQL**: 23505 (unique), 23503 (FK), 23502 (not-null), 23514 (check), 42P01 (undefined table), 57014 (query canceled/timeout)
- **Moodle**: `MoodleError` instances from `src/core/integrations/moodle.ts`
- **Network**: ECONNREFUSED, ENOTFOUND, ETIMEDOUT, socket hang up, generic connect/timeout
- **Rate limiting**: 429, "rate limit", "too many requests"
- **File uploads**: size limits, unsupported types
- **R2/S3 storage**: NoSuchKey, AccessDenied, NoSuchBucket
- **Business logic**: Error messages from services pass through as-is (these are already user-facing)

### 3. The `createAction` Builder (new — inspired by next-safe-action)

**File**: `src/shared/lib/utils/actionResult.ts` (add to existing file)

Instead of a bare `wrapAction` function, we use a composable **builder pattern** that standardizes the action pipeline. This is the core of the error handling system.

```ts
import { createServiceLogger } from '@/core/platform/logger';
import { extractError } from './extractError';

const actionLogger = createServiceLogger('ServerAction');

type ActionHandler<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

interface ActionBuilder<TInput> {
  handler<TOutput>(
    fn: ActionHandler<TInput, TOutput>
  ): (...args: TInput extends void ? [] : [TInput]) => Promise<ActionResult<TOutput>>;
}

export function createAction(): ActionBuilder<void>;
export function createAction<TInput>(): ActionBuilder<TInput>;
export function createAction<TInput = void>(): ActionBuilder<TInput> {
  return {
    handler<TOutput>(fn: ActionHandler<TInput, TOutput>) {
      return async (...args: TInput extends void ? [] : [TInput]) => {
        try {
          const input = args[0] as TInput;
          const result = await fn(input);
          return success(result);
        } catch (error) {
          actionLogger.error('Action failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return failure<TOutput>(extractError(error));
        }
      };
    },
  };
}
```

**Why a builder instead of a simple wrapper?**

1. **Type inference**: The builder preserves full input/output types through the pipeline. The returned function signature matches the original action signature — callers don't need to change.
2. **Composability**: Future additions (middleware, rate limiting, audit integration) slot into the builder chain without changing existing action code.
3. **Consistency**: Every action file follows the identical `createAction<Input>().handler(fn)` pattern — easy to lint, audit, and migrate.
4. **No ceremony for void inputs**: `createAction().handler(fn)` works for no-arg actions. No need to pass `undefined`.

**Usage — simple action (no input)**:
```ts
export const getAllSchools = createAction().handler(
  async () => service.findAll({ filter: eq(schools.isActive, true) }).then(r => r.items)
);
```

**Usage — action with input**:
```ts
export const createStudent = createAction<StudentInsert>().handler(
  async (data) => studentsService.create(data)
);
```

**Usage — action with multiple params (use an object)**:
```ts
type FindAllInput = { page: number; search: string };

export const findAllStudents = createAction<FindAllInput>().handler(
  async ({ page, search }) => studentsService.findAll({ page, search })
);
```

**Backward compat**: `wrapAction` is kept as a thin alias for gradual migration:
```ts
export async function wrapAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  return createAction().handler(fn)();
}
```

### 4. RSC Page Unwrap Helper

Since **all** actions now return `ActionResult<T>`, RSC pages need a tiny unwrap utility. This eliminates the "Server Components render" error entirely — errors are **values**, never thrown across the server-client boundary.

**File**: `src/shared/lib/utils/actionResult.ts` (add to existing file)

```ts
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.success) {
    throw new Error(getActionErrorMessage(result.error));
  }
  return result.data;
}
```

**RSC page usage**:
```ts
import { unwrap } from '@/shared/lib/utils/actionResult';

export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const student = unwrap(await getStudent(id));
  if (!student) notFound();
  return <StudentDetails student={student} />;
}
```

**Why this works**: `unwrap` throws inside the RSC render, which `error.tsx` catches. But the key difference from the old pattern is:
- The **action itself never throws** — it returns `ActionResult<T>` which serializes cleanly across server/client boundaries.
- If the action is called from a **client component** (via TanStack Query or Form), the error is a structured `AppError` object — never the opaque "Server Components render" message.
- `error.tsx` is now purely a **safety net** for programming bugs (e.g., calling `unwrap` on a failure result in RSC), not the primary error handling strategy.

### 5. Shared `isActionResult` Type Guard & Helpers

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

**Every** mutation server action uses `createAction`. Never throw from any action.

```ts
'use server';

import { createAction } from '@/shared/lib/utils/actionResult';

export const createStudent = createAction<StudentInsert>().handler(
  async (data) => studentsService.create(data)
);

export const updateSponsor = createAction<{ id: number; data: Partial<SponsorInsert> }>().handler(
  async ({ id, data }) => sponsorsService.update(id, data)
);

export const deleteSponsor = createAction<number>().handler(
  async (id) => sponsorsService.delete(id)
);
```

### Pattern 2: Server Actions (Queries for ListLayout)

`ListLayout` calls a `getData(page, search)` function. These also use `createAction`:

```ts
type FindAllInput = { page: number; search: string };

export const findAllStudents = createAction<FindAllInput>().handler(
  async ({ page, search }) => studentsService.findAll({ page, search })
);
```

`ListLayout` unwraps `ActionResult` internally and shows error states on failure.

### Pattern 3: Server Actions (Queries for RSC Pages) — NOW WRAPPED

All GET actions return `ActionResult<T>`. RSC pages use `unwrap()` to extract the data.

**Before (dangerous — causes "Server Components render" error in production)**:
```ts
export async function getStudent(stdNo: number) {
  return studentsService.get(stdNo); // throws in production → opaque error
}
```

**After (safe — error is a value)**:
```ts
export const getStudent = createAction<number>().handler(
  async (stdNo) => studentsService.get(stdNo)
);
```

**RSC page usage**:
```ts
import { unwrap } from '@/shared/lib/utils/actionResult';

export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const student = unwrap(await getStudent(Number(id)));
  if (!student) notFound();
  return <StudentDetails student={student} />;
}
```

**Why this is better than the old "keep throwing" approach**:
- When called from **client components** (Form, TanStack Query), errors are structured `AppError` objects — never the opaque "Server Components render" message.
- When called from **RSC**, `unwrap()` converts the failure back to a throw, which `error.tsx` catches cleanly.
- **One action, one signature** — no need for "split into throwing RSC getter + wrapped client getter" duplication.
- Server-side logging happens in `createAction` regardless of caller context.

### Pattern 4: Server Actions (No-Input Queries)

For actions that take no arguments:

```ts
export const getAllSchools = createAction().handler(
  async () => {
    const data = await service.findAll({ filter: eq(schools.isActive, true) });
    return data.items;
  }
);
```

### Pattern 5: Multi-Param Actions

When an action needs multiple parameters, use an input object:

```ts
type UpdateModuleInput = {
  id: number;
  module: Module & { prerequisiteCodes?: string[] };
};

export const updateModule = createAction<UpdateModuleInput>().handler(
  async ({ id, module }) => {
    const { prerequisiteCodes, ...moduleData } = module;
    const updated = await semesterModulesService.update(id, moduleData);
    // ... prerequisite logic
    return updated;
  }
);
```

### Pattern 6: Actions with Side Effects (revalidation)

For actions that call `revalidatePath` or other side effects:

```ts
export const updateStudent = createAction<{ stdNo: number; data: Student }>().handler(
  async ({ stdNo, data }) => {
    const result = await service.update(stdNo, {
      ...data,
      name: formatPersonName(data.name) ?? data.name,
    });
    revalidatePath(`/registry/students/${stdNo}`);
    return result;
  }
);
```

Side effects run inside the handler — if they fail, the error is caught and logged like any other failure.

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
- `createAction<TInput>().handler(fn)` builder with server-side logging via `createServiceLogger`
- `wrapAction<T>()` backward-compat alias
- `unwrap<T>()` for RSC pages
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

**a) Update `getData` type to return `ActionResult`**:
```ts
import {
  isActionResult,
  getActionErrorMessage,
  type ActionResult,
} from '@/shared/lib/utils/actionResult';

export type ListLayoutProps<T> = {
  getData: (
    page: number,
    search: string
  ) => Promise<ActionResult<{ items: T[]; totalPages: number; totalItems?: number }>>;
  // ...
};

queryFn: async () => {
  const result = await getData(page, search);
  if (!result.success) throw new Error(getActionErrorMessage(result.error));
  return result.data;
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

Migrate every `_server/actions.ts` file across all modules. **Every single action** — mutations, queries, GETs — uses `createAction`.

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
10. `src/app/apply/` — application wizard (update existing ActionResult usage)

**ALL actions get wrapped** — no exceptions:

| Action type | Called from | Wrapped? |
|---|---|---|
| Mutations (create, update, delete) | Client (Form, DeleteButton) | ✅ Yes |
| Queries for ListLayout (findAll) | Client (useQuery) | ✅ Yes |
| GET for RSC pages (get, getById) | Server Component | ✅ Yes — RSC pages use `unwrap()` |
| Utility queries (getAll, search) | Either | ✅ Yes |

**Migration template per action file**:

```ts
// Before:
'use server';

export async function createThing(data: Input) {
  return thingService.create(data);
}

export async function findAllThings(page: number, search: string) {
  return thingService.findAll({ page, search });
}

export async function getThing(id: number) {
  return thingService.get(id);
}

// After:
'use server';

import { createAction } from '@/shared/lib/utils/actionResult';

export const createThing = createAction<Input>().handler(
  async (data) => thingService.create(data)
);

export const findAllThings = createAction<{ page: number; search: string }>().handler(
  async ({ page, search }) => thingService.findAll({ page, search })
);

export const getThing = createAction<number>().handler(
  async (id) => thingService.get(id)
);
```

**RSC pages update**:
```ts
// Before:
const thing = await getThing(id);
if (!thing) notFound();

// After:
import { unwrap } from '@/shared/lib/utils/actionResult';

const thing = unwrap(await getThing(id));
if (!thing) notFound();
```

### Step 11: Update RSC pages to use `unwrap()`

Every RSC page that calls a server action must use `unwrap()` to extract the data:

```ts
import { unwrap } from '@/shared/lib/utils/actionResult';
import { notFound } from 'next/navigation';

export default async function EntityPage({ params }: Props) {
  const { id } = await params;
  const entity = unwrap(await getEntity(Number(id)));
  if (!entity) notFound();
  return <EntityDetails entity={entity} />;
}
```

`error.tsx` catches any `unwrap()` failures as a safety net — but with all actions wrapped, these should be rare (only programming bugs, not runtime errors).

---

## Services & Repositories: No Changes

The `BaseService` and `BaseRepository` layers continue to **throw** errors internally. This is correct — they are internal boundaries. The `actions.ts` layer is the **server-client boundary** where errors are caught, logged, and converted to `ActionResult<T>`.

```
[DB] → Repository (throws) → Service (throws) → Action (catches → logs → ActionResult) → Client (reads result)
                                                                                           → RSC (unwraps result)
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
│  RSC page.tsx ──────► unwrap(result) → notFound() if null       │
│                                                                 │
│  QueryClient ───────► global mutations.onError → fallback toast │
│  error.tsx ─────────► catches unwrap() failures → generic msg   │
│  global-error.tsx ──► catches root layout errors → full page    │
│  not-found.tsx ─────► renders styled 404 UI (already exists)    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ActionResult<T, AppError>
                             │
┌────────────────────────────┴────────────────────────────────────┐
│               SERVER ACTIONS (ALL of them)                       │
│                                                                 │
│  createAction().handler(fn):                                    │
│    1. Execute fn(input)                                         │
│    2. On success: return { success: true, data }                │
│    3. On error: LOG via createServiceLogger (raw error + stack) │
│    4. On error: extractError → sanitize → AppError              │
│    5. Return { success: false, error: AppError }                │
│                                                                 │
│  extractError coverage:                                         │
│    • PostgreSQL: 23505, 23503, 23502, 23514, 42P01, 57014      │
│    • Moodle: MoodleError instances                              │
│    • Network: ECONNREFUSED, ENOTFOUND, ETIMEDOUT, socket       │
│    • Rate limit: 429, "rate limit", "too many requests"         │
│    • File upload: size limits, unsupported types                │
│    • Storage: R2/S3 NoSuchKey, AccessDenied, NoSuchBucket       │
│    • Business logic: service error messages pass through        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                         throws
                             │
┌────────────────────────────┴────────────────────────────────────┐
│               SERVICE (throws on failure)                        │
│               REPOSITORY (throws on failure)                     │
│               DATABASE (PostgreSQL via Drizzle)                  │
│               INTEGRATIONS (Moodle, R2, Pay Lesotho)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary of Files to Create/Modify

| Action | File |
|--------|------|
| **Move + Upgrade** | `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts` (with PG, Moodle, network, rate limit, file, storage error mapping) |
| **Rewrite** | `src/shared/lib/utils/actionResult.ts` (full `AppError`, `createAction` builder, `wrapAction` compat, `unwrap`, `isActionResult`, `getActionErrorMessage`) |
| **Modify** | `src/shared/ui/StatusPage.tsx` (add `onRetry` prop) |
| **Create** | `src/app/error.tsx` (generic message, never shows raw `error.message`) |
| **Create** | `src/app/global-error.tsx` (mandatory — catches root layout errors) |
| **Modify** | `src/app/providers.tsx` (add `mutations.onError` to `QueryClient`) |
| **Modify** | `src/shared/ui/adease/ListLayout.tsx` (update `getData` type to `ActionResult`, add error state + unwrap) |
| **Modify** | `src/shared/ui/adease/DeleteButton.tsx` (detect ActionResult in onSuccess) |
| **Modify** | `src/shared/ui/adease/DetailsViewHeader.tsx` (update handleDelete type) |
| **Modify** | `src/shared/ui/adease/Form.tsx` (replace local isActionResult with shared import) |
| **Modify** | ALL `_server/actions.ts` across all modules (every action uses `createAction`) |
| **Modify** | ALL RSC `page.tsx` files that call server actions (add `unwrap()`) |
| **No change** | `src/core/platform/BaseService.ts` (internal, keeps throwing) |
| **No change** | `src/core/platform/BaseRepository.ts` (internal, keeps throwing) |
| **No change** | `src/app/not-found.tsx` (already exists and uses StatusPage) |

---

## Rules

1. **Every server action** — mutations, queries, GETs, everything — MUST use `createAction().handler(fn)`.
2. **Never throw** from a server action. The `createAction` builder catches all errors and returns `ActionResult<T>`.
3. **RSC pages** use `unwrap(await action(input))` to extract data. `null` checks → `notFound()`.
4. **Services and repositories** continue to throw — they are internal boundaries.
5. **`error.tsx`** is a safety net for `unwrap()` failures and programming bugs — NOT the primary error handling strategy.
6. **`extractError()`** is the single normalization point — maps PostgreSQL, Moodle, network, rate limit, file, and storage errors to safe messages.
7. **`createAction()`** always logs the raw error server-side before sanitizing for the client.
8. **User-facing messages** are always sanitized. `error.tsx` and `global-error.tsx` show generic messages, never `error.message`.
9. **`ListLayout`** unwraps `ActionResult` and shows inline error + retry on failure.
10. **`DeleteButton`** detects `ActionResult` in mutation `onSuccess` (same pattern as `Form`).
11. **`isActionResult`** is imported from `@/shared/lib/utils/actionResult` — never duplicated locally.
12. **`QueryClient`** has a global `mutations.onError` handler as a fallback safety net.
13. **`global-error.tsx`** is mandatory — it catches root layout errors that `error.tsx` cannot.
14. **No split actions**: A single action serves both RSC and client callers. RSC uses `unwrap()`, client uses the `ActionResult` directly.
15. **Multi-param actions** use input objects, not positional arguments: `createAction<{ page: number; search: string }>()`.
16. **Side effects** (revalidatePath, etc.) run inside the handler — failures are caught like any other error.
