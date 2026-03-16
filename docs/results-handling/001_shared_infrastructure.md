# Plan 001: Shared Infrastructure

> Create the foundational types and utilities that all subsequent plans depend on. **Non-breaking** — no existing consumers change.

## Prerequisites

- None (this is the first plan)

## Non-Breaking Guarantee

This plan **only creates new files and extends existing types**. No existing consumer code changes. The key compatibility decisions:

- `ActionResult.error` is typed as `AppError | string` (union) — existing `failure('string')` callers still work
- `getActionErrorMessage()` handles both `string` and `AppError` — UI can use it for either
- `apply/_lib/errors.ts` is **NOT** modified in this plan (migrated in Plan 008 with the rest of the apply module)
- Existing `success()` and `failure()` signatures remain compatible

## Scope

| Action | File |
|--------|------|
| **Create** | `src/shared/lib/actions/extractError.ts` |
| **Rewrite** | `src/shared/lib/actions/actionResult.ts` |

## Task 1: Create `extractError.ts`

**File**: `src/shared/lib/actions/extractError.ts`

### Contents

1. **`UserFacingError`** class — the only way custom service messages reach the UI:
```ts
export class UserFacingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}
```

2. **`isNextNavigationError(error: unknown): boolean`** — detects Next.js sentinel errors (`redirect`, `notFound`, `unauthorized`, `forbidden`) so `createAction` can re-throw them:
```ts
export function isNextNavigationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'digest' in error &&
    typeof (error as Error & { digest: string }).digest === 'string' &&
    (error as Error & { digest: string }).digest.startsWith('NEXT_')
  );
}
```

3. **`extractError(error: unknown): AppError`** — single normalization point for all error types:

| Error Source | Detection | Mapped `code` | User Message |
|---|---|---|---|
| `UserFacingError` | `instanceof` | from `.code` | Passthrough `.message` |
| PostgreSQL 23505 | `isPostgresError` + code | `UNIQUE_VIOLATION` | "A record with this value already exists" |
| PostgreSQL 23503 | code | `FK_VIOLATION` | "This record is referenced by other data..." |
| PostgreSQL 23502 | code | `NOT_NULL_VIOLATION` | "A required field is missing" |
| PostgreSQL 23514 | code | `CHECK_VIOLATION` | "The value provided is out of the allowed range" |
| PostgreSQL 42P01 | code | `UNDEFINED_TABLE` | "A system configuration error occurred..." |
| PostgreSQL 57014 | code | `QUERY_CANCELED` | "The operation took too long..." |
| Moodle errors | `isMoodleError` | `MOODLE_ERROR` | "An error occurred communicating with the LMS..." |
| Network errors | message contains connect/ECONNREFUSED/ENOTFOUND/timeout/ETIMEDOUT/socket hang up | `SERVICE_UNAVAILABLE` | "Service temporarily unavailable..." |
| Rate limiting | message contains rate limit/too many requests/429 | `RATE_LIMITED` | "Too many requests..." |
| File too large | message contains file too large/payload too large/LIMIT_FILE_SIZE | `FILE_TOO_LARGE` | "The file is too large..." |
| Invalid file type | message contains unsupported+type/invalid file/LIMIT_UNEXPECTED_FILE | `INVALID_FILE_TYPE` | "This file type is not supported" |
| R2/S3 storage | message contains NoSuchKey/AccessDenied/NoSuchBucket | `STORAGE_ERROR` | "A file storage error occurred..." |
| Unknown | fallthrough | none | "An unexpected error occurred" |

### Type guard helpers (private):

```ts
function isPostgresError(error: unknown): error is Error & { code: string; severity: string; detail?: string }
function isMoodleError(error: unknown): error is Error & { exception: string; errorcode?: string }
```

Full implementation: see [error-handling-plan.md](./error-handling-plan.md) Section 2.

## Task 2: Rewrite `actionResult.ts`

**File**: `src/shared/lib/actions/actionResult.ts`

Current contents are minimal (just `ActionResult<T>`, `success`, `failure` with string error). Replace with expanded version that **maintains backward compatibility**.

### Types

```ts
export interface AppError {
  message: string;
  code?: string;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError | string };

export type ActionData<T> = T extends (...args: infer _TArgs) => infer TResult
  ? Awaited<TResult> extends ActionResult<infer TData>
    ? TData
    : never
  : never;
```

**`error: AppError | string` union** — this is the key compatibility decision. Existing code that produces `failure('string')` still creates valid `ActionResult`. New code using `createAction` produces `AppError` objects. Both are valid. The union is cleaned up in Plan 009.

**`ActionData<T>`** — utility type that extracts the unwrapped data type from an action function. Useful for typing component props that receive action output:
```ts
type Term = ActionData<typeof getActiveTerm>; // extracts the Term type from ActionResult<Term>
```

### Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `success` | `<T>(data: T) => ActionResult<T>` | Wrap successful data (same as current) |
| `failure` | `<T>(error: AppError \| string) => ActionResult<T>` | Wrap error — accepts both string (backward compat) and AppError |
| `createAction` | `<TArgs, TOutput>(fn) => wrapped fn returning ActionResult<TOutput>` | Core action wrapper — catches, logs, returns `ActionResult` |
| `unwrap` | `<T>(result: ActionResult<T>) => T` | Extract data or throw — for RSC pages |
| `isActionResult` | `(value: unknown) => value is ActionResult<unknown>` | Type guard for UI components |
| `getActionErrorMessage` | `(error: AppError \| string) => string` | Extract message string — **handles both formats** |
| `ActionData` | `type ActionData<T>` | Utility type — extracts `TData` from `(...) => Promise<ActionResult<TData>>` |

### `getActionErrorMessage` — backward compat bridge

```ts
export function getActionErrorMessage(error: AppError | string): string {
  return typeof error === 'string' ? error : error.message;
}
```

This is what UI components use to safely read error messages regardless of whether the action was migrated yet.

### `createAction` implementation

```ts
import { createServiceLogger } from '@/core/platform/logger';
import { isNextNavigationError, UserFacingError } from './extractError';
import { extractError } from './extractError';

const actionLogger = createServiceLogger('ServerAction');

export function createAction<TArgs extends unknown[], TOutput>(
  fn: (...args: TArgs) => Promise<TOutput>
): (...args: TArgs) => Promise<ActionResult<TOutput>> {
  return async (...args) => {
    try {
      return success(await fn(...args));
    } catch (error) {
      if (isNextNavigationError(error)) throw error;

      const logMeta = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };

      if (error instanceof UserFacingError) {
        actionLogger.warn('Action rejected', logMeta);
      } else {
        actionLogger.error('Action failed', logMeta);
      }

      return failure<TOutput>(extractError(error));
    }
  };
}
```

**CRITICAL — Next.js sentinel re-throw**: `unauthorized()`, `forbidden()`, `redirect()`, and `notFound()` from `next/navigation` throw special sentinel errors. `createAction` MUST re-throw these so Next.js handles them (401/403 pages, redirects, 404). Without this, `withPermission`'s `unauthorized()` / `forbidden()` calls would be swallowed and turned into generic failures.

**Note**: `createAction` preserves the original function's parameter signature. An action `findAll(page: number, search: string)` wrapped with `createAction` still takes `(page, search)` — only the return type changes from `T` to `ActionResult<T>`.

### `unwrap` implementation

```ts
import { UserFacingError } from './extractError';

export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.success) {
    const msg = getActionErrorMessage(result.error);
    const code = typeof result.error === 'object' ? result.error.code : undefined;
    throw new UserFacingError(msg, code);
  }
  return result.data;
}
```

**Why `UserFacingError`**: When actions call other wrapped actions (40+ cross-action calls in the codebase), the outer `createAction` catches the throw. `extractError` detects `UserFacingError` and preserves the original message and code.

Full implementation: see [error-handling-plan.md](./error-handling-plan.md) Sections 1, 3, 4, 5.

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero new type errors. The `ActionResult.error` union of `AppError | string` means existing consumers that read `.error` as a string get a type warning, but:
- `Form.tsx` already uses a local `isActionResult` and reads `data.error` — still valid with the union since `string` is part of it
- `apply/` module was not changed, its local types are independent
- No other module currently consumes `ActionResult`

If minor type warnings appear in Form.tsx due to the union, they are fixed in Plan 002.

## Done When

- [ ] `src/shared/lib/actions/extractError.ts` exists with `UserFacingError`, `isNextNavigationError`, `extractError`, all error mappings
- [ ] `src/shared/lib/actions/actionResult.ts` has `AppError`, `ActionResult<T>` (with `error: AppError | string`), `createAction` (with sentinel re-throw), `unwrap`, `isActionResult`, `getActionErrorMessage`
- [ ] `createAction` re-throws Next.js sentinels (`redirect`, `notFound`, `unauthorized`, `forbidden`) — verified by checking `isNextNavigationError`
- [ ] `src/app/apply/_lib/errors.ts` is **untouched** (migrated in Plan 008)
- [ ] `pnpm tsc --noEmit` passes (or has only minor warnings fixed in Plan 002)
