# Part 2: Migrate Existing Filters

## Goal

Refactor the current filter implementations to the new shared pattern while preserving their existing filter fields, defaults, and data-fetching behavior.

## Migration Rules

- Preserve feature behavior and field semantics.
- Remove duplicated modal, hover, and URL-state wiring where the shared components now cover it.
- Move URL ownership into the filter component for menu-style filters.
- Keep layouts responsible for reading `searchParams` and building the filter object passed to data loaders.
- Ensure filtered list queries react to `searchParams.toString()`.

---

## Migrations

### Step 2.1: `StudentsFilter`

**Files**:
- `src/app/registry/students/_components/StudentsFilter.tsx`
- `src/app/registry/students/layout.tsx`

- Replace `HoverCard` + `ActionIcon` with `FilterButton`
- Replace the local modal shell with `FilterModal`
- Replace manual `useState` + `useQueryState` synchronization with `useFilterState`
- Preserve cascading school → program behavior
- Preserve current-student defaults and term/semester controls
- Update the layout query key to include `searchParams.toString()`

### Step 2.2: `ApplicationsFilter`

**Files**:
- `src/app/admissions/applications/_components/ApplicationsFilter.tsx`
- `src/app/admissions/applications/layout.tsx`

- Keep the three fields: status, payment, intake
- Remove effect-based synchronization in favor of `useFilterState`
- Remove the description preview from the modal

### Step 2.3: `EntryRequirementsFilter`

**Files**:
- `src/app/admissions/entry-requirements/_components/EntryRequirementsFilter.tsx`
- `src/app/admissions/entry-requirements/layout.tsx`

- Keep the two fields: school and level
- Migrate the shell and state handling to the shared primitives

### Step 2.4: `SubjectsFilter`

**Files**:
- `src/app/admissions/subjects/_components/SubjectsFilter.tsx`
- `src/app/admissions/subjects/layout.tsx`

- Convert this single-field filter to `FilterMenu`
- Keep `defaultValue='4'`

### Step 2.5: `TaskStatusFilter`

**Files**:
- `src/app/admin/tasks/_components/TaskStatusFilter.tsx`
- `src/app/admin/tasks/layout.tsx`

- Convert from controlled props to self-managed `FilterMenu`
- Remove layout-owned status handlers
- Read `status` from `searchParams` in the layout data flow

### Step 2.6: `DepositStatusFilter`

**Files**:
- `src/app/admissions/payments/_components/DepositStatusFilter.tsx`
- `src/app/admissions/payments/layout.tsx`

- Apply the same migration pattern as task status filters

### Step 2.7: `DocumentReviewFilter`

**Files**:
- `src/app/admissions/documents/_components/DocumentReviewFilter.tsx`
- `src/app/admissions/documents/layout.tsx`

- Keep the two fields: status and type
- Replace prop-driven apply handling with self-managed URL state
- Simplify the layout to read filter values from `searchParams`

### Step 2.8: Assessments `ModuleViewToggle`

**Files**:
- `src/app/academic/assessments/layout.tsx`
- Related toggle component

- Replace React state with URL-based state
- Use `FilterMenu` with `assigned` and `all`

### Step 2.9: Mail inbox `AccountSelector`

**Files**:
- `src/app/mail/inbox/layout.tsx`
- Related account selector component

- Align the selector with `FilterButton` styling
- Reuse the `FilterMenu` pattern while supporting dynamic account options

---

## Acceptance Criteria

- All nine current filter implementations share the same trigger and state model.
- Existing filter defaults still behave the same.
- Layouts become simpler because they no longer own interactive filter state.
- Filter changes trigger list refetches through reactive query keys.

## Verification

1. After each migration, run `pnpm tsc --noEmit`.
2. After each migration batch, run `pnpm lint:fix`.
3. Manually verify apply, clear, reload persistence, and query refetch behavior.
