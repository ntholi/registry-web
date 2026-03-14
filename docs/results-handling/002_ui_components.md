# Plan 002: UI Components

> Update all shared UI components to handle both old (raw data) and new (`ActionResult<T>`) response formats. Add error boundaries and global error handling. **Non-breaking** — all existing callers continue to work unchanged.

## Prerequisites

- Plan 001 completed (`extractError.ts`, `actionResult.ts` with `AppError | string` union)

## Non-Breaking Guarantee

Every change in this plan maintains full backward compatibility:

- `Form.tsx`: Already handles both `ActionResult<T>` and raw `T` — update to use shared `isActionResult` + `getActionErrorMessage` (handles both `string` and `AppError`)
- `DeleteButton.tsx`: `handleDelete` type widens from `Promise<void>` to `Promise<void | ActionResult<unknown>>` — existing `() => Promise<void>` callers still match
- `ListLayout.tsx`: **Keeps `getData(page, search)` positional params** — no caller changes needed. Adds ActionResult unwrapping on the **return value** only.
- New files (`error.tsx`, `global-error.tsx`) don't affect existing code
- QueryClient `mutations.onError` is purely additive

## Scope

| Action | File |
|--------|------|
| **Modify** | `src/shared/ui/StatusPage.tsx` — add `onRetry` prop |
| **Create** | `src/app/error.tsx` — root error boundary |
| **Create** | `src/app/global-error.tsx` — mandatory root layout error boundary |
| **Modify** | `src/app/providers.tsx` — global `mutations.onError` |
| **Modify** | `src/shared/ui/adease/Form.tsx` — use shared `isActionResult` + `getActionErrorMessage` |
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

## Task 4: Configure `QueryClient` global mutation error handler

**File**: `src/app/providers.tsx`

Add `defaultOptions.mutations.onError` to the `QueryClient`:

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

---

## Task 5: Update `Form.tsx`

**File**: `src/shared/ui/adease/Form.tsx`

1. **Remove** local `isActionResult` function
2. **Import** from shared:
```ts
import {
  isActionResult,
  getActionErrorMessage,
  type ActionResult,
} from '@/shared/lib/utils/actionResult';
```
3. **Update** error handling to use `getActionErrorMessage(result.error)` instead of accessing `.error` directly:

```ts
// BEFORE (current)
message: data.error,

// AFTER
message: getActionErrorMessage(data.error),
```

This handles both `string` (old actions) and `AppError` (new `createAction`-wrapped actions).

The `onError` callback also needs updating:
```ts
// BEFORE
onError?.({ message: data.error } as Error);

// AFTER
onError?.({ message: getActionErrorMessage(data.error) } as Error);
```

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
import { isActionResult, getActionErrorMessage, type ActionResult } from '@/shared/lib/utils/actionResult';
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
} from '@/shared/lib/utils/actionResult';

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
- [ ] `QueryClient` has global `mutations.onError` handler
- [ ] `Form.tsx` uses shared `isActionResult` + `getActionErrorMessage`
- [ ] `DeleteButton.tsx` detects `ActionResult` in `onSuccess`
- [ ] `DetailsViewHeader.tsx` has updated `handleDelete` type
- [ ] `ListLayout.tsx` accepts both `ActionResult` and raw return values, keeps `(page, search)` positional params, shows error state + retry
- [ ] `pnpm tsc --noEmit` passes — zero errors
- [ ] **All existing callers work unchanged** (no layout/page/form modifications needed)
