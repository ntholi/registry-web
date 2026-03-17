# Option 2: Per-User OAuth (Authorization Code Flow)

Each finance user connects their own Zoho account. API calls carry the user's identity, preserving Zoho's native audit trail.

> **Key benefit**: Zoho's audit logs show exactly which finance user performed each action (created a contact, viewed invoices, etc.) — full accountability without any custom logging.

---

## 1. Architecture Overview

### Why Per-User OAuth?

The Self Client approach uses a single shared token — all API calls appear as one Zoho user in audit logs, making it impossible to track who did what.

With per-user OAuth:

- Each finance user authenticates via Zoho's OAuth consent screen
- API calls are made with **the user's own access token**
- Zoho's built-in audit logs attribute every action to the correct user
- Users can revoke access at any time from their Zoho account

### Data Flow

```
Finance user clicks "Connect Zoho Books"
  → Registry redirects to Zoho OAuth consent screen
  → User logs in with their Zoho account and grants access
  → Zoho redirects back to Registry with authorization code
  → Registry exchanges code for access_token + refresh_token
  → Tokens stored (encrypted) per-user in database
  → All subsequent Zoho API calls use this user's tokens
  → Zoho audit logs show: "Jane Doe created Contact X at 10:32 AM"
```

### Prerequisites

Each finance user who needs Zoho access **must**:

1. Have a Zoho account (same email domain recommended)
2. Be invited as a user in the Zoho Books organization with an appropriate role
3. Connect their Zoho account via the Registry UI (one-time consent)

---

## 2. Initial Setup

### 2.1 Zoho Books Organization

The app connects to a single Zoho Books organization. The organization must:

- Use **LSL (Lesotho Loti)** as the base currency
- Have **Reporting Tags** configured (see [Section 7](#7-reporting-tags--contact-tagging))
- Have a **Contact Custom Field** named `Account Code` (type: string)
- Have all finance staff invited as Zoho Books users with appropriate roles

### 2.2 Register a Server-Based Application

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click **Add Client** → **Server-based Applications**
3. Fill in:
   - **Client Name**: `Registry Web` (or your app name)
   - **Homepage URL**: `https://portal.luct.ac.ls`
   - **Authorized Redirect URIs**:
     - Production: `https://portal.luct.ac.ls/api/zoho/callback`
     - Development: `http://localhost:3000/api/zoho/callback`
4. Save the **Client ID** and **Client Secret**

> Zoho allows multiple redirect URIs. Add both production and localhost so you can test locally.

### 2.3 Environment Variables

Add to `.env.local`:

```env
ZOHO_BOOKS_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
ZOHO_BOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_BOOKS_ORGANIZATION_ID=823788793
ZOHO_BOOKS_REDIRECT_URI=http://localhost:3000/api/zoho/callback
```

For production deployment:

```env
ZOHO_BOOKS_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
ZOHO_BOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_BOOKS_ORGANIZATION_ID=823788793
ZOHO_BOOKS_REDIRECT_URI=https://portal.luct.ac.ls/api/zoho/callback
```

Optional overrides (defaults shown):

```env
ZOHO_BOOKS_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_BOOKS_API_BASE_URL=https://www.zohoapis.com/books/v3
```

> **No `ZOHO_BOOKS_REFRESH_TOKEN`** — tokens are now per-user and stored in the database.

### 2.4 Required OAuth Scopes

When finance users connect, the app requests these scopes:

```
ZohoBooks.invoices.READ,ZohoBooks.customerpayments.READ,ZohoBooks.salesorders.READ,ZohoBooks.estimates.ALL,ZohoBooks.projects.READ,ZohoBooks.expenses.READ,ZohoBooks.creditnotes.READ,ZohoBooks.purchaseorders.READ,ZohoBooks.bills.READ,ZohoBooks.debitnotes.READ,ZohoBooks.vendorpayments.READ,ZohoBooks.banking.READ,ZohoBooks.accountants.READ,ZohoBooks.contacts.READ,ZohoBooks.contacts.CREATE,ZohoBooks.contacts.UPDATE,ZohoBooks.settings.UPDATE,ZohoBooks.settings.READ
```

These are displayed to the user during the OAuth consent flow and they must approve.

### 2.5 Generate `zoho-config.json`

The config script needs a one-time admin token to fetch tag/field mappings. Use the Self Client approach **once** just for config generation:

1. Go to [Zoho API Console](https://api-console.zoho.com/) → Self Client → Generate Code
2. Scope: `ZohoBooks.settings.READ`
3. Run:

```bash
ZOHO_TEMP_TOKEN=<grant_token> pnpm tsx scripts/fetch-zoho-config.ts
```

This writes `src/app/finance/_lib/zoho-books/zoho-config.json` with:

- Reporting tag IDs (Financial Assistance, School, Programme)
- All tag option IDs (each school code, program code, sponsor type)
- Contact custom field IDs (Account Code)

**Re-run** if you add/change reporting tags or custom fields in Zoho Books.

### 2.6 Invite Finance Users to Zoho Books

For each finance staff member who will use the Zoho integration:

1. In Zoho Books: **Settings → Users → Invite User**
2. Enter their work email address
3. Assign an appropriate role:
   - **Admin**: Full access to all modules and settings
   - **Staff**: Read access + limited write (recommended for most finance users)
   - **Custom role**: Fine-grained permission control (create one for Registry use)
4. User accepts the Zoho Books invitation via email
5. In Registry: User navigates to the finance section and clicks **"Connect Zoho Books"**

---

## 3. Per-User Token Management

### 3.1 Database Schema

A `zoho_tokens` table stores encrypted per-user tokens:

```sql
CREATE TABLE zoho_tokens (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  refresh_token    TEXT NOT NULL,        -- encrypted at rest
  access_token     TEXT,                 -- cached, encrypted at rest
  token_expires_at TIMESTAMP,            -- when access_token expires
  zoho_user_id     TEXT,                 -- from GET /users/me
  zoho_email       TEXT,                 -- for display/debugging
  dc_location      TEXT DEFAULT 'com',   -- data center (com, eu, in, etc.)
  connected_at     TIMESTAMP NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(user_id)                        -- one Zoho connection per user
);
```

### 3.2 OAuth Connection Flow

#### Step 1 — Initiate

Finance user clicks **"Connect Zoho Books"** in Registry.

The app generates a CSRF token, stores it in the user's session, and redirects to:

```
GET https://accounts.zoho.com/oauth/v2/auth
  ?client_id={ZOHO_BOOKS_CLIENT_ID}
  &response_type=code
  &redirect_uri=http://localhost:3000/api/zoho/callback
  &scope=ZohoBooks.contacts.READ,ZohoBooks.contacts.CREATE,ZohoBooks.contacts.UPDATE,...
  &access_type=offline
  &prompt=consent
  &state={csrf_token}
```

Parameters:

| Parameter | Value | Purpose |
|---|---|---|
| `client_id` | From `.env` | Identifies the Registry Web application |
| `response_type` | `code` | Authorization Code flow |
| `redirect_uri` | `http://localhost:3000/api/zoho/callback` | Must match API Console exactly |
| `scope` | All required Zoho Books scopes | What permissions the app requests |
| `access_type` | `offline` | Ensures a refresh token is returned |
| `prompt` | `consent` | Forces consent every time (ensures fresh refresh token) |
| `state` | Random CSRF token | Verified on callback to prevent CSRF attacks |

#### Step 2 — User Grants Consent

Zoho shows a login/consent page. The finance user:

1. Logs in with their Zoho account (if not already logged in)
2. Sees the list of permissions the app is requesting
3. Clicks **"Accept"**

Zoho redirects back to:

```
http://localhost:3000/api/zoho/callback?code={auth_code}&location={dc}&state={csrf_token}
```

#### Step 3 — Callback Handler

The route handler at `/api/zoho/callback` (a Next.js API route):

1. **Verify CSRF**: Check `state` matches the stored CSRF token
2. **Exchange code for tokens**:

```
POST https://accounts.zoho.com/oauth/v2/token
  ?grant_type=authorization_code
  &client_id={ZOHO_BOOKS_CLIENT_ID}
  &client_secret={ZOHO_BOOKS_CLIENT_SECRET}
  &redirect_uri=http://localhost:3000/api/zoho/callback
  &code={authorization_code}
```

Response:

```json
{
  "access_token": "1000.xxxx.yyyy",
  "refresh_token": "1000.aaaa.bbbb",
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

3. **Get Zoho user identity**: Call `GET /users/me` with the new access token
4. **Encrypt and store**: Save both tokens in `zoho_tokens` for the current Registry user
5. **Store DC location**: Save the `location` from Zoho's callback (for multi-DC token refresh)
6. **Redirect**: Send user back to the finance page with a success message

#### Step 4 — Ongoing Usage

All subsequent API calls:

1. Get current Registry user from session
2. Look up `zoho_tokens` for that user
3. Check if `access_token` is still valid (with 60-second safety margin)
4. If expired, refresh using `refresh_token` and update the DB
5. Make the API call with the user's own token
6. Zoho logs the action as this specific user

### 3.3 Token Refresh

Access tokens expire after 1 hour. The client automatically refreshes:

```
POST https://accounts.{dc_domain}/oauth/v2/token
  ?grant_type=refresh_token
  &client_id={ZOHO_BOOKS_CLIENT_ID}
  &client_secret={ZOHO_BOOKS_CLIENT_SECRET}
  &refresh_token={stored_refresh_token}
```

The refresh flow:

1. Check if cached `access_token` is still valid (with 60-second buffer)
2. If expired, use the `refresh_token` to get a new access token
3. Update `access_token` and `token_expires_at` in the database
4. If refresh fails with `invalid_code`, the connection is broken — user must re-authorize

### 3.4 Token Limits (Zoho-Enforced)

| Token Type | Limit | Notes |
|---|---|---|
| Refresh tokens | Max 20 per user per client | Oldest auto-invalidated when exceeded |
| Access tokens | Max 10 per refresh token | Oldest auto-invalidated when exceeded |
| Access token requests | Max 10 per 10 minutes per refresh token | Throttled — reuse tokens |
| Authorization codes | Max 10 per user per 10 minutes | Throttled |
| Authorization code validity | 2 minutes | One-time use |
| Access token validity | 1 hour (3600 seconds) | Must refresh after |

### 3.5 Multi-DC Support

Zoho uses regional data centers. A user in the EU has their data at `accounts.zoho.eu`, not `accounts.zoho.com`. The OAuth callback includes a `location` parameter.

Store this per-user and use the correct domain for all token operations:

| Location | Accounts URL | API Base URL |
|---|---|---|
| (default / US) | `https://accounts.zoho.com` | `https://www.zohoapis.com/books/v3` |
| `eu` | `https://accounts.zoho.eu` | `https://www.zohoapis.eu/books/v3` |
| `in` | `https://accounts.zoho.in` | `https://www.zohoapis.in/books/v3` |
| `com.au` | `https://accounts.zoho.com.au` | `https://www.zohoapis.com.au/books/v3` |
| `jp` | `https://accounts.zoho.jp` | `https://www.zohoapis.jp/books/v3` |

### 3.6 Disconnection & Revocation

**From Registry** (finance user clicks "Disconnect Zoho"):

1. Delete the `zoho_tokens` row for the user
2. Optionally call `POST https://accounts.zoho.com/oauth/v2/token/revoke?token={refresh_token}`

**From Zoho** (user revokes via [Connected Apps](https://accounts.zoho.com/home#sessions/connectedapps)):

1. User revokes access for Registry Web in Zoho Accounts
2. Next API call from Registry fails with `INVALID_OAUTHTOKEN`
3. Registry detects the failure and prompts the user to re-connect

---

## 4. Zoho Audit Trail Benefits

This is the primary motivation for per-user OAuth.

### What Zoho Records

When an API call is made with a user's own access token, Zoho's audit trail captures:

| Field | Value |
|---|---|
| **Who** | The actual Zoho user (e.g., "Jane Doe") |
| **What** | The operation (e.g., "Created contact Mathapelo Letsoela") |
| **When** | Timestamp of the action |
| **Where** | IP address and client information |
| **Module** | The Zoho Books module affected (Contacts, Invoices, etc.) |

### Where to View

In Zoho Books: **Settings → Audit Trail** (or Activity Logs depending on your plan)

### Comparison

| Scenario | Self Client Audit Log | Per-User OAuth Audit Log |
|---|---|---|
| Jane creates a contact | "Admin Account created contact..." | "Jane Doe created contact..." |
| John views invoices | (no write = no log) | (no write = no log) |
| Jane updates a contact | "Admin Account updated contact..." | "Jane Doe updated contact..." |
| Investigation: "Who created this contact?" | Cannot determine | Clearly shows "Jane Doe" |

---

## 5. Zoho Books User Roles

### Available Roles

| Role | Access Level | Recommended For |
|---|---|---|
| **Admin** | Full access — all modules, settings, users | Finance department heads |
| **Staff** | Limited access as configured | General finance users |
| **Custom roles** | Fine-grained per-module permissions | Tailored Registry integration use |

### Recommended Custom Role for Registry

Create a custom role in Zoho Books for Registry finance users:

| Module | Permission |
|---|---|
| Contacts | Create, Read, Update |
| Invoices | Read |
| Payments Received | Read |
| Estimates | Read |
| Sales Receipts | Read |
| Credit Notes | Read |
| Settings | Read |

This ensures Registry users can only do what the integration needs — nothing more.

---

## 6. How Students Map to Zoho Contacts

Students are stored as **Business** contacts. The field mapping:

| Zoho Field | Value | Purpose |
|---|---|---|
| `contact_name` | Full name (e.g., `Mathapelo Letsoela`) | Display name |
| `first_name` | Student number as string (e.g., `901017723`) | Used by `search_text` lookup |
| `company_name` | Program name (e.g., `Diploma in Information Technology`) | Program identification |
| `cf_account_code` | Student number as string | **Primary match field** |
| `customer_sub_type` | `business` | Always business |
| `contact_type` | `customer` | Always customer |
| `payment_terms` | `0` (Due on Receipt) | Standard terms |
| `notes` | `{programName} Initial Intake Year {intakeDate}` | Reference info |
| `contact_persons[0]` | Primary contact person with `first_name` = student number | Required for business contacts |
| `tags` | Financial Assistance, School, Programme | Reporting categorization |

### Contact Lookup Strategy

1. `GET /contacts?search_text={stdNo}` — searches across FirstName, CompanyName, EmailID, Notes, Name
2. Verify result by checking `cf_account_code === stdNo` (primary) or `first_name === stdNo` (fallback)

### Contact Creation

`createZohoContact(stdNo)` orchestrates:

1. Fetches student data from Registry (name, phone, email, programs)
2. Resolves the active program, school, and sponsor
3. Builds contact input with all fields + reporting tags
4. POSTs to `/contacts` **using the finance user's own token**
5. Saves the returned `contact_id` back to the student record

> Zoho's audit log records: "Jane Doe created contact Mathapelo Letsoela"

---

## 7. Reporting Tags & Contact Tagging

Three tags are configured:

| Tag | Example Values | Maps From |
|---|---|---|
| **Financial Assitance** (sic) | `ManPower`, `Private` | Sponsor code |
| **School** | `FINT`, `FBS`, `FFTB`, `FCO`, `FDSI`, etc. | School code |
| **Programe** (sic) | `DIT`, `BIT`, `BABJ`, etc. | Program code |

> Tag names contain typos — these match Zoho's actual configuration.

### School Code Aliases

| Internal Code | Zoho Tag Option |
|---|---|
| `FICT` | `FINT` |
| `FBMG` | `FBS` |
| `FCM` | `FCO` |
| `FDI` | `FDSI` |

### Sponsor Code Mapping

| Registry Sponsor Code | Zoho Tag Option |
|---|---|
| `NMDS` | `ManPower` |
| `PRV` | `Private` |

---

## 8. API Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/oauth/v2/auth` | GET | Redirect finance user to Zoho consent screen |
| `/oauth/v2/token` | POST | Exchange auth code or refresh access token |
| `/oauth/v2/token/revoke` | POST | Revoke a refresh or access token |
| `/users/me` | GET | Get current Zoho user identity after connection |
| `/contacts` | GET | Search contacts by student number |
| `/contacts/{id}` | GET | Get full contact detail with credits/receivables |
| `/contacts` | POST | Create new student contact |
| `/contacts/{id}` | PUT | Update existing student contact |
| `/invoices` | GET | List invoices for a contact |
| `/invoices/{id}` | GET | Get invoice detail with line items |
| `/customerpayments` | GET | List payments for a contact |
| `/estimates` | GET | List estimates for a contact |
| `/salesreceipts` | GET | List sales receipts for a contact |
| `/salesreceipts/{id}` | GET | Get sales receipt detail with line items |
| `/creditnotes` | GET | List credit notes for a contact |
| `/settings/tags` | GET | List reporting tags (config generation) |
| `/settings/tags/{id}` | GET | Get tag options (config generation) |
| `/settings/customfields` | GET | List custom fields (config generation) |

---

## 9. Security Considerations

| Concern | Mitigation |
|---|---|
| Token at rest | Encrypt refresh tokens in the database (AES-256 or equivalent) |
| Token in transit | All Zoho API calls use HTTPS; tokens never sent to browser |
| CSRF on callback | `state` parameter verified against session-stored value |
| Cross-org access | Validate `organization_id` matches expected value after connection |
| Token exposure | Never log tokens; never include in error messages sent to client |
| Revocation | Support both user-initiated disconnect and Zoho-side revocation detection |
| Broken connections | Detect `INVALID_OAUTHTOKEN` and prompt re-authorization gracefully |

---

## 10. File Structure

```
src/app/finance/_lib/zoho-books/
├── client.ts            # Per-user OAuth HTTP client (resolves tokens from DB)
├── service.ts           # Business logic (find/create contacts, fetch transactions)
├── actions.ts           # Server Actions (resolve user tokens, call service)
├── types.ts             # TypeScript interfaces for all Zoho entities
└── zoho-config.json     # Generated tag/field ID mappings (do not edit manually)

src/app/finance/zoho-tokens/
├── _schema/
│   └── zohoTokens.ts    # Drizzle schema for zoho_tokens table
├── _server/
│   ├── repository.ts    # CRUD for zoho_tokens (encrypted storage)
│   └── actions.ts       # Server Actions for connect/disconnect flows
└── _components/
    └── ConnectZohoBtn.tsx  # "Connect Zoho Books" / "Disconnect" button

src/app/api/zoho/
└── callback/route.ts    # OAuth callback handler (GET /api/zoho/callback)

scripts/
└── fetch-zoho-config.ts # Generates zoho-config.json from live Zoho API
```

### Consumer Components

All UI lives in `src/app/registry/students/_components/finance/`:

| Component | Purpose |
|---|---|
| `StudentFinanceView.tsx` | Main finance tab — orchestrates all sub-tabs |
| `FinancialOverview.tsx` | Summary cards (total, paid, outstanding, credits) |
| `InvoicesTab.tsx` | Invoice list with expandable detail |
| `PaymentsTab.tsx` | Payments list |
| `EstimatesTab.tsx` | Estimates list with expandable detail |
| `SalesReceiptsTab.tsx` | Sales receipts list with expandable detail |
| `CreateContactBtn.tsx` | Button to create Zoho contact for a student |
| `ConnectZohoBtn.tsx` | Connect/disconnect Zoho account button |

---

## 11. Rate Limits

| Plan | Daily Requests | Per-Minute Limit | Concurrent Calls |
|---|---|---|---|
| Free | 1,000 | 100 | 5 |
| Standard | 2,000 | 100 | 10 |
| Professional+ | 5,000–10,000 | 100 | 10 |

Rate limits are **per organization**, not per user. Multiple finance users making concurrent calls share the same pool.

---

## 12. Migration from Self Client

If migrating from the Self Client setup:

1. **Register** a Server-based Application in [Zoho API Console](https://api-console.zoho.com/) with redirect URIs for both `https://portal.luct.ac.ls/api/zoho/callback` and `http://localhost:3000/api/zoho/callback`
2. **Create** the `zoho_tokens` table via Drizzle migration
3. **Update** `client.ts` to resolve tokens per-user from the database
4. **Add** the OAuth callback route at `src/app/api/zoho/callback/route.ts`
5. **Add** the "Connect Zoho Books" button to the finance UI
6. **Remove** `ZOHO_BOOKS_REFRESH_TOKEN` from `.env` files
7. **Each finance user** connects their own Zoho account (one-time setup per user)

### Backward Compatibility

During migration, you can support both modes:

1. If user has a `zoho_tokens` entry → use per-user tokens
2. If not and `ZOHO_BOOKS_REFRESH_TOKEN` env var exists → fall back to service account (with deprecation warning in logs)
3. Once all finance users are migrated → remove fallback and env var

---

## 13. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Zoho not connected" error | Finance user hasn't completed OAuth flow | Click "Connect Zoho Books" and complete consent |
| `invalid_code` on callback | Authorization code expired (2 min) or reused | Restart connection flow |
| `INVALID_OAUTHTOKEN` on API calls | Access token expired and refresh failed | Check if refresh token was revoked; user must re-connect |
| `Access Denied` on token refresh | Throttle limit (10 requests / 10 min) | Wait and retry; ensure tokens are cached properly |
| `code: 57` — "not authorized" | Finance user's Zoho role lacks permission | Admin must update user's role in Zoho Books |
| HTTP 429 | Organization rate limit exceeded | Wait a few minutes; reduce concurrent requests |
| Wrong data center errors | Token refresh sent to wrong DC | Ensure `dc_location` stored from OAuth callback is used |
| User sees "permission denied" in Zoho | Zoho role too restrictive | Update the user's Zoho Books role to include needed modules |
| `cf_account_code` empty on created contact | Old code bug (fixed) | `createStudentContact` sends both flat `cf_account_code` and `custom_fields` array |
| Student not found via `findStudentContact` | `cf_account_code` was never set | Manually update contact in Zoho Books or re-create |
| Tag not applied | Tag option doesn't exist for the code | Run `fetch-zoho-config.ts` to refresh mappings |
| Can't connect — "access_denied" | Finance user isn't a member of the Zoho Books org | Invite user in Zoho Books → Settings → Users first |
| Max refresh tokens reached (20) | Too many re-authorizations | Oldest auto-invalidated by Zoho; no action needed |
| Multiple finance users see different data | Expected — each sees data their Zoho role allows | Align Zoho roles for consistent access |
