# Step 009: Admin UI & Navigation

## Introduction

This final step assembles the full admin UI for the email module: the mail accounts list page, detail pages with inbox tabs, compose modal, reply editor, sent log table, queue status view, and the user profile authorization section. All components use Mantine v8 exclusively (no custom CSS).

## Context

- Previous steps created all backend layers: schema, Gmail client, services, actions, templates, triggers, permissions.
- The UI follows the existing app patterns: `ListLayout` for lists, `DetailsView` for detail pages, `Form` for editing.
- Inbox uses TanStack Query with 15-minute `refetchInterval` for client-side polling.
- All pages are under `src/app/admin/mails/`.
- The user profile section (authorize email) is in `src/app/auth/users/_components/`.

## Requirements

### 1. Navigation

**File to modify:** `src/app/admin/admin.config.ts`

Add the mails entry to the admin navigation:

| Property | Value |
|----------|-------|
| `label` | `'Mails'` |
| `href` | `'/admin/mails'` |
| `icon` | `IconMail` (from Tabler) |
| `permissions` | `[{ resource: 'mails', action: 'read' }]` |

Position: After "Notifications" in the navigation list.

### 2. Mail Accounts List Page

**File:** `src/app/admin/mails/page.tsx`

**Type:** Server Component (RSC)

Uses `ListLayout` to display all authorized email accounts:

| Field | Display |
|-------|---------|
| Email address | Primary text |
| Display name | Secondary text |
| Authorized by | User name who authorized |
| Status badges | `isPrimary` badge, `isActive` status |
| Assignment count | Number of role/user assignments |

**Features:**
- Search by email address or display name.
- `NewLink` not used (accounts are created via OAuth, not a form).
- Each list item links to `/admin/mails/[id]`.

### 3. Mail Account Detail Page

**File:** `src/app/admin/mails/[id]/page.tsx`

**Type:** Server Component

Uses `DetailsView` with tabs:

#### Tab 1: Overview

`DetailsViewBody` with `FieldView` components:

| Field | Value |
|-------|-------|
| Email | Account email address |
| Display Name | Editable display name |
| Authorized By | User who authorized (linked to user profile) |
| Status | Active/Inactive toggle (`StatusToggle`) |
| Primary | Primary badge / "Set as Primary" button |
| Signature | Current signature preview |
| Last Sync | Timestamp of last inbox sync |
| Authorized | Creation date |

**Actions:**
- "Set as Primary" button (admin only, shows confirmation modal).
- "Edit" link → `/admin/mails/[id]/edit`.
- `DeleteButton` for revoking the account.

#### Tab 2: Inbox

The main inbox view (see §7 below).

#### Tab 3: Sent Log

Table of emails sent from this account (see §9 below).

#### Tab 4: Assignments

List of current assignments with ability to add/remove (see §5 below).

#### Tab 5: Queue (admin only)

Queue status for this account (see §10 below).

### 4. Mail Account Edit Page

**File:** `src/app/admin/mails/[id]/edit/page.tsx`

Uses the `Form` component:

| Field | Type | Description |
|-------|------|-------------|
| Display Name | `TextInput` | Name shown in "From" header |
| Signature | `Textarea` / rich text | HTML signature for outgoing emails |
| Active | `Switch` | Enable/disable the account |

Saves via `updateMailAccount(id, data)` action.

### 5. Assignments Section

**File:** `src/app/admin/mails/_components/AssignmentSection.tsx`

**Type:** Client Component (`'use client'`)

Displayed in the Assignments tab of the detail page.

**Current Assignments Table:**

| Column | Description |
|--------|-------------|
| Type | "Role" or "User" |
| Assignee | Role name (e.g., "Registry") or user name + email |
| Can Reply | Checkbox icon (✓/✗) |
| Can Compose | Checkbox icon (✓/✗) |
| Actions | Remove button |

**Add Assignment Form:**

Two modes (segmented control toggle):

**Assign to Role:**
| Field | Component | Options |
|-------|-----------|---------|
| Role | `Select` | List of app roles (registry, finance, academic, etc.) |
| Can Reply | `Switch` | Default: true |
| Can Compose | `Switch` | Default: false |

**Assign to User:**
| Field | Component | Options |
|-------|-----------|---------|
| User | `Select` (searchable) | Users list, search by name/email |
| Can Reply | `Switch` | Default: true |
| Can Compose | `Switch` | Default: false |

Both modes use `assignToRole()` / `assignToUser()` server actions.

### 6. Authorize Email Button (User Profile)

**File:** `src/app/auth/users/_components/AuthorizeEmailSection.tsx`

**Type:** Client Component

Embedded in the user's profile page:

**Layout:**
```
┌────────────────────────────────────────┐
│ Authorized Emails                      │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📧 registry@limkokwing.ac.ls      │ │
│ │    Primary · Active                │ │
│ │    Authorized on Mar 15, 2026      │ │
│ │                          [Revoke]  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 📧 john@limkokwing.ac.ls          │ │
│ │    Active                          │ │
│ │    Authorized on Mar 18, 2026      │ │
│ │                          [Revoke]  │ │
│ └────────────────────────────────────┘ │
│                                        │
│        [+ Authorize New Email]         │
└────────────────────────────────────────┘
```

- "Authorize New Email" navigates to `/api/auth/gmail?returnUrl=/auth/users/[userId]`.
- "Revoke" calls `deleteMailAccount(id)` with confirmation modal.
- Uses TanStack Query for the list with `queryKey: ['my-mail-accounts']`.

### 7. Inbox View

**File:** `src/app/admin/mails/_components/InboxView.tsx`

**Type:** Client Component

Displayed in the Inbox tab of the mail account detail page.

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ [Search] [🔄 Sync]                              │
├─────────────────────────────────────────────────┤
│                                                  │
│ ● John Doe <john@gmail.com>            10:30 AM │
│   Re: Registration Query                        │
│   I have a question about the semester...   📎  │
│                                                  │
│   Jane Smith <jane@gmail.com>          Mar 17   │
│   Payment Confirmation                           │
│   Thank you for your payment of...              │
│                                                  │
│ ● Finance Dept <finance@limk...>       Mar 16   │
│   Budget Report Q1                               │
│   Please find attached the quarterly...     📎  │
│                                                  │
├─────────────────────────────────────────────────┤
│ ◀ 1 2 3 ▶                                       │
└─────────────────────────────────────────────────┘
```

**Features:**
- Bold dot (●) for unread threads.
- Paperclip icon (📎) for threads with attachments.
- Relative date formatting (today → time, this week → day, older → date).
- Click a thread → opens `ThreadView`.
- Search bar with basic Gmail query support (subject, from, free text).
- Sync button triggers `syncInbox()` action.
- TanStack Query with `refetchInterval: 15 * 60 * 1000` (15 minutes).
- Pagination via `Pagination` component.

### 8. Thread View

**File:** `src/app/admin/mails/_components/ThreadView.tsx`

**Type:** Client Component

Opened when a thread is clicked from `InboxView`.

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
│ │ John Doe <john@gmail.com>                  │   │
│ │ To: registry@limkokwing.ac.ls              │   │
│ │ Mar 17, 2026 10:30 AM                      │   │
│ │                                            │   │
│ │ Thank you! One more question...            │   │
│ │                                            │   │
│ │ 📎 registration_form.pdf (125 KB)         │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ ┌───────────────────────────────────────────┐   │
│ │ [Reply editor - rich text]                 │   │
│ │                                            │   │
│ │                              [Send Reply]  │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Messages displayed chronologically (oldest first).
- Each message shows: sender, recipient, timestamp, body.
- HTML body rendered safely in an iframe or `dangerouslySetInnerHTML` with sanitized content.
- Attachments shown with download links (call `downloadAttachment` action).
- Older messages collapsed by default (show only first + last, expandable).
- Auto-mark as read when thread is opened.
- Reply editor at the bottom (only if user has `canReply` permission).

### 9. Reply Editor

**File:** `src/app/admin/mails/_components/ReplyEditor.tsx`

**Type:** Client Component

A simple rich text editor for composing replies:

| Component | Implementation |
|-----------|---------------|
| Editor | Mantine `Textarea` (or `RichTextEditor` if available) |
| Send button | `Button` with loading state |

On send:
1. Call `replyToThread(accountId, threadId, htmlBody)`.
2. Show success notification.
3. Optimistically add reply to thread view.
4. Invalidate thread query for fresh data.

### 10. Compose Modal

**File:** `src/app/admin/mails/_components/ComposeModal.tsx`

**Type:** Client Component

Self-contained modal for composing new emails (admin only):

| Field | Component |
|-------|-----------|
| From | `Select` — choose from accessible mail accounts |
| To | `TextInput` — recipient email(s), comma-separated |
| CC | `TextInput` — CC emails (collapsible) |
| BCC | `TextInput` — BCC emails (collapsible) |
| Subject | `TextInput` |
| Body | `Textarea` or `RichTextEditor` |
| Attachments | File upload (stored to R2, referenced in email) |

Trigger button: "Compose" `ActionIcon` in the page header (visible only to users with `canCompose`).

On send:
1. Call `sendEmail({ ..., immediate: true, triggerType: 'manual' })`.
2. Close modal, show success notification.
3. Invalidate sent log query.

### 11. Sent Log Table

**File:** `src/app/admin/mails/_components/SentLogTable.tsx`

**Type:** Client Component

Table showing sent emails for an account:

| Column | Content |
|--------|---------|
| To | Recipient(s) |
| Subject | Email subject (truncated) |
| Status | Sent / Failed badge |
| Trigger | Type badge (system, manual, reply) |
| Sent At | Formatted date/time |
| Sent By | User who triggered (or "System") |

Features:
- Paginated via `Pagination`.
- Search by subject or recipient.
- Click row for details (Popover or modal with full info).

### 12. Queue Status View (Admin Only)

**File:** `src/app/admin/mails/_components/QueueStatusView.tsx`

**Type:** Client Component

Dashboard showing queue health:

**Stats Cards:**
| Stat | Description |
|------|-------------|
| Pending | Emails waiting to be sent |
| Processing | Currently being sent |
| Sent Today | Count for today |
| Failed | Emails that failed after max retries |
| Daily Quota | Used / 2,000 |

**Queue Items Table:**
| Column | Content |
|--------|---------|
| To | Recipient |
| Subject | Subject line |
| Status | Pending / Retry / Failed badge |
| Attempts | X / 3 |
| Scheduled | When processing will attempt |
| Actions | Retry (for failed), Cancel (for pending) |

### 13. Layout

**File:** `src/app/admin/mails/layout.tsx`

Standard admin module layout with `ListLayout` integration:

```tsx
export default function MailsLayout({ children }) {
  return (
    <ListLayout
      path="/admin/mails"
      getData={getMailAccounts}
      renderItem={(account) => (
        <ListItem
          id={account.id}
          label={account.email}
          description={account.displayName}
        />
      )}
    >
      {children}
    </ListLayout>
  );
}
```

### 14. Component Hierarchy

```
layout.tsx (ListLayout)
├── page.tsx (NothingSelected - default view)
└── [id]/
    ├── page.tsx (DetailsView with tabs)
    │   ├── Tab: Overview (FieldViews)
    │   ├── Tab: Inbox (InboxView)
    │   │   └── ThreadView (opened inline or modal)
    │   │       └── ReplyEditor
    │   ├── Tab: Sent Log (SentLogTable)
    │   ├── Tab: Assignments (AssignmentSection)
    │   └── Tab: Queue (QueueStatusView, admin only)
    └── edit/
        └── page.tsx (Form)
```

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/layout.tsx` | ListLayout wrapper |
| `src/app/admin/mails/page.tsx` | Default empty state |
| `src/app/admin/mails/[id]/page.tsx` | Account detail with tabs |
| `src/app/admin/mails/[id]/edit/page.tsx` | Edit account form |
| `src/app/admin/mails/_components/InboxView.tsx` | Inbox thread list |
| `src/app/admin/mails/_components/ThreadView.tsx` | Thread conversation |
| `src/app/admin/mails/_components/ReplyEditor.tsx` | Reply composer |
| `src/app/admin/mails/_components/ComposeModal.tsx` | New email modal |
| `src/app/admin/mails/_components/SentLogTable.tsx` | Sent email log |
| `src/app/admin/mails/_components/QueueStatusView.tsx` | Queue dashboard |
| `src/app/admin/mails/_components/AssignmentSection.tsx` | Assignment management |
| `src/app/auth/users/_components/AuthorizeEmailSection.tsx` | Profile email auth |
| `src/app/admin/admin.config.ts` | Modified: add mails nav |

## Validation Criteria

1. Mails nav item visible for users with `mails:read` permission
2. Mail accounts list displays with search and pagination
3. Account detail page shows all tabs correctly
4. Overview tab shows account info with edit/delete/set-primary actions
5. Inbox tab displays threaded emails with search and sync
6. Thread view shows full conversation with messages and attachments
7. Reply editor sends reply and updates thread view
8. Compose modal allows admin to send new emails
9. Sent log shows all outbound emails with filtering
10. Queue status shows current queue health (admin only)
11. Assignments tab allows adding/removing role and user assignments
12. User profile shows authorized emails with authorize/revoke
13. Dark mode: all components render correctly with good contrast
14. Mobile responsive: inbox and thread views usable on smaller screens
15. `pnpm tsc --noEmit` passes
16. `pnpm lint:fix` passes

## Notes

- Use `Tabs` from Mantine for the detail page tab navigation.
- Use `Badge` for status indicators (primary, active, sent/failed, trigger types).
- Use `ActionIcon` for inline actions (sync, reply, etc.).
- Use `Indicator` on the Inbox tab label to show unread count.
- The thread view's HTML email rendering should use an `<iframe>` with `srcDoc` for complete style isolation from the app's CSS. This prevents email styles from affecting the app layout.
- For the compose modal's file attachments: upload to R2 first using `uploadFile()`, then reference the R2 key in the email's attachments array. Files are fetched from R2 at send time by the queue processor.
- All date/time formatting must use `@/shared/lib/utils/dates` utilities.
- All status colors/icons should use `@/shared/lib/utils/colors` and `@/shared/lib/utils/status.tsx`.
