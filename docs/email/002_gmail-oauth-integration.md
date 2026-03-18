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
| OAuth consent screen | Scopes: `gmail.send`, `gmail.readonly`, `gmail.compose`, `gmail.modify` |
| Authorized redirect URI | `${BETTER_AUTH_URL}/api/auth/gmail` |

No new env vars needed — reuses existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 2. Gmail API Scopes

Define scopes in `src/app/admin/mails/_lib/scopes.ts`:

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/gmail.send` | Send emails |
| `https://www.googleapis.com/auth/gmail.readonly` | Read inbox, threads, messages |
| `https://www.googleapis.com/auth/gmail.compose` | Create drafts, compose |
| `https://www.googleapis.com/auth/gmail.modify` | Mark read/unread, star, labels |
| `https://www.googleapis.com/auth/userinfo.email` | Get authorized email address |
| `https://www.googleapis.com/auth/userinfo.profile` | Get display name |

Export as a constant array `GMAIL_SCOPES`.

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

Create `src/app/admin/mails/_server/gmail-client.ts` — the core utility for all Gmail operations.

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

### 5. Token Encryption

Tokens stored in `mailAccounts` must be encrypted at rest. Two approaches:

**Option A (Recommended):** Use the same encryption mechanism as Better Auth's `encryptOAuthTokens`. Import the encryption utilities from Better Auth internals or replicate the pattern using `BETTER_AUTH_SECRET` as the key.

**Option B:** If Better Auth's encryption is not easily importable, use Node.js `crypto.createCipheriv` / `crypto.createDecipheriv` with AES-256-GCM, deriving the key from `BETTER_AUTH_SECRET`.

The `gmail-client.ts` should decrypt tokens when creating the OAuth2 client, and the OAuth route should encrypt before storing.

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
| `src/app/admin/mails/_lib/scopes.ts` | Gmail API scope constants |
| `src/app/api/auth/gmail/route.ts` | OAuth callback handler |
| `src/app/admin/mails/_server/gmail-client.ts` | Gmail API client factory |
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
- Gmail API rate limits: 250 quota units per user per second. The client should handle `429 Too Many Requests` gracefully.
- The `googleapis` package is already a dependency (`googleapis@171.0.0` in package.json).
