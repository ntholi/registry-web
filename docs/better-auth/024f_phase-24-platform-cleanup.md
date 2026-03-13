# Phase 24f: Core Platform Cleanup & Final Verification

> Estimated Implementation Time: 30–40 minutes

**Prerequisites**: Phases 24d and 24e both `DONE` (no legacy role-array consumers, no `legacyPosition` consumers).

**Goal**: Remove all legacy compatibility scaffolding from the core platform layer (`withPermission.ts`, `BaseService.ts`), migrate the `DetailsViewHeader` UI component from role-based to permission-based props, clean up auth error logging, and run final system-wide verification. After this phase, the Better Auth migration is **complete**.

---

## Table of Contents

1. [24f.1 — Remove Legacy Role-Array Support from `withPermission.ts`](#24f1--remove-legacy-role-array-support-from-withpermissionts)
2. [24f.2 — Remove Legacy Role-Array Support from `BaseService.ts`](#24f2--remove-legacy-role-array-support-from-baseservicets)
3. [24f.3 — Migrate `DetailsViewHeader` Role Props to Permissions](#24f3--migrate-detailsviewheader-role-props-to-permissions)
4. [24f.4 — Clean Up `logAuthError` Verbosity](#24f4--clean-up-logautherror-verbosity)
5. [24f.5 — Final Grep Verification](#24f5--final-grep-verification)
6. [24f.6 — TypeScript & Lint Validation](#24f6--typescript--lint-validation)

---

## 24f.1 — Remove Legacy Role-Array Support from `withPermission.ts`

**File**: `src/core/platform/withPermission.ts`

### Remove These Types
```ts
// DELETE these lines:
type LegacyAuthRole = 'all' | 'auth' | 'dashboard' | string;
type LegacyAuthConfig = readonly LegacyAuthRole[];
```

### Simplify `AuthConfig` Type
```ts
// BEFORE:
type AuthConfig = AuthRequirement | AccessCheckFunction | LegacyAuthConfig;

// AFTER:
type AuthConfig = AuthRequirement | AccessCheckFunction;
```

### Remove `isLegacyRoleConfig()` Function
```ts
// DELETE this function entirely:
function isLegacyRoleConfig(requirement: AuthConfig): requirement is LegacyAuthConfig {
  return Array.isArray(requirement);
}
```

### Remove `withLegacyRoleConfig()` Function
Delete the entire `withLegacyRoleConfig()` function (~70 lines).

### Remove Legacy Branch in `withPermission()`
In the main `withPermission()` function body, remove:
```ts
if (isLegacyRoleConfig(requirement)) {
  return await withLegacyRoleConfig(fn, requirement, functionName);
}
```

### Final Shape of `withPermission.ts`

The function should only handle:
- `'all'` → allow without session
- `'auth'` → allow if authenticated
- `'dashboard'` → check `DASHBOARD_ROLES`
- `PermissionRequirement` → check grants
- `AccessCheckFunction` → run custom check
- Admin bypass for all permission checks

---

## 24f.2 — Remove Legacy Role-Array Support from `BaseService.ts`

**File**: `src/core/platform/BaseService.ts`

### Remove Legacy Types
```ts
// DELETE:
type LegacyAuthConfig = readonly string[];
type ServiceAuthConfig = AuthConfig | LegacyAuthConfig;
```

### Remove Legacy Config Properties from `BaseServiceConfig`
```ts
// DELETE these 6 properties:
byIdRoles?: ServiceAuthConfig;
findAllRoles?: ServiceAuthConfig;
createRoles?: ServiceAuthConfig;
updateRoles?: ServiceAuthConfig;
deleteRoles?: ServiceAuthConfig;
countRoles?: ServiceAuthConfig;
```

### Remove Legacy Fallbacks in Constructor
```ts
// BEFORE:
this.defaultByIdAuth = config.byIdAuth ?? config.byIdRoles ?? ['dashboard'];

// AFTER:
this.defaultByIdAuth = config.byIdAuth ?? 'dashboard';
```

Apply the same pattern for all 6 properties. Default for `findAll` is `'dashboard'`, for writes it should be whatever the current fallback is minus the `*Roles` fallback.

### Remove Legacy Method Aliases
```ts
// DELETE all 6 of these methods:
protected byIdRoles(): ServiceAuthConfig { return this.byIdAuth(); }
protected findAllRoles(): ServiceAuthConfig { return this.findAllAuth(); }
protected createRoles(): ServiceAuthConfig { return this.createAuth(); }
protected updateRoles(): ServiceAuthConfig { return this.updateAuth(); }
protected deleteRoles(): ServiceAuthConfig { return this.deleteAuth(); }
protected countRoles(): ServiceAuthConfig { return this.countAuth(); }
```

### Update Return Types
All `*Auth()` methods should return `AuthConfig` (which is `AuthRequirement | AccessCheckFunction`), not `ServiceAuthConfig`.

### Update Internal Field Types
```ts
// All private fields become:
private defaultByIdAuth: AuthConfig;
private defaultFindAllAuth: AuthConfig;
// ... etc.
```

---

## 24f.3 — Migrate `DetailsViewHeader` Role Props to Permissions

**File**: `src/shared/ui/adease/DetailsViewHeader.tsx`

### Update Props Type

```ts
// BEFORE:
type Props = {
    deleteRoles?: UserRole[];
    editRoles?: UserRole[];
    // ...
};

// AFTER:
type Props = {
    deletePermission?: PermissionRequirement;
    editPermission?: PermissionRequirement;
    // ...
};
```

### Update Client-Side Check

```ts
const { data: session } = authClient.useSession();
const permissions = session?.permissions ?? [];
const canEdit = session?.user?.role === 'admin' || (editPermission && hasPermission(permissions, editPermission));
const canDelete = session?.user?.role === 'admin' || (deletePermission && hasPermission(permissions, deletePermission));
```

### Export `hasPermission` for Client Use

In `src/core/auth/permissions.ts`, add:
```ts
export function hasPermission(
    permissions: PermissionGrant[],
    requirement: PermissionRequirement
): boolean {
    for (const [resource, actions] of Object.entries(requirement)) {
        for (const action of actions) {
            if (!permissions.some(p => p.resource === resource && p.action === action)) {
                return false;
            }
        }
    }
    return true;
}
```

### Update All Call Sites (7–8 files)

| File | Current | Target |
|------|---------|--------|
| `src/app/admissions/intake-periods/[id]/page.tsx` | `editRoles={['registry', 'marketing']}` | `editPermission={{ 'intake-periods': ['update'] }}` |
| `src/app/admissions/entry-requirements/[id]/page.tsx` | `editRoles={['registry', 'marketing']}` | `editPermission={{ 'entry-requirements': ['update'] }}` |
| `src/app/timetable/venues/[id]/page.tsx` | `editRoles={['academic', 'registry']}` | `editPermission={{ venues: ['update'] }}` |
| `src/app/registry/blocked-students/[id]/page.tsx` | `editRoles={['finance']}` | `editPermission={{ 'blocked-students': ['update'] }}` |
| `src/app/registry/registration/requests/[id]/page.tsx` | `editRoles={['registry']}`, `deleteRoles={['registry']}` | `editPermission={{ registration: ['update'] }}`, `deletePermission={{ registration: ['delete'] }}` |
| `src/app/registry/graduation/requests/[id]/page.tsx` | `editRoles={['registry', 'admin']}` | `editPermission={{ graduation: ['update'] }}` |
| `src/app/registry/clearance/auto-approve/[id]/page.tsx` | `editRoles={['finance', 'library', 'admin']}` | `editPermission={{ 'auto-approvals': ['update'] }}` |

---

## 24f.4 — Clean Up `logAuthError` Verbosity

**File**: `src/core/platform/withPermission.ts`

Auth denials are normal flow (user navigating to unauthorized pages). `forbidden()` and `unauthorized()` already communicate the correct HTTP status.

### Remove `logAuthError`

Remove all `logAuthError` calls and the function itself. Also remove the `functionName` variable in the main function body since it's only used for logging:
```ts
// DELETE:
const functionName = fn.toString();
```

---

## 24f.5 — Final Grep Verification

Run all of these commands. **Every single one** must return **zero results** in `src/`:

```bash
# Legacy auth patterns
rg "LegacyAuthRole|LegacyAuthConfig|isLegacyRoleConfig|withLegacyRoleConfig" src
rg "byIdRoles|findAllRoles|createRoles|updateRoles|deleteRoles|countRoles" src
rg "legacyPosition" src
rg "logAuthError" src
rg "LEGACY_PRESET_MAPPINGS|LEGACY_PRESET_POSITIONS|getLegacyPresetPosition" src --glob "!**/notifications/**"
rg "LegacyPresetPosition|LegacyPresetMapping|PresetPosition" src --glob "!**/notifications/**"

# Old auth patterns (should already be zero from 24a/24b)
rg "next-auth|NextAuth|getServerSession|SessionProvider" src
rg "@auth/drizzle-adapter" src
rg "AUTH_SECRET|AUTH_TRUST_HOST|NEXTAUTH_URL|NEXTAUTH_SECRET" src
rg "session\.user\.position[^s]" src
rg "userPositions|dashboardUsers" src

# Role arrays in service/action files (should be zero after 24d)
rg "\['dashboard'\]|\['academic'\]|\['registry'\]|\['finance'\]|\['human_resource'\]|\['leap'\]" src --glob "**/*.ts"

# Verify deleteRoles/editRoles removed from DetailsViewHeader
rg "deleteRoles|editRoles" src
```

### Acceptable Exceptions

- `LEGACY_PRESET_MAPPINGS` in notifications module only (if 24e used simpler alternative)
- `UserRole` type usage is fine — it's the new canonical type from `permissions.ts`
- `DASHBOARD_ROLES` usage is fine — it's the new canonical constant

---

## 24f.6 — TypeScript & Lint Validation

```bash
pnpm tsc --noEmit
pnpm lint:fix
```

Fix all errors and repeat until clean. This is the **final gate** for the entire Better Auth migration.

---

## Summary

| Area | What Gets Removed | What Replaces It |
|------|-------------------|------------------|
| `withPermission.ts` | `LegacyAuthRole`, `LegacyAuthConfig`, `isLegacyRoleConfig()`, `withLegacyRoleConfig()`, `logAuthError()` | Direct `AuthRequirement` handling only |
| `BaseService.ts` | `*Roles` config props, `*Roles()` methods, `ServiceAuthConfig`, `LegacyAuthConfig` | `AuthConfig` union (`AuthRequirement \| AccessCheckFunction`) |
| `DetailsViewHeader.tsx` | `deleteRoles`, `editRoles` (role-based) | `deletePermission`, `editPermission` (permission-based) |
| `permissions.ts` | — | New `hasPermission()` export for client use |

### Files Modified (Estimated: ~12–15 files)

**Core Platform** (2):
- `src/core/platform/withPermission.ts`
- `src/core/platform/BaseService.ts`

**Shared UI** (1):
- `src/shared/ui/adease/DetailsViewHeader.tsx`

**Permission Utilities** (1):
- `src/core/auth/permissions.ts` (add `hasPermission` export)

**Call Sites** (7–8):
- Various `[id]/page.tsx` files updating `editRoles`/`deleteRoles` → `editPermission`/`deletePermission`
