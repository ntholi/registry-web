# Step 011: Sent Log, Queue & Settings UI

## Introduction

This final step adds the remaining admin sub-sections: the sent email log, the email queue management dashboard, and a settings page for module-wide configuration. The sent log and queue each use ListLayout-powered directories. The settings page does **not** use ListLayout.

## Context

- Steps 009–010 established the module navigation, accounts management, and inbox/compose UI.
- The sent log data comes from the `mail_sent_log` database table (not from Gmail API).
- The queue data comes from the `mail_queue` database table.
- Queue management is admin-only.
- Settings provides a centralized view for module-wide configuration (primary account, global signature defaults, etc.).

## Pre-Existing Infrastructure

| Item | Location | Status |
|------|----------|--------|
| Sent log actions | `./queues/_server/actions.ts` (`getSentLog`, `getDailyStats`) | Done |
| Queue actions | `./queues/_server/actions.ts` (`getQueueStatus`, `getQueueItems`, `retryFailedEmail`, `cancelQueuedEmail`) | Done |
| Account actions | `./accounts/_server/actions.ts` (`getMailAccounts`, `setPrimaryMailAccount`) | Done |

### Action Import Paths

| Import Path | Actions Used in This Step |
|-------------|--------------------------|
| `../queues/_server/actions` | `getSentLog`, `getDailyStats`, `getQueueStatus`, `getQueueItems`, `retryFailedEmail`, `cancelQueuedEmail` |
| `../accounts/_server/actions` | `getMailAccounts`, `setPrimaryMailAccount` |

## Requirements

### 1. Sent Log Layout (ListLayout)

**File:** `src/app/admin/mail/sent/layout.tsx`

**Type:** Client Component (`'use client'`)

Standard `ListLayout` wrapping the sent email log:

| Property | Value |
|----------|-------|
| `path` | `'/admin/mail/sent'` |
| `queryKey` | `['mail-sent-log']` |
| `getData` | `getSentLog` (returns `{ items, totalPages }` from `mail_sent_log` table) |
| `renderItem` | Sent email list item (see below) |
| `actionIcons` | None |

**List item display:**

| Field | Display |
|-------|---------|
| Recipient(s) | To address(es) (`label`) |
| Subject | Email subject, truncated (`description`) |
| Status badge | `rightSection`: Sent ✓ (green) / Failed ✗ (red) badge |
| Trigger type | Small badge: `system`, `manual`, `reply` |

### 2. Sent Log Default Page

**File:** `src/app/admin/mail/sent/page.tsx`

**Type:** Server Component

Displays `NothingSelected` with title `'Sent Emails'` when no email is selected.

### 3. Sent Email Detail Page

**File:** `src/app/admin/mail/sent/[id]/page.tsx`

**Type:** Server Component

Uses `DetailsView` with `DetailsViewHeader` and `DetailsViewBody`.

**Body fields** (`FieldView` components):

| Field | Value |
|-------|-------|
| To | Recipient email(s) |
| CC | CC emails (if any) |
| BCC | BCC emails (if any) |
| Subject | Full subject line |
| Status | Sent / Failed badge |
| Error | Error message (if failed) |
| Trigger Type | Badge: student_status_created, notification_mirror, manual, reply, etc. |
| Trigger Entity | Link to related entity (if applicable) |
| Sent By | User who triggered (or "System") |
| Sent At | Formatted date/time |
| Gmail Message ID | Reference ID from Gmail API |
| Snippet | Email preview text |

### 4. Queue Layout (ListLayout)

**File:** `src/app/admin/mail/queue/layout.tsx`

**Type:** Client Component (`'use client'`)

Standard `ListLayout` wrapping the queue items:

| Property | Value |
|----------|-------|
| `path` | `'/admin/mail/queue'` |
| `queryKey` | `['mail-queue']` |
| `getData` | `getQueueItems` (returns `{ items, totalPages }` from `mail_queue` table) |
| `renderItem` | Queue item list item (see below) |
| `actionIcons` | None |

**List item display:**

| Field | Display |
|-------|---------|
| Recipient | To address (`label`) |
| Subject | Email subject, truncated (`description`) |
| Status badge | `rightSection`: Pending (yellow) / Retry (orange) / Processing (blue) / Failed (red) |
| Attempts | Small text: `X/3` attempts |

### 5. Queue Default Page (with Stats Overview)

**File:** `src/app/admin/mail/queue/page.tsx`

**Type:** Client Component (`'use client'`)

Unlike other default pages, this one displays a stats overview dashboard when no specific queue item is selected. Uses `getQueueStatus()` with TanStack Query.

**Stats Cards (SimpleGrid):**

| Stat | Description | Color |
|------|-------------|-------|
| Pending | Emails waiting to be sent | Yellow |
| Processing | Currently being sent | Blue |
| Sent Today | Count for today | Green |
| Failed | Emails that failed after max retries | Red |
| Daily Quota | Used / 2,000 | Default |

Uses `getDailyStats()` for the daily quota information.

**Auto-refresh:** `refetchInterval: 30 * 1000` (30 seconds) to keep stats current.

### 6. Queue Item Detail Page

**File:** `src/app/admin/mail/queue/[id]/page.tsx`

**Type:** Server Component (with client actions)

Uses `DetailsView` with `DetailsViewHeader` and `DetailsViewBody`.

**Body fields** (`FieldView` components):

| Field | Value |
|-------|-------|
| To | Recipient email(s) |
| CC | CC emails (if any) |
| Subject | Full subject line |
| Status | Badge with current status |
| Attempts | `X / maxAttempts` |
| Error | Last error message (if any) |
| Trigger Type | Badge: system, manual, reply |
| Scheduled At | When processing will attempt next |
| Created At | When the email was enqueued |

**Actions:**
- "Retry" button (for failed items) → calls `retryFailedEmail(queueId)` via `useActionMutation`
- "Cancel" button (for pending items) → calls `cancelQueuedEmail(queueId)` with confirmation modal via `useActionMutation`

### 7. Settings Page (No ListLayout)

**File:** `src/app/admin/mail/settings/page.tsx`

**Type:** Server Component (or Client Component as needed)

**Important:** This page does NOT use `ListLayout`. It is a standalone settings page.

**No `layout.tsx`** needed for the settings directory — it inherits from the parent `mail/layout.tsx`.

**Sections:**

#### Primary Account

- Display the current primary mail account (email, display name, status).
- "Change Primary" button → opens a `Select` modal listing all active accounts.
- Calls `setPrimaryMailAccount(id)` on selection.

#### Queue Configuration (Display Only)

- Show current queue settings:
  - Max retries: 3
  - Daily quota: 2,000
  - Retry delays: Exponential backoff schedule
- These are display-only (hardcoded in the queue processor). If future configurability is needed, this section provides the foundation.

#### System Email Triggers (Display Only)

- Table listing all configured triggers:

| Trigger | Description | Status |
|---------|-------------|--------|
| Student Status Created | Email sent when student submits status request | Active |
| Student Status Updated | Email sent when student updates status request | Active |
| Student Status Approved | Email sent when approver approves status | Active |
| Student Status Rejected | Email sent when approver rejects status | Active |
| Notification Mirror | In-app notifications mirrored as email | Active |

- Display-only for now. Future: toggles to enable/disable individual triggers.

## Expected Files

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/admin/mail/sent/layout.tsx` | ListLayout for sent emails |
| `src/app/admin/mail/sent/page.tsx` | NothingSelected default |
| `src/app/admin/mail/sent/[id]/page.tsx` | Sent email detail view |
| `src/app/admin/mail/queue/layout.tsx` | ListLayout for queue items |
| `src/app/admin/mail/queue/page.tsx` | Queue stats dashboard |
| `src/app/admin/mail/queue/[id]/page.tsx` | Queue item detail with retry/cancel |
| `src/app/admin/mail/settings/page.tsx` | Settings page (no ListLayout) |

## Validation Criteria

1. `/admin/mail/sent` renders ListLayout with sent email log and search
2. Selecting a sent email shows full detail with all fields
3. Sent log list items show recipient, subject, status badge, trigger type
4. `/admin/mail/queue` renders ListLayout with queue items and stats overview
5. Queue stats cards show pending, processing, sent today, failed, daily quota
6. Queue stats auto-refresh every 30 seconds
7. Selecting a queue item shows full detail with retry/cancel actions
8. Retry button resets failed items to retry status
9. Cancel button removes pending items with confirmation
10. `/admin/mail/settings` renders settings page without ListLayout
11. Settings page shows primary account with ability to change
12. Settings page shows queue configuration and trigger status (display-only)
13. Dark mode: all components render correctly with good contrast
14. `pnpm tsc --noEmit` passes
15. `pnpm lint:fix` passes

## Notes

- Use `Badge` for all status indicators (sent/failed, pending/retry/processing, trigger types).
- All date/time formatting must use `@/shared/lib/utils/dates` utilities.
- All status colors should use `@/shared/lib/utils/colors`.
- The queue page is the only "default" page that shows content (stats dashboard) instead of `NothingSelected`. This is intentional since the queue overview is more useful than an empty state.
- The settings page intentionally has no `layout.tsx` file — it uses the parent `mail/layout.tsx` directly.
- The sent email detail view may reference attachments from composed emails (step 010). Show attachment names/sizes as display-only — do not provide download links since R2-stored attachments may be cleaned up after sending.
