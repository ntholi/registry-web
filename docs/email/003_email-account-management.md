# Step 003: Email Account Management

## Introduction

With OAuth integration from Step 002 allowing users to authorize emails, this step builds the full CRUD management layer: repository, service, and server actions for `mailAccounts` and `mailAccountAssignments`. Admins can view all authorized emails, set a primary sender, assign emails to roles/users, and manage signatures.

## Context

- Users authorize emails from their profile (Step 002). Token management is handled by `gmail-client.ts`.
- This step focuses on the **admin management** of those authorized accounts — assignments, primary designation, signatures.
- Follows the standard pattern: Repository → Service → Actions.
- Uses `BaseRepository` and `BaseService` from `src/core/platform/`.

## Requirements

### 1. Repository

**File:** `src/app/admin/mails/accounts/_server/repository.ts` and `src/app/admin/mails/assignments/_server/repository.ts`

#### `MailAccountRepository extends BaseRepository`

| Method | Description |
|--------|-------------|
| `findAll(opts)` | Paginated list of all mail accounts. Join with `users` to get authorizer info. |
| `findById(id)` | Single account with user info and assignments. |
| `findByUserId(userId)` | All accounts authorized by a specific user. |
| `findByEmail(email)` | Lookup by email address. |
| `findPrimary()` | Get the current primary account (`isPrimary = true`). |
| `findActive()` | All active accounts. |
| `create(data)` | Insert new mail account. |
| `update(id, data)` | Update account fields (display name, signature, isActive, etc.). |
| `delete(id)` | Delete account and cascade to assignments. |
| `setPrimary(id)` | Transaction: unset all `isPrimary`, then set target to `true`. |
| `updateTokens(id, tokens)` | Update access/refresh tokens and expiry (used by auto-refresh). |

#### `MailAssignmentRepository extends BaseRepository`

| Method | Description |
|--------|-------------|
| `findByAccountId(accountId)` | All assignments for a mail account. |
| `findByRole(role)` | All accounts assigned to a specific role. |
| `findByUserId(userId)` | All accounts a specific user has access to (direct + via role). |
| `findAccessibleAccounts(userId, role)` | Accounts accessible to user — both direct assignments AND role-based. Single query with OR condition. Returns accounts with merged permissions (`canReply`, `canCompose`) from all matching assignments. |
| `create(data)` | Create assignment (validate role XOR userId constraint). |
| `delete(id)` | Remove an assignment. |
| `deleteByAccountId(accountId)` | Remove all assignments for an account (used when revoking). |

### 2. Service

**File:** `src/app/admin/mails/accounts/_server/service.ts` and `src/app/admin/mails/assignments/_server/service.ts`

#### `MailAccountService extends BaseService`

**Config:**
- `byIdAuth`: `{ mails: ['read'] }`
- `findAllAuth`: `{ mails: ['read'] }`
- `createAuth`: `'auth'` (any authenticated user can authorize — actual creation via OAuth)
- `updateAuth`: `{ mails: ['manage'] }`
- `deleteAuth`: `'auth'` (user can revoke own, admin can revoke any)
- `activityTypes`: `{ create: 'mail_account_authorized', update: 'mail_account_updated', delete: 'mail_account_revoked' }`

**Custom methods:**

| Method | Auth | Description |
|--------|------|-------------|
| `getMyAccounts()` | `'auth'` | Current user's authorized accounts |
| `setPrimary(id)` | `{ mails: ['manage'] }` | Set an account as primary (admin only) |
| `getAccessibleAccounts()` | `'dashboard'` | Accounts the current user can access (for inbox), with resolved per-account permissions (`canReply`, `canCompose`) |
| `revokeAccount(id)` | `'auth'` | Revoke: verify ownership or admin, then delete |

#### `MailAssignmentService`

**Custom methods (all require `{ mails: ['manage'] }`):**

| Method | Description |
|--------|-------------|
| `getAssignments(accountId)` | List assignments for an account |
| `assignToRole(accountId, role, perms)` | Assign email to a role with canCompose/canReply |
| `assignToUser(accountId, userId, perms)` | Assign email to a specific user |
| `removeAssignment(assignmentId)` | Remove a single assignment |
| `removeAllAssignments(accountId)` | Clear all assignments for an account |

### 3. Server Actions

**File:** `src/app/admin/mails/accounts/_server/actions.ts` and `src/app/admin/mails/assignments/_server/actions.ts`

#### Mail Account Actions

| Action | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getMailAccounts(page, search)` | page: number, search: string | `{ items, totalPages, totalItems }` | Paginated list for admin |
| `getMailAccount(id)` | id: string | Account with assignments | Single account detail |
| `getMyMailAccounts()` | — | Account[] | Current user's authorized emails |
| `updateMailAccount(id, data)` | id, { displayName, signature, isActive } | Account | Update account settings |
| `deleteMailAccount(id)` | id: string | void | Revoke/delete account |
| `setPrimaryMailAccount(id)` | id: string | Account | Set as primary sender |

#### Assignment Actions

| Action | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getAssignments(accountId)` | accountId: string | Assignment[] | List assignments |
| `assignToRole(accountId, role, perms)` | accountId, role, { canCompose, canReply } | Assignment | Add role assignment |
| `assignToUser(accountId, userId, perms)` | accountId, userId, { canCompose, canReply } | Assignment | Add user assignment |
| `removeAssignment(assignmentId)` | assignmentId: number | void | Remove assignment |
| `getAccessibleMailAccounts()` | — | Account[] | Mail accounts current user can access |

### 4. Activity Logging

**File:** `src/app/admin/mails/_lib/activities.ts`

Define an `ActivityFragment` for the mails module:

| Activity Type | Description |
|--------------|-------------|
| `mail_account_authorized` | User authorized a new email account |
| `mail_account_updated` | Admin updated account settings |
| `mail_account_revoked` | Email account revoked/deleted |
| `mail_assignment_created` | Admin assigned email to role/user |
| `mail_assignment_removed` | Admin removed an email assignment |
| `mail_primary_changed` | Admin changed the primary sender |

Register fragment in `src/app/admin/activity-tracker/_lib/registry.ts`.

### 5. Validation Types

**File:** `src/app/admin/mails/_lib/types.ts`

Zod schemas:

| Schema | Fields |
|--------|--------|
| `updateMailAccountSchema` | `displayName?`, `signature?`, `isActive?` |
| `assignToRoleSchema` | `mailAccountId`, `role`, `canCompose?`, `canReply?` |
| `assignToUserSchema` | `mailAccountId`, `userId`, `canCompose?`, `canReply?` |

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/accounts/_server/repository.ts` | Mail account repository |
| `src/app/admin/mails/accounts/_server/service.ts` | Mail account service |
| `src/app/admin/mails/accounts/_server/actions.ts` | Mail account server actions |
| `src/app/admin/mails/assignments/_server/repository.ts` | Mail assignment repository |
| `src/app/admin/mails/assignments/_server/service.ts` | Mail assignment service |
| `src/app/admin/mails/assignments/_server/actions.ts` | Mail assignment server actions |
| `src/app/admin/mails/_lib/types.ts` | Zod validation schemas |
| `src/app/admin/mails/_lib/activities.ts` | Activity fragment for audit logging |

## Validation Criteria

1. Admin can list all authorized email accounts (paginated, searchable)
2. Admin can view a single account with its assignments
3. Admin can update display name, signature, active status
4. Admin can set an account as primary (old primary unset atomically)
5. Admin can assign an account to a role (duplicate role assignment rejected)
6. Admin can assign an account to a specific user (duplicate user assignment rejected)
7. Admin can remove individual assignments
8. Users can list their own authorized accounts
9. Users can revoke their own account (deletes account + all assignments)
10. Admin can revoke any account
11. Activity log entries created for all mutations
12. `pnpm tsc --noEmit` passes
13. `pnpm lint:fix` passes

## Notes

- The `setPrimary` method must use a DB transaction to ensure atomicity — unset old primary and set new primary in the same transaction.
- The `findAccessibleAccounts` query should be a single query that checks both direct user assignments and role-based assignments using an OR condition, avoiding two separate DB calls.
- When revoking an account, optionally call Google's token revocation endpoint to invalidate the token server-side. Use `new google.auth.OAuth2()` to create a client instance, then call `oauth2Client.revokeToken(accessToken)`. Do NOT call `revokeToken` on the prototype.
- The `role` field in assignments maps to existing user roles from the app's role system (e.g., `'registry'`, `'finance'`, `'academic'`, `'admin'`).
- Service exports follow the naming convention: `export const mailAccountService = new MailAccountService(...)` and `export const mailAssignmentService = new MailAssignmentService(...)`.
