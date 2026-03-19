# Step 009: Mail Accounts UI & Module Navigation

## Introduction

This step sets up the admin mails module navigation structure and the mail accounts management sub-section. It replaces the single-tab detail page approach with ListLayout-powered directory routes (`/admin/mail/accounts/`, `/admin/mail/inbox/`, etc.), each functioning as an independent sub-feature. This step focuses on the accounts management and the top-level navigation wiring.

## Context

- Previous steps created all backend layers: schema, Gmail client, services, actions, templates, triggers, permissions.
- The mails module currently has a flat `{ label: 'Mail', href: '/admin/mail' }` entry in `admin.config.ts`.
- This step converts it to a collapsible parent with children routes for each sub-section.
- Each sub-section (`accounts`, `inbox`, `sent`, `queue`, `settings`) lives in its own directory with its own `layout.tsx` using `ListLayout` — except `settings` which has no `ListLayout`.
- No `new/` route for accounts — accounts are created via OAuth authorization, not a form.

## Pre-Existing Infrastructure

| Item | Location | Status |
|------|----------|--------|
| Navigation entry | `src/app/admin/admin.config.ts` (flat Mail link) | Needs update |
| Permission resource | `'mails'` in `src/core/auth/permissions.ts` RESOURCES | Done |
| Activity fragment | `src/app/admin/_lib/activities.ts` | Done |
| Activity registry | `src/app/admin/activity-tracker/_lib/registry.ts` | Done |
| AuthorizeEmailSection | `src/app/auth/users/_components/AuthorizeEmailSection.tsx` | Done |
| Account actions | `./accounts/_server/actions.ts` | Done |
| Assignment actions | `./assignments/_server/actions.ts` | Done |

### Action Import Paths

| Import Path | Actions Used in This Step |
|-------------|--------------------------|
| `../accounts/_server/actions` | `getMailAccounts`, `getMailAccount`, `updateMailAccount`, `deleteMailAccount`, `setPrimaryMailAccount` |
| `../assignments/_server/actions` | `getAssignments`, `assignToRole`, `assignToUser`, `removeAssignment` |

## Requirements

### 1. Navigation Update

**File:** `src/app/admin/admin.config.ts`

Convert the flat Mail nav item into a collapsible parent with children:

```typescript
{
  label: 'Mail',
  href: '/admin/mail',
  icon: IconMail,
  collapsed: true,
  permissions: [{ resource: 'mails', action: 'read' }],
  children: [
    { label: 'Inbox', href: '/admin/mail/inbox', icon: IconInbox },
    { label: 'Accounts', href: '/admin/mail/accounts', icon: IconUserCheck },
    { label: 'Sent', href: '/admin/mail/sent', icon: IconSend },
    { label: 'Queue', href: '/admin/mail/queue', icon: IconStack2, roles: ['admin'] },
    { label: 'Settings', href: '/admin/mail/settings', icon: IconSettings, roles: ['admin'] },
  ],
}
```

Queue and Settings are admin-only. All children inherit the parent's `permissions`.

### 2. Module Layout

**File:** `src/app/admin/mail/layout.tsx`

Re-exports the dashboard layout (same pattern as other top-level modules):

```typescript
export { default, generateMetadata } from '../../dashboard/layout';
```

### 3. Module Default Page

**File:** `src/app/admin/mail/page.tsx`

**Type:** Server Component

Redirects to `/admin/mail/inbox` using Next.js `redirect()`. The inbox is the primary view users see when clicking "Mail" in the sidebar.

### 4. Accounts Layout (ListLayout)

**File:** `src/app/admin/mail/accounts/layout.tsx`

**Type:** Client Component (`'use client'`)

Standard `ListLayout` wrapping the accounts list:

| Property | Value |
|----------|-------|
| `path` | `'/admin/mail/accounts'` |
| `queryKey` | `['mail-accounts']` |
| `getData` | `getMailAccounts` (from `../accounts/_server/actions`) |
| `renderItem` | `<ListItem id={account.id} label={account.email} description={account.displayName} />` |
| `actionIcons` | None (accounts created via OAuth, not a form) |

**List item display:**

| Field | Display |
|-------|---------|
| Email address | Primary text (`label`) |
| Display name | Secondary text (`description`) |
| Status badges | `rightSection`: `isPrimary` badge (optional), `isActive` status indicator |

### 5. Accounts Default Page

**File:** `src/app/admin/mail/accounts/page.tsx`

**Type:** Server Component

Displays `NothingSelected` with title `'Mail Accounts'` when no account is selected.

### 6. Account Detail Page

**File:** `src/app/admin/mail/accounts/[id]/page.tsx`

**Type:** Server Component

Uses `DetailsView` with `DetailsViewHeader` and `DetailsViewBody`.

**Header actions:**
- "Edit" link → `/admin/mail/accounts/[id]/edit`
- `DeleteButton` for revoking the account

**Body fields** (`FieldView` components):

| Field | Value |
|-------|-------|
| Email | Account email address |
| Display Name | Display name |
| Authorized By | User who authorized (linked to user profile) |
| Status | Active/Inactive (`StatusToggle`) |
| Primary | Primary badge / "Set as Primary" button |
| Signature | Current signature preview |
| Last Sync | Timestamp of last inbox sync (formatted via `@/shared/lib/utils/dates`) |
| Authorized | Creation date (formatted via `@/shared/lib/utils/dates`) |

**Set as Primary button:**
- Admin only.
- Shows confirmation modal before calling `setPrimaryMailAccount(id)`.
- Uses `useActionMutation`.

**Assignments Section:**
- Displayed below account fields.
- Renders `AssignmentSection` component (see section 8).

### 7. Account Edit Page

**File:** `src/app/admin/mail/accounts/[id]/edit/page.tsx`

**Type:** Server Component

Uses the `Form` component:

| Field | Type | Description |
|-------|------|-------------|
| Display Name | `TextInput` | Name shown in "From" header |
| Signature | `Textarea` | HTML signature for outgoing emails |
| Active | `Switch` | Enable/disable the account |

Saves via `updateMailAccount(id, data)` action.

### 8. Assignments Section

**File:** `src/app/admin/mail/accounts/_components/AssignmentSection.tsx`

**Type:** Client Component (`'use client'`)

Displayed in the account detail page.

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
| Role | `Select` | List of app roles |
| Can Reply | `Switch` | Default: true |
| Can Compose | `Switch` | Default: false |

**Assign to User:**
| Field | Component | Options |
|-------|-----------|---------|
| User | `Select` (searchable) | Users list, search by name/email |
| Can Reply | `Switch` | Default: true |
| Can Compose | `Switch` | Default: false |

Uses `assignToRole()` / `assignToUser()` / `removeAssignment()` server actions with `useActionMutation`.

### 9. Barrel Exports

**File:** `src/app/admin/mail/_database/index.ts`

Re-exports all schemas from `../_schema/`:
- `mailAccounts`
- `mailAccountAssignments`
- `mailQueue`
- `mailSentLog`

**File:** `src/app/admin/mail/index.ts`

Re-exports key actions and types for cross-module imports.

## Expected Files

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/admin/mail/layout.tsx` | Dashboard layout re-export |
| `src/app/admin/mail/page.tsx` | Redirect to inbox |
| `src/app/admin/mail/accounts/layout.tsx` | ListLayout for accounts |
| `src/app/admin/mail/accounts/page.tsx` | NothingSelected default |
| `src/app/admin/mail/accounts/[id]/page.tsx` | Account detail (overview + assignments) |
| `src/app/admin/mail/accounts/[id]/edit/page.tsx` | Edit account form |
| `src/app/admin/mail/accounts/_components/AssignmentSection.tsx` | Assignment management |
| `src/app/admin/mail/_database/index.ts` | Schema barrel re-exports |
| `src/app/admin/mail/index.ts` | Feature re-exports |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/admin/admin.config.ts` | Convert flat Mail link to collapsible parent with children |

## Validation Criteria

1. Admin sidebar shows "Mail" as a collapsible section with Inbox, Accounts, Sent, Queue, Settings children
2. Clicking "Mail" parent or navigating to `/admin/mail` redirects to `/admin/mail/inbox`
3. `/admin/mail/accounts` renders ListLayout with mail accounts list and `NothingSelected`
4. Selecting an account shows detail page with all fields, status toggle, and assignments
5. "Set as Primary" works with confirmation modal
6. Edit page saves display name, signature, and active status
7. AssignmentSection lists current assignments with ability to add/remove role and user assignments
8. `_database/index.ts` barrel re-exports all mail schemas
9. Dark mode: all components render correctly with good contrast
10. `pnpm tsc --noEmit` passes
11. `pnpm lint:fix` passes

## Notes

- Use `Badge` for status indicators (primary, active/inactive).
- All date/time formatting must use `@/shared/lib/utils/dates` utilities.
- All status colors/icons should use `@/shared/lib/utils/colors` and `@/shared/lib/utils/status.tsx`.
- The ListLayout for accounts does **not** include a `NewLink` since accounts are created via the OAuth authorization flow on the user profile page.
