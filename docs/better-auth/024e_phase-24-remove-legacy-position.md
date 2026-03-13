# Phase 24e: Remove `legacyPosition` & Legacy Catalog Exports

> Estimated Implementation Time: 30–40 minutes

**Prerequisites**: Phase 24d `DONE` (no more role-array consumers in services).

**Goal**: Remove all `legacyPosition` references from the codebase. Migrate the two remaining consumer systems (approval roles and notification targeting) to permission-based checks, then strip `legacyPosition` from the session and clean up legacy catalog exports.

---

## Table of Contents

1. [24e.1 — Migrate `approvalRoles.ts` to Permission-Based Checks](#24e1--migrate-approvalrolests-to-permission-based-checks)
2. [24e.2 — Migrate Notification Position Targeting to Preset-Based](#24e2--migrate-notification-position-targeting-to-preset-based)
3. [24e.3 — Remove Dashboard `legacyPosition` Display](#24e3--remove-dashboard-legacyposition-display)
4. [24e.4 — Remove `legacyPosition` from Session & Auth](#24e4--remove-legacyposition-from-session--auth)
5. [24e.5 — Remove Legacy Preset Mapping Exports from Catalog](#24e5--remove-legacy-preset-mapping-exports-from-catalog)
6. [24e.6 — Verification](#24e6--verification)

---

## 24e.1 — Migrate `approvalRoles.ts` to Permission-Based Checks

**File**: `src/app/registry/student-statuses/_lib/approvalRoles.ts`

The approval system uses `legacyPosition` to check year_leader, program_leader, etc. Replace with permission checks.

### Add New Permissions to Catalog (if not present)

In `src/core/auth/permissions.ts`, verify `student-statuses` resource and `approve` action exist. They should already be in `RESOURCES` and `ACTIONS`.

### Rewrite `approvalRoles.ts`

Replace `legacyPosition`-based checks with permission checks via the session's `permissions` array:

```ts
import type { Session } from '@/core/auth';
import type { PermissionGrant } from '@/core/auth/permissions';
import type { StudentStatusApprovalRole } from './types';

const APPROVAL_PERMISSION_MAP: Record<StudentStatusApprovalRole, { resource: string; action: string }> = {
    year_leader: { resource: 'student-statuses', action: 'approve' },
    program_leader: { resource: 'student-statuses', action: 'approve' },
    student_services: { resource: 'student-statuses', action: 'approve' },
    finance: { resource: 'student-statuses', action: 'approve' },
};
```

**Decision needed**: The current system differentiates between `year_leader` and `program_leader` approvals. If the permission model needs this granularity, consider:
- Option A: Single `student-statuses:approve` permission — all preset holders can approve any tier. Simpler but loses tier distinction.
- Option B: Add `approve-year-leader`, `approve-program-leader` as actions. More granular.

**Recommendation**: Option A for now (single `approve` action). The preset assignment already controls which users get this permission; the tier distinction can be enforced by checking which approval roles the user is assigned to (via a new `approvalRoles` field on presets or a mapping). Document this as a follow-up if needed.

If Option A is insufficient, keep the `legacyPosition` checks **for now** and mark with a `TODO: Replace with permission-based approval tiers` comment. In that case, skip removing `legacyPosition` from `SessionUser` for these fields only.

### Also Update

- `src/app/registry/terms/settings/_server/termRegistrationsService.ts` — replace `legacyPosition === 'manager'` with a permission check like `session.permissions?.some(p => p.resource === 'terms-settings' && p.action === 'update')`
- `src/app/registry/students/_server/actions.ts` — replace `legacyPosition === 'manager'` with equivalent permission check

---

## 24e.2 — Migrate Notification Position Targeting to Preset-Based

**File**: `src/app/admin/notifications/_server/repository.ts`

The notification system uses `targetPositions` (e.g., `['manager', 'year_leader']`) to filter which users see a notification. This depends on `getLegacyPresetPosition()`.

### Strategy (Simpler Alternative — Recommended)

Keep `targetPositions` as-is and treat it as a "legacy" notification targeting mechanism. Move the legacy position utilities into the notifications module as private utilities rather than exporting from the catalog:

1. Move these from `catalog.ts` to `src/app/admin/notifications/_lib/legacyPositions.ts`:
   - `LEGACY_PRESET_MAPPINGS`
   - `LEGACY_PRESET_POSITIONS`
   - `LegacyPresetPosition` type
   - `getLegacyPresetPosition()`
   - `LegacyPresetMapping` interface

2. Update imports in notification files to use the new local path.

This isolates the legacy concern to the notifications module rather than keeping it as a system-wide export.

### Full Migration Alternative (If Desired)

Replace position-based targeting with **preset-based targeting**:

1. Add a `targetPresetIds` column (text array) to the `notifications` table schema, alongside the existing `targetPositions`.
2. In the notification form, replace the "Position" multi-select with a "Preset" multi-select.
3. In `getActiveNotificationsForUser()`, match on `targetPresetIds.includes(user.presetId)` instead of resolving legacy positions.
4. Keep `targetPositions` column temporarily for backward compatibility.

**Schema change** (requires `pnpm db:generate`):
```ts
targetPresetIds: text().array(),
```

---

## 24e.3 — Remove Dashboard `legacyPosition` Display

**File**: `src/app/dashboard/dashboard.tsx`

### Remove Position Display
```ts
// DELETE this line (around line 315):
{user?.legacyPosition ? ` | ${toTitleCase(user.legacyPosition)}` : ''}
```

### Replace With Preset Name
```ts
{user?.presetName ? ` | ${user.presetName}` : ''}
```

This is already available on the session user since `presetName` is hydrated by `customSession`.

---

## 24e.4 — Remove `legacyPosition` from Session & Auth

> **IMPORTANT**: Execute this step only after 24e.1, 24e.2, and 24e.3 are done (all consumers removed).

**File**: `src/core/auth.ts`

### Remove From Type Definitions
```ts
// In SessionExtras — DELETE:
legacyPosition?: string | null;

// In SessionUser — DELETE:
legacyPosition: string | null;
```

### Remove From `customSession` Plugin
```ts
// In the customSession callback — DELETE:
const legacyPosition = getLegacyPresetPosition(preset?.role, presetName);
// And remove `legacyPosition` from the return object
```

### Remove From `auth()` Function
```ts
// DELETE legacyPosition assembly in the return:
legacyPosition:
    typeof sessionExtras.legacyPosition === 'string'
        ? sessionExtras.legacyPosition
        : null,
```

### Remove Import
```ts
// DELETE:
import { getLegacyPresetPosition } from '@auth/permission-presets/_lib/catalog';
```

---

## 24e.5 — Remove Legacy Preset Mapping Exports from Catalog

**File**: `src/app/auth/permission-presets/_lib/catalog.ts`

### If Using Simpler Alternative (24e.2 moved to notifications)
Verify all consumers have been moved. Then delete from `catalog.ts`:
- `LEGACY_PRESET_MAPPINGS`
- `LEGACY_PRESET_POSITIONS`
- `LegacyPresetPosition` type
- `getLegacyPresetPosition()`
- `LegacyPresetMapping` interface

### If Using Full Preset-Based Migration
Delete entirely from `catalog.ts`:
- All of the above
- `PresetPosition` type (if unused elsewhere)

### Verification
```bash
rg "LEGACY_PRESET|getLegacyPresetPosition|LegacyPresetPosition|LegacyPresetMapping|PresetPosition" src
```
Should return results only in the notifications module (if using simpler alternative) or zero results (if using full migration).

---

## 24e.6 — Verification

### Grep Checks
```bash
# legacyPosition — must be zero everywhere
rg "legacyPosition" src

# Legacy catalog exports — zero outside notifications module
rg "LEGACY_PRESET_MAPPINGS|LEGACY_PRESET_POSITIONS|getLegacyPresetPosition" src --glob "!**/notifications/**"
rg "LegacyPresetPosition|LegacyPresetMapping|PresetPosition" src --glob "!**/notifications/**"
```

### TypeScript & Lint
```bash
pnpm tsc --noEmit
pnpm lint:fix
```
Fix all errors and repeat until clean.

---

## Summary

| Area | What Gets Removed | What Replaces It |
|------|-------------------|------------------|
| `approvalRoles.ts` | `legacyPosition` checks | Permission-based checks via `session.permissions` |
| `notifications/` | `getLegacyPresetPosition` import from catalog | Local legacy position utility (isolated in notifications module) |
| `dashboard.tsx` | `legacyPosition` display | `presetName` display |
| `auth.ts` | `legacyPosition` from types, session enrichment, and return assembly | Removed entirely (`presetName` already available) |
| `catalog.ts` | `LEGACY_PRESET_*`, `getLegacyPresetPosition()`, `LegacyPresetMapping`, `PresetPosition` | Moved to notifications module or deleted |

### Files Modified (Estimated: ~10–12 files)

**Core** (1):
- `src/core/auth.ts`

**Auth Module** (1):
- `src/app/auth/permission-presets/_lib/catalog.ts`

**Registry** (3):
- `src/app/registry/student-statuses/_lib/approvalRoles.ts`
- `src/app/registry/terms/settings/_server/termRegistrationsService.ts`
- `src/app/registry/students/_server/actions.ts`

**Admin** (2–3):
- `src/app/admin/notifications/_server/repository.ts`
- `src/app/admin/notifications/_lib/legacyPositions.ts` (new, if simpler alternative)
- `src/app/admin/notifications/_components/Form.tsx` (import update)

**Dashboard** (1):
- `src/app/dashboard/dashboard.tsx`
