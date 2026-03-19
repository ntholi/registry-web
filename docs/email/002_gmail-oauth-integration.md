# Step 002: Gmail OAuth Integration

## Introduction

With the database schema from Step 001 in place, this step implements the Gmail OAuth 2.0 flow that allows any user to authorize their Google email account. It also creates the core Gmail API client used by all subsequent steps for sending, reading, and managing emails.

## Context

- The app already has Google OAuth for sign-in via Better Auth (using the same Google Cloud project: `ntholi.g@gmail.com`).
- The existing Google Classroom integration (`src/app/api/auth/google-classroom/route.ts`) provides a proven pattern: a dedicated API route that initiates OAuth, exchanges codes, and stores tokens.
- The Google Sheets integration (`src/core/integrations/google-sheets.ts`) shows how to create a per-user `OAuth2Client` with auto-refresh listeners.
- This step reuses both patterns but stores tokens in `mailAccounts` (not `accounts`) to keep Gmail email authorization separate from the main sign-in OAuth.

## Requirements

### 1. Google Cloud Console Setup

Before any code, the following must be configured in the Google Cloud project:

| Setting | Value |
|---------|-------|
| API to enable | **Gmail API** |
| OAuth consent screen | Scopes: `gmail.modify`, `userinfo.email`, `userinfo.profile` |
| Authorized redirect URI | `${BETTER_AUTH_URL}/api/auth/gmail` |

No new env vars needed — reuses existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 2. Gmail API Scopes

Define scopes in `src/app/admin/mails/accounts/_lib/scopes.ts`:

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/gmail.modify` | Read, compose, send emails, manage labels (mark read/unread, star). Covers all needed operations. |
| `https://www.googleapis.com/auth/userinfo.email` | Get authorized email address |
| `https://www.googleapis.com/auth/userinfo.profile` | Get display name |

Export as a constant array `GMAIL_SCOPES`.

> **Note on restricted scopes:** `gmail.modify` is classified as a **restricted** scope by Google (not just sensitive). For Google Workspace for Education:
> 1. The Workspace admin must go to **Admin Console → Security → Access and data control → API controls → Manage App Access**.
> 2. Add the app by its **OAuth client ID** (from the Google Cloud project).
> 3. Mark the app as **"Trusted"** — this grants it access to restricted scopes including Gmail data.
> 4. If the Google Cloud project belongs to the same Workspace organization, the app is classified as "Internal". If it belongs to an external account (e.g., a personal Gmail), it's classified as "Third-party" but can still be explicitly Trusted by the admin.
> 5. This avoids the full OAuth verification / security assessment process required for public apps distributed outside the organization.

### 3. OAuth API Route

Create `src/app/api/auth/gmail/route.ts` — a `GET` handler with two phases (mirrors Google Classroom pattern):

#### Phase 1: No `code` query param → Redirect to Google OAuth

1. Verify user session via `auth()`.
2. Create `google.auth.OAuth2` client with:
   - `clientId`: `process.env.GOOGLE_CLIENT_ID`
   - `clientSecret`: `process.env.GOOGLE_CLIENT_SECRET`
   - `redirectUri`: `${process.env.BETTER_AUTH_URL}/api/auth/gmail`
3. Generate auth URL with:
   - `access_type: 'offline'` (get refresh token)
   - `scope`: `GMAIL_SCOPES`
   - `prompt: 'consent'` (always show consent to guarantee refresh token)
   - `state`: JSON-encoded `{ returnUrl, userId }` (returnUrl from query param, defaults to profile page)
   - `login_hint`: optional email query param (pre-fill Google account selector)
4. Redirect to the auth URL.

#### Phase 2: `code` query param present → Exchange for tokens

1. Verify user session.
2. Exchange authorization code for tokens via `oauth2Client.getToken(code)`.
3. Use tokens to call Google UserInfo API to get the authorized email address and display name.
4. Check if this email already exists in `mailAccounts`:
   - **Exists + same userId**: Update tokens (re-authorization).
   - **Exists + different userId**: Return error — email already authorized by another user.
   - **New**: Insert new `mailAccounts` row.
5. Store: `accessToken`, `refreshToken`, `tokenExpiresAt`, `scope` (space-separated), `email`, `displayName`.
6. Redirect to `returnUrl` from state param.

#### Security considerations:
- Validate `state` param to prevent CSRF.
- Ensure `returnUrl` in state is a relative path (no open redirect).
- Rate-limit this endpoint (Better Auth's rate limiter already applies).

### 4. Gmail API Client

Create `src/app/admin/mails/accounts/_server/gmail-client.ts` — the core utility for all Gmail operations.

#### `getGmailClient(mailAccountId: string)`

1. Fetch `mailAccount` from DB (including tokens).
2. Create `google.auth.OAuth2` client with stored tokens.
3. Register `on('tokens')` listener to auto-persist refreshed tokens (same pattern as Google Sheets).
4. Return `google.gmail({ version: 'v1', auth: oauth2Client })`.

#### `getGmailClientByEmail(email: string)`

Convenience: looks up `mailAccountId` by email, then calls `getGmailClient`.

#### `getPrimaryGmailClient()`

Convenience: fetches the primary mail account (`isPrimary = true`), returns its Gmail client. Used by the system email sender.

#### Token refresh handling:

```
oauth2Client.on('tokens', async (tokens) => {
  // Update mailAccounts row with new access_token, refresh_token, expiry
  // Same pattern as google-sheets.ts
});
```

#### Error handling:

- If token is expired and no refresh token exists → mark `mailAccount.isActive = false`, throw descriptive error.
- If Gmail API returns 401/403 → mark inactive, log error.

### 5. Token Storage

Tokens stored in `mailAccounts` follow the same pattern as the existing Google Classroom / Google Sheets integrations — stored directly in the table without application-level encryption. This matches the established codebase pattern where the `accounts` table stores OAuth tokens unencrypted.

The `gmail-client.ts` reads tokens directly when creating the OAuth2 client, and the OAuth route stores them directly.

> **Future:** If encryption is added, it should be applied consistently across all OAuth token stores (Better Auth `accounts` + `mailAccounts`).

### 6. User Profile Integration

Add an "Authorize Email" section to the user profile. This is a client component that:

1. Shows a list of emails the current user has authorized (fetched via server action).
2. Provides an "Authorize New Email" button that navigates to `/api/auth/gmail?returnUrl=/profile`.
3. Each authorized email shows: email address, display name, status (active/inactive), primary badge.
4. Each email has a "Revoke" button that calls a server action to delete the mail account.

**Location:** `src/app/auth/users/_components/AuthorizeEmailSection.tsx`

This component is embedded in the user profile page (exact location determined in Step 009).

### 7. Revoke Authorization

Server action `revokeMailAccount(mailAccountId: string)`:

1. Verify the requesting user owns this mail account OR is admin.
2. Optionally call Google's token revocation endpoint: `https://oauth2.googleapis.com/revoke?token={token}`.
3. Delete all `mailAccountAssignments` for this account.
4. Delete the `mailAccounts` row.
5. If this was the primary account, log a warning (admin must reassign).

## Expected Files

| File | Purpose |
|------|---------|
| `src/app/admin/mails/accounts/_lib/scopes.ts` | Gmail API scope constants |
| `src/app/api/auth/gmail/route.ts` | OAuth callback handler |
| `src/app/admin/mails/accounts/_server/gmail-client.ts` | Gmail API client factory |
| `src/app/auth/users/_components/AuthorizeEmailSection.tsx` | Profile page email auth UI |

## Validation Criteria

1. User can click "Authorize Email" from profile → redirected to Google consent screen
2. After consent, tokens stored in `mailAccounts` with correct email and display name
3. Re-authorizing same email updates tokens (no duplicate rows)
4. Authorizing an email already owned by another user shows error
5. `getGmailClient()` returns a working Gmail API instance
6. Token auto-refresh works (expired access token gets renewed via refresh token)
7. Revoking an email deletes the account and its assignments
8. `pnpm tsc --noEmit` passes
9. `pnpm lint:fix` passes

## Notes

- The `login_hint` query param on the OAuth URL lets the profile page pre-suggest which Google account to authorize (useful when user has multiple Google accounts).
- `prompt: 'consent'` is critical — without it, Google won't return a refresh token on re-auth.
- The `state` parameter should include the user ID to verify on callback (prevents token theft if URL is intercepted).
- Gmail API rate limits: 15,000 quota units per user per minute. `messages.send` = 100 units, `threads.list` = 10 units, `threads.get` = 10 units. The client should handle `429 Too Many Requests` gracefully.
- Gmail sending limits per Workspace user: 2,000 messages/day, **500 recipients/message via Gmail API** (web UI allows 2,000 but API is capped at 500), 10,000 total recipients/day, 3,000 external recipients/day.
- The `googleapis` package is already a dependency (`googleapis@171.0.0` in package.json).
