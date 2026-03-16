# Plan 002: UI Components

> Update all shared UI components to handle both old (raw data) and new (`ActionResult<T>`) response formats. Add error boundaries and global error handling. **Non-breaking** — all existing callers continue to work unchanged.

## Prerequisites

- Plan 001 completed (`extractError.ts`, `actionResult.ts` with `AppError | string` union) — **already implemented**

## Non-Breaking Guarantee

Every change in this plan maintains full backward compatibility:

- `Form.tsx`: Already imports shared `getActionErrorMessage` and handles both `ActionResult<T>` and raw `T` — only remaining change is replacing local `isActionResult` with shared import
- `DeleteButton.tsx`: `handleDelete` type widens from `Promise<void>` to `Promise<void | ActionResult<unknown>>` — existing `() => Promise<void>` callers still match
- `ListLayout.tsx`: **Keeps `getData(page, search)` positional params** — no caller changes needed. Adds ActionResult unwrapping on the **return value** only.
- New files (`error.tsx`, `global-error.tsx`) don't affect existing code
- `useActionMutation` hook is purely additive — no existing code uses it yet

## Scope

| Action | File |
|--------|------|
| **Modify** | `src/shared/ui/StatusPage.tsx` — add `onRetry` prop |
| **Create** | `src/app/error.tsx` — root error boundary |
| **Create** | `src/app/global-error.tsx` — mandatory root layout error boundary |
| **Create** | `src/shared/lib/actions/use-action-mutation.ts` — unwraps `ActionResult` for direct `useMutation` callers |
| **Modify** | `src/shared/ui/adease/Form.tsx` — replace local `isActionResult` with shared import |
| **Modify** | `src/shared/ui/adease/DeleteButton.tsx` — detect `ActionResult` in onSuccess |
| **Modify** | `src/shared/ui/adease/DetailsViewHeader.tsx` — update `handleDelete` type |
| **Modify** | `src/shared/ui/adease/ListLayout.tsx` — ActionResult unwrap on response + error state |

---

## Task 1: Add `onRetry` prop to `StatusPage`

**File**: `src/shared/ui/StatusPage.tsx`

Add optional `onRetry?: () => void` to the props interface. When provided, render a "Try again" button that calls `onRetry`.

---

## Task 2: Create root `error.tsx`

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

**Important**: Description is hardcoded — never show `error.message` (it's empty/unsafe in production).

---

## Task 3: Create `global-error.tsx` (MANDATORY)

**File**: `src/app/global-error.tsx`

Must include its own `<html>`, `<body>`, and `MantineProvider` since root layout providers are unavailable when this catches.

```tsx
'use client';

import '@mantine/core/styles.css';

import {
  Button, Center, Container, Group, MantineProvider,
  Stack, Text, ThemeIcon, Title,
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
                    variant="light" color="red"
                    leftSection={<IconArrowLeft size="1.2rem" />}
                    onClick={() => window.location.reload()}
                  >
                    Reload page
                  </Button>
                  <Button color="red" onClick={reset}>Try again</Button>
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

---

## Task 4: Create `useActionMutation` hook

**File**: `src/shared/lib/actions/use-action-mutation.ts`

This hook unwraps `ActionResult<T>` so that ~150+ client components using `useMutation` directly continue to work after actions are wrapped with `createAction`. It converts `ActionResult` failures into thrown errors, preserving TanStack Query's native `onError` / `onSuccess` contract.

```ts
'use client';

import {
  isActionResult,
  getActionErrorMessage,
  type ActionResult,
} from '@/shared/lib/actions/actionResult';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export function useActionMutation<TData, TVariables = void>(
  action: (variables: TVariables) => Promise<ActionResult<TData>>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const result = await action(variables);
      if (!result.success) {
        throw new Error(getActionErrorMessage(result.error));
      }
      return result.data;
    },
    ...options,
  });
}
```

**How it works**:
- Wraps the action call and inspects the `ActionResult`
- On success: returns `result.data` as `T` — `onSuccess(data)` receives unwrapped `T`
- On failure: throws `Error` with the extracted message — `onError(error)` fires naturally
- Existing component patterns (`onSuccess`, `onError`, notifications) continue working unchanged

**Migration pattern for client components** (applied in Plans 003–008):
```ts
// BEFORE
const mutation = useMutation({
  mutationFn: updateThing,
  onSuccess: (data) => { /* data was T, now broken — it's ActionResult<T> */ },
  onError: (error) => { /* never fires after createAction wrapping */ },
});

// AFTER
const mutation = useActionMutation(updateThing, {
  onSuccess: (data) => { /* data is T (unwrapped) ✓ */ },
  onError: (error) => { /* fires on ActionResult failure ✓ */ },
});
```

**Backward compat during migration**: `useActionMutation` is only used when the corresponding action has been wrapped with `createAction`. TypeScript enforces this — passing a non-wrapped action (returning `T` instead of `ActionResult<T>`) produces a type error.

---

## Task 5: Update `Form.tsx`

**File**: `src/shared/ui/adease/Form.tsx`

**Current state**: `Form.tsx` already imports `getActionErrorMessage` and `ActionResult` from `@/shared/lib/actions/actionResult`, and already uses `getActionErrorMessage(data.error)` correctly in the `onSuccess` handler. However, it still has a **local duplicate** `isActionResult` function.

1. **Remove** the local `isActionResult` function (lines 41–47)
2. **Add** `isActionResult` to the existing shared import:
```ts
import {
  isActionResult,
  getActionErrorMessage,
  type ActionResult,
} from '@/shared/lib/actions/actionResult';
```

No other changes needed — error handling already uses `getActionErrorMessage` correctly.

**Backward compat**: The `action` prop type already accepts both `Promise<R | ActionResult<R>>` — no change needed there.

---

## Task 6: Update `DeleteButton.tsx`

**File**: `src/shared/ui/adease/DeleteButton.tsx`

1. **Widen** `handleDelete` prop type to accept both old and new patterns:
```ts
handleDelete: () => Promise<void | ActionResult<unknown>>;
```

2. **Import** shared utilities:
```ts
import { isActionResult, getActionErrorMessage, type ActionResult } from '@/shared/lib/actions/actionResult';
```

3. **Update** `mutationFn` and `onSuccess` to detect ActionResult:
```ts
mutationFn: handleDelete,
onSuccess: async (data) => {
  if (isActionResult(data)) {
    if (!data.success) {
      notifications.show({
        title: 'Error',
        message: getActionErrorMessage(data.error),
        color: 'red',
      });
      return;
    }
  }
  // existing success logic (navigate, invalidate, etc.)
},
```

**Backward compat**: Old callers pass `() => Promise<void>` — `void` is not an ActionResult, so the `isActionResult` check skips, and existing success logic runs as before.

---

## Task 7: Update `DetailsViewHeader.tsx`

**File**: `src/shared/ui/adease/DetailsViewHeader.tsx`

Update the `handleDelete` type to match `DeleteButton`'s new type:
```ts
handleDelete?: () => Promise<void | ActionResult<unknown>>;
```

This is a passthrough — `DetailsViewHeader` forwards `handleDelete` to `DeleteButton`.

**Backward compat**: `() => Promise<void>` is assignable to `() => Promise<void | ActionResult<unknown>>`.

---

## Task 8: Update `ListLayout.tsx`

**File**: `src/shared/ui/adease/ListLayout.tsx`

### 8a: Keep `getData` signature — add ActionResult unwrap on response ONLY

```ts
import {
  isActionResult,
  getActionErrorMessage,
  type ActionResult,
} from '@/shared/lib/actions/actionResult';

type GetDataResult<T> = { items: T[]; totalPages: number; totalItems?: number };

export type ListLayoutProps<T> = {
  getData: (
    page: number,
    search: string
  ) => Promise<ActionResult<GetDataResult<T>> | GetDataResult<T>>;
  // ... rest of props unchanged
};
```

**Key**: `getData` still takes `(page: number, search: string)` positional params. The ONLY change is the return type widens to accept both `ActionResult<GetDataResult<T>>` and `GetDataResult<T>`.

**Backward compat**: Old `getData` functions that return `GetDataResult<T>` directly still match the wider union type.

### 8b: Update `queryFn` to unwrap `ActionResult`

```ts
const {
  isLoading,
  isError,
  refetch,
  data: { items, totalPages, totalItems } = {
    items: [],
    totalPages: 0,
    totalItems: 0,
  },
} = useQuery({
  queryKey: [...queryKey, page, search],
  queryFn: async () => {
    const result = await getData(page, search);
    if (isActionResult(result)) {
      if (!result.success) throw new Error(getActionErrorMessage(result.error));
      return result.data;
    }
    return result;
  },
  staleTime: 0,
});
```

Add `isError` and `refetch` from the `useQuery` destructure.

### 8c: Add error state rendering

When `useQuery` returns `isError`, show inline error + retry instead of the list:

```tsx
import { Button, Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

// Inside the list panel, replace loading skeleton section with:
{isError ? (
  <Center py="xl">
    <Stack align="center" gap="sm">
      <ThemeIcon size={48} radius="xl" variant="light" color="red">
        <IconAlertTriangle size={24} />
      </ThemeIcon>
      <Text c="dimmed" size="sm">Failed to load data</Text>
      <Button size="xs" variant="light" onClick={() => refetch()}>Retry</Button>
    </Stack>
  </Center>
) : isLoading ? (
  // existing skeleton loading
) : (
  // existing items list
)}
```

---

## Verification

```bash
pnpm tsc --noEmit
```

**Expected**: Zero type errors. All existing callers still pass correct types because:
- `getData(page, search)` signature unchanged
- `handleDelete: () => Promise<void>` is assignable to `() => Promise<void | ActionResult<unknown>>`
- `Form.action` already accepts `Promise<R | ActionResult<R>>`
- `getActionErrorMessage` handles both `string` and `AppError`

## Done When

- [ ] `StatusPage` has `onRetry` prop
- [ ] `src/app/error.tsx` exists with generic message + retry
- [ ] `src/app/global-error.tsx` exists with standalone Mantine provider
- [ ] `src/shared/lib/actions/use-action-mutation.ts` exports `useActionMutation` hook
- [ ] `Form.tsx` uses shared `isActionResult` + `getActionErrorMessage`
- [ ] `DeleteButton.tsx` detects `ActionResult` in `onSuccess`
- [ ] `DetailsViewHeader.tsx` has updated `handleDelete` type
- [ ] `ListLayout.tsx` accepts both `ActionResult` and raw return values, keeps `(page, search)` positional params, shows error state + retry
- [ ] `pnpm tsc --noEmit` passes — zero errors
- [ ] **All existing callers work unchanged** (no layout/page/form modifications needed)
