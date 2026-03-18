# Step 007: Inbox, Threads & Reply

## Introduction

This step implements the email reading experience: fetching emails from Gmail API on-demand, displaying threaded conversations, and replying to emails. Client-side caching is handled by TanStack Query.

## Context

- Client-side polling every 15 minutes via TanStack Query (no server-side cron for inbox).
- **On-demand fetching**: Emails and threads are fetched directly from Gmail API. TanStack Query provides client-side caching and background refetching.
- Emails displayed as **threaded conversations** (using Gmail's `threadId`).
- Users can only access inboxes they are assigned to (via `mailAccountAssignments`).
- Admins see all inboxes.

## Requirements

### 1. Gmail Read Functions

**File:** `src/app/admin/mails/_server/gmail-client.ts` (extend)

#### `fetchInbox(mailAccountId: string, options: InboxOptions): Promise<GmailThread[]>`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxResults` | `number` | 20 | Max threads to return |
| `pageToken` | `string` | — | Gmail pagination token |
| `query` | `string` | — | Gmail search query (e.g., subject, from, date) |
| `labelIds` | `string[]` | `['INBOX']` | Gmail labels to filter |

**Behavior:**
1. Get Gmail client for the account.
2. Call `gmail.users.threads.list({ userId: 'me', maxResults, pageToken, q: query, labelIds })`.
3. Return thread list with: `threadId`, `snippet`, `historyId`, `nextPageToken`.

#### `fetchThread(mailAccountId: string, threadId: string): Promise<GmailThreadDetail>`

1. Call `gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' })`.
2. Parse each message in the thread:
   - Extract headers: `From`, `To`, `Subject`, `Date`, `Message-ID`, `In-Reply-To`.
   - Decode body: prefer `text/html` part, fallback to `text/plain`.
   - Detect attachments (parts with `filename`).
3. Return structured thread with ordered messages.

#### `fetchMessage(mailAccountId: string, messageId: string): Promise<GmailMessageDetail>`

Fetch a single message with full body and metadata.

#### `markAsRead(mailAccountId: string, messageId: string): Promise<void>`

Call `gmail.users.messages.modify()` to remove `UNREAD` label.

#### `markAsUnread(mailAccountId: string, messageId: string): Promise<void>`

Call `gmail.users.messages.modify()` to add `UNREAD` label.

#### `fetchAttachment(mailAccountId: string, messageId: string, attachmentId: string): Promise<Buffer>`

Call `gmail.users.messages.attachments.get()` and decode the base64 data.

### 2. Data Fetching Strategy

**On-demand approach:**
- Inbox list is fetched from Gmail API via `fetchInbox()` on each page load.
- TanStack Query caches responses client-side with `staleTime: 2 * 60 * 1000` (2 minutes).
- Background refetching every 15 minutes via `refetchInterval: 15 * 60 * 1000`.
- Thread details fetched on-demand when user clicks a thread.
- No server-side DB cache needed — simplifies implementation significantly.

**Benefits:**
- Always up-to-date (no stale cache issues).
- No DB storage overhead for email bodies.
- No cache invalidation complexity.
- Simpler codebase (~30% less implementation).

### 3. Inbox Server Actions

**File:** `src/app/admin/mails/_server/actions.ts` (extend)

| Action | Auth | Description |
|--------|------|-------------|
| `getInbox(accountId, page, search)` | Assignment check | Get inbox threads for an account (fetched from Gmail API) |
| `getThread(accountId, threadId)` | Assignment check | Get full thread conversation (fetched from Gmail API) |
| `markRead(accountId, messageId)` | Assignment check | Mark message read (Gmail API) |
| `markUnread(accountId, messageId)` | Assignment check | Mark message unread (Gmail API) |
| `replyToThread(accountId, threadId, body)` | Assignment check + canReply | Send reply |
| `downloadAttachment(accountId, msgId, attId)` | Assignment check | Download email attachment |

**Assignment check:** Before any inbox action, verify the requesting user has access to this mail account:
1. If user role is `admin` → allow.
2. Else query `mailAccountAssignments` where `(mailAccountId, userId)` matches or `(mailAccountId, role)` matches user's role.
3. For reply: additionally check `canReply = true` on the assignment.

### 4. Inbox Data Types

**File:** `src/app/admin/mails/_lib/types.ts` (extend)

#### `InboxThread`

| Field | Type | Description |
|-------|------|-------------|
| `threadId` | `string` | Gmail thread ID |
| `subject` | `string` | Thread subject (from first message) |
| `snippet` | `string` | Preview text |
| `from` | `{ name: string, email: string }` | Latest message sender |
| `to` | `string` | Recipients |
| `messageCount` | `number` | Number of messages in thread |
| `isRead` | `boolean` | All messages read? |
| `hasAttachments` | `boolean` | Any message has attachments? |
| `lastMessageAt` | `Date` | Timestamp of latest message |

#### `ThreadMessage`

| Field | Type | Description |
|-------|------|-------------|
| `messageId` | `string` | Gmail message ID |
| `from` | `{ name: string, email: string }` | Sender |
| `to` | `string` | Recipients |
| `cc` | `string` | CC recipients |
| `subject` | `string` | Subject |
| `htmlBody` | `string` | HTML body (sanitized) |
| `textBody` | `string` | Plain text body |
| `isRead` | `boolean` | Read status |
| `receivedAt` | `Date` | Receive timestamp |
| `attachments` | `MessageAttachment[]` | Attachment metadata |

#### `MessageAttachment`

| Field | Type | Description |
|-------|------|-------------|
| `attachmentId` | `string` | Gmail attachment ID |
| `filename` | `string` | Original filename |
| `mimeType` | `string` | MIME type |
| `size` | `number` | Size in bytes |

### 5. HTML Sanitization

Email HTML bodies can contain malicious content. Before rendering in the UI:

1. Sanitize HTML using a library like `dompurify` (server-side via `jsdom`) or `sanitize-html`.
2. Strip `<script>`, `<iframe>`, `<form>`, `<object>`, `<embed>` tags.
3. Strip `onclick`, `onload`, and other event handler attributes.
4. Allow safe tags: `<p>`, `<br>`, `<div>`, `<span>`, `<a>`, `<img>`, `<table>`, `<tr>`, `<td>`, `<th>`, `<ul>`, `<ol>`, `<li>`, `<b>`, `<i>`, `<strong>`, `<em>`, `<h1>`-`<h6>`, `<blockquote>`, `<pre>`, `<code>`.
5. Allow `href` on `<a>` (only `http:`, `https:`, `mailto:` protocols).
6. Allow `src` on `<img>` (only `http:`, `https:`, `cid:` protocols).

**Install:** `sanitize-html` package.

### 6. Reply Flow

When a user replies to a thread:

1. User types reply in the `ReplyEditor` component (Step 009).
2. Client calls `replyToThread(accountId, threadId, htmlBody)` server action.
3. Server action:
   a. Verify assignment + `canReply` permission.
   b. Fetch the latest message in the thread to get `Message-ID` for `In-Reply-To` header.
   c. Call `sendReply()` from `gmail-client.ts` (immediate send, not queued).
   d. Log to `mailSentLog` with `triggerType: 'reply'`.
4. Return the new message for optimistic UI update. Invalidate the thread query for fresh data.

### 7. Search

Gmail search query syntax is powerful but complex. For the basic search feature:

| UI Field | Gmail Query | Example |
|----------|-------------|---------|
| Subject | `subject:` | `subject:registration` |
| From | `from:` | `from:student@gmail.com` |
| Free text | raw text | `payment receipt` |
| Date range | `after: before:` | `after:2026/03/01 before:2026/03/15` |

Construct the Gmail `q` parameter from UI search fields and pass to `fetchInbox()`.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/_server/gmail-client.ts` | Extended with fetchInbox, fetchThread, markRead, etc. |
| `src/app/admin/mails/_server/actions.ts` | Extended with inbox/thread/reply actions |
| `src/app/admin/mails/_lib/types.ts` | Extended with InboxThread, ThreadMessage types |

## Validation Criteria

1. `fetchInbox()` returns paginated thread list from Gmail
2. `fetchThread()` returns full conversation with parsed messages
3. `markAsRead/markAsUnread` updates Gmail via API
4. Reply sends with correct `In-Reply-To` / `References` headers for threading
5. Reply is reflected in thread via TanStack Query invalidation
6. HTML bodies sanitized before returning to client
7. Search constructs valid Gmail query strings
8. Attachment download returns correct binary data
9. Assignment check enforced on all inbox actions
10. `pnpm tsc --noEmit` passes
11. `pnpm lint:fix` passes

## Notes

- Gmail API quota: `threads.list` = 5 units, `threads.get` = 10 units, `messages.send` = 100 units. The 250 units/sec/user limit should not be an issue for normal inbox use.
- MIME parsing: Gmail returns messages in `multipart/alternative` or `multipart/mixed` format. Walk the MIME tree to find `text/html` and `text/plain` parts.
- Base64 decoding: Gmail uses URL-safe base64 encoding. Use `Buffer.from(data, 'base64url')` for decoding.
- The `historyId` from Gmail can be used for incremental sync (only fetch changes since last check). This is an optimization for later — initial implementation fetches on-demand.
- For the client-side 15-minute polling: use `refetchInterval: 15 * 60 * 1000` in TanStack Query's `useQuery` for the inbox data. Use `staleTime: 2 * 60 * 1000` to avoid refetching on every navigation.
