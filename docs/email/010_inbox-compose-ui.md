# Step 010: Inbox & Compose UI

## Introduction

This step builds the inbox reading experience and email composition flow. The inbox lives at `/admin/mails/inbox/` as a ListLayout-powered directory listing email threads fetched from Gmail. Selecting a thread opens a conversation view with reply capability. A compose modal allows creating new emails.

## Context

- Step 009 established the module navigation (collapsible Mails parent with children routes) and the accounts management UI.
- The inbox fetches threads on-demand from the Gmail API — there is no local database cache for inbox messages.
- TanStack Query handles client-side caching with a 15-minute `refetchInterval` for automatic polling.
- Users see inbox threads for their accessible accounts (determined by `mailAccountAssignments` or admin role).
- The `getInbox`, `getThread`, `replyToThread` actions are in `./accounts/_server/actions.ts`.
- The `getAccessibleMailAccounts` action determines which accounts the current user can access.

## Pre-Existing Infrastructure

| Item | Location | Status |
|------|----------|--------|
| Inbox actions | `./accounts/_server/actions.ts` (`getInbox`, `getThread`, `getMessage`, `markRead`, `markUnread`, `replyToThread`, `downloadAttachment`) | Done |
| Access control | `requireInboxAccess` helper in accounts service | Done |
| Accessible accounts | `getAccessibleMailAccounts()` action | Done |
| Queue enqueue | `./queues/_server/actions.ts` (for compose sends) | Done |

### Action Import Paths

| Import Path | Actions Used in This Step |
|-------------|--------------------------|
| `../accounts/_server/actions` | `getAccessibleMailAccounts`, `getInbox`, `getThread`, `getMessage`, `markRead`, `markUnread`, `replyToThread`, `downloadAttachment` |
| `../queues/_server/actions` | `enqueueEmail` (or equivalent for manual compose) |

## Requirements

### 1. Account Selector

**File:** `src/app/admin/mails/inbox/_components/AccountSelector.tsx`

**Type:** Client Component (`'use client'`)

A `Select` component allowing the user to pick which mail account's inbox to view.

**Behavior:**
- Fetches accounts via `getAccessibleMailAccounts()` with TanStack Query (`queryKey: ['accessible-mail-accounts']`).
- Default selection: the first account in the list (or the primary account if accessible).
- On change: updates the selected account and triggers inbox refetch.
- Stored in a shared state (React context or URL search param `?account=<id>`) so the ListLayout's `getData` can use it.
- If user has access to only one account, the selector is hidden.

### 2. Inbox Layout (ListLayout)

**File:** `src/app/admin/mails/inbox/layout.tsx`

**Type:** Client Component (`'use client'`)

Standard `ListLayout` wrapping the inbox thread list:

| Property | Value |
|----------|-------|
| `path` | `'/admin/mails/inbox'` |
| `queryKey` | `['inbox-threads', selectedAccountId]` |
| `getData` | Wrapper calling `getInbox(selectedAccountId, { page, search })` |
| `renderItem` | Thread list item (see below) |
| `actionIcons` | `[<ComposeModal key="compose" />, <AccountSelector key="account" />]` or equivalent placement |

**Thread list item display:**

| Field | Display |
|-------|---------|
| Sender | From name or email (`label`) — bold if unread |
| Subject + snippet | Subject line with preview text (`description`) |
| Date | Relative formatting: today → time, this week → day, older → date |
| Unread indicator | Bold dot (●) for unread threads |
| Attachment indicator | Paperclip icon (📎) for threads with attachments |

**Important:** Since `getInbox` returns Gmail API data (not from the database), the `getData` function must transform the Gmail thread list response into the `{ items, totalPages }` format expected by `ListLayout`. The `getInbox` action should already return this shape.

**Polling:** Use TanStack Query's `refetchInterval: 15 * 60 * 1000` (15 minutes) for automatic inbox refresh.

### 3. Inbox Default Page

**File:** `src/app/admin/mails/inbox/page.tsx`

**Type:** Server Component

Displays `NothingSelected` with title `'Inbox'` when no thread is selected.

### 4. Thread Detail Page

**File:** `src/app/admin/mails/inbox/[threadId]/page.tsx`

**Type:** Client Component (`'use client'`)

Loads the full thread via `getThread(accountId, threadId)` using TanStack Query.

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ ← Back to Inbox                                  │
│                                                  │
│ Registration Query                     3 messages│
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌───────────────────────────────────────────┐   │
│ │ John Doe <john@gmail.com>                  │   │
│ │ To: registry@limkokwing.ac.ls              │   │
│ │ Mar 15, 2026 10:30 AM                      │   │
│ │                                            │   │
│ │ Hello, I have a question about the         │   │
│ │ semester registration process...           │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ ┌───────────────────────────────────────────┐   │
│ │ Registry <registry@limkokwing.ac.ls>      │   │
│ │ To: john@gmail.com                         │   │
│ │ Mar 15, 2026 11:00 AM                      │   │
│ │                                            │   │
│ │ Thank you for reaching out. The            │   │
│ │ registration period opens on...            │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ ┌───────────────────────────────────────────┐   │
│ │ [Reply editor]                             │   │
│ │                                            │   │
│ │                              [Send Reply]  │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Messages displayed chronologically (oldest first).
- Each message shows: sender, recipient, timestamp, body.
- HTML body rendered in a sandboxed `<iframe>` with `srcDoc` and `sandbox="allow-same-origin"` for complete style isolation and script execution prevention (never use `dangerouslySetInnerHTML` — XSS risk).
- Attachments shown with download links (call `downloadAttachment` action).
- Older messages collapsed by default (show only first + last, expandable).
- Auto-mark as read when thread is opened via `markRead` action.
- Reply editor at the bottom (only if user has `canReply` permission for the account).
- "Back to Inbox" link navigates to `/admin/mails/inbox`.

### 5. Reply Editor

**File:** `src/app/admin/mails/inbox/_components/ReplyEditor.tsx`

**Type:** Client Component (`'use client'`)

Embedded at the bottom of the thread detail page.

| Component | Implementation |
|-----------|---------------|
| Editor | Mantine `Textarea` (plain text) or `RichTextEditor` if available |
| Send button | `Button` with loading state |

**On send:**
1. Call `replyToThread(accountId, threadId, htmlBody)` via `useActionMutation`.
2. Show success notification.
3. Invalidate thread query for fresh data.
4. Clear the editor.

**Visibility:** Only shown if the current user has `canReply` permission for the selected account (or is admin).

### 6. Compose Modal

**File:** `src/app/admin/mails/inbox/_components/ComposeModal.tsx`

**Type:** Client Component (`'use client'`)

Self-contained modal for composing new emails:

| Field | Component |
|-------|-----------|
| From | `Select` — choose from accessible mail accounts (with `canCompose` permission) |
| To | `TextInput` — recipient email(s), comma-separated |
| CC | `TextInput` — CC emails (collapsible, hidden by default) |
| BCC | `TextInput` — BCC emails (collapsible, hidden by default) |
| Subject | `TextInput` |
| Body | `Textarea` or `RichTextEditor` |
| Attachments | File upload (stored to R2, referenced in email) |

**Trigger button:** "Compose" `ActionIcon` or `Button` in the inbox layout's `actionIcons` or page header. Visible only to users with `canCompose` assignment or admin role.

**On send:**
1. Enqueue via queue actions with `triggerType: 'manual'`.
2. Close modal, show success notification.
3. Invalidate sent log query with `queryKey: ['mail-sent-log']`.

**Attachment handling:**
- Upload to R2 first using `uploadFile()` from `@/core/integrations/storage`.
- Reference the R2 key in the email's attachments array.
- Use `StoragePaths` for path generation.

## Expected Files

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/admin/mails/inbox/layout.tsx` | ListLayout for inbox threads |
| `src/app/admin/mails/inbox/page.tsx` | NothingSelected default |
| `src/app/admin/mails/inbox/[threadId]/page.tsx` | Thread conversation view |
| `src/app/admin/mails/inbox/_components/AccountSelector.tsx` | Mail account picker |
| `src/app/admin/mails/inbox/_components/ReplyEditor.tsx` | Reply composer |
| `src/app/admin/mails/inbox/_components/ComposeModal.tsx` | New email modal |

## Validation Criteria

1. `/admin/mails/inbox` renders ListLayout with inbox threads for the selected account
2. Account selector appears when user has access to multiple accounts
3. Thread list items show sender, subject, date, unread indicator, attachment icon
4. Clicking a thread navigates to `/admin/mails/inbox/[threadId]`
5. Thread detail page shows all messages chronologically with HTML in `<iframe>` (`srcDoc`)
6. Attachments show download links that call `downloadAttachment`
7. Reply editor appears for users with `canReply` permission
8. Reply sends successfully and updates the thread view
9. Compose modal allows sending new emails (only for `canCompose` users/admin)
10. Compose modal enqueues email and shows success notification
11. Inbox auto-polls every 15 minutes via TanStack Query `refetchInterval`
12. Dark mode: all components render correctly with good contrast
13. `pnpm tsc --noEmit` passes
14. `pnpm lint:fix` passes

## Notes

- The thread detail page uses the `accountId` from the account selector context (URL param or React context) combined with the `threadId` from the route.
- HTML email rendering must use a sandboxed `<iframe>` with `srcDoc` and `sandbox="allow-same-origin"` for complete style isolation and script execution prevention. Never use `dangerouslySetInnerHTML` — this is an XSS risk. The `sandbox` attribute ensures that even if malicious HTML is present, JavaScript cannot execute in the iframe context.
- For the compose modal's file attachments: upload to R2 first, then reference the R2 key in the email's attachments. Add a path builder to `StoragePaths` in `storage-utils.ts` for mail attachments.
- All date/time formatting must use `@/shared/lib/utils/dates` utilities.
- Search in the inbox list uses Gmail query syntax (subject, from, free text) passed through to the `getInbox` action's search parameter.
