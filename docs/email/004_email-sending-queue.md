# Step 004: Email Sending & Queue

## Introduction

With mail accounts and the Gmail client in place (Steps 001-003), this step implements the email sending pipeline: a queue system that respects Gmail API rate limits, a queue processor API route triggered by an external cron, and a primary `sendEmail` function used by the rest of the application.

## Context

- Gmail Workspace limits (per user, rolling 24h): **2,000 messages/day**, **10,000 total recipients/day**, **3,000 external recipients/day**, **3,000 unique recipients/day** (2,000 external).
- Gmail API-specific limits: **500 recipients/message** when sent via the Gmail API (NOT the 2,000 limit shown in Gmail web UI). Max **500 external** recipients per message regardless of method.
- Gmail API rate limit: **15,000 quota units/user/minute** (1,200,000/min per project). `messages.send` costs **100 units** → theoretical max **150 sends/min/user**.
- Running on Vercel (serverless) — no persistent background processes.
- Queue uses a DB table (`mailQueue`) processed by an API route that **Vercel Cron Jobs** call periodically (configured in `vercel.json`).
- The `sendEmail` function is the single entry point for all outbound email — both system-triggered and manual.

## Required Adjustment Before Implementation

The current queue schema must persist the user who initiated a queued email. Add a nullable `sentByUserId` foreign key on `mailQueue` before implementing this step so queued manual emails can be written to `mailSentLog` with the correct sender when the cron processor runs later.

## Requirements

### 1. Send Email Function

**File:** `src/app/admin/mails/accounts/_server/gmail-client.ts` (extend existing)

#### `sendEmail(options: SendEmailOptions): Promise<SendResult>`

**Input type `SendEmailOptions`:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | `string \| string[]` | Yes | Recipient(s) |
| `cc` | `string \| string[]` | No | CC recipients |
| `bcc` | `string \| string[]` | No | BCC recipients |
| `subject` | `string` | Yes | Subject line |
| `htmlBody` | `string` | Yes | Rendered HTML body |
| `textBody` | `string` | No | Plain-text fallback |
| `attachments` | `EmailAttachment[]` | No | File attachments |
| `triggerType` | `MailTriggerType` | Yes | What caused this send |
| `triggerEntityId` | `string` | No | Related entity ID |
| `mailAccountId` | `string` | No | Specific account to send from (defaults to primary) |
| `senderId` | `string` | No | User who triggered (NULL for system) |
| `immediate` | `boolean` | No | Skip queue, send immediately (for replies) |

**`EmailAttachment` type:**

| Field | Type | Description |
|-------|------|-------------|
| `filename` | `string` | Display filename |
| `r2Key` | `string` | R2 storage key (fetched at send time) |
| `mimeType` | `string` | MIME type |

**Behavior:**

1. If `immediate` is true → call `sendViaGmail()` directly, log to `mailSentLog`.
2. Otherwise → insert into `mailQueue` with status `pending`.
3. Returns `{ queued: boolean, messageId?: string }`.

Queued inserts must persist `sentByUserId` from `senderId` together with the payload needed by the processor.

#### `sendViaGmail(mailAccountId: string, email: GmailMessage): Promise<{ messageId: string; snippet?: string }>`

Low-level function that:

1. Gets Gmail client via `getGmailClient(mailAccountId)`.
2. Constructs RFC 2822 MIME message using **nodemailer's MailComposer** with:
   - `From`: account email + displayName
   - `To`, `Cc`, `Bcc` headers
   - `Subject` header
   - `Content-Type: multipart/mixed` (if attachments) or `multipart/alternative` (html + text)
  - Attachment parts: load file bytes from R2 via a shared storage helper, base64-encode, add as MIME parts
   - Signature: append account's signature to HTML body
3. Base64url-encode the message.
4. Call `gmail.users.messages.send({ userId: 'me', requestBody: { raw } })`.
5. Return the Gmail message ID and snippet if available.

`sendViaGmail()` should **not** insert into `mailSentLog`. Logging must happen exactly once in the caller (`sendEmail`, `sendReply`, or `processEmailQueue`) after the send succeeds, otherwise queued sends will double-write audit rows.

**Error handling:**
- `401/403` → mark account inactive, throw.
- `429` → throw rate limit error (queue processor handles retry).
- `400` → throw a permanent-send error that the caller records as failed.

### 2. Queue Processor

**File:** `src/app/admin/mails/queues/_server/queue-processor.ts`

#### `processEmailQueue(): Promise<ProcessResult>`

Called by the API route. Processes pending emails in batches:

1. **Claim batch atomically**: use one repository method that claims rows in a single transaction with `FOR UPDATE SKIP LOCKED`, sets `status = 'processing'`, updates `processedAt`, and increments `attempts`. Do not rely on a plain SELECT followed by a later UPDATE, because parallel cron invocations can pick the same rows.
2. **Rate check in one grouped query**: load daily sent counts for all mail accounts represented in the claimed batch. If an account is at or above the configured threshold (default `1900`), move its claimed rows back to `retry` with a short delay instead of re-counting per item.
3. **Process each**:
  a. Call `sendViaGmail()`.
  b. On success: in one DB transaction UPDATE status to `sent`, set `sentAt`, clear `error`, and insert one `mailSentLog` row using the queue row's `sentByUserId`.
   d. On failure:
    - If retriable (429, 5xx, network): UPDATE status to `retry`, set `scheduledAt` to `NOW() + backoff`, store error.
    - If permanent (400, 401, 403): UPDATE status to `failed`, store error.
4. **Return**: `{ processed, sent, failed, retried }`.

The queue processor should live behind a repository/service boundary in the mails module. Repository methods own the DB reads and row claiming; the processor coordinates Gmail sends and service-level policy.

#### MailQueueRepository Methods

| Method | Description |
|--------|-------------|
| `claimBatch(batchSize: number)` | Atomically claim up to `batchSize` pending/retry rows using `FOR UPDATE SKIP LOCKED`, set status to `processing`, increment `attempts`, set `processedAt`. Returns claimed rows. |
| `markSent(id, gmailMessageId, sentByUserId?, triggerType, triggerEntityId?)` | In one transaction: update queue row to `sent` + `sentAt`, and insert `mailSentLog` row. |
| `markFailed(id, error)` | Set status to `failed`, store error message. |
| `markRetry(id, error, nextScheduledAt)` | Set status to `retry`, store error, update `scheduledAt` for backoff. |
| `getDailySendCounts(accountIds)` | Count `mailSentLog` rows per account where `sentAt >= start of today (UTC)`. |
| `getQueueCounts()` | Count rows grouped by status for dashboard. |

#### Batch Size & Duration

Process at most **10 emails per invocation** to stay well within Vercel function duration limits. Set `export const maxDuration = 60` on the route handler (Pro plan required for >10s).

#### Backoff strategy:

| Attempt Number | Delay After Failure |
|----------------|---------------------|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | Mark failed after the attempt |

### 3. Queue API Route

**File:** `src/app/api/mail/process-queue/route.ts`

A `GET` handler (Vercel Cron always sends HTTP GET requests):

1. Verify request authenticity: compare `request.headers.get('authorization')` against `Bearer ${process.env.CRON_SECRET}`.
2. Reject requests when `CRON_SECRET` is missing or the bearer token does not match (return 401).
3. Call `processEmailQueue()`.
4. Return JSON: `{ processed, sent, failed, retried }`.
5. Set `export const maxDuration = 60` to allow sufficient processing time (requires Pro plan).

**Security:** This endpoint is called by Vercel Cron. Vercel automatically sends the `CRON_SECRET` env var as a bearer token in the `Authorization` header. Non-cron requests are rejected.

**Vercel Cron config** — add to `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/mail/process-queue",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

> **Note:** Hobby plans are limited to cron jobs that run **once per day** only — expressions like `0 * * * *` (hourly) or `*/2 * * * *` (every 2 min) will **fail deployment**. The `*/2` schedule requires a **Pro** plan. If on Hobby, use `0 8 * * *` (once daily at 8 AM UTC, but invocation may occur anywhere within that hour ±59 min). For a university email system, **Pro plan is strongly recommended** for timely delivery.

#### New env vars:

| Var | Description |
|-----|-------------|
| `CRON_SECRET` | Shared secret verified from the bearer token on cron requests |
| `MAIL_DAILY_LIMIT` | Optional per-account daily send cap override, default `1900` |

### 4. Daily Rate Tracking

Add a helper function in `queue-processor.ts`:

#### `getDailySendCounts(mailAccountIds: string[]): Promise<Map<string, number>>`

Count rows in `mailSentLog` grouped by `mailAccountId` WHERE `mailAccountId IN (...)` AND `sentAt >= start of today (UTC)` AND `status = 'sent'`.

#### `canSendMore(mailAccountId: string, counts: Map<string, number>, limit: number = 1900): boolean`

Returns `(counts.get(mailAccountId) ?? 0) < limit`.

### 5. Queue Management Actions

Add to `src/app/admin/mails/queues/_server/actions.ts`:

| Action | Auth | Description |
|--------|------|-------------|
| `getQueueStatus()` | `{ mails: ['manage'] }` | Count by status: pending, processing, sent, failed, retry |
| `getQueueItems(page, status?)` | `{ mails: ['manage'] }` | Paginated queue items, filter by status |
| `retryFailedEmail(queueId)` | `{ mails: ['manage'] }` | Reset a failed email to pending |
| `cancelQueuedEmail(queueId)` | `{ mails: ['manage'] }` | Delete a pending email from queue |
| `getSentLog(page, search)` | `{ mails: ['read'] }` | Paginated sent email log |
| `getDailyStats(accountId)` | `{ mails: ['read'] }` | Sent count and remaining quota for today |

### 6. Reply Function

#### `sendReply(options: ReplyOptions): Promise<string>`

| Field | Type | Description |
|-------|------|-------------|
| `mailAccountId` | `string` | Account to reply from |
| `threadId` | `string` | Gmail thread ID to reply to |
| `inReplyTo` | `string` | Gmail message ID being replied to |
| `to` | `string` | Recipient |
| `subject` | `string` | Original subject (prepend `Re:` if missing) |
| `htmlBody` | `string` | Reply body HTML |
| `senderId` | `string` | User sending the reply |

Behavior:
1. Construct MIME message with `Subject`, `In-Reply-To`, and `References` headers (all three required for proper Gmail threading per RFC 2822).
2. Append account signature.
3. Call `gmail.users.messages.send()` with `threadId` parameter.
4. Log to `mailSentLog` with `triggerType: 'reply'`.
5. Return the send result to the calling server action so the client mutation can invalidate the thread query key.

Replies are always sent immediately (not queued) — they are user-initiated and time-sensitive.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/accounts/_server/gmail-client.ts` | Extended with sendEmail, sendViaGmail, sendReply |
| `src/app/admin/mails/queues/_server/queue-processor.ts` | Queue processing logic |
| `src/app/api/mail/process-queue/route.ts` | Cron-triggered API endpoint |
| `src/app/admin/mails/queues/_server/actions.ts` | Extended with queue/sent log actions |

## Validation Criteria

1. `sendEmail()` with `immediate: true` sends via Gmail API and logs to `mailSentLog`
2. `sendEmail()` without `immediate` inserts into `mailQueue` with status `pending`
3. Queue processor picks up pending/retry emails and sends them
4. Failed emails get retried with exponential backoff up to 3 attempts
5. Rate limiting prevents exceeding 1,900 sends/day per account
6. API route rejects requests without a valid bearer token derived from `CRON_SECRET`
7. Reply function sends with proper `In-Reply-To` headers for Gmail threading
8. Sent log records all outbound emails with sender, recipient, status
9. Parallel cron invocations do not process the same queue row twice (idempotent: `FOR UPDATE SKIP LOCKED` ensures duplicate cron events safely skip already-claimed rows)
10. `pnpm tsc --noEmit` passes
11. `pnpm lint:fix` passes

## Notes

- **MIME construction:** Use **nodemailer's MailComposer** (`nodemailer/lib/mail-composer`) to build RFC 2822 compliant messages. This handles multipart/alternative, multipart/mixed, base64 encoding of attachments, and proper header formatting. The `googleapis` library expects the raw message as a base64url-encoded string.
- **Dependency to install:** `pnpm add nodemailer` and `pnpm add -D @types/nodemailer`.
- **Attachments:** Reuse the shared R2 storage helper to fetch file bytes for server-side MIME assembly. Do not duplicate ad hoc R2 download logic inside the Gmail client.
- **Idempotency:** Vercel's event-driven system can occasionally deliver the same cron event more than once. The `FOR UPDATE SKIP LOCKED` claim mechanism ensures duplicate invocations safely skip already-claimed rows. The atomic claim query (not a separate SELECT then UPDATE) is critical for correctness.
- **Vercel plan requirement:** The `*/2` cron schedule requires a **Pro** plan. Hobby is limited to **once per day** only — hourly or more frequent expressions fail deployment. All plans support up to **100 cron jobs** per project. Pro plan cron jobs are invoked within the specified minute; Hobby has ±59 min jitter.
- **Batch size:** Cap at 10 emails per cron invocation. With 100 quota units per `messages.send` and 15,000 units/min limit, 10 sends is well within bounds. This also keeps function execution under 60 seconds.
