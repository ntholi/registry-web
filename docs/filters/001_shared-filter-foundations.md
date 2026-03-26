# Part 1: Shared Filter Foundations

## Goal

Build the reusable filter primitives once in shared UI so every feature can consume the same interaction, state, and visual treatment without duplicating modal or menu logic.

## Deliverables

### Step 1.1: Create `FilterButton`

**File**: `src/shared/ui/adease/FilterButton.tsx`

Shared trigger button for all filter types.

- Props: `{ opened?: boolean, activeCount?: number, label: string, onClick: () => void }`
- Use `ActionIcon` with `IconFilter`
- Keep `size='input-sm'`
- When `activeCount > 0`, switch to a filled treatment and show the count in an `Indicator`
- When `activeCount === 0`, keep the default treatment
- Use `Popover` for the label hint

### Step 1.2: Create `FilterModal`

**File**: `src/shared/ui/adease/FilterModal.tsx`

Reusable shell for multi-field filters.

- Props: `{ opened: boolean, onClose: () => void, title: string, onApply: () => void, onClear: () => void, children: ReactNode }`
- Render a consistent modal layout with a stacked content area and footer actions
- Footer actions: `Clear All` and `Apply Filters`
- Leave field rendering to children

### Step 1.3: Create `FilterMenu`

**File**: `src/shared/ui/adease/FilterMenu.tsx`

Reusable single-field filter dropdown for status-style filters.

- Props: `{ label: string, value: string, options: { value: string, label: string, color?: string }[], queryParam: string, defaultValue?: string }`
- Manage URL state internally with `useQueryState(queryParam)`
- Render a `Menu` driven by `FilterButton`
- Highlight the current option
- Compute `activeCount` based on deviation from `defaultValue`

### Step 1.4: Create `useFilterState`

**File**: `src/shared/lib/hooks/use-filter-state.ts`

Shared helper for modal filter state.

- Wrap multiple `useQueryState` calls from `nuqs`
- Return `{ filters, setFilter, applyFilters, clearFilters, hasActiveFilters, activeCount }`
- Accept a config list like `{ key: string, defaultValue?: string }[]`
- Keep pending modal state local until `applyFilters()` runs
- Reset to defaults on `clearFilters()`

### Step 1.5: Update shared exports

**File**: `src/shared/ui/adease/index.ts`

Export `FilterButton`, `FilterModal`, and `FilterMenu` from the shared UI barrel.

---

## Reference Inputs

- `src/shared/lib/utils/colors.ts` for active-state color decisions
- `nuqs` for URL state management primitives
- Existing filter components that already solve feature-specific field logic and can be simplified onto the shared shell

---

## Acceptance Criteria

- Shared components are generic enough to cover all current filter variants in the repo.
- No feature-specific filtering logic is duplicated inside shared UI.
- Shared components expose only the minimum props needed for reuse.
- Visual treatment is consistent across modal and menu filters.

## Verification

1. `pnpm tsc --noEmit`
2. `pnpm lint:fix`
3. Render each shared component in an existing consumer and verify interaction parity.
