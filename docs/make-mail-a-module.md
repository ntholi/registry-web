# Make Mail an Independent Module

Move the mail feature from `src/app/admin/mail/` to `src/app/mail/` as an independent top-level module (like `academic`, `registry`, `finance`, etc.).

---

## Complete File Tree (Current)

All 51 files currently under `src/app/admin/mail/`:

```
src/app/admin/mail/
├── index.ts
├── layout.tsx
├── page.tsx
├── accounts/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   ├── _components/
│   │   ├── AccountForm.tsx
│   │   ├── AddAssignmentForm.tsx
│   │   ├── AssignmentSection.tsx
│   │   └── SetPrimaryButton.tsx
│   ├── _lib/
│   │   └── scopes.ts
│   └── _server/
│       ├── actions.ts
│       ├── gmail-client.ts
│       ├── repository.ts
│       └── service.ts
├── assignments/
│   ├── _lib/
│   │   └── types.ts
│   └── _server/
│       ├── actions.ts
│       ├── repository.ts
│       └── service.ts
├── inbox/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── [threadId]/
│   │   └── page.tsx
│   └── _components/
│       ├── AccountSelector.tsx
│       ├── ComposeModal.tsx
│       └── ReplyEditor.tsx
├── queue/
│   ├── layout.tsx
│   ├── page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── QueueItemActions.tsx
├── queues/
│   └── _server/
│       ├── actions.ts
│       ├── queue-processor.ts
│       └── repository.ts
├── sent/
│   ├── layout.tsx
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── settings/
│   ├── ChangePrimaryButton.tsx
│   └── page.tsx
├── _database/
│   └── index.ts
├── _lib/
│   └── types.ts
├── _schema/
│   ├── mailAccountAssignments.ts
│   ├── mailAccounts.ts
│   ├── mailQueue.ts
│   ├── mailSentLog.ts
│   └── relations.ts
├── _server/
│   └── trigger-service.ts
└── _templates/
    ├── BaseLayout.tsx
    ├── GenericEmail.tsx
    ├── NotificationEmail.tsx
    ├── render.ts
    └── StudentStatusEmail.tsx
```

---

## Step 1: Move the Directory

Move `src/app/admin/mail/` → `src/app/mail/`

**Command:**
```bash
mv src/app/admin/mail src/app/mail
```

---

## Step 2: Create `mail.config.ts`

**Create file:** `src/app/mail/mail.config.ts`

This is the module config file (follow the pattern of `admin.config.ts`, `academic.config.ts`, etc.).

```ts
import {
	IconInbox,
	IconMail,
	IconSend,
	IconSettings,
	IconStack2,
	IconUserCheck,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const mailConfig: ModuleConfig = {
	id: 'mail',
	name: 'Mail',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Inbox',
				href: '/mail/inbox',
				icon: IconInbox,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Accounts',
				href: '/mail/accounts',
				icon: IconUserCheck,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Sent',
				href: '/mail/sent',
				icon: IconSend,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Queue',
				href: '/mail/queue',
				icon: IconStack2,
				roles: ['admin'],
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Settings',
				href: '/mail/settings',
				icon: IconSettings,
				roles: ['admin'],
				permissions: [{ resource: 'mails', action: 'read' }],
			},
		],
	},

	flags: {
		enabled: moduleConfig.mail,
		beta: false,
	},
};
```

---

## Step 3: Create `_lib/activities.ts` for Mail

**Create file:** `src/app/mail/_lib/activities.ts`

Extract mail-related activity entries from `src/app/admin/_lib/activities.ts` into mail's own `_lib/activities.ts`.

```ts
import type { ActivityFragment } from '@/shared/lib/utils/activities';

const MAIL_ACTIVITIES = {
	catalog: {
		mail_account_authorized: {
			label: 'Mail Account Authorized',
			department: 'mail',
		},
		mail_account_updated: {
			label: 'Mail Account Updated',
			department: 'mail',
		},
		mail_account_revoked: {
			label: 'Mail Account Revoked',
			department: 'mail',
		},
		mail_assignment_created: {
			label: 'Mail Assignment Created',
			department: 'mail',
		},
		mail_assignment_removed: {
			label: 'Mail Assignment Removed',
			department: 'mail',
		},
		mail_primary_changed: {
			label: 'Mail Primary Changed',
			department: 'mail',
		},
		mail_queue_retried: {
			label: 'Mail Queue Retried',
			department: 'mail',
		},
		mail_queue_cancelled: {
			label: 'Mail Queue Cancelled',
			department: 'mail',
		},
	},
	tableOperationMap: {
		'mail_accounts:INSERT': 'mail_account_authorized',
		'mail_accounts:UPDATE': 'mail_account_updated',
		'mail_accounts:DELETE': 'mail_account_revoked',
		'mail_account_assignments:INSERT': 'mail_assignment_created',
		'mail_account_assignments:DELETE': 'mail_assignment_removed',
	},
} as const satisfies ActivityFragment;

export default MAIL_ACTIVITIES;

export type MailActivityType = keyof typeof MAIL_ACTIVITIES.catalog;
```

---

## Step 4: Register Mail as an Independent Module

### 4a. `src/config/modules.config.ts`

**Add** `'mail'` to `ModuleKey` union:
```ts
export type ModuleKey =
	| 'academic'
	| 'admin'
	| 'admissions'
	| 'appraisals'
	| 'lms'
	| 'finance'
	| 'mail'        // <-- ADD
	| 'registry'
	| 'reports'
	| 'timetable'
	| 'student-portal'
	| 'audit-logs'
	| 'library'
	| 'human-resource';
```

**Add** `mail` to `moduleEnvKeys`:
```ts
mail: 'ENABLE_MODULE_MAIL',
```

**Add** `mail` to `moduleConfig` export:
```ts
mail: isModuleEnabled('mail'),
```

**Add** `mail` to `getModuleConfig()`:
```ts
mail: moduleConfig.mail,
```

### 4b. `tsconfig.json`

**Add** the `@mail/*` path alias:
```json
"@mail/*": ["./src/app/mail/*"]
```

### 4c. `src/app/dashboard/dashboard.tsx`

**Add import:**
```ts
import { mailConfig } from '@/app/mail/mail.config';
```

**Add to `allConfigs` array** (around line 110-121):
```ts
{ config: mailConfig, enabled: moduleConfig.mail },
```

### 4d. `src/core/database/index.ts`

**Add import:**
```ts
import * as mail from '@mail/_database';
```

**Add to schema spread:**
```ts
...mail,
```

**Add re-export:**
```ts
export * from '@mail/_database';
```

---

## Step 5: Update `admin.config.ts` — Remove Mail Nav

**File:** `src/app/admin/admin.config.ts`

**Remove** the entire Mail nav item block (lines ~63-90):
```ts
// REMOVE THIS ENTIRE BLOCK:
{
	label: 'Mail',
	href: '/admin/mail',
	icon: IconMail,
	collapsed: true,
	permissions: [{ resource: 'mails', action: 'read' }],
	children: [
		{ label: 'Inbox', href: '/admin/mail/inbox', icon: IconInbox },
		{
			label: 'Accounts',
			href: '/admin/mail/accounts',
			icon: IconUserCheck,
		},
		{ label: 'Sent', href: '/admin/mail/sent', icon: IconSend },
		{
			label: 'Queue',
			href: '/admin/mail/queue',
			icon: IconStack2,
			roles: ['admin'],
		},
		{
			label: 'Settings',
			href: '/admin/mail/settings',
			icon: IconSettings,
			roles: ['admin'],
		},
	] as NavItem[],
},
```

Also **remove unused icon imports** from the top:
- `IconInbox`
- `IconMail`
- `IconSend`
- `IconStack2`
- `IconUserCheck`

(Only remove if no other admin nav item uses them — check first.)

---

## Step 6: Update `admin/_database/index.ts` — Remove Mail Schema Exports

**File:** `src/app/admin/_database/index.ts`

**Remove** these 5 lines:
```ts
export * from '../mail/_schema/mailAccountAssignments';
export * from '../mail/_schema/mailAccounts';
export * from '../mail/_schema/mailQueue';
export * from '../mail/_schema/mailSentLog';
export * from '../mail/_schema/relations';
```

---

## Step 7: Update `admin/_lib/activities.ts` — Remove Mail Activity Entries

**File:** `src/app/admin/_lib/activities.ts`

**Remove** all mail-related catalog entries:
```ts
// REMOVE:
mail_account_authorized: { label: 'Mail Account Authorized', department: 'admin' },
mail_account_updated: { label: 'Mail Account Updated', department: 'admin' },
mail_account_revoked: { label: 'Mail Account Revoked', department: 'admin' },
mail_assignment_created: { label: 'Mail Assignment Created', department: 'admin' },
mail_assignment_removed: { label: 'Mail Assignment Removed', department: 'admin' },
mail_primary_changed: { label: 'Mail Primary Changed', department: 'admin' },
mail_queue_retried: { label: 'Mail Queue Retried', department: 'admin' },
mail_queue_cancelled: { label: 'Mail Queue Cancelled', department: 'admin' },
```

**Remove** all mail-related tableOperationMap entries:
```ts
// REMOVE:
'mail_accounts:INSERT': 'mail_account_authorized',
'mail_accounts:UPDATE': 'mail_account_updated',
'mail_accounts:DELETE': 'mail_account_revoked',
'mail_account_assignments:INSERT': 'mail_assignment_created',
'mail_account_assignments:DELETE': 'mail_assignment_removed',
```

---

## Step 8: Update Activity Tracker Registry

**File:** `src/app/admin/activity-tracker/_lib/registry.ts`

**Add import:**
```ts
import MAIL_ACTIVITIES from '@mail/_lib/activities';
```

**Add to `ALL_FRAGMENTS` array:**
```ts
MAIL_ACTIVITIES,
```

---

## Step 9: Update Internal Route Paths (Inside Mail Module)

All hardcoded `/admin/mail/...` routes inside the mail module must be updated to `/mail/...`.

### 9a. `src/app/mail/page.tsx`
**Change:**
```ts
redirect('/admin/mail/inbox');
```
**To:**
```ts
redirect('/mail/inbox');
```

### 9b. `src/app/mail/layout.tsx`
**Change** the relative import path:
```ts
export { default, generateMetadata } from '../../dashboard/layout';
```
**To:**
```ts
export { default, generateMetadata } from '../dashboard/layout';
```

### 9c. `src/app/mail/inbox/[threadId]/page.tsx`
**Change (line 98):**
```tsx
<ActionIcon variant='subtle' component={Link} href='/admin/mail/inbox'>
```
**To:**
```tsx
<ActionIcon variant='subtle' component={Link} href='/mail/inbox'>
```

### 9d. `src/app/mail/inbox/layout.tsx`
**Change (line 39):**
```ts
router.replace(`/admin/mail/inbox?${params.toString()}`);
```
**To:**
```ts
router.replace(`/mail/inbox?${params.toString()}`);
```

**Change (line 58):**
```ts
path='/admin/mail/inbox'
```
**To:**
```ts
path='/mail/inbox'
```

### 9e. `src/app/mail/queue/[id]/QueueItemActions.tsx`
**Change (line 48):**
```ts
router.push('/admin/mail/queue');
```
**To:**
```ts
router.push('/mail/queue');
```

### 9f. `src/app/mail/sent/layout.tsx`
**Change (line 16):**
```ts
path='/admin/mail/sent'
```
**To:**
```ts
path='/mail/sent'
```

### 9g. `src/app/mail/queue/layout.tsx`
**Change (line 17):**
```ts
path='/admin/mail/queue'
```
**To:**
```ts
path='/mail/queue'
```

### 9h. `src/app/mail/accounts/layout.tsx`
**Change (line 11):**
```ts
path='/admin/mail/accounts'
```
**To:**
```ts
path='/mail/accounts'
```

---

## Step 10: Update External Imports (Other Modules Importing from Mail)

### 10a. `src/app/registry/student-statuses/_server/actions.ts`
**Change (line 3):**
```ts
import { triggerStudentStatusEmail } from '@admin/mail/_server/trigger-service';
```
**To:**
```ts
import { triggerStudentStatusEmail } from '@mail/_server/trigger-service';
```

### 10b. `src/app/admin/notifications/_server/actions.ts`
**Change (line 3):**
```ts
import { triggerNotificationEmail } from '@admin/mail/_server/trigger-service';
```
**To:**
```ts
import { triggerNotificationEmail } from '@mail/_server/trigger-service';
```

### 10c. `src/app/auth/users/_components/AuthorizeEmailSection.tsx`
**Change (lines 4-6):**
```ts
import {
	deleteMailAccount,
	getMyMailAccounts,
} from '@admin/mail/accounts/_server/actions';
```
**To:**
```ts
import {
	deleteMailAccount,
	getMyMailAccounts,
} from '@mail/accounts/_server/actions';
```

**Change (line 40):**
```ts
const authorizeUrl = '/api/auth/gmail?returnUrl=/admin/mail';
```
**To:**
```ts
const authorizeUrl = '/api/auth/gmail?returnUrl=/mail';
```

### 10d. `src/app/api/auth/gmail/route.ts`
**Change (line 1):**
```ts
import { GMAIL_SCOPES } from '@admin/mail/accounts/_lib/scopes';
```
**To:**
```ts
import { GMAIL_SCOPES } from '@mail/accounts/_lib/scopes';
```

**Change (line 44):**
```ts
const returnUrl = searchParams.get('returnUrl') || '/admin/mail';
```
**To:**
```ts
const returnUrl = searchParams.get('returnUrl') || '/mail';
```

**Change (line 47):**
```ts
const safeReturnUrl = isRelativePath(returnUrl) ? returnUrl : '/admin/mail';
```
**To:**
```ts
const safeReturnUrl = isRelativePath(returnUrl) ? returnUrl : '/mail';
```

**Change (line 69):**
```ts
let returnUrl = '/admin/mail';
```
**To:**
```ts
let returnUrl = '/mail';
```

### 10e. `src/app/api/mail/process-queue/route.ts`
**Change (line 2):**
```ts
import { processEmailQueue } from '@/app/admin/mail/queues/_server/queue-processor';
```
**To:**
```ts
import { processEmailQueue } from '@mail/queues/_server/queue-processor';
```

### 10f. `src/app/api/mail/preview/[template]/route.ts`
**Change (lines 4-6):**
```ts
import {
	renderGenericEmail,
	renderNotificationEmail,
	renderStudentStatusEmail,
} from '@/app/admin/mail/_templates/render';
```
**To:**
```ts
import {
	renderGenericEmail,
	renderNotificationEmail,
	renderStudentStatusEmail,
} from '@mail/_templates/render';
```

---

## Step 11: Update `copilot-instructions.md`

**File:** `.github/copilot-instructions.md`

### 11a. Path Aliases Table — Add `@mail/*`

Add to the "Path Aliases" table:
```
| `@mail/*` | `./src/app/mail/*` |
```

### 11b. Project Structure — Add Mail Module

Add to the project structure tree under `src/app/`:
```
│   ├── mail/                  # Email system (accounts, queue, inbox, templates)
```

### 11c. Module Description

In any section referencing mail as part of admin, update to note it's an independent module.

---

## Step 12: Update `mail/_database/index.ts` Schema Exports

**File:** `src/app/mail/_database/index.ts`

Schema import paths are RELATIVE within the module, so they should still work after the move. **No change needed** — the relative paths (`../_schema/...`) remain valid.

Current content (stays the same):
```ts
export { mailAccountAssignments } from '../_schema/mailAccountAssignments';
export { mailAccounts } from '../_schema/mailAccounts';
export { mailQueue, mailQueueStatus, mailTriggerType } from '../_schema/mailQueue';
export { mailSentLog } from '../_schema/mailSentLog';
```

---

## Step 13: Verify Internal Relative Imports

All files inside the mail module use **relative imports** (`./`, `../`, `../../`) for intra-module references. After moving the entire directory, these relative paths remain valid. **No changes needed** for:

- `_server/trigger-service.ts` — imports from relative `../accounts/...`, `../queues/...`, `../_templates/...`
- `queues/_server/queue-processor.ts` — imports from relative `../../accounts/...`, `./repository`
- `accounts/_server/gmail-client.ts` — imports from relative `../_lib/scopes`, `./repository`
- All `_components/` — import from relative `../_server/actions`
- All `_schema/relations.ts` — imports from relative `./mailAccounts`, `./mailQueue`, etc.

**Exception:** The mail `index.ts` barrel export uses relative paths — also fine.

---

## Summary: All Files Requiring Changes

### Files to CREATE (2):
| # | File | Description |
|---|------|-------------|
| 1 | `src/app/mail/mail.config.ts` | New module config |
| 2 | `src/app/mail/_lib/activities.ts` | Mail activity fragment (extracted from admin) |

### Files to MOVE (1 directory, 51 files):
| # | From | To |
|---|------|----|
| 1 | `src/app/admin/mail/` (entire dir) | `src/app/mail/` |

### Files to EDIT (16):
| # | File | Change |
|---|------|--------|
| 1 | `src/config/modules.config.ts` | Add `'mail'` to `ModuleKey`, `moduleEnvKeys`, `moduleConfig`, `getModuleConfig()` |
| 2 | `tsconfig.json` | Add `"@mail/*": ["./src/app/mail/*"]` path alias |
| 3 | `src/app/dashboard/dashboard.tsx` | Import `mailConfig`, add to `allConfigs` array |
| 4 | `src/core/database/index.ts` | Import `* as mail`, spread into schema, add re-export |
| 5 | `src/app/admin/admin.config.ts` | Remove entire Mail nav item block + unused icon imports |
| 6 | `src/app/admin/_database/index.ts` | Remove 5 mail schema re-export lines |
| 7 | `src/app/admin/_lib/activities.ts` | Remove 8 mail catalog entries + 5 tableOperationMap entries |
| 8 | `src/app/admin/activity-tracker/_lib/registry.ts` | Import `MAIL_ACTIVITIES` from `@mail/_lib/activities`, add to `ALL_FRAGMENTS` |
| 9 | `src/app/mail/page.tsx` | Change redirect from `/admin/mail/inbox` → `/mail/inbox` |
| 10 | `src/app/mail/layout.tsx` | Change relative import from `../../dashboard/layout` → `../dashboard/layout` |
| 11 | `src/app/mail/inbox/[threadId]/page.tsx` | Change link href `/admin/mail/inbox` → `/mail/inbox` |
| 12 | `src/app/mail/inbox/layout.tsx` | Change 2 paths: `router.replace` and `path=` prop |
| 13 | `src/app/mail/queue/[id]/QueueItemActions.tsx` | Change `router.push` path |
| 14 | `src/app/mail/sent/layout.tsx` | Change `path=` prop |
| 15 | `src/app/mail/queue/layout.tsx` | Change `path=` prop |
| 16 | `src/app/mail/accounts/layout.tsx` | Change `path=` prop |

### External Files to EDIT (6):
| # | File | Change |
|---|------|--------|
| 17 | `src/app/registry/student-statuses/_server/actions.ts` | `@admin/mail/...` → `@mail/...` |
| 18 | `src/app/admin/notifications/_server/actions.ts` | `@admin/mail/...` → `@mail/...` |
| 19 | `src/app/auth/users/_components/AuthorizeEmailSection.tsx` | `@admin/mail/...` → `@mail/...` + URL change |
| 20 | `src/app/api/auth/gmail/route.ts` | `@admin/mail/...` → `@mail/...` + 3 URL fallback changes |
| 21 | `src/app/api/mail/process-queue/route.ts` | `@/app/admin/mail/...` → `@mail/...` |
| 22 | `src/app/api/mail/preview/[template]/route.ts` | `@/app/admin/mail/...` → `@mail/...` |

### Documentation to UPDATE (1):
| # | File | Change |
|---|------|--------|
| 23 | `.github/copilot-instructions.md` | Add `@mail/*` alias, add mail to project structure |

---

## Execution Order

1. **Move directory** (`src/app/admin/mail/` → `src/app/mail/`)
2. **Create** `mail.config.ts` and `_lib/activities.ts`
3. **Edit** `tsconfig.json` (add path alias — needed before all other edits)
4. **Edit** `modules.config.ts` (register module)
5. **Edit** `dashboard.tsx` (register in sidebar)
6. **Edit** `core/database/index.ts` (register schema)
7. **Edit** `admin/_database/index.ts` (remove mail schema exports)
8. **Edit** `admin/admin.config.ts` (remove mail nav)
9. **Edit** `admin/_lib/activities.ts` (remove mail activities)
10. **Edit** `activity-tracker/_lib/registry.ts` (add mail activities import)
11. **Edit** all 8 internal route files (update `/admin/mail/` → `/mail/`)
12. **Edit** all 6 external import files (update import paths)
13. **Edit** `copilot-instructions.md`
14. **Run** `pnpm tsc --noEmit & pnpm lint:fix` and fix any issues
