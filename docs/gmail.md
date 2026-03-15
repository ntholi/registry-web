# Gmail Integration Feature Plan

## Feasibility Assessment

**Verdict: Fully feasible.** The existing codebase already provides ~90% of the required infrastructure:

| Requirement | Status | Evidence |
|---|---|---|
| `googleapis` package | ✅ Installed | `googleapis@^171.0.0` in `package.json` |
| OAuth2 client pattern | ✅ Exists | `src/core/integrations/google-sheets.ts` — `getOAuth2Client(userId)` |
| Token storage (access + refresh) | ✅ Exists | `accounts` table: `access_token`, `refresh_token`, `expires_at`, `scope` columns |
| Automatic token refresh | ✅ Exists | `oauth2Client.on('tokens')` listener in `google-sheets.ts` (lines 55–82) |
| Scope authorization flow | ✅ Exists | `src/app/api/auth/google-classroom/route.ts` — redirects to Google, exchanges code, merges scopes |
| Shared OAuth client credentials | ✅ Exists | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` env vars used across all Google integrations |
| Per-user token isolation | ✅ Exists | Tokens keyed by `(userId, provider='google')` in `accounts` table |
| Admin module shell | ✅ Exists | `src/app/admin/` with config, navigation, layout |

**No new dependencies required.** No new environment variables needed beyond what is already configured.

---

## Overview

Add a Gmail integration feature to the Admin module that allows staff users to connect their Gmail account (via incremental OAuth scope authorization), then read, compose, send, and reply to emails directly within the Registry Web application—all using the Gmail API through the existing `googleapis` package.

### OAuth Scopes Required

| Scope | Purpose |
|---|---|
| `https://www.googleapis.com/auth/gmail.modify` | Read, send, archive, label, mark as read/unread |
| `https://www.googleapis.com/auth/gmail.send` | Send and reply to emails |

> `gmail.modify` covers read + send + modify (labels, archive, mark-as-read). Combined with `gmail.send` for explicit send permission. This avoids requesting full `mail.google.com` access.

### Google Cloud Console Prerequisite

Enable the **Gmail API** in the same Google Cloud project that owns the existing `AUTH_GOOGLE_ID` OAuth client. No new credentials or environment variables are needed.

---

## Architecture

### Data Flow

```
UI (Client Components)
  → Server Actions (src/app/admin/gmail/_server/actions.ts)
    → Service (src/app/admin/gmail/_server/service.ts)
      → Gmail Integration (src/core/integrations/google-gmail.ts)
        → googleapis Gmail API
        → Token auto-refresh → accounts table update
```

### File Structure

```
src/
├── core/
│   └── integrations/
│       └── google-gmail.ts              # Gmail API wrapper (read, send, reply, labels)
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── google-gmail/
│   │           └── route.ts             # OAuth redirect & code exchange (like google-classroom)
│   └── admin/
│       └── gmail/
│           ├── _server/
│           │   ├── service.ts           # Business logic (auth checks, formatting)
│           │   └── actions.ts           # Server actions for UI consumption
│           ├── _components/
│           │   ├── ConnectGmailButton.tsx   # "Connect Gmail" trigger + status indicator
│           │   ├── InboxView.tsx            # Email list with pagination/search
│           │   ├── MessageView.tsx          # Single email thread viewer
│           │   ├── ComposeModal.tsx         # Compose/reply modal with rich text
│           │   └── GmailLayout.tsx          # Split-pane layout (list + detail)
│           ├── _lib/
│           │   └── types.ts             # Gmail-specific types (EmailMessage, Thread, etc.)
│           ├── layout.tsx
│           ├── page.tsx                 # Main inbox page
│           └── index.ts                 # Barrel export
```

---

## Implementation Steps

### Step 1: Google Cloud Configuration (Manual)

1. Open the Google Cloud Console → APIs & Services → Library
2. Search for **Gmail API** and enable it for the project that owns `AUTH_GOOGLE_ID`
3. No new OAuth credentials needed — the existing client is sufficient
4. If the app is in "Testing" mode, ensure target users are added as test users (Gmail scopes require verified apps for production)

### Step 2: OAuth Authorization Route

**File**: `src/app/api/auth/google-gmail/route.ts`

Follow the exact pattern of `src/app/api/auth/google-classroom/route.ts`:

1. **No `code` param** → Generate auth URL with Gmail scopes and redirect to Google
2. **Has `code` param** → Exchange for tokens, merge scopes into `accounts` table, redirect back

```
Flow:
  User clicks "Connect Gmail"
    → GET /api/auth/google-gmail (no code)
      → Redirect to Google OAuth consent screen
        → User grants permission
          → Google redirects to /api/auth/google-gmail?code=xxx&state=/admin/gmail
            → Exchange code for tokens
            → Merge gmail scopes into accounts.scope
            → Update access_token, refresh_token, expires_at
            → Redirect to /admin/gmail
```

**Gmail scopes to request:**

```typescript
const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
];
```

**Key details:**
- Use `access_type: 'offline'` to receive a refresh token
- Use `prompt: 'consent'` to force consent screen (ensures refresh token is returned)
- Use `state` parameter to carry the return URL (defaults to `/admin/gmail`)
- Merge new scopes with existing scopes (don't overwrite Classroom/Sheets scopes)
- Preserve existing `refresh_token` if Google doesn't return a new one

### Step 3: Gmail API Integration Module

**File**: `src/core/integrations/google-gmail.ts`

Extract the existing `getOAuth2Client(userId)` function from `google-sheets.ts` into a shared `src/core/integrations/google-auth.ts` module (see Step 9). Both `google-sheets.ts` and `google-gmail.ts` must import from this shared module to avoid duplication. The Gmail module provides these core functions:

#### Scope Check

```typescript
async function hasGmailScope(userId: string): Promise<boolean>
```

Query `accounts` table for user's scope field. Return `true` if it contains `gmail.modify`.

#### List Messages (Inbox)

```typescript
interface GmailListOptions {
  query?: string;       // Gmail search query (e.g., "is:unread", "from:user@example.com")
  maxResults?: number;  // Default: 20
  pageToken?: string;   // For pagination
  labelIds?: string[];  // Filter by labels (e.g., ['INBOX'], ['SENT'])
}

interface GmailListResult {
  messages: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

async function listMessages(userId: string, options?: GmailListOptions): Promise<GmailListResult>
```

- Call `gmail.users.messages.list({ userId: 'me', ...options })`
- For each message ID returned, batch-fetch headers (From, To, Subject, Date, snippet) using `gmail.users.messages.get()` with `format: 'metadata'`
- Map to `GmailMessage` type

#### Get Message / Thread

```typescript
interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  date: string;
  body: string;          // HTML body preferred, fallback to plain text
  isUnread: boolean;
  hasAttachments: boolean;
  attachments?: GmailAttachment[];
}

interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

async function getMessage(userId: string, messageId: string): Promise<GmailMessage>
async function getThread(userId: string, threadId: string): Promise<GmailMessage[]>
```

- Call `gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' })`
- Parse MIME parts to extract HTML/plain body and attachment metadata
- For threads, call `gmail.users.threads.get()` and map each message

#### Send Email

```typescript
interface SendEmailOptions {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;          // HTML content
  inReplyTo?: string;    // Message-ID header for replies
  references?: string;   // References header for threading
  threadId?: string;     // Gmail thread ID to keep in same thread
}

async function sendEmail(userId: string, options: SendEmailOptions): Promise<{ id: string; threadId: string }>
```

- Construct RFC 2822 email with proper headers
- For replies: set `In-Reply-To`, `References`, `Subject` (with `Re:` prefix), and `threadId`
- Base64url-encode the raw message
- Call `gmail.users.messages.send({ userId: 'me', requestBody: { raw, threadId } })`

#### Modify Message

```typescript
async function markAsRead(userId: string, messageId: string): Promise<void>
async function markAsUnread(userId: string, messageId: string): Promise<void>
async function archiveMessage(userId: string, messageId: string): Promise<void>
async function trashMessage(userId: string, messageId: string): Promise<void>
```

- Call `gmail.users.messages.modify()` with `addLabelIds` / `removeLabelIds`
- Archive = remove `INBOX` label
- Trash = call `gmail.users.messages.trash()`

#### List Labels

```typescript
interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
}

async function listLabels(userId: string): Promise<GmailLabel[]>
```

#### Get Attachment

```typescript
async function getAttachment(userId: string, messageId: string, attachmentId: string): Promise<Buffer>
```

### Step 4: Service Layer

**File**: `src/app/admin/gmail/_server/service.ts`

Wraps Gmail integration functions with authentication and role-based access control:

```typescript
import { withAuth } from '@/core/platform';

class GmailService {
  async checkConnection(): Promise<{ connected: boolean; email?: string }>
  async getInbox(options?: GmailListOptions): Promise<GmailListResult>
  async getSentMessages(options?: GmailListOptions): Promise<GmailListResult>
  async getMessage(messageId: string): Promise<GmailMessage>
  async getThread(threadId: string): Promise<GmailMessage[]>
  async send(options: SendEmailOptions): Promise<{ id: string; threadId: string }>
  async reply(options: SendEmailOptions): Promise<{ id: string; threadId: string }>
  async markAsRead(messageId: string): Promise<void>
  async archive(messageId: string): Promise<void>
  async trash(messageId: string): Promise<void>
  async getLabels(): Promise<GmailLabel[]>
  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer>
}
```

- All methods use `withAuth()` to get the session and extract `userId`
- Role restriction: allow `admin`, `registry`, `finance`, `academic` roles (configurable)
- Each method delegates to the corresponding `google-gmail.ts` function

### Step 5: Server Actions

**File**: `src/app/admin/gmail/_server/actions.ts`

Expose service methods as server actions using `createAction`:

```typescript
'use server';

export const checkGmailConnection = createAction(async () => { ... });
export const getInboxMessages = createAction(async (options?: GmailListOptions) => { ... });
export const getSentMessages = createAction(async (options?: GmailListOptions) => { ... });
export const getEmailMessage = createAction(async (messageId: string) => { ... });
export const getEmailThread = createAction(async (threadId: string) => { ... });
export const sendEmail = createAction(async (options: SendEmailOptions) => { ... });
export const replyToEmail = createAction(async (options: SendEmailOptions) => { ... });
export const markMessageAsRead = createAction(async (messageId: string) => { ... });
export const archiveMessage = createAction(async (messageId: string) => { ... });
export const trashMessage = createAction(async (messageId: string) => { ... });
export const getGmailLabels = createAction(async () => { ... });
```

### Step 6: Types

**File**: `src/app/admin/gmail/_lib/types.ts`

Define all Gmail-specific types (as outlined in Step 3 interfaces). Use Zod for input validation:

```typescript
import { z } from 'zod/v4';

export const sendEmailSchema = z.object({
  to: z.string().email(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  threadId: z.string().optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
```

### Step 7: UI Components

#### 7a. ConnectGmailButton

**File**: `src/app/admin/gmail/_components/ConnectGmailButton.tsx`

```
'use client'
```

- Uses TanStack Query to call `checkGmailConnection` on mount
- **Not connected**: Shows a button "Connect Gmail" that navigates to `/api/auth/google-gmail?state=/admin/gmail`
- **Connected**: Shows green indicator with connected email address and a "Reconnect" option
- Uses Mantine `Button` with `IconBrandGmail` from Tabler Icons

#### 7b. InboxView

**File**: `src/app/admin/gmail/_components/InboxView.tsx`

```
'use client'
```

- TanStack Query to fetch messages with `getInboxMessages`
- Mantine `Table` or custom list showing: sender avatar/initials, subject, snippet, date, unread indicator
- Search bar using Gmail query syntax
- Pagination via `nextPageToken`
- Label/folder tabs: Inbox, Sent, Drafts (using `labelIds` filter)
- Click a message → opens `MessageView`

#### 7c. MessageView

**File**: `src/app/admin/gmail/_components/MessageView.tsx`

```
'use client'
```

- Fetches full thread via `getEmailThread`
- Displays email thread as a conversation (stacked cards)
- Shows: from, to, cc, date, subject, HTML body (rendered safely)
- Action buttons: Reply, Archive, Trash, Mark as unread
- Auto-marks as read when opened
- Attachment list with download links

#### 7d. ComposeModal

**File**: `src/app/admin/gmail/_components/ComposeModal.tsx`

```
'use client'
```

- Self-contained modal with trigger button (Mantine `Modal`)
- Form fields: To, CC, BCC, Subject, Body (rich text via Mantine `Textarea` or RichTextEditor)
- For replies: pre-fills `to`, `subject` (with `Re:` prefix), `inReplyTo`, `references`, `threadId`
- Uses `useActionMutation` for submission
- Zod validation with `sendEmailSchema`

#### 7e. GmailLayout

**File**: `src/app/admin/gmail/_components/GmailLayout.tsx`

```
'use client'
```

- Split-pane layout: sidebar (labels/folders) + message list + message detail
- Responsive: stacks on mobile
- Compose FAB (floating action button) to open `ComposeModal`
- Connection status in header via `ConnectGmailButton`

### Step 8: Pages & Navigation

#### Layout

**File**: `src/app/admin/gmail/layout.tsx`

Standard admin sub-layout.

#### Main Page

**File**: `src/app/admin/gmail/page.tsx`

Server component that checks Gmail connection status:
- **Not connected** → Render `ConnectGmailButton` prominently with explanation
- **Connected** → Render `GmailLayout` with `InboxView`

#### Admin Config Update

**File**: `src/app/admin/admin.config.ts`

Add Gmail navigation item:

```typescript
{
  label: 'Gmail',
  href: '/admin/gmail',
  icon: IconMail,  // from @tabler/icons-react
  roles: ['admin', 'registry', 'finance', 'academic'],
},
```

### Step 9: Shared OAuth2 Client Refactor (Required)

The `getOAuth2Client(userId)` function currently lives in `google-sheets.ts`. To comply with the no-duplication rule, it must be extracted to a shared module before building the Gmail integration:

**File**: `src/core/integrations/google-auth.ts`

```typescript
export async function getOAuth2Client(userId: string): Promise<OAuth2Client>
export async function hasScope(userId: string, scope: string): Promise<boolean>
```

Both `google-sheets.ts` and `google-gmail.ts` import from this shared module. Update `google-sheets.ts` to remove its local `getOAuth2Client` and import from `google-auth.ts`.

---

## Token Management

### How It Works (Existing Infrastructure)

1. **Initial Authorization**: User clicks "Connect Gmail" → redirected to Google → grants permission → Google returns auth code → backend exchanges for `access_token` + `refresh_token` → stored in `accounts` table

2. **Automatic Refresh**: The `googleapis` OAuth2 client auto-refreshes expired tokens using the stored `refresh_token`. The `oauth2Client.on('tokens')` listener (already in `getOAuth2Client`) writes new tokens back to the `accounts` table.

3. **Scope Merging**: New Gmail scopes are merged with existing scopes (Classroom, Sheets) in the `accounts.scope` column. Users don't lose access to other integrations.

4. **Per-User Isolation**: Each user has their own row in `accounts` keyed by `(userId, provider='google')`. One user's token refresh doesn't affect others.

### Token Lifecycle

```
User connects Gmail
  → accounts.access_token = "ya29.xxx" (valid ~1 hour)
  → accounts.refresh_token = "1//xxx" (long-lived)
  → accounts.expires_at = 1234567890 (Unix seconds)
  → accounts.scope = "openid email profile ...gmail.modify gmail.send"

API call with expired token
  → googleapis detects expiry
  → Uses refresh_token to get new access_token
  → on('tokens') fires → updates accounts table
  → API call succeeds transparently
```

### Edge Cases

| Scenario | Handling |
|---|---|
| User revokes access in Google settings | API call fails → catch error → show "Reconnect Gmail" prompt |
| Refresh token expires (rare, 6 months inactive) | Catch `invalid_grant` error → redirect to re-authorize |
| Multiple browser tabs making simultaneous calls | `getOAuth2Client` fetches latest tokens each time; `on('tokens')` is idempotent |
| User has no Google account row | `getOAuth2Client` throws → UI shows "Connect Gmail" |

---

## Security Considerations

1. **Scope Minimization**: Request only `gmail.modify` + `gmail.send` — not full `mail.google.com` access
2. **Server-Side Only**: All Gmail API calls happen server-side via Server Actions. Tokens never reach the client.
3. **Role-Based Access**: Only users with permitted roles (admin, registry, etc.) can access Gmail features
4. **No Token Exposure**: Access/refresh tokens are stored in the database and never sent to the browser
5. **HTML Sanitization**: Email body HTML must be sanitized before rendering to prevent XSS (use DOMPurify or similar)
6. **Rate Limiting**: Gmail API has per-user rate limits (250 quota units/second). Implement error handling for `429` responses.

---

## Testing Strategy

1. **Scope Check**: Verify `hasGmailScope()` correctly reads the `accounts.scope` column
2. **OAuth Flow**: Test the `/api/auth/google-gmail` route handles both redirect (no code) and callback (with code) paths
3. **Token Refresh**: Verify the `on('tokens')` listener updates the database when tokens are refreshed
4. **Message Parsing**: Test MIME parsing for various email formats (plain text, HTML, multipart, with attachments)
5. **Reply Threading**: Verify `In-Reply-To`, `References`, and `threadId` are set correctly for replies
6. **Error Handling**: Test graceful degradation when tokens are revoked or expired
7. **UI States**: Test connected vs. disconnected states, loading states, empty inbox, search results

---

## Implementation Order

| Phase | Task | Depends On |
|---|---|---|
| 1 | Enable Gmail API in Google Cloud Console | — |
| 2 | Extract shared `src/core/integrations/google-auth.ts` from `google-sheets.ts` | — |
| 3 | Create `src/app/api/auth/google-gmail/route.ts` | Phase 1 |
| 4 | Create `src/core/integrations/google-gmail.ts` | Phase 1, 2 |
| 5 | Create `src/app/admin/gmail/_lib/types.ts` | — |
| 6 | Create `src/app/admin/gmail/_server/service.ts` | Phase 4, 5 |
| 7 | Create `src/app/admin/gmail/_server/actions.ts` | Phase 6 |
| 8 | Create `ConnectGmailButton.tsx` | Phase 3, 7 |
| 9 | Create `InboxView.tsx` + `MessageView.tsx` | Phase 7, 8 |
| 10 | Create `ComposeModal.tsx` | Phase 7, 9 |
| 11 | Create `GmailLayout.tsx` + pages | Phase 8, 9, 10 |
| 12 | Update `admin.config.ts` navigation | Phase 11 |

---

## Future Enhancements

- **Email templates**: Pre-defined templates for common administrative emails (enrollment confirmation, payment receipts)
- **Bulk send**: Send personalized emails to groups of students/staff
- **Email logging**: Store sent email records in the database for audit trail (using the existing activity logging system)
- **Signature management**: Per-user email signature configuration
- **Contact integration**: Auto-suggest recipients from the users/students database
- **Push notifications**: Gmail API push notifications via Pub/Sub for real-time inbox updates
- **Draft management**: Save and manage email drafts
