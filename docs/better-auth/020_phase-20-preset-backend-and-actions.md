# Phase 20: Permission Preset Backend & Actions

> Estimated Implementation Time: 1.5 to 2 hours

**Prerequisites**: Phase 19 complete. Read `000_overview.md` first.

This phase builds the auth-owned permission preset backend (repository, service, actions) and the shared types. The admin route module consumes that backend; it does not own it.

## 20.1 File Structure

```
src/app/auth/permission-presets/
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   └── actions.ts
├── _lib/
│   └── types.ts

src/app/admin/permission-presets/
├── _components/
│   └── Form.tsx          (Phase 22)
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/page.tsx
└── layout.tsx
```

## 20.2 Types

File: `src/app/auth/permission-presets/_lib/types.ts`

```ts
import { z } from 'zod/v4';
import { permissionGrantSchema } from '@/core/auth/permissions';

export const presetFormSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(permissionGrantSchema),
});

export type PresetFormValues = z.infer<typeof presetFormSchema>;
```

## 20.3 Repository

File: `src/app/auth/permission-presets/_server/repository.ts`

Extends `BaseRepository` for `permissionPresets` table. Additional methods:

- `findByIdWithPermissions(id: string)` — joins `preset_permissions` to get full preset + permissions
- `findByRole(role: string)` — returns presets filtered by role
- `createWithPermissions(data, permissions[])` — transaction: insert preset + permission rows
- `updateWithPermissions(id, data, permissions[])` — transaction: update preset, delete old permissions, insert new
- `deleteById(id)` — cascade deletes permissions via FK

## 20.4 Service

File: `src/app/auth/permission-presets/_server/service.ts`

Extends `BaseService`. All operations gated by `{ users: ['manage'] }` (only admin-level users manage presets).

```ts
class PermissionPresetService extends BaseService<typeof permissionPresets, 'id'> {
  constructor() {
    super(new PermissionPresetRepository(), {
      byIdAuth: { users: ['manage'] },
      findAllAuth: { users: ['manage'] },
      createAuth: { users: ['manage'] },
      updateAuth: { users: ['manage'] },
      deleteAuth: { users: ['manage'] },
    });
  }
}
```

## 20.5 Actions

File: `src/app/auth/permission-presets/_server/actions.ts`

Standard CRUD actions:

```ts
export async function getPreset(id: string) { ... }
export async function findAllPresets(page: number, search: string) { ... }
export async function findPresetsByRole(role: string) { ... }
export async function createPreset(data: PresetFormValues) { ... }
export async function updatePreset(id: string, data: PresetFormValues) { ... }
export async function deletePreset(id: string) { ... }
```

These actions must remain thin. They validate input and call auth-owned services only. The admin pages import these actions. Do not add direct `db` writes or direct session-revocation loops inside the action layer.

## 20.6 Circular Dependency Prevention

> **Important**: Keep preset mutation side effects in auth-owned service code. The import graph should remain one-directional:
> - `auth.ts` → imports the auth-owned preset repository helper for `customSession`
> - auth-owned preset service/repository → may import `auth` from `@/core/auth` for session revocation
> - admin pages/components → import auth-owned actions only
>
> This prevents circular dependencies. If `auth.ts` ever imports from preset actions/service, refactor to break the cycle.

## 20.7 Session Revocation on Preset Change

When an admin updates a preset's permissions or changes a user's preset assignment, the user's cached session cookie still contains OLD permissions until the cookie cache expires (5 minutes). To ensure immediate permission enforcement:

**Strategy: Revoke affected user sessions when a preset changes.**

When updating a preset (permissions changed), do it inside the auth-owned preset service:
```ts
async updateWithPermissions(id: string, data: PresetFormValues) {
  const result = await this.repository.updateWithPermissions(id, data, data.permissions);

  // Revoke sessions for all users with this preset
  const affectedUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.presetId, id));

  for (const user of affectedUsers) {
    await auth.api.revokeUserSessions({ body: { userId: user.id } });
  }

  return result;
}
```

When admin changes a user's preset (in user form update), the admin-facing action should delegate to the auth-owned user service. That service handles preset reassignment and session revocation:
```ts
// In the auth-owned user service, if presetId changed:
if (oldPresetId !== newPresetId) {
  await auth.api.revokeUserSessions({ body: { userId } });
}
```

**Impact**: Affected users will need to re-sign-in. Their next session will have the updated permissions loaded via `customSession` plugin. This is the cleanest approach per Better Auth docs — the cookie cache revocation tradeoff is fully addressed.

## Exit Criteria

- [ ] Types defined with Zod schema in `_lib/types.ts`
- [ ] Repository extends `BaseRepository` with custom methods for permissions
- [ ] Service extends `BaseService` with `{ users: ['manage'] }` auth config
- [ ] Standard CRUD actions created including `findPresetsByRole`
- [ ] Backend files live under `src/app/auth/permission-presets/_server/` and are imported by admin pages
- [ ] Session revocation implemented for preset updates (affected users forced to re-login)
- [ ] Session revocation implemented in auth-owned user service when presetId changes
- [ ] `pnpm tsc --noEmit` passes
