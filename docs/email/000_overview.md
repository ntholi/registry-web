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
├── _server/
│   ├── repository.ts
│   ├── service.ts
│   ├── actions.ts
│   ├── gmail-client.ts          # Gmail API wrapper (OAuth, send, read, threads)
│   └── queue-processor.ts       # Queue processing logic
├── _components/
│   ├── MailAccountList.tsx       # List all authorized emails
│   ├── MailAccountForm.tsx       # Assignment management
│   ├── AuthorizeEmailButton.tsx  # OAuth trigger button
│   ├── InboxView.tsx             # Threaded inbox
│   ├── ThreadView.tsx            # Single thread conversation
│   ├── ComposeModal.tsx          # Admin compose modal
│   ├── ReplyEditor.tsx           # Reply editor
│   ├── SentLogTable.tsx          # Sent email audit table
│   └── QueueStatusView.tsx       # Queue dashboard
├── _lib/
│   ├── types.ts                  # Zod schemas, types
│   ├── activities.ts             # Activity fragment
│   └── scopes.ts                 # Gmail API scopes
├── _templates/
│   ├── BaseLayout.tsx            # Shared email layout (react-email)
│   ├── StudentStatusEmail.tsx    # Student status notification
│   └── NotificationEmail.tsx     # Generic notification mirror
├── page.tsx                      # Mail accounts list
├── [id]/
│   ├── page.tsx                  # Mail account details + inbox
│   └── edit/page.tsx             # Edit assignments/settings
├── layout.tsx
└── index.ts

src/app/api/
├── auth/gmail/route.ts           # Gmail OAuth callback handler
└── mail/process-queue/route.ts   # Cron-triggered queue processor

src/app/auth/users/_components/
└── AuthorizeEmailSection.tsx     # User profile email auth section
```

## Implementation Steps

Update this table immediately after each task is completed so `000_overview.md` remains the source of truth for implementation progress.

| Step | File | Title | Status | Overview Update Requirement | Description |
|------|------|-------|--------|-----------------------------|-------------|
| 001 | [001_database-schema.md](001_database-schema.md) | Database Schema | Complete | Mark complete here as soon as the task is finished | All tables, enums, relations, indexes, migration |
| 002 | [002_gmail-oauth-integration.md](002_gmail-oauth-integration.md) | Gmail OAuth Integration | Complete | Mark complete here as soon as the task is finished | OAuth flow, token storage, scope management, Gmail API client |
| 003 | [003_email-account-management.md](003_email-account-management.md) | Email Account Management | Pending | Change to complete here when the task is finished | Repository, service, actions for mail accounts + assignments |
| 004 | [004_email-sending-queue.md](004_email-sending-queue.md) | Email Sending & Queue | Pending | Change to complete here when the task is finished | Send function, DB queue, rate limiter, cron API route |
| 005 | [005_email-templates.md](005_email-templates.md) | Email Templates | Pending | Change to complete here when the task is finished | react-email setup, base layout, templates for each trigger |
| 006 | [006_system-email-triggers.md](006_system-email-triggers.md) | System Email Triggers | Pending | Change to complete here when the task is finished | Hook into student-status, notifications; auto-send logic |
| 007 | [007_inbox-reading-threads.md](007_inbox-reading-threads.md) | Inbox, Threads & Reply | Pending | Change to complete here when the task is finished | Gmail read, thread display, reply, caching, search |
| 008 | [008_permissions-access-control.md](008_permissions-access-control.md) | Permissions & Access Control | Pending | Change to complete here when the task is finished | Catalog entry, permission checks, role-based inbox access |
| 009 | [009_admin-ui.md](009_admin-ui.md) | Admin UI & Navigation | Pending | Change to complete here when the task is finished | Full admin pages, nav config, inbox tabs, compose, sent log |

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
| Rate limit | Queue respects Gmail API limits (2,000 msgs/day, 500 recipients/msg via API, 10,000 total recipients/day) |
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
009 Admin UI & Navigation     ← Depends on all above (assembles full UI)
```

## Validation Command

```bash
pnpm tsc --noEmit && pnpm lint:fix
```
