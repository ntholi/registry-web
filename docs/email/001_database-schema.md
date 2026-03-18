# Step 001: Database Schema

## Introduction

This is the foundational step. All tables, enums, relations, and indexes for the email module are defined here. No business logic or UI — just the data layer that every subsequent step builds on.

## Context

- The email module lives under `src/app/admin/mails/`.
- Schema files go in `src/app/admin/mails/_schema/` — one table per file, `camelCase` filenames matching the export.
- Relations live in `relations.ts` within the same `_schema` folder.
- The module barrel export goes in `src/app/admin/_database/index.ts` (re-export all schemas).
- Foreign keys reference `users` from `@auth/users/_schema/users`.

## Requirements

### 1. Enums

#### `mailQueueStatus`

| Value | Description |
|-------|-------------|
| `pending` | Queued, awaiting processing |
| `processing` | Currently being sent |
| `sent` | Successfully delivered to Gmail API |
| `failed` | Permanent failure after max retries |
| `retry` | Temporary failure, scheduled for retry |

#### `mailTriggerType`

| Value | Description |
|-------|-------------|
| `student_status_created` | Student status request created |
| `student_status_updated` | Student status request updated |
| `student_status_approved` | Student status approved by approver |
| `student_status_rejected` | Student status rejected by approver |
| `notification_mirror` | In-app notification mirrored to email |
| `manual` | Admin-composed email |
| `reply` | Reply sent from inbox |

### 2. Tables

#### `mailAccounts`

Stores authorized Gmail accounts with OAuth tokens. Any user can authorize their email; admin manages assignments separately.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | nanoid |
| `userId` | `text` | FK → users, NOT NULL | User who authorized this email |
| `email` | `text` | NOT NULL, UNIQUE | Gmail address (e.g., registry@limkokwing.ac.ls) |
| `displayName` | `text` | | Display name for sent emails |
| `accessToken` | `text` | | Gmail OAuth access token (encrypted) |
| `refreshToken` | `text` | | Gmail OAuth refresh token (encrypted) |
| `tokenExpiresAt` | `timestamp` | | Access token expiry |
| `scope` | `text` | | Space-separated granted scopes |
| `isPrimary` | `boolean` | DEFAULT false | Is this the primary system sender? |
| `signature` | `text` | | HTML signature appended to outgoing emails |
| `isActive` | `boolean` | DEFAULT true | Can this account be used? |
| `lastSyncAt` | `timestamp` | | Last time inbox was synced/cached |
| `createdAt` | `timestamp` | DEFAULT now(), NOT NULL | |
| `updatedAt` | `timestamp` | DEFAULT now(), NOT NULL | Auto-updated |

**Indexes:**
- `mail_accounts_user_id_idx` on `userId`
- `mail_accounts_email_idx` UNIQUE on `email`
- `mail_accounts_is_primary_idx` partial index WHERE `isPrimary = true` (enforce single primary via app logic)

#### `mailAccountAssignments`

Links an authorized email to roles (departments) or specific users for inbox access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PK | Auto-increment |
| `mailAccountId` | `text` | FK → mailAccounts, NOT NULL | Which email account |
| `role` | `text` | nullable | User role (e.g., 'registry', 'finance'). NULL if assigning to specific user |
| `userId` | `text` | FK → users, nullable | Specific user. NULL if assigning to role |
| `canCompose` | `boolean` | DEFAULT false | Can this assignee compose new emails? |
| `canReply` | `boolean` | DEFAULT true | Can this assignee reply to threads? |
| `createdAt` | `timestamp` | DEFAULT now(), NOT NULL | |

**Constraints:**
- CHECK: exactly one of `role` or `userId` must be non-null
- UNIQUE on `(mailAccountId, role)` WHERE `role IS NOT NULL`
- UNIQUE on `(mailAccountId, userId)` WHERE `userId IS NOT NULL`

**Indexes:**
- `mail_assignments_account_idx` on `mailAccountId`
- `mail_assignments_role_idx` on `role` WHERE `role IS NOT NULL`
- `mail_assignments_user_idx` on `userId` WHERE `userId IS NOT NULL`

#### `mailQueue`

Outbound email queue with rate limiting support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PK | Auto-increment |
| `mailAccountId` | `text` | FK → mailAccounts, NOT NULL | Send via this account |
| `to` | `text` | NOT NULL | Comma-separated recipient emails |
| `cc` | `text` | | Comma-separated CC |
| `bcc` | `text` | | Comma-separated BCC |
| `subject` | `text` | NOT NULL | Email subject |
| `htmlBody` | `text` | NOT NULL | Rendered HTML body |
| `textBody` | `text` | | Plain-text fallback |
| `attachments` | `jsonb` | | Array of `{ filename, r2Key, mimeType }` |
| `status` | `mailQueueStatus` | DEFAULT 'pending', NOT NULL | Current send status |
| `attempts` | `integer` | DEFAULT 0, NOT NULL | Number of send attempts |
| `maxAttempts` | `integer` | DEFAULT 3, NOT NULL | Maximum retry count |
| `error` | `text` | | Last error message |
| `scheduledAt` | `timestamp` | DEFAULT now(), NOT NULL | When to process this email |
| `processedAt` | `timestamp` | | When last processing attempt happened |
| `sentAt` | `timestamp` | | When successfully sent |
| `triggerType` | `mailTriggerType` | NOT NULL | What caused this email |
| `triggerEntityId` | `text` | | ID of the triggering entity (e.g., studentStatusId) |
| `createdAt` | `timestamp` | DEFAULT now(), NOT NULL | |

**Indexes:**
- `mail_queue_status_idx` on `(status, scheduledAt)` — for queue processor queries
- `mail_queue_account_idx` on `mailAccountId`
- `mail_queue_trigger_idx` on `(triggerType, triggerEntityId)` — for dedup checks

#### `mailSentLog`

Audit log for all sent emails (system-triggered and manual).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PK | Auto-increment |
| `mailAccountId` | `text` | FK → mailAccounts, NOT NULL | Which account sent it |
| `queueId` | `integer` | FK → mailQueue, nullable | Link to queue entry (NULL for direct sends) |
| `gmailMessageId` | `text` | | Gmail message ID of sent email |
| `to` | `text` | NOT NULL | Recipients |
| `cc` | `text` | | CC recipients |
| `bcc` | `text` | | BCC recipients |
| `subject` | `text` | NOT NULL | Subject line |
| `snippet` | `text` | | Preview text |
| `status` | `text` | NOT NULL | 'sent' or 'failed' |
| `error` | `text` | | Error message if failed |
| `sentAt` | `timestamp` | DEFAULT now(), NOT NULL | Timestamp |
| `sentByUserId` | `text` | FK → users, nullable | User who triggered (NULL for system) |
| `triggerType` | `mailTriggerType` | NOT NULL | What caused this send |
| `triggerEntityId` | `text` | | ID of triggering entity |

**Indexes:**
- `mail_sent_log_account_idx` on `mailAccountId`
- `mail_sent_log_sent_at_idx` on `sentAt DESC` — for chronological log view
- `mail_sent_log_trigger_idx` on `(triggerType, triggerEntityId)`

### 3. Relations

Define in `relations.ts`:

- `mailAccounts` → `users` (many-to-one via `userId`)
- `mailAccounts` → `mailAccountAssignments` (one-to-many)
- `mailAccounts` → `mailQueue` (one-to-many)
- `mailAccounts` → `mailSentLog` (one-to-many)
- `mailAccountAssignments` → `mailAccounts` (many-to-one via `mailAccountId`)
- `mailAccountAssignments` → `users` (many-to-one via `userId`, optional)
- `mailQueue` → `mailAccounts` (many-to-one via `mailAccountId`)
- `mailSentLog` → `mailAccounts` (many-to-one via `mailAccountId`)
- `mailSentLog` → `mailQueue` (many-to-one via `queueId`, optional)
- `mailSentLog` → `users` (many-to-one via `sentByUserId`, optional)

### 4. Module Barrel Export

Add schema re-exports to the admin module's `_database/index.ts`:

```
export { mailAccounts } from '../mails/_schema/mailAccounts';
export { mailAccountAssignments } from '../mails/_schema/mailAccountAssignments';
export { mailQueue } from '../mails/_schema/mailQueue';
export { mailSentLog } from '../mails/_schema/mailSentLog';
```

Also add all tables to the core database barrel (`src/core/database/index.ts`).

### 5. Migration

Run `pnpm db:generate` after creating all schema files. Do NOT manually create .sql migration files.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/_schema/mailAccounts.ts` | Mail accounts table |
| `src/app/admin/mails/_schema/mailAccountAssignments.ts` | Assignment table |
| `src/app/admin/mails/_schema/mailQueue.ts` | Email queue table |
| `src/app/admin/mails/_schema/mailSentLog.ts` | Sent email audit log |
| `src/app/admin/mails/_schema/relations.ts` | All relations |

## Validation Criteria

1. All four schema files exist with correct column types and constraints
2. Relations file defines all foreign key relationships
3. Barrel exports updated in `_database/index.ts` and `core/database/index.ts`
4. `pnpm db:generate` produces a clean migration
5. `pnpm tsc --noEmit` passes with no errors
6. `pnpm lint:fix` passes clean

## Notes

- Token encryption: Tokens stored in `mailAccounts` follow the same pattern as existing Google integrations (stored directly without application-level encryption). If encryption is later enabled for Better Auth's `encryptOAuthTokens`, the same approach should be applied here.
- The `isPrimary` flag enforced at application level: when setting a new primary, unset the old one in a transaction.
- The CHECK constraint on `mailAccountAssignments` ensures exactly one of `role`/`userId` is set — prevents ambiguous assignments.
- `mailQueue.attachments` is JSONB storing `{ filename: string, r2Key: string, mimeType: string }[]`.
