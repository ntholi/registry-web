# Step 004: Email Sending & Queue

## Introduction

With mail accounts and the Gmail client in place (Steps 001-003), this step implements the email sending pipeline: a queue system that respects Gmail API rate limits, a queue processor API route triggered by an external cron, and a primary `sendEmail` function used by the rest of the application.

## Context

- Gmail Workspace limit: **2,000 messages/day** per user, **500 recipients/message** via API, **10,000 total recipients/day**, **15,000 quota units/user/minute**.
- Running on Vercel (serverless) — no persistent background processes.
- Queue uses a DB table (`mailQueue`) processed by an API route that **Vercel Cron Jobs** call periodically (configured in `vercel.json`).
- The `sendEmail` function is the single entry point for all outbound email — both system-triggered and manual.

## Requirements

### 1. Send Email Function

**File:** `src/app/admin/mails/_server/gmail-client.ts` (extend existing)

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

#### `sendViaGmail(mailAccountId: string, email: GmailMessage): Promise<string>`

Low-level function that:

1. Gets Gmail client via `getGmailClient(mailAccountId)`.
2. Constructs RFC 2822 MIME message using **nodemailer's MailComposer** with:
   - `From`: account email + displayName
   - `To`, `Cc`, `Bcc` headers
   - `Subject` header
   - `Content-Type: multipart/mixed` (if attachments) or `multipart/alternative` (html + text)
   - Attachment parts: fetch from R2, base64-encode, add as MIME parts
   - Signature: append account's signature to HTML body
3. Base64url-encode the message.
4. Call `gmail.users.messages.send({ userId: 'me', requestBody: { raw } })`.
5. Return the Gmail message ID.
6. Insert row into `mailSentLog`.

**Error handling:**
- `401/403` → mark account inactive, throw.
- `429` → throw rate limit error (queue processor handles retry).
- `400` → log error, mark queue entry as `failed`.

### 2. Queue Processor

**File:** `src/app/admin/mails/_server/queue-processor.ts`

#### `processEmailQueue(): Promise<ProcessResult>`

Called by the API route. Processes pending emails in batches:

1. **Fetch batch**: SELECT from `mailQueue` WHERE `status IN ('pending', 'retry')` AND `scheduledAt <= NOW()` AND `attempts < maxAttempts` ORDER BY `scheduledAt ASC` LIMIT 10.
2. **Rate check**: Count emails sent today by the mail account. If approaching daily limit (e.g., > 1,900 for Workspace), skip that account's emails.
3. **Process each**:
   a. UPDATE status to `processing`.
   b. Call `sendViaGmail()`.
   c. On success: UPDATE status to `sent`, set `sentAt`, insert `mailSentLog`.
   d. On failure:
      - If retriable (429, 5xx, network): UPDATE status to `retry`, increment `attempts`, set `scheduledAt` to `NOW() + backoff`.
      - If permanent (400, 401, 403): UPDATE status to `failed`, store error.
4. **Return**: `{ processed, sent, failed, retried }`.

#### Backoff strategy:

| Attempt | Delay |
|---------|-------|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 15 minutes (then mark failed) |

### 3. Queue API Route

**File:** `src/app/api/mail/process-queue/route.ts`

A `POST` handler:

1. Verify request authenticity via the `CRON_SECRET` header (Vercel automatically sends this for cron invocations).
2. Call `processEmailQueue()`.
3. Return JSON: `{ processed, sent, failed, retried }`.

**Security:** This endpoint is called by Vercel Cron. Vercel sends the `CRON_SECRET` automatically. Non-cron requests are rejected.

**Vercel Cron config** — add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/mail/process-queue",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

#### New env var:

| Var | Description |
|-----|-------------|
| `CRON_SECRET` | Automatically provided by Vercel for cron authentication |

### 4. Daily Rate Tracking

Add a helper function in `queue-processor.ts`:

#### `getDailySendCount(mailAccountId: string): Promise<number>`

Count rows in `mailSentLog` WHERE `mailAccountId` = target AND `sentAt >= start of today (UTC)` AND `status = 'sent'`.

#### `canSendMore(mailAccountId: string, limit: number = 1900): Promise<boolean>`

Returns `getDailySendCount(mailAccountId) < limit`.

### 5. Queue Management Actions

Add to `src/app/admin/mails/_server/actions.ts`:

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
| `htmlBody` | `string` | Reply body HTML |
| `senderId` | `string` | User sending the reply |

Behavior:
1. Construct MIME message with `In-Reply-To` and `References` headers (for proper threading).
2. Append account signature.
3. Call `gmail.users.messages.send()` with `threadId` parameter.
4. Log to `mailSentLog` with `triggerType: 'reply'`.
5. Invalidate thread TanStack Query so the UI re-fetches the updated thread from Gmail.

Replies are always sent immediately (not queued) — they are user-initiated and time-sensitive.

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/_server/gmail-client.ts` | Extended with sendEmail, sendViaGmail, sendReply |
| `src/app/admin/mails/_server/queue-processor.ts` | Queue processing logic |
| `src/app/api/mail/process-queue/route.ts` | Cron-triggered API endpoint |
| `src/app/admin/mails/_server/actions.ts` | Extended with queue/sent log actions |

## Validation Criteria

1. `sendEmail()` with `immediate: true` sends via Gmail API and logs to `mailSentLog`
2. `sendEmail()` without `immediate` inserts into `mailQueue` with status `pending`
3. Queue processor picks up pending/retry emails and sends them
4. Failed emails get retried with exponential backoff up to 3 attempts
5. Rate limiting prevents exceeding 1,900 sends/day per account
6. API route rejects requests without valid `CRON_SECRET` header
7. Reply function sends with proper `In-Reply-To` headers for Gmail threading
8. Sent log records all outbound emails with sender, recipient, status
9. `pnpm tsc --noEmit` passes
10. `pnpm lint:fix` passes

## Notes

- MIME message construction: Use **nodemailer's MailComposer** (`nodemailer/lib/mail-composer`) to build RFC 2822 compliant messages. This handles multipart/alternative, multipart/mixed, base64 encoding of attachments, and proper header formatting. The `googleapis` library expects the raw message as a base64url-encoded string.
- **Dependency to install:** `nodemailer` (and `@types/nodemailer` for TypeScript).
- For attachments: fetch the file from R2 using `getPublicUrl(key)` or the S3 client, then base64-encode and attach as a MIME part with `Content-Disposition: attachment`.
- The queue processor should be idempotent — if called twice in parallel, the `processing` status acts as a lock (only one processor picks up each email).
- Consider adding a `MAIL_DAILY_LIMIT` env var (default 1900) to make the threshold configurable.
- The Vercel Cron runs every 2 minutes for timely delivery. Vercel Cron Jobs are free on Pro plans (up to 2 per project on Hobby).
