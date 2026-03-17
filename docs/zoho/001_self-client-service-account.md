# Option 1: Self Client (Service Account)

Single shared Zoho account for all API calls. Simple setup, no per-user token management.

> **Trade-off**: All Zoho audit log entries show the same service account — you cannot tell which finance user performed an action in Zoho's logs.

---

## 1. Initial Setup

### 1.1 Zoho Books Organization

The app connects to a single Zoho Books organization. The organization must:

- Use **LSL (Lesotho Loti)** as the base currency
- Have **Reporting Tags** configured (see [Section 5](#5-reporting-tags--contact-tagging))
- Have a **Contact Custom Field** named `Account Code` (type: string) — this is the primary field used to match students by student number

### 1.2 Create a Self Client (OAuth 2.0)

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click **Add Client** → **Self Client**
3. Save the **Client ID** and **Client Secret**

### 1.3 Generate a Refresh Token

Generate a grant token in the API Console with **all** required scopes:

```
ZohoBooks.invoices.READ,ZohoBooks.customerpayments.READ,ZohoBooks.salesorders.READ,ZohoBooks.estimates.ALL,ZohoBooks.projects.READ,ZohoBooks.expenses.READ,ZohoBooks.creditnotes.READ,ZohoBooks.purchaseorders.READ,ZohoBooks.bills.READ,ZohoBooks.debitnotes.READ,ZohoBooks.vendorpayments.READ,ZohoBooks.banking.READ,ZohoBooks.accountants.READ,ZohoBooks.contacts.READ,ZohoBooks.contacts.CREATE,ZohoBooks.contacts.UPDATE,ZohoBooks.settings.UPDATE,ZohoBooks.settings.READ
```

> Grant tokens expire quickly (typically 3 minutes). Exchange it immediately.

Exchange the grant token for a permanent refresh token:

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_GRANT_TOKEN"
```

The response contains `access_token` and `refresh_token`. The **refresh token is permanent** until revoked — store it securely.

> If you get `invalid_code`, the grant token expired or was already used. Generate a new one from the API Console.

### 1.4 Environment Variables

Add to `.env.local` (and your deployment environment):

```env
ZOHO_BOOKS_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
ZOHO_BOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_BOOKS_REFRESH_TOKEN=1000.xxxxxxxxxxxxx.yyyyyyyyyyyyyy
ZOHO_BOOKS_ORGANIZATION_ID=823788793
```

Optional overrides (defaults shown):

```env
ZOHO_BOOKS_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_BOOKS_API_BASE_URL=https://www.zohoapis.com/books/v3
```

### 1.5 Generate `zoho-config.json`

The app uses a static JSON config that maps Zoho reporting tag IDs and custom field IDs. After setting up environment variables, run:

```bash
pnpm tsx scripts/fetch-zoho-config.ts
```

This connects to the Zoho API and writes `src/app/finance/_lib/zoho-books/zoho-config.json` with:

- Reporting tag IDs (Financial Assistance, School, Programme)
- All tag option IDs (each school code, program code, sponsor type)
- Contact custom field IDs (Account Code)

**This must be re-run** if you add/change reporting tags or custom fields in Zoho Books.

---

## 2. How It Works

### Token Flow

```
App starts
  → Reads ZOHO_BOOKS_REFRESH_TOKEN from .env
  → On first API call, exchanges refresh token for access token
  → Caches access token in memory (~60 min, with 60s safety buffer)
  → On 401 response, force-refreshes and retries once
  → All finance users share the same token
```

### Architecture

```
Finance User → Server Action (permission check) → Service → Zoho API
                                                       ↑
                                              Single shared token
                                              from env variable
```

---

## 3. Authentication & Token Management

The client (`src/app/finance/_lib/zoho-books/client.ts`) handles OAuth transparently:

- Access tokens are cached in memory with a 60-second pre-expiry buffer
- On HTTP 401, the token is force-refreshed and the request is retried once
- On HTTP 429, a rate-limit error is thrown immediately (no retry)
- All requests inject `organization_id` as a query parameter automatically

---

## 4. How Students Map to Zoho Contacts

Students are stored as **Business** contacts. The field mapping:

| Zoho Field | Value | Purpose |
|---|---|---|
| `contact_name` | Full name (e.g., `Mathapelo Letsoela`) | Display name |
| `first_name` | Student number as string (e.g., `901017723`) | Used by `search_text` lookup |
| `company_name` | Program name (e.g., `Diploma in Information Technology`) | Program identification |
| `cf_account_code` | Student number as string | **Primary match field** — `findStudentContact` verifies contacts against this |
| `customer_sub_type` | `business` | Always business |
| `contact_type` | `customer` | Always customer |
| `payment_terms` | `0` (Due on Receipt) | Standard terms |
| `notes` | `{programName} Initial Intake Year {intakeDate}` | Reference info |
| `contact_persons[0]` | Primary contact person with `first_name` = student number | Required for business contacts to populate `first_name` correctly |
| `tags` | Financial Assistance, School, Programme | Reporting categorization |

### Contact Lookup Strategy

The Zoho Contacts API does not support filtering by custom fields directly. The app uses:

1. `GET /contacts?search_text={stdNo}` — searches across FirstName, CompanyName, EmailID, Notes, Name
2. Verify result by checking `cf_account_code === stdNo` (primary) or `first_name === stdNo` (fallback)

### Contact Creation

`createZohoContact(stdNo)` in `actions.ts` orchestrates the full flow:

1. Fetches student data from Registry (name, phone, email, programs)
2. Resolves the active program, school, and sponsor
3. Builds `CreateStudentContactInput` with all available fields
4. Calls `createStudentContact(input)` which POSTs to `/contacts` with:
   - Contact info (name, email, phone, mobile)
   - A primary contact person (with `first_name` = student number)
   - Account Code custom field (both flat `cf_account_code` and `custom_fields` array)
   - Reporting tags (Financial Assistance, School, Programme) resolved via `zoho-config.json`
5. Saves the returned `contact_id` back to the student record

---

## 5. Reporting Tags & Contact Tagging

Zoho Books Reporting Tags are used to categorize students for financial reporting. Three tags are configured:

| Tag | Example Values | Maps From |
|---|---|---|
| **Financial Assitance** (sic) | `ManPower`, `Private` | Sponsor code via `SPONSOR_CODE_TO_ZOHO_TAG` |
| **School** | `FINT`, `FBS`, `FFTB`, `FCO`, `FDSI`, etc. | School code (with alias resolution) |
| **Programe** (sic) | `DIT`, `BIT`, `BABJ`, etc. | Program code |

> The tag names contain typos (`Assitance`, `Programe`) — these match the actual Zoho configuration and must not be "corrected".

### School Code Aliases

Some internal school codes differ from Zoho tag options:

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

## 6. API Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/oauth/v2/token` | POST | Refresh access token (on `accounts.zoho.com`) |
| `/contacts` | GET | Search contacts by student number |
| `/contacts/{id}` | GET | Get full contact detail with credits/receivables |
| `/contacts` | POST | Create new student contact |
| `/invoices` | GET | List invoices for a contact |
| `/invoices/{id}` | GET | Get invoice detail with line items |
| `/customerpayments` | GET | List payments for a contact |
| `/estimates` | GET | List estimates for a contact |
| `/salesreceipts` | GET | List sales receipts for a contact |
| `/salesreceipts/{id}` | GET | Get sales receipt detail with line items |
| `/creditnotes` | GET | List credit notes for a contact |
| `/settings/tags` | GET | List reporting tags (used by `fetch-zoho-config.ts`) |
| `/settings/tags/{id}` | GET | Get tag options (used by `fetch-zoho-config.ts`) |
| `/settings/customfields` | GET | List custom fields (used by `fetch-zoho-config.ts`) |

---

## 7. File Structure

```
src/app/finance/_lib/zoho-books/
├── client.ts            # OAuth 2.0 HTTP client (zohoGet, zohoPost)
├── service.ts           # Business logic (find/create contacts, fetch transactions)
├── actions.ts           # Server Actions (wrappers for use from components)
├── types.ts             # TypeScript interfaces for all Zoho entities
└── zoho-config.json     # Generated tag/field ID mappings (do not edit manually)

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

---

## 8. Rate Limits

| Plan | Daily Requests | Per-Minute Limit | Concurrent Calls |
|---|---|---|---|
| Free | 1,000 | 100 | 5 |
| Standard | 2,000 | 100 | 10 |
| Professional+ | 5,000–10,000 | 100 | 10 |

Each student finance view loads ~5 API calls (contact + invoices + payments + estimates + receipts). Contact creation is 1–2 calls.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `invalid_code` on token exchange | Grant token expired or reused | Generate a new grant token from API Console |
| `INVALID_OAUTHTOKEN` on API calls | Refresh token revoked or invalid | Regenerate refresh token from scratch (Section 1.3) |
| `code: 57` — "not authorized" | Missing OAuth scopes | Regenerate grant token with all scopes listed in Section 1.3 |
| HTTP 429 | Rate limit exceeded | Wait a few minutes; reduce concurrent requests |
| `cf_account_code` empty on created contact | Old code bug (fixed) | `createStudentContact` now sends both flat `cf_account_code` and `custom_fields` array |
| `contact_persons` empty | Old code bug (fixed) | `createStudentContact` now sends `contact_persons` array with primary contact |
| Student not found via `findStudentContact` | `cf_account_code` was never set | Manually update the contact in Zoho Books or re-create it |
| Tag not applied | Tag option doesn't exist for the code | Run `fetch-zoho-config.ts` to refresh mappings, or add the tag option in Zoho Books Settings → Reporting Tags |
