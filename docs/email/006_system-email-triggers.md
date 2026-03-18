# Step 006: System Email Triggers

## Introduction

With templates (Step 005) and the sending pipeline (Step 004) ready, this step wires up automatic email triggers. When certain events occur in the application (student status changes, notifications created), the system automatically queues emails through the primary mail account.

## Context

- The student-status feature is at `src/app/registry/student-statuses/_server/`.
- The notification system is at `src/app/admin/notifications/_server/`.
- This step modifies existing services/actions to call `sendEmail()` after their primary operations.
- All automatic emails go through the **primary mail account** (`isPrimary = true`).
- Emails are queued (not immediate) — the cron processor handles actual delivery.

## Requirements

### 1. Email Trigger Service

**File:** `src/app/admin/mails/_server/trigger-service.ts`

A centralized service that handles all automated email triggers. Other modules call this service instead of calling `sendEmail()` directly.

#### `triggerStudentStatusEmail(params: StudentStatusTriggerParams): Promise<void>`

**Input:**

| Field | Type | Description |
|-------|------|-------------|
| `stdNo` | `string` | Student number |
| `statusId` | `number` | Student status ID |
| `statusType` | `string` | Status type name (e.g., "Deferment") |
| `action` | `'created' \| 'updated' \| 'approved' \| 'rejected'` | What happened |
| `reason` | `string` | Optional reason (for approval/rejection) |
| `approverName` | `string` | Approver name (for approval/rejection) |

**Behavior:**

1. Get primary mail account. If none configured, log warning and return (don't crash).
2. Resolve recipient email:
   - `created`/`updated` → Approver emails (auto-resolve from approval chain).
   - `approved`/`rejected` → Student email (from student profile).
3. Render template: `renderStudentStatusEmail(...)`.
4. Call `sendEmail()` with `triggerType: 'student_status_created'` (or appropriate variant), `triggerEntityId: statusId`.
5. Check for duplicate: query `mailQueue` for same `triggerType + triggerEntityId` within last 5 minutes to prevent double-sends on rapid updates.

#### `triggerNotificationEmail(params: NotificationTriggerParams): Promise<void>`

**Input:**

| Field | Type | Description |
|-------|------|-------------|
| `notificationId` | `number` | Notification ID |
| `title` | `string` | Notification title |
| `message` | `string` | Notification body |
| `link` | `string` | Optional action link |
| `senderName` | `string` | Creator of the notification |
| `recipientEmails` | `string[]` | Resolved email addresses of recipients |

**Behavior:**

1. Get primary mail account. If none, log and return.
2. Render template: `renderNotificationEmail(...)`.
3. For each recipient email, call `sendEmail()` with `triggerType: 'notification_mirror'`, `triggerEntityId: notificationId`.
4. Batch recipients where possible (use BCC for privacy if > 1 recipient, or individual emails for personalization).

#### `triggerGenericEmail(params: GenericTriggerParams): Promise<void>`

For ad-hoc system emails not tied to a specific feature.

| Field | Type | Description |
|-------|------|-------------|
| `to` | `string \| string[]` | Recipient(s) |
| `heading` | `string` | Email heading |
| `body` | `string` | HTML body content |
| `ctaText` | `string` | Optional CTA button text |
| `ctaUrl` | `string` | Optional CTA button URL |
| `triggerType` | `MailTriggerType` | Trigger type |
| `triggerEntityId` | `string` | Related entity |

### 2. Student Status Integration

Modify **existing** student status service/actions to call the trigger service.

**File to modify:** `src/app/registry/student-statuses/_server/service.ts` (or `actions.ts`)

**Integration points:**

| Existing Method | Trigger Call |
|-----------------|-------------|
| `create()` / create action | After successful creation → `triggerStudentStatusEmail({ action: 'created', ... })` |
| `update()` / update action | After successful update → `triggerStudentStatusEmail({ action: 'updated', ... })` |
| Approve action | After approval → `triggerStudentStatusEmail({ action: 'approved', ... })` |
| Reject action | After rejection → `triggerStudentStatusEmail({ action: 'rejected', ... })` |

**Important:** Email trigger calls must:
- Be called AFTER the primary operation succeeds (not inside the transaction).
- Be wrapped in try-catch — email failure must NOT cause the primary operation to fail.
- Be non-blocking where possible (fire-and-forget after the DB write).

### 3. Notification Mirror Integration

Modify **existing** notification actions to call the trigger service.

**File to modify:** `src/app/admin/notifications/_server/actions.ts` (or `service.ts`)

**Integration point:**

| Existing Method | Trigger Call |
|-----------------|-------------|
| Create notification action | After successful creation → Resolve recipient emails from `notificationRecipients` → `triggerNotificationEmail(...)` |

**Recipient resolution:**
1. Query `notificationRecipients` joined with `users` to get email addresses.
2. Filter out recipients without email addresses.
3. Pass the email list to the trigger function.

### 4. Recipient Resolution Utilities

**File:** `src/app/admin/mails/_server/trigger-service.ts` (private helpers)

#### `resolveStudentEmail(stdNo: string): Promise<string | null>`

Query the student + user tables to find the email address for a student number. Return null if no email found.

#### `resolveApproverEmails(statusId: number): Promise<string[]>`

For a student status creation, determine which approvers should be notified. Query the approval chain based on the status type and return their email addresses.

**Note:** These resolution functions import actions from the registry module (cross-module import per architecture rules). Do NOT re-implement student/user queries.

### 5. Deduplication Guard

To prevent sending duplicate emails when an operation is retried or triggered multiple times:

#### `isDuplicate(triggerType: string, triggerEntityId: string, windowMinutes: number = 5): Promise<boolean>`

Query `mailQueue` for entries matching `triggerType` + `triggerEntityId` created within the last `windowMinutes` minutes. If found, return `true` (skip sending).

### 6. Feature Flag

Add a simple guard to disable email triggers globally without code changes:

- Check for primary mail account existence before sending. If no primary is configured, all email triggers silently no-op.
- This means the email feature is "off by default" until an admin authorizes and sets a primary email.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/_server/trigger-service.ts` | Centralized email trigger logic |

**Files to modify:**

| File | Change |
|------|--------|
| `src/app/registry/student-statuses/_server/service.ts` or `actions.ts` | Add email trigger calls after create/update/approve/reject |
| `src/app/admin/notifications/_server/actions.ts` or `service.ts` | Add email trigger after notification creation |

## Validation Criteria

1. Creating a student status queues an email to approvers
2. Approving a student status queues an email to the student
3. Rejecting a student status queues an email to the student with reason
4. Creating a notification queues emails to all recipients with email addresses
5. No email sent if no primary mail account is configured (silent no-op)
6. Duplicate emails within 5 minutes are prevented
7. Email trigger failure does NOT cause the primary operation to fail
8. Existing student-status and notification functionality unchanged
9. `pnpm tsc --noEmit` passes
10. `pnpm lint:fix` passes

## Notes

- Cross-module imports: The trigger service imports from `@registry/student-statuses/_server/actions` for student/approver resolution. This follows the ownership rule — the registry module owns student data.
- Fire-and-forget pattern: After the primary DB operation, call the trigger in a `.catch(() => { /* log */ })` pattern or `void triggerX(...)` so the user doesn't wait for email queue insertion.
- When the notification system sends to many recipients (50+), consider batching the queue insertions to avoid long-running transactions.
- The trigger service should be imported only in server code (actions/services), never in client components.
