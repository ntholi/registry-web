# Step 008: Permissions & Access Control

## Introduction

This step integrates the email module into the existing permission system. It adds `mails` as a resource in the permission catalog, defines granular actions, and implements the access control logic that governs who can manage accounts, view inboxes, and send/reply to emails.

## Context

- The app uses a permission preset system: `permission_presets` table with `PermissionGrant[]` arrays.
- The permission catalog lives in `src/app/auth/permission-presets/_lib/catalog.ts`.
- `withPermission(fn, requirement)` enforces access. Admin role bypasses all checks.
- Email access is assignment-based: users access inboxes they're assigned to (by role or directly).
- This is layered: catalog permissions control who can manage the mails feature; assignments control per-inbox access.

## Requirements

### 1. Permission Catalog Entry

**File to modify:** `src/app/auth/permission-presets/_lib/catalog.ts`

Add `mails` as a new resource:

| Resource | Actions | Description |
|----------|---------|-------------|
| `mails` | `read` | View authorized email accounts and sent log |
| `mails` | `create` | Authorize new email accounts (via OAuth flow) |
| `mails` | `manage` | Set primary, assign to roles/users, update settings, manage queue |
| `mails` | `inbox` | Access inboxes assigned to user (read + reply based on assignment) |
| `mails` | `compose` | Compose new outbound emails (grantable via presets; also requires `canCompose` assignment) |
| `mails` | `delete` | Revoke email accounts |

### 2. Access Control Layers

The email module has **two layers** of access control:

#### Layer 1: Feature-Level Permissions (via catalog)

Controls who can access the mails feature at all. Used in service `BaseServiceConfig`:

| Operation | Permission Requirement |
|-----------|----------------------|
| View mail accounts list | `{ mails: ['read'] }` |
| View single mail account | `{ mails: ['read'] }` |
| Update mail account settings | `{ mails: ['manage'] }` |
| Set primary email | `{ mails: ['manage'] }` |
| Manage assignments | `{ mails: ['manage'] }` |
| View sent log | `{ mails: ['read'] }` |
| View queue status | `{ mails: ['manage'] }` |
| Delete/revoke account | `{ mails: ['delete'] }` |

**Special case:** Any authenticated user can authorize their own email and revoke their own email — this uses `'auth'` permission level, not the catalog.

#### Layer 2: Assignment-Based Inbox Access

Controls which specific inboxes a user can access. Checked **after** Layer 1 passes:

| Operation | Assignment Check |
|-----------|-----------------|
| View inbox | User must have an assignment for this mailAccountId |
| Read thread | Same as view inbox |
| Reply to thread | Assignment must have `canReply = true` |
| Compose new email | Assignment must have `canCompose = true` (or user is admin) |
| Mark read/unread | Same as view inbox |
| Download attachment | Same as view inbox |
| Search inbox | Same as view inbox |

#### Access Resolution Logic

```
function canAccessInbox(userId, userRole, mailAccountId):
  1. If userRole === 'admin' → return { canView: true, canReply: true, canCompose: true }
  2. Query mailAccountAssignments WHERE:
     (mailAccountId = target AND userId = current) OR
     (mailAccountId = target AND role = userRole)
  3. If no assignment found → return { canView: false }
  4. Merge permissions from all matching assignments (e.g., role + direct):
     canReply = any assignment has canReply = true
     canCompose = any assignment has canCompose = true
  5. Return { canView: true, canReply, canCompose }
```

### 3. Permission Check Helper

**File:** `src/app/admin/mails/_server/service.ts` (add to service)

#### `checkInboxAccess(mailAccountId: string): Promise<InboxAccess>`

Returns `{ canView: boolean, canReply: boolean, canCompose: boolean }`.

Called by every inbox action before proceeding. Throws `ForbiddenError` if `canView` is false.

### 4. Navigation Permissions

**File to modify:** `src/app/admin/admin.config.ts`

Add mails navigation entry:

```
{
  label: 'Mails',
  href: '/admin/mails',
  icon: IconMail,
  permissions: [{ resource: 'mails', action: 'read' }],
}
```

This ensures the nav item only appears for users with `mails:read` permission (or admin role).

### 5. User Profile Authorization Access

The "Authorize Email" button on the user profile page does NOT require `mails` permission — any authenticated user can authorize their own Gmail. The flow:

1. User clicks "Authorize Email" on their profile.
2. OAuth flow creates `mailAccounts` row.
3. The account is dormant until an admin assigns it (sets primary, assigns to roles/users).
4. The authorizing user can see their own accounts and revoke them from their profile.

### 6. Self-Service vs Admin

| Action | Who | Permission |
|--------|-----|-----------|
| Authorize own email | Any user | `'auth'` (authenticated) |
| View own authorized emails | Any user | `'auth'` |
| Revoke own email | Any user | `'auth'` + ownership check |
| Revoke any email | Admin | `{ mails: ['delete'] }` |
| View all accounts | Users with permission | `{ mails: ['read'] }` |
| Manage accounts | Admin / permitted users | `{ mails: ['manage'] }` |
| Access assigned inbox | Assigned users | `{ mails: ['inbox'] }` + assignment |

### 7. Middleware / Route Protection

The `admin/mails/` route group should be protected:

- `layout.tsx`: Verify session exists (redirect to login if not).
- Page-level: Each page component calls the appropriate server action which handles permission checks internally via `withPermission`.

No additional middleware needed — the existing app shell handles dashboard-level auth.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/auth/permission-presets/_lib/catalog.ts` | Modified: add `mails` resource |
| `src/app/admin/admin.config.ts` | Modified: add mails nav entry |
| `src/app/admin/mails/_server/service.ts` | Modified: add `checkInboxAccess` |

## Validation Criteria

1. `mails` resource appears in permission catalog with all actions
2. Permission presets can be configured to grant mails access
3. Admin role bypasses all permission checks for mails
4. Non-admin users without `mails:read` cannot see the mails nav item
5. Non-admin users without assignment cannot access any inbox
6. Assignment with `canReply: false` prevents replying
7. Only admin (or users with `canCompose: true` assignment) can compose new emails
8. Any authenticated user can authorize/revoke their own email from profile
9. Revoking another user's email requires `mails:delete` permission
10. `pnpm tsc --noEmit` passes
11. `pnpm lint:fix` passes

## Notes

- The two-layer approach (catalog + assignment) is necessary because:
  - Catalog controls feature-level visibility (who sees the mails section at all).
  - Assignments control per-inbox granular access (which inboxes a user can read/reply).
- When an admin revokes a user's email, all assignments for that email are also deleted (cascade).
- If a user's role changes (e.g., moves from `registry` to `finance`), their inbox access automatically changes because assignments are role-based.
- Consider adding an `inbox` permission action separate from `read` — `read` shows the account management view, `inbox` grants inbox reading access. This allows a scenario where a user can see account settings but not read emails.
