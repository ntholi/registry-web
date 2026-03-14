# Production Error & Result Handling

> **Estimated effort (~10 sessions):** 1 shared infra, 1 UI components, 3-4 for 105 action files, 2-3 for ~110 RSC pages, 1-2 for ~50 ListLayout callers, 1 for verification.

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
| **ALL server actions** | Return `ActionResult<T>` via `createAction` wrapper — mutations, queries, RSC GETs, everything |
| Action wrapper pattern | Simple `createAction(fn)` variadic wrapper — catches, logs, returns `ActionResult` |
| Input validation | Stays in Form/service layer (no Zod at action boundary) |
| Shared result contract | Structured `AppError` type (`message`, `code`, `fieldErrors`) |
| Error boundaries | Root-level `error.tsx` + **mandatory `global-error.tsx`** (safety net only) |
| ListLayout errors | Inline error state with retry button + `ActionResult` unwrapping |
| DeleteButton/DetailsViewHeader | Detect `ActionResult` like Form does |
| `isActionResult` | Exported from `actionResult.ts` (shared utility) |
| StatusPage | Add `onRetry` prop for error boundaries |
| QueryClient | Add `defaultOptions.mutations.onError` for global mutation error toasts |
| Error logging | `createAction` logs errors server-side via `createServiceLogger` before sanitizing |
| Message sanitization | Never show raw thrown messages; `extractError` maps known DB/integration codes to safe messages. Unknown errors default to generic message. Services use `UserFacingError` for intentional user messages |
| Error coverage | PostgreSQL, Moodle, file upload, rate limiting, network, UserFacingError — all mapped |
| Migration strategy | Full sprint: shared infrastructure first, then all ~104 action files simultaneously |
| RSC page pattern | `const entity = unwrap(await getEntity(id)); if (!entity) notFound();` |
| `not-found.tsx` | Already exists ✅ — uses `StatusPage` |
| User-facing messages | Always sanitized. Technical details logged server-side only |

---

## Architecture

### 1. The `ActionResult<T>` Type

**File**: `src/shared/lib/utils/actionResult.ts`

```ts
export interface AppError {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function failure<T>(error: AppError | string): ActionResult<T> {
  const normalized = typeof error === 'string' ? { message: error } : error;
  return { success: false, error: normalized };
}
```

The `AppError` shape supports:
- `message` — user-safe text shown in toasts/UI
- `code` — programmatic error code (e.g. `'UNIQUE_VIOLATION'`, `'NOT_FOUND'`, `'UNAUTHORIZED'`) for conditional client logic
- `fieldErrors` — per-field validation errors (complements Zod for server-side validation scenarios like unique constraint violations on specific fields)

### 2. Shared `extractError` Utility (move from apply to shared)

**Move**: `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts`

This is the **single normalization point** for all error types in the system. It maps known error patterns to safe, user-friendly `AppError` objects while preserving programmatic `code` fields for conditional UI logic.

```ts
import type { AppError } from './actionResult';

export class UserFacingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

const PG_ERROR_MAP: Record<string, (detail?: string) => AppError> = {
  '23505': (detail) => ({
    message: detail?.includes('Key')
      ? 'A record with this value already exists'
      : 'A duplicate record was detected',
    code: 'UNIQUE_VIOLATION',
  }),
  '23503': () => ({
    message: 'This record is referenced by other data and cannot be modified',
    code: 'FK_VIOLATION',
  }),
  '23502': () => ({
    message: 'A required field is missing',
    code: 'NOT_NULL_VIOLATION',
  }),
  '23514': () => ({
    message: 'The value provided is out of the allowed range',
    code: 'CHECK_VIOLATION',
  }),
  '42P01': () => ({
    message: 'A system configuration error occurred. Please contact support.',
    code: 'UNDEFINED_TABLE',
  }),
  '57014': () => ({
    message: 'The operation took too long. Please try again.',
    code: 'QUERY_CANCELED',
  }),
};

function isPostgresError(
  error: unknown
): error is Error & { code: string; severity: string; detail?: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    'severity' in error
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
  // UserFacingError — explicitly safe messages from services
  if (error instanceof UserFacingError) {
    return { message: error.message, code: error.code };
  }

  // PostgreSQL errors
  if (isPostgresError(error) && PG_ERROR_MAP[error.code]) {
    return PG_ERROR_MAP[error.code](error.detail);
  }

  // Moodle API errors
  if (isMoodleError(error)) {
    return {
      message: 'An error occurred communicating with the LMS. Please try again.',
      code: 'MOODLE_ERROR',
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
      };
    }
  }

  // Default: generic message. Raw error details are logged server-side by createAction.
  // Services that need user-facing messages should throw UserFacingError.
  return { message: 'An unexpected error occurred' };
}
```

**`UserFacingError`** is a lightweight Error subclass for services that need to surface specific messages to users. Services throw `new UserFacingError('Student not found')` instead of `new Error('Student not found')`. This is the **only** way a custom message reaches the UI — all other unknown errors map to `'An unexpected error occurred'`.

This prevents leaking internal details (SQL errors, stack traces, runtime bugs like `"Cannot read properties of undefined"`) to the UI while still allowing services to communicate meaningful messages.

Coverage:
- **UserFacingError**: Explicit user-safe messages from services (the ONLY way custom messages reach the UI)
- **PostgreSQL**: 23505 (unique), 23503 (FK), 23502 (not-null), 23514 (check), 42P01 (undefined table), 57014 (query canceled/timeout). Discriminated by `severity` field.
- **Moodle**: `MoodleError` instances from `src/core/integrations/moodle.ts`
- **Network**: ECONNREFUSED, ENOTFOUND, ETIMEDOUT, socket hang up, generic connect/timeout
- **Rate limiting**: 429, "rate limit", "too many requests"
- **File uploads**: size limits, unsupported types
- **R2/S3 storage**: NoSuchKey, AccessDenied, NoSuchBucket
- **Unknown errors**: Default to `'An unexpected error occurred'` (raw message logged server-side only)

### 3. The `createAction` Wrapper

**File**: `src/shared/lib/utils/actionResult.ts` (add to existing file)

A simple variadic function wrapper that standardizes the action pipeline. It wraps any async function — regardless of arity — with try/catch, logging, and `ActionResult` return.

```ts
import { createServiceLogger } from '@/core/platform/logger';
import { extractError } from './extractError';

const actionLogger = createServiceLogger('ServerAction');

export function createAction<TArgs extends unknown[], TOutput>(
  fn: (...args: TArgs) => Promise<TOutput>
): (...args: TArgs) => Promise<ActionResult<TOutput>> {
  return async (...args) => {
    try {
      return success(await fn(...args));
    } catch (error) {
      actionLogger.error('Action failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return failure<TOutput>(extractError(error));
    }
  };
}
```

**Why a simple wrapper instead of a builder?**

1. **Type inference**: Infers all argument types and output type directly from the function — no manual generic annotations needed.
2. **Any arity**: Works with 0, 1, 2, or N arguments. No special handling for void inputs.
3. **Minimal ceremony**: `createAction(fn)` — one call, no chaining.
4. **Preserves signatures**: The wrapped function has the exact same signature as the original, just with `ActionResult<T>` wrapping the return type.

> **Coding standard note**: Wrapped actions use `export const` since `createAction` returns a function value. This is the **only** exception to the "use `function` for top-level exports" rule — it applies exclusively to server action files using `createAction`.

**Usage — simple action (no input)**:
```ts
export const getAllSchools = createAction(
  async () => service.findAll({ filter: eq(schools.isActive, true) }).then(r => r.items)
);
```

**Usage — action with input**:
```ts
export const createStudent = createAction(
  async (data: StudentInsert) => studentsService.create(data)
);
```

**Usage — action with multiple params (use an object)**:
```ts
type FindAllInput = { page: number; search: string };

export const findAllStudents = createAction(
  async ({ page, search }: FindAllInput) => studentsService.findAll({ page, search })
);
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

export const createStudent = createAction(
  async (data: StudentInsert) => studentsService.create(data)
);

export const updateSponsor = createAction(
  async ({ id, data }: { id: number; data: Partial<SponsorInsert> }) => sponsorsService.update(id, data)
);

export const deleteSponsor = createAction(
  async (id: number) => sponsorsService.delete(id)
);
```

### Pattern 2: Server Actions (Queries for ListLayout)

`ListLayout` calls `getData({ page, search })` with an object param. These use `createAction`:

```ts
type FindAllInput = { page: number; search: string };

export const findAllStudents = createAction(
  async ({ page, search }: FindAllInput) => studentsService.findAll({ page, search })
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
export const getStudent = createAction(
  async (stdNo: number) => studentsService.get(stdNo)
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
export const getAllSchools = createAction(
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

export const updateModule = createAction(
  async ({ id, module }: UpdateModuleInput) => {
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
export const updateStudent = createAction(
  async ({ stdNo, data }: { stdNo: number; data: Student }) => {
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

### Step 1: Create shared `extractError` and `UserFacingError`

**Move** `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts`

Upgrade to the smart `extractError` with PostgreSQL error code mapping, `UserFacingError` class, and `isPostgresError` with `severity` check (see Section 2 above).

Update all imports in `src/app/apply/` to use `@/shared/lib/utils/extractError`.

**Migration for existing services**: Services that currently `throw new Error('Student not found')` with user-facing messages should be updated to `throw new UserFacingError('Student not found')`. This can be done incrementally — unrecognized errors will show the generic message until migrated.

### Step 2: Upgrade `actionResult.ts`

**File**: `src/shared/lib/utils/actionResult.ts`

Replace the current minimal file with the full version containing:
- `AppError` interface (with `message`, `code`, `fieldErrors`)
- `ActionResult<T>` type
- `success<T>()` and `failure<T>()` helpers
- `createAction(fn)` variadic wrapper with server-side logging via `createServiceLogger`
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

**a) Update `getData` type to accept object params and return `ActionResult`**:
```ts
import {
  isActionResult,
  getActionErrorMessage,
  type ActionResult,
} from '@/shared/lib/utils/actionResult';

type GetDataParams = { page: number; search: string };

export type ListLayoutProps<T> = {
  getData: (
    params: GetDataParams
  ) => Promise<ActionResult<{ items: T[]; totalPages: number; totalItems?: number }>>;
  // ...
};

queryFn: async () => {
  const result = await getData({ page, search });
  if (!result.success) throw new Error(getActionErrorMessage(result.error));
  return result.data;
}
```

This change aligns ListLayout's `getData` signature with `createAction`'s single-object-arg convention. Layouts that pass actions directly (`getData={findAllVenues}`) continue to work without wrappers. Layouts that add extra filters destructure the object:

```tsx
// Before (2-arg):
getData={(page, search) => findAllSubjects(page, search, lqfLevel)}

// After (object):
getData={({ page, search }) => findAllSubjects({ page, search, lqfLevel })}
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

export const createThing = createAction(
  async (data: Input) => thingService.create(data)
);

export const findAllThings = createAction(
  async ({ page, search }: { page: number; search: string }) => thingService.findAll({ page, search })
);

export const getThing = createAction(
  async (id: number) => thingService.get(id)
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

## Services & Repositories: Minimal Change

The `BaseService` and `BaseRepository` layers continue to **throw** errors internally. This is correct — they are internal boundaries. Services that need to surface specific messages to the UI throw `UserFacingError` instead of plain `Error`. The `actions.ts` layer is the **server-client boundary** where errors are caught, logged, and converted to `ActionResult<T>`.

```
[DB] → Repository (throws) → Service (throws / UserFacingError) → Action (catches → logs → ActionResult) → Client (reads result)
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
                    ActionResult<T>
                             │
┌────────────────────────────┴────────────────────────────────────┐
│               SERVER ACTIONS (ALL of them)                       │
│                                                                 │
│  createAction(fn):                                              │
│    1. Execute fn(...args)                                       │
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
│    • UserFacingError: explicit service messages pass through   │
│    • Unknown errors: generic message (raw logged server-side)  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                         throws
                             │
┌────────────────────────────┴────────────────────────────────────┐
│               SERVICE (throws / throws UserFacingError)          │
│               REPOSITORY (throws on failure)                     │
│               DATABASE (PostgreSQL via Drizzle)                  │
│               INTEGRATIONS (Moodle, R2, Pay Lesotho)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary of Files to Create/Modify

| Action | File |
|--------|------|
| **Move + Upgrade** | `src/app/apply/_lib/errors.ts` → `src/shared/lib/utils/extractError.ts` (with `UserFacingError`, PG, Moodle, network, rate limit, file, storage error mapping) |
| **Rewrite** | `src/shared/lib/utils/actionResult.ts` (`AppError`, `createAction` wrapper, `unwrap`, `isActionResult`, `getActionErrorMessage`) |
| **Modify** | `src/shared/ui/StatusPage.tsx` (add `onRetry` prop) |
| **Create** | `src/app/error.tsx` (generic message, never shows raw `error.message`) |
| **Create** | `src/app/global-error.tsx` (mandatory — catches root layout errors) |
| **Modify** | `src/app/providers.tsx` (add `mutations.onError` to `QueryClient`) |
| **Modify** | `src/shared/ui/adease/ListLayout.tsx` (update `getData` to object params + `ActionResult`, add error state + unwrap) |
| **Modify** | `src/shared/ui/adease/DeleteButton.tsx` (detect ActionResult in onSuccess) |
| **Modify** | `src/shared/ui/adease/DetailsViewHeader.tsx` (update handleDelete type) |
| **Modify** | `src/shared/ui/adease/Form.tsx` (replace local isActionResult with shared import) |
| **Modify** | ALL `_server/actions.ts` across all modules (every action uses `createAction`) |
| **Modify** | ALL layout files with `getData` prop (update to object params if using inline wrappers) |
| **Modify** | ALL RSC `page.tsx` files that call server actions (add `unwrap()`) |
| **No change** | `src/core/platform/BaseService.ts` (internal, keeps throwing) |
| **No change** | `src/core/platform/BaseRepository.ts` (internal, keeps throwing) |
| **No change** | `src/app/not-found.tsx` (already exists and uses StatusPage) |

---

## Rules

1. **Every server action** — mutations, queries, GETs, everything — MUST use `createAction(fn)`.
2. **Never throw** from a server action. The `createAction` wrapper catches all errors and returns `ActionResult<T>`.
3. **RSC pages** use `unwrap(await action(input))` to extract data. `null` checks → `notFound()`.
4. **Services and repositories** continue to throw — they are internal boundaries.
5. **`error.tsx`** is a safety net for `unwrap()` failures and programming bugs — NOT the primary error handling strategy.
6. **`extractError()`** is the single normalization point — maps PostgreSQL, Moodle, network, rate limit, file, storage, and `UserFacingError` to safe messages. Unknown errors default to generic message.
7. **`createAction()`** always logs the raw error server-side before sanitizing for the client.
8. **User-facing messages** are always sanitized. `error.tsx` and `global-error.tsx` show generic messages, never `error.message`.
9. **`ListLayout`** unwraps `ActionResult` and shows inline error + retry on failure.
10. **`DeleteButton`** detects `ActionResult` in mutation `onSuccess` (same pattern as `Form`).
11. **`isActionResult`** is imported from `@/shared/lib/utils/actionResult` — never duplicated locally.
12. **`QueryClient`** has a global `mutations.onError` handler as a fallback safety net.
13. **`global-error.tsx`** is mandatory — it catches root layout errors that `error.tsx` cannot.
14. **No split actions**: A single action serves both RSC and client callers. RSC uses `unwrap()`, client uses the `ActionResult` directly.
15. **Multi-param actions** use input objects, not positional arguments: `createAction(async ({ page, search }: Input) => ...)`.
16. **ListLayout `getData`** uses object params: `getData({ page, search })` to align with `createAction`'s single-arg convention.
17. **`export const` exception**: Server action files using `createAction` use `export const` (the only exception to "use `function` for top-level exports").
17. **`UserFacingError`** is the only way custom service messages reach the UI. Services throw `new UserFacingError('message')` for user-safe errors.
18. **Side effects** (revalidatePath, etc.) run inside the handler — failures are caught like any other error.
