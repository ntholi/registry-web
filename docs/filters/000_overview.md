# ListLayout Filtering — Overview

> Scope: Standardize `ListLayout` filtering across Registry Web.
> Date: 2026-03-26

## Summary

Standardize all list filters around one shared pattern built in `src/shared/ui/adease/`, then migrate the current filter implementations and add filters to the layouts that still have none. All filters should manage URL state through `nuqs`, while layouts read `searchParams` to build filter objects and reactive query keys.

## Progress Tracker

| # | Part | Status |
|---|------|--------|
| 1 | [Shared filter foundations](./001_shared-filter-foundations.md) | ⬜ Not started |
| 2 | [Migrate existing filters](./002_migrate-existing-filters.md) | ⬜ Not started |
| 3 | [Add filters to remaining layouts](./003_new-filters-rollout.md) | ⬜ Not started |

---

## Global Decisions

- **UI pattern**: Use a modal for filters with two or more fields. Use a menu-based dropdown for single-field status-style filters.
- **Shared components**: Create `FilterButton`, `FilterModal`, and `FilterMenu` in `src/shared/ui/adease/`.
- **State management**: Filters own URL state through `nuqs`. Layouts only read from `searchParams`.
- **Active indicator**: Show active state with a filled button treatment plus a count badge.
- **Modal content**: Keep filter modals minimal. Do not include description previews.
- **Field composition**: `FilterModal` should render children so feature filters can supply their own fields.
- **Query reactivity**: Filtered layouts should use `['feature', searchParams.toString()]`-style query keys.
- **Trigger sizing**: Keep filter triggers at `size='input-sm'` for alignment with inputs.
- **Hint UI**: Use `Popover` instead of `Tooltip` or `HoverCard`.
- **Scope**: Existing special cases such as the assessments toggle and mail inbox account selector should converge on the same filter pattern.
- **Delivery order**: Implement the work in three parts: shared foundations, migrations, then new rollout.

---

## Parts

### Part 1: [Shared filter foundations](./001_shared-filter-foundations.md)

Create the reusable filter primitives and hook that all feature filters will depend on.

### Part 2: [Migrate existing filters](./002_migrate-existing-filters.md)

Refactor the nine current filter implementations to the shared pattern without changing their feature behavior.

### Part 3: [Add filters to remaining layouts](./003_new-filters-rollout.md)

Add filters to the remaining 17 layouts and extend the corresponding server-side list queries to honor those new parameters.

---

## Final Verification

1. `pnpm tsc --noEmit`
2. `pnpm lint:fix`
3. Manual verification on every affected layout:
   - Filter trigger shows the correct default state.
   - Applying filters updates the URL and refetches the list.
   - Clearing filters resets to defaults.
   - Reloading the page preserves filter state from the URL.
   - Active filter count badges render correctly.
   - Filter triggers share the same size, state treatment, and Popover behavior.
