# Step 008: Permissions & Access Control

## Introduction

This step adds the mails navigation entry to the admin config and documents the access control logic already implemented in the email module. The `mails` resource and catalog entries are already in place.

## Context

- The app uses a permission preset system: `permission_presets` table with `PermissionGrant[]` arrays.
- The permission catalog lives in `src/app/auth/permission-presets/_lib/catalog.ts`.
- `withPermission(fn, requirement)` enforces access. Admin role bypasses all checks.
- Email access is assignment-based: users access inboxes they're assigned to (by role or directly).
- This is layered: catalog permissions control who can access the mails feature; assignments control per-inbox access.
- The system's `Action` type only supports: `read`, `create`, `update`, `delete`, `approve`, `reject`. All mails permissions must use these existing actions.

## Already Implemented

The following are already in place and do NOT need changes:

- `mails` added to `RESOURCES` in `src/core/auth/permissions.ts`
- `mails` added to the `Admin` group in `PERMISSION_RESOURCE_GROUPS` in `src/app/auth/permission-presets/_lib/catalog.ts`
- All preset seeds grant `mails: ['read']` (view-only for non-admin roles)
- `MailAccountService` in `src/app/admin/mails/accounts/_server/service.ts` and `MailAssignmentService` in `src/app/admin/mails/assignments/_server/service.ts` with `withPermission` calls
- `MailAssignmentRepository.findAccessibleAccounts()` handles assignment-based inbox filtering

## Requirements

### 1. Permission Catalog Entry (already done)

**File:** `src/app/auth/permission-presets/_lib/catalog.ts`

`mails` uses the standard `Action` set. The actions map as follows:

| Resource | Action | Description |
|----------|--------|-------------|
| `mails` | `read` | View mail accounts list, view single account, view sent log, view queue status, view daily stats |
| `mails` | `create` | Authorize new email accounts (via OAuth), create assignments (assign to role/user) |
| `mails` | `update` | Update mail account settings, set primary email, retry failed queue items |
| `mails` | `delete` | Revoke email accounts, remove assignments, cancel queued emails |

All preset seeds currently grant only `mails: ['read']`. Only admin role (which bypasses all checks) can perform `create`, `update`, `delete` operations on mails.

### 2. Access Control Layers

The email module has **two layers** of access control:

#### Layer 1: Feature-Level Permissions (via `withPermission`)

Controls who can access the mails feature at all. These are the actual `withPermission` calls in the service and actions:

**BaseServiceConfig (`MailAccountService`):**

| Config | Requirement | Effect |
|--------|-------------|--------|
| `byIdAuth` | `{ mails: ['read'] }` | View single mail account |
| `findAllAuth` | `{ mails: ['read'] }` | View mail accounts list |
| `createAuth` | `'auth'` | Any authenticated user can authorize their own email |
| `updateAuth` | `{ mails: ['update'] }` | Update account settings (display name, signature, active status) |
| `deleteAuth` | `'auth'` | Revoke account (ownership check + admin bypass in service logic) |

**Custom service methods:**

| Method | Requirement | Effect |
|--------|-------------|--------|
| `search()` | `{ mails: ['read'] }` | Paginated search of mail accounts |
| `getMyAccounts()` | No `withPermission` (called after `getSession()`) | User views own accounts |
| `setPrimary()` | `{ mails: ['update'] }` | Set an account as primary sender |
| `getAccessibleAccounts()` | `'dashboard'` | Any dashboard user; admin sees all, others see assigned |
| `revokeAccount()` | `'auth'` | Authenticated + ownership OR admin check in code |

**Assignment service methods:**

| Method | Requirement | Effect |
|--------|-------------|--------|
| `getAssignments()` | `{ mails: ['read'] }` | View assignments for an account |
| `assignToRole()` | `{ mails: ['create'] }` | Assign account to a dashboard role |
| `assignToUser()` | `{ mails: ['create'] }` | Assign account to a specific user |
| `removeAssignment()` | `{ mails: ['delete'] }` | Remove a single assignment |
| `removeAllAssignments()` | `{ mails: ['delete'] }` | Remove all assignments for an account |

**Queue/log actions (in `actions.ts`):**

| Action | Requirement | Effect |
|--------|-------------|--------|
| `getQueueStatus()` | `{ mails: ['read'] }` | View queue counts by status |
| `getQueueItems()` | `{ mails: ['read'] }` | View paginated queue items |
| `getSentLog()` | `{ mails: ['read'] }` | View paginated sent log |
| `getDailyStats()` | `{ mails: ['read'] }` | View daily send count for an account |
| `retryFailedEmail()` | `{ mails: ['update'] }` | Retry a failed queue item |
| `cancelQueuedEmail()` | `{ mails: ['delete'] }` | Cancel/delete a pending queue item |

#### Layer 2: Assignment-Based Inbox Access

Controls which specific inboxes a user can access. This is handled by `MailAssignmentRepository.findAccessibleAccounts(userId, role)` which queries `mail_account_assignments` matching either the user's ID or their dashboard role, and aggregates `canCompose`/`canReply` using `bool_or()`.

| Operation | Assignment Check |
|-----------|-----------------|
| View inbox | User must have an assignment (by userId or role) for this mailAccountId |
| Read thread | Same as view inbox |
| Reply to thread | Assignment must have `canReply = true` |
| Compose new email | Assignment must have `canCompose = true` (or user is admin) |
| Mark read/unread | Same as view inbox |
| Download attachment | Same as view inbox |
| Search inbox | Same as view inbox |

#### Access Resolution Logic (implemented in `findAccessibleAccounts`)

```
function findAccessibleAccounts(userId, userRole):
  1. If caller is admin (checked in service) → return all active accounts
  2. Query mailAccountAssignments WHERE:
     (userId = current) OR (role = userRole)
  3. JOIN with mailAccounts (active only)
  4. GROUP BY account, aggregate with bool_or(canCompose), bool_or(canReply)
  5. Return accounts[] with { canCompose, canReply } per account
  6. Accounts not in result set → user has no access
```

### 3. Navigation Permissions

**File to modify:** `src/app/admin/admin.config.ts`

Add mails navigation entry to the dashboard navigation array:

```typescript
{
  label: 'Mails',
  href: '/admin/mails',
  icon: IconMail,
  permissions: [{ resource: 'mails', action: 'read' }],
}
```

This ensures the nav item only appears for users with `mails:read` permission (or admin role).

### 4. User Profile Authorization Access

The "Authorize Email" button on the user profile page does NOT require `mails` permission — any authenticated user can authorize their own Gmail. The flow:

1. User clicks "Authorize Email" on their profile.
2. OAuth flow creates `mailAccounts` row (`createAuth: 'auth'`).
3. The account is dormant until an admin assigns it (sets primary, assigns to roles/users).
4. The authorizing user can see their own accounts via `getMyAccounts()` and revoke them.

### 5. Self-Service vs Admin

| Action | Who | Permission |
|--------|-----|-----------|
| Authorize own email | Any user | `'auth'` (authenticated) |
| View own authorized emails | Any user | `getSession()` + `findByUserId()` |
| Revoke own email | Any user | `'auth'` + ownership check in `revokeAccount()` |
| Revoke any email | Admin | `'auth'` + admin role check in `revokeAccount()` |
| View all accounts | Users with permission | `{ mails: ['read'] }` |
| Update account settings | Admin only (no presets grant this) | `{ mails: ['update'] }` |
| Set primary | Admin only | `{ mails: ['update'] }` |
| Create assignments | Admin only | `{ mails: ['create'] }` |
| Remove assignments | Admin only | `{ mails: ['delete'] }` |
| View assigned inboxes | Any dashboard user | `'dashboard'` + assignment filter |

### 6. Middleware / Route Protection

The `admin/mails/` route group is protected by the existing app shell which handles dashboard-level auth.

Page-level: Each page component calls the appropriate server action which handles permission checks internally via `withPermission`. No additional middleware needed.

## Expected Files

| File | Status | Purpose |
|------|--------|---------|
| `src/core/auth/permissions.ts` | Done | `mails` already in `RESOURCES` array |
| `src/app/auth/permission-presets/_lib/catalog.ts` | Done | `mails` in resource groups + all preset seeds grant `['read']` |
| `src/app/admin/mails/accounts/_server/service.ts` | Done | `withPermission` calls on all service methods |
| `src/app/admin/mails/queues/_server/actions.ts` | Done | `withPermission` calls on queue/log actions |
| `src/app/admin/admin.config.ts` | **TODO** | Add mails nav entry with `IconMail` |

## Validation Criteria

1. `mails` resource exists in `RESOURCES` array in `permissions.ts`
2. `mails` appears in `PERMISSION_RESOURCE_GROUPS` under Admin
3. All preset seeds grant `mails: ['read']`
4. Admin role bypasses all permission checks for mails
5. Non-admin users without `mails:read` cannot see the mails nav item
6. Non-admin users without assignment cannot access any inbox (filtered by `findAccessibleAccounts`)
7. Assignment with `canReply: false` prevents replying
8. Assignment with `canCompose: false` prevents composing (admin bypasses)
9. Any authenticated user can authorize/revoke their own email
10. Only admin can update settings, set primary, manage assignments (no presets grant `update`/`create`/`delete`)
11. `pnpm tsc --noEmit` passes
12. `pnpm lint:fix` passes

## Notes

- The two-layer approach (catalog + assignment) is necessary because:
  - Catalog controls feature-level visibility (who sees the mails section at all).
  - Assignments control per-inbox granular access (which inboxes a user can read/reply).
- When an admin revokes a user's email via `revokeAccount()`, all assignments for that email are deleted in the same transaction.
- If a user's role changes (e.g., moves from `registry` to `finance`), their inbox access automatically changes because `findAccessibleAccounts` matches by role.
- All presets only grant `mails: ['read']`. Management operations (`update`, `create`, `delete`) are effectively admin-only unless specific presets are updated in the future.
