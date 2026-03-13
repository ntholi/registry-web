# Phase 24d: Migrate Legacy Services to Permission-Based Auth

> Estimated Implementation Time: 25–35 minutes

**Prerequisites**: Phases 24a, 24b, 24c all `DONE`.

**Goal**: Migrate all remaining services that still use legacy role-array configs (`['dashboard']`, `['academic', 'leap']`, etc.) to the new `AuthRequirement` union type. After this phase, no service or action file will contain role arrays as auth configs.

---

## Table of Contents

1. [24d.1 — Migrate 7 Legacy Services](#24d1--migrate-7-legacy-services)
2. [24d.2 — Verify 7 Mixed Services](#24d2--verify-7-mixed-services)
3. [24d.3 — Verification](#24d3--verification)

---

## 24d.1 — Migrate 7 Legacy Services

These services still use legacy role-array configs (`['dashboard']`, `['academic', 'leap']`, etc.). Migrate each to `AuthRequirement` (the new `byIdAuth`/`findAllAuth`/etc. properties or direct `withPermission` calls with permission objects).

### 1. `src/app/registry/terms/_server/service.ts`

**Current**: `findAllRoles: ['dashboard']`
**Target**: `findAllAuth: 'dashboard'` (string literal, not array)

If it also has implicit create/update roles, convert those to proper permission config:
```ts
findAllAuth: 'dashboard',
createAuth: { 'terms-settings': ['create'] },
updateAuth: { 'terms-settings': ['update'] },
```

### 2. `src/app/registry/graduation/dates/_server/service.ts`

**Current**: `findAllRoles: ['dashboard']`
**Target**:
```ts
findAllAuth: 'dashboard',
createAuth: { graduation: ['create'] },
updateAuth: { graduation: ['update'] },
deleteAuth: { graduation: ['delete'] },
```

### 3. `src/app/registry/student-notes/_server/service.ts`

**Current**: `byIdRoles: ['dashboard'], findAllRoles: ['dashboard'], createRoles: ['dashboard'], updateRoles: ['dashboard'], deleteRoles: ['dashboard']`
**Target**:
```ts
byIdAuth: 'dashboard',
findAllAuth: 'dashboard',
createAuth: { 'student-notes': ['create'] },
updateAuth: { 'student-notes': ['update'] },
deleteAuth: { 'student-notes': ['delete'] },
```

### 4. `src/app/academic/schools/_server/service.ts`

**Current**: Custom `withPermission(..., ['dashboard'])` calls
**Target**: Replace every `['dashboard']` with `'dashboard'` as const. Any write operations should use the appropriate permission object:
```ts
withPermission(fn, 'dashboard')          // reads
withPermission(fn, { schools: ['update'] })  // writes — add 'schools' to RESOURCES if needed
```
> If `schools` is not in `RESOURCES`, keep `'dashboard'` for now and add a TODO.

### 5. `src/app/academic/assigned-modules/_server/service.ts`

**Current**: Custom `withPermission(..., ['academic', 'leap'])` calls
**Target**: Replace `['academic', 'leap']` with `{ 'assigned-modules': ['read'] }` for reads and appropriate permission objects for writes.

### 6. `src/app/human-resource/employees/_server/service.ts`

**Current**: Custom `withPermission(..., ['human_resource', 'admin'])` calls
**Target**: Replace `['human_resource', 'admin']` with `{ employees: ['read'] }` for reads and `{ employees: ['create'] }`, `{ employees: ['update'] }`, `{ employees: ['delete'] }` for writes.

### 7. `src/app/timetable/viewer/_server/service.ts`

**Current**: Standalone functions with `withPermission(..., ['dashboard'])`
**Target**: Replace `['dashboard']` with `'dashboard'` as string literal.

---

## 24d.2 — Verify 7 Mixed Services

These services already use permission objects for writes but still use `'dashboard'` string for reads. `'dashboard'` is a legitimate member of the `AuthRequirement` union — **no changes needed** if the string literal is used directly (not wrapped in an array).

**Verify** each uses `'dashboard'` as a **string literal** (not `['dashboard']` array):

| Service | File |
|---------|------|
| SemesterModuleService | `src/app/academic/semester-modules/_server/service.ts` |
| SchoolStructureService | `src/app/academic/schools/structures/_server/service.ts` |
| VenueService | `src/app/timetable/venues/_server/service.ts` |
| VenueTypeService | `src/app/timetable/venue-types/_server/service.ts` |
| TimetableAllocationService | `src/app/timetable/timetable-allocations/_server/service.ts` |
| SlotService | `src/app/timetable/slots/_server/service.ts` |
| ModuleService | `src/app/academic/modules/_server/service.ts` |

If any uses array format, convert to string literal `'dashboard'`.

---

## 24d.3 — Verification

### Grep Check
```bash
rg "\[.*'dashboard'.*\]|\[.*'academic'.*\]|\[.*'registry'.*\]|\[.*'finance'.*\]|\[.*'leap'.*\]|\[.*'human_resource'.*\]" src --glob "**/*service*" --glob "**/*action*"
```
Must return **zero** results.

### Broader Role-Array Check
```bash
rg "\['dashboard'\]|\['academic'\]|\['registry'\]|\['finance'\]|\['human_resource'\]|\['leap'\]" src --glob "**/*.ts"
```
Must return **zero** results in service/action files.

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
| 7 legacy services | Array configs `['dashboard']`, `['academic', 'leap']`, `['human_resource', 'admin']` | String literals (`'dashboard'`) or permission objects (`{ resource: ['action'] }`) |
| 7 mixed services | Verified as already correct | No changes expected |

### Files Modified (Estimated: ~7–10 files)

**Services** (7):
- `src/app/registry/terms/_server/service.ts`
- `src/app/registry/graduation/dates/_server/service.ts`
- `src/app/registry/student-notes/_server/service.ts`
- `src/app/academic/schools/_server/service.ts`
- `src/app/academic/assigned-modules/_server/service.ts`
- `src/app/human-resource/employees/_server/service.ts`
- `src/app/timetable/viewer/_server/service.ts`
