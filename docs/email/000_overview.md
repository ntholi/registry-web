# Email Module — Implementation Plan

## Overview

A centralized email integration for the Registry Web application using the Gmail API with OAuth 2.0 (no app passwords). Any user can authorize their Google email account; admins can then assign authorized emails as the **primary system sender** or give **department/user-level inbox access**. The system sends automated branded HTML emails (via react-email) for events like student-status changes and in-app notification mirroring, and provides a shared inbox experience for reading and replying to email threads.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth method | Gmail API + OAuth 2.0 | No app passwords; uses existing Google Cloud project |
| Email authorization | Any user authorizes via profile page | Decentralized — users grant access to their own email |
| Admin assignment | Centralized at `admin/mails/` | Admin controls primary sender, dept/user assignments |
| Primary email | One email designated for system sends | `registry@limkokwing.ac.ls` sends all automated emails |
| Inbox access | Per-email assignment to roles/users | Department members (mapped to roles) or specific users |
| Compose | Admin + assigned users with canCompose | Controlled via assignments for flexibility |
| Templates | react-email with university branding | Type-safe, composable, consistent look |
| Queue | DB table + Vercel Cron API route | Serverless-compatible rate limiting (2,000 msgs/day Workspace) |
| Inbox fetching | On-demand via Gmail API | No DB cache needed; TanStack Query handles client caching |
| Inbox polling | Client-side via TanStack Query (15 min) | No server-side cron needed; Vercel serverless friendly |
| Thread display | Gmail threaded conversations | Natural email reading experience |
| Attachments | Supported (R2 / generated PDFs) | Transcripts, receipts, documents |

## Features Summary

| Feature | Admin | Assigned Users | Regular Users |
|---------|-------|----------------|---------------|
| Authorize own email | ✓ | ✓ | ✓ |
| Revoke own email | ✓ | ✓ | ✓ |
| View all authorized emails | ✓ | — | — |
| Set primary email | ✓ | — | — |
| Assign email to role/users | ✓ | — | — |
| Remove email assignment | ✓ | — | — |
| Read inbox (assigned emails) | ✓ | ✓ | — |
| Reply to emails | ✓ | ✓ | — |
| Compose new emails | ✓ | ✓ (if assigned) | — |
| View sent email log | ✓ | — | — |
| Search inbox | ✓ | ✓ | — |
| Manage signatures | ✓ | — | — |
| View email queue status | ✓ | — | — |

## System Email Triggers

| Event | Description | Recipient |
|-------|-------------|-----------|
| Student status created/updated | Student submits or modifies a status request | Relevant approvers (auto-resolved) |
| Student status approved/rejected | Approver acts on status | Student (auto-resolved from profile) |
| Notification mirror | In-app notification triggers email copy | Notification recipients with emails |
| Manual admin email | Admin composes from shared inbox | Manual recipient(s) |

## Database Entities

```
┌──────────────────────┐     ┌──────────────────────────┐
│   mail_accounts      │     │   mail_account_assignments│
│──────────────────────│     │──────────────────────────│
│ id (PK)              │────<│ mailAccountId (FK)        │
│ userId (FK → users)  │     │ role (nullable)           │
│ email                │     │ userId (FK, nullable)     │
│ accessToken          │     │ canCompose               │
│ refreshToken         │     │ canReply                 │
│ tokenExpiresAt       │     │ createdAt                │
│ scope                │     └──────────────────────────┘
│ isPrimary            │
│ signature            │     ┌──────────────────────────┐
│ displayName          │     │   mail_queue             │
│ isActive             │     │──────────────────────────│
│ lastSyncAt           │     │ id (PK)                  │
│ createdAt            │     │ mailAccountId (FK)       │
│ updatedAt            │     │ to                       │
└──────────────────────┘     │ cc, bcc                  │
                             │ subject                  │
                             │ htmlBody                 │
                             │ textBody                 │
                             │ attachments (jsonb)      │
                             │ status (pending/sent/    │
                             │         failed/retry)    │
                             │ attempts                 │
                             │ error                    │
                             │ scheduledAt              │
                             │ sentAt                   │
                             │ triggerType              │
                             │ triggerEntityId          │
                             │ createdAt                │
                             └──────────────────────────┘

                             ┌──────────────────────────┐
                             │   mail_sent_log          │
                             │──────────────────────────│
                             │ id (PK)                  │
                             │ mailAccountId (FK)       │
                             │ queueId (FK, nullable)   │
                             │ gmailMessageId           │
                             │ to                       │
                             │ cc, bcc                  │
                             │ subject                  │
                             │ snippet                  │
                             │ status                   │
                             │ sentAt                   │
                             │ sentByUserId (FK)        │
                             │ triggerType              │
                             │ triggerEntityId          │
                             └──────────────────────────┘
```

## Directory Structure (Final)

```
src/app/admin/mails/
├── _schema/
│   ├── mailAccounts.ts
│   ├── mailAccountAssignments.ts
│   ├── mailQueue.ts
│   ├── mailSentLog.ts
│   └── relations.ts
├── _database/
│   └── index.ts                   # Barrel re-exports all schemas
├── _server/
│   └── trigger-service.ts         # Email trigger/send logic
├── _lib/
│   ├── types.ts
│   └── activities.ts
├── _templates/
│   ├── BaseLayout.tsx
│   ├── GenericEmail.tsx
│   ├── NotificationEmail.tsx
│   ├── StudentStatusEmail.tsx
│   └── render.ts
├── accounts/
│   ├── _lib/scopes.ts
│   ├── _server/
│   │   ├── actions.ts
│   │   ├── gmail-client.ts
│   │   ├── repository.ts
│   │   └── service.ts
│   ├── _components/
│   │   └── AssignmentSection.tsx   # Assignment management
│   ├── layout.tsx                  # ListLayout for mail accounts
│   ├── page.tsx                    # NothingSelected
│   └── [id]/
│       ├── page.tsx                # Account detail (overview + assignments)
│       └── edit/page.tsx           # Edit account form
├── assignments/
│   ├── _lib/types.ts
│   └── _server/
│       ├── actions.ts
│       ├── repository.ts
│       └── service.ts
├── inbox/
│   ├── _components/
│   │   ├── AccountSelector.tsx     # Mail account picker
│   │   ├── ComposeModal.tsx        # New email compose modal
│   │   └── ReplyEditor.tsx         # Reply composer
│   ├── layout.tsx                  # ListLayout for inbox threads
│   ├── page.tsx                    # NothingSelected
│   └── [threadId]/
│       └── page.tsx                # Thread conversation view
├── sent/
│   ├── layout.tsx                  # ListLayout for sent emails
│   ├── page.tsx                    # NothingSelected
│   └── [id]/
│       └── page.tsx                # Sent email detail
├── queue/
│   ├── layout.tsx                  # ListLayout for queue items
│   ├── page.tsx                    # Queue stats dashboard
│   └── [id]/
│       └── page.tsx                # Queue item detail (retry/cancel)
├── queues/
│   └── _server/
│       ├── actions.ts
│       ├── queue-processor.ts
│       └── repository.ts
├── settings/
│   └── page.tsx                    # Settings page (no ListLayout)
├── layout.tsx                      # Dashboard layout re-export
├── page.tsx                        # Redirect to inbox
└── index.ts

src/app/api/
├── auth/gmail/route.ts             # Gmail OAuth callback handler
└── mail/process-queue/route.ts     # Cron-triggered queue processor

src/app/auth/users/_components/
└── AuthorizeEmailSection.tsx       # User profile email auth section
```

## Implementation Steps

Update this table immediately after each task is completed so `000_overview.md` remains the source of truth for implementation progress.

| Step | File | Title | Status | Overview Update Requirement | Description |
|------|------|-------|--------|-----------------------------|-------------|
| 001 | [001_database-schema.md](001_database-schema.md) | Database Schema | Complete | Mark complete here as soon as the task is finished | All tables, enums, relations, indexes, migration |
| 002 | [002_gmail-oauth-integration.md](002_gmail-oauth-integration.md) | Gmail OAuth Integration | Complete | Mark complete here as soon as the task is finished | OAuth flow, token storage, scope management, Gmail API client |
| 003 | [003_email-account-management.md](003_email-account-management.md) | Email Account Management | Complete | Change to complete here when the task is finished | Repository, service, actions for mail accounts + assignments |
| 004 | [004_email-sending-queue.md](004_email-sending-queue.md) | Email Sending & Queue | Complete | Change to complete here when the task is finished | Send function, DB queue, rate limiter, cron API route |
| 005 | [005_email-templates.md](005_email-templates.md) | Email Templates | Complete | Change to complete here when the task is finished | react-email setup, base layout, templates for each trigger |
| 006 | [006_system-email-triggers.md](006_system-email-triggers.md) | System Email Triggers | Complete | Change to complete here when the task is finished | Hook into student-status, notifications; auto-send logic |
| 007 | [007_inbox-reading-threads.md](007_inbox-reading-threads.md) | Inbox, Threads & Reply | Complete | Change to complete here when the task is finished | Gmail read, thread display, reply, caching, search |
| 008 | [008_permissions-access-control.md](008_permissions-access-control.md) | Permissions & Access Control | Complete | Mark complete here as soon as the task is finished | Catalog entry, permission checks, role-based inbox access |
| 009 | [009_accounts-ui.md](009_accounts-ui.md) | Mail Accounts UI & Module Navigation | Pending | Change to complete here when the task is finished | Nav config, accounts ListLayout, account detail/edit, assignments |
| 010 | [010_inbox-compose-ui.md](010_inbox-compose-ui.md) | Inbox & Compose UI | Pending | Change to complete here when the task is finished | Inbox ListLayout, thread view, reply editor, compose modal |
| 011 | [011_sent-queue-settings-ui.md](011_sent-queue-settings-ui.md) | Sent Log, Queue & Settings UI | Pending | Change to complete here when the task is finished | Sent log ListLayout, queue ListLayout + stats, settings page |

## Business Rules

| Rule | Description |
|------|-------------|
| One primary email | Exactly one `mailAccount` can be `isPrimary = true` at a time |
| Primary for system sends | All automatic system emails sent through the primary account |
| User owns authorization | Users authorize emails from their profile; tokens tied to their Google account |
| Admin controls assignments | Admin assigns emails to roles or specific users |
| Role = department | Existing user roles (`registry`, `finance`, `academic`, etc.) act as departments |
| Compose controlled by assignment | Users assigned to an inbox can read + reply; compose requires `canCompose` on assignment or admin role |
| Revoke = both | Either the authorizing user or an admin can revoke/remove an email |
| Rate limit | Queue respects Gmail API limits (2,000 msgs/day, **500 recipients/msg via Gmail API**, 10,000 total recipients/day, 3,000 external recipients/day, 3,000 unique recipients/day) |
| On-demand inbox | Emails fetched directly from Gmail API; TanStack Query handles client caching |
| Token refresh | Auto-refresh Gmail tokens using google-auth-library `on('tokens')` listener |
| Token storage | Gmail tokens stored in mailAccounts table (matching existing Google integrations pattern) |

## Access Control

| Role | Capabilities |
|------|-------------|
| `admin` | Full access: manage all accounts, assignments, compose, view queue, view logs |
| Assigned user (by role) | Read inbox + reply for emails assigned to their role |
| Assigned user (specific) | Read inbox + reply for emails explicitly assigned to them |
| Any authenticated user | Authorize/revoke their own email from profile page |
| Unauthenticated | No access |

## Execution Order & Dependencies

```
001 Database Schema           ← No dependencies (run first)
    ↓
002 Gmail OAuth Integration   ← Depends on 001 (needs mailAccounts table)
    ↓
003 Email Account Management  ← Depends on 001, 002 (CRUD for accounts)
    ↓
004 Email Sending & Queue     ← Depends on 001, 002 (needs gmail-client + queue table)
    ↓
005 Email Templates           ← Depends on 004 (templates consumed by send function)
    ↓
006 System Email Triggers     ← Depends on 004, 005 (hooks into existing features)
    ↓
007 Inbox, Threads & Reply    ← Depends on 001, 002 (Gmail read + cache)
    ↓
008 Permissions & Access      ← Depends on 003 (assignment-based access)
    ↓
009 Accounts UI & Nav         ← Depends on 003, 008 (accounts ListLayout, nav config, assignments UI)
    ↓
010 Inbox & Compose UI        ← Depends on 007, 008, 009 (inbox ListLayout, thread view, compose)
    ↓
011 Sent, Queue & Settings    ← Depends on 004, 009 (sent log ListLayout, queue ListLayout, settings)
```

## Validation Command

```bash
pnpm tsc --noEmit && pnpm lint:fix
```
