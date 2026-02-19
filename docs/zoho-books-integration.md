# Zoho Books Integration Guide

> **Verified against Zoho Books API docs on 2026-02-19**. External APIs can change; re-check official docs before production rollout.

> **Goal**: Verify student payments in Zoho Books before allowing operations in the Registry Web app. When a student wants to perform an action (e.g., print a student card), the app checks Zoho Books for a matching **paid** invoice. If found, the operation proceeds and a local `paymentReceipt` record is created. If not found, the operation is denied.

> **Sync Direction**: Zoho Books → App (one-way, on-demand verification)
>
> **Starting Scope**: Student Card payment verification (extend to other receipt types later)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Step 1 — Discover How Students & Payments Are Stored in Zoho Books](#step-1--discover-how-students--payments-are-stored-in-zoho-books)
3. [Step 2 — Register an OAuth App in Zoho Developer Console](#step-2--register-an-oauth-app-in-zoho-developer-console)
4. [Step 3 — Generate OAuth Tokens (Self Client)](#step-3--generate-oauth-tokens-self-client)
5. [Step 4 — Verify Connectivity & Find Your Organization ID](#step-4--verify-connectivity--find-your-organization-id)
6. [Step 5 — Map Zoho Books Data to Registry Web Receipt Types](#step-5--map-zoho-books-data-to-registry-web-receipt-types)
7. [Step 6 — Add Environment Variables](#step-6--add-environment-variables)
8. [Step 7 — Implement the Zoho Books API Client](#step-7--implement-the-zoho-books-api-client)
9. [Step 8 — Implement the Payment Verification Service](#step-8--implement-the-payment-verification-service)
10. [Step 9 — Create Server Actions](#step-9--create-server-actions)
11. [Step 10 — Integrate Into the Student Card Flow (Example)](#step-10--integrate-into-the-student-card-flow-example)
12. [Step 11 — Extend to Other Receipt Types](#step-11--extend-to-other-receipt-types)
13. [Step 12 — Testing Checklist](#step-12--testing-checklist)
14. [Step 13 — Rate Limits & Error Handling](#step-13--rate-limits--error-handling)
15. [Appendix A — Zoho Books API Quick Reference](#appendix-a--zoho-books-api-quick-reference)
16. [Appendix B — Troubleshooting](#appendix-b--troubleshooting)

---

## 1. Prerequisites

Before you begin, make sure you have:

- [ ] **Admin access** to Limkokwing's Zoho Books account (confirm your data center domain: `.com`, `.eu`, `.in`, `.com.au`, `.jp`, `.ca`, `.com.cn`, `.sa`)
- [ ] **A Zoho account** that can access the [Zoho API Console](https://api-console.zoho.com/)
- [ ] **cURL or Postman** installed for testing API calls
- [ ] Access to the Registry Web codebase and the ability to deploy environment variables

---

## Step 1 — Discover How Students & Payments Are Stored in Zoho Books

> **Why**: Before writing any code, you need to understand how Zoho Books stores student data and payment information. This step is 100% manual exploration — no coding yet.

### 1.1 Find Out How Students Are Identified

1. Open [Zoho Books](https://books.zoho.com) and log in with admin credentials.
2. Go to **Sales → Customers** (or **Contacts** in the left sidebar).
3. Search for a student you know (e.g., by name or student number like `901234567`).
4. Click on the student's contact record and note:

| Question | Where to look | Write down the answer |
|----------|---------------|----------------------|
| Is the student number (`stdNo`) the **Contact Name**? | The main name displayed | _________________ |
| Is the student number in the **Contact Number** field? | Under "Other Details" section | _________________ |
| Is it in a **Custom Field** (e.g., "Student ID")? | Scroll down to "Custom Fields" | _________________ |
| Is the student number in the **Company Name**? | Near the top of the contact | _________________ |
| What is the Zoho **Contact ID** for this student? | In the URL when viewing: `contacts/XXXXXXXXX` | _________________ |

5. **Write down exactly which field contains the student number.** This is critical for the API integration.

### 1.2 Find Out How Payment Types Are Identified

1. While viewing the student's contact, click the **Invoices** tab (or go to **Sales → Invoices** and filter by this customer).
2. Find an invoice for a "Student Card" payment. Open it and note:

| Question | Where to look | Write down the answer |
|----------|---------------|----------------------|
| What is the **Item Name** on the invoice line item? (e.g., "Student Card", "Student Card Fee") | Under "Item Details" in the invoice | _________________ |
| What is the **Invoice Number** format? | Top of the invoice (e.g., `INV-00042`) | _________________ |
| Is the invoice **status** "Paid"? | Status badge on the invoice | _________________ |
| What is the **Item ID** in Zoho? | Click on the item name → check the URL | _________________ |

3. **Repeat for other payment types** if you can find them:
   - Graduation Gown
   - Graduation Fee
   - Repeat Module
   - Late Registration
   - Tuition Fee
   - Library Fine
   - Application Fee

4. Go to **Settings → Items** to see the full list of items. Note down IDs and exact names of items that correspond to your receipt types.

### 1.3 Record Your Findings

Create a mapping table based on what you found:

```
Registry Web Receipt Type  →  Zoho Books Item Name  →  Zoho Item ID
─────────────────────────────────────────────────────────────────────
student_card               →  "Student Card"         →  XXXXXXXXXX
graduation_gown            →  "Graduation Gown"      →  XXXXXXXXXX
graduation_fee             →  "Graduation Fee"       →  XXXXXXXXXX
repeat_module              →  "Repeat Module"        →  XXXXXXXXXX
late_registration          →  "Late Registration"    →  XXXXXXXXXX
tuition_fee                →  "Tuition Fee"          →  XXXXXXXXXX
library_fine               →  "Library Fine"         →  XXXXXXXXXX
application_fee            →  "Application Fee"      →  XXXXXXXXXX
```

> **IMPORTANT**: The exact names and IDs will be needed in Step 5 and Step 6. Do NOT guess — verify in Zoho Books.

---

## Step 2 — Register an OAuth App in Zoho Developer Console

> **Why**: The Zoho Books API uses OAuth 2.0. You need an app registration to get a Client ID and Client Secret.

### 2.1 Go to the Zoho Developer Console

1. Open [https://api-console.zoho.com/](https://api-console.zoho.com/)
2. Log in with the **same Zoho account** that has admin access to Zoho Books.

### 2.2 Create a Self Client

Since the Registry Web is a **server-side app** that runs backend jobs (checking payments during operations), a **Self Client** is the simplest approach.

1. Click **Add Client** (or **GET STARTED**).
2. Choose **Self Client**.
3. Click **Create Now** (or **OK** on any confirmation popup).
4. You will see your **Client ID** and **Client Secret**. **Save them immediately** somewhere secure (password manager or `.env` file). You cannot see the secret again later.

```
Client ID:     1000.XXXXXXXXXXXXXXXXXXXX
Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **SECURITY WARNING**: Never commit the Client Secret to Git. It goes in `.env.local` only.

---

## Step 3 — Generate OAuth Tokens (Self Client)

> **Why**: With a Self Client, you generate a temporary "Grant Token" from the console, then exchange it for a permanent Refresh Token. The Refresh Token is used by your app to automatically get short-lived Access Tokens.

### 3.1 Generate a Grant Token

1. In the [Zoho API Console](https://api-console.zoho.com/), click your Self Client.
2. Click the **Generate Code** tab.
3. In the **Scope** field, enter (comma-separated, no spaces around commas):

```
ZohoBooks.invoices.READ,ZohoBooks.contacts.READ,ZohoBooks.settings.READ
```

These scopes allow:
- `ZohoBooks.invoices.READ` — Search and read invoices (to check payment status)
- `ZohoBooks.contacts.READ` — Search and read contacts (to find students by student number)
- `ZohoBooks.settings.READ` — Read organization info and items list

4. For **Time Duration**, select **10 minutes** (you must use it within this window).
5. Enter a **Description** like: `Registry Web payment verification`
6. Click **Create**.
7. **Copy the generated Grant Token immediately.** It looks like:

```
1000.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyy
```

### 3.2 Exchange the Grant Token for a Refresh Token

> **You must do this within the time duration you selected above (e.g., 10 minutes).**

Open a terminal and run (replace the placeholder values):

> Use the accounts domain that matches your Zoho data center (`accounts.zoho.com`, `accounts.zoho.eu`, `accounts.zoho.in`, etc.).

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_GRANT_TOKEN"
```

> **Note**: No `redirect_uri` is needed for Self Client.

**Expected successful response:**

```json
{
  "access_token": "1000.xxxx...xxxx",
  "refresh_token": "1000.xxxx...xxxx",
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

8. **Save the `refresh_token` securely.** This is permanent (until revoked) and is what your app will use.

> **If you get `invalid_code`**: The grant token expired or was already used. Go back to Step 3.1 and generate a new one.

### 3.3 Test the Access Token

Verify it works by listing your organizations:

> Use the API domain from your token response (`api_domain`) and your region.

```bash
curl -X GET "https://www.zohoapis.com/books/v3/organizations" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

You should see your Limkokwing organization listed. **Note down the `organization_id`** — you'll need it for every API call.

---

## Step 4 — Verify Connectivity & Find Your Organization ID

### 4.1 Get Your Organization ID

From the response in Step 3.3, find the correct organization:

```json
{
  "organizations": [
    {
      "organization_id": "10234695",
      "name": "Limkokwing University",
      "is_default_org": true,
      "currency_code": "...",
      ...
    }
  ]
}
```

Write it down: `organization_id = _______________`

### 4.2 Test Searching for a Student

Try searching for a known student. Use supported List Contacts parameters such as `contact_name`, `company_name`, or `search_text`:

```bash
curl -X GET "https://www.zohoapis.com/books/v3/contacts?organization_id=YOUR_ORG_ID&search_text=901234567" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

If no results, try:
```bash
# Search by contact name
curl -X GET "https://www.zohoapis.com/books/v3/contacts?organization_id=YOUR_ORG_ID&contact_name=StudentName" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

**From the response**, confirm which field contains the student number. Note the `contact_id` for the next test.

> `search_text` searches contact name and notes; it does not directly query `contact_number`.

### 4.3 Test Searching for Invoices by Student

Use the `customer_id` found above:

```bash
curl -X GET "https://www.zohoapis.com/books/v3/invoices?organization_id=YOUR_ORG_ID&customer_id=CONTACT_ID&status=paid" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

Alternatively, search by item name:

```bash
curl -X GET "https://www.zohoapis.com/books/v3/invoices?organization_id=YOUR_ORG_ID&customer_id=CONTACT_ID&item_name=Student Card" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

**From this response**, confirm:
- ✅ You can find the student's invoices
- ✅ You can filter by paid invoices and item name
- ✅ The status is "paid" for completed payments
- ✅ The invoice number is available (this will become the `receiptNo` in our app)

> If you must validate exact line items, call `GET /invoices/{invoice_id}` for each candidate invoice.

---

## Step 5 — Map Zoho Books Data to Registry Web Receipt Types

Based on your exploration in Steps 1 and 4, fill in this **definitive mapping table**:

### 5.1 Student Identification Strategy

Choose ONE of the following based on what you found:

| Strategy | How student is found in Zoho | API parameter used |
|----------|-----------------------------|--------------------|
| **A: Contact Name = Student Number** | `contact_name` field equals `stdNo` (e.g., `"901234567"`) | `contact_name=901234567` |
| **B: Company Name = Student Number** | `company_name` field equals `stdNo` | `company_name=901234567` |
| **C: Custom Field = Student Number** | A custom field (e.g., `cf_student_id`) holds `stdNo` | `search_text=901234567` (searches contact name and notes; verify results manually) |
| **D: Contact Name = Student Full Name** | Search by name, then verify via custom field | `search_text=John Doe` |

> **Note**: The List Contacts API does **not** support searching by `contact_number` as a query parameter. If student numbers are stored in the `contact_number` field, use `search_text` and filter results client-side, or use `contact_name` / `company_name` if those fields hold the student number.

**Your choice**: ______ (fill in after Step 1 & 4 exploration)

### 5.2 Payment Type Mapping

| `receiptType` in Registry | Zoho Books Item Name | Zoho Item ID | Invoice Search Strategy |
|---------------------------|---------------------|--------------|------------------------|
| `student_card` | _________________ | _________________ | `item_name=...&status=paid` |
| `graduation_gown` | _________________ | _________________ | `item_name=...&status=paid` |
| `graduation_fee` | _________________ | _________________ | `item_name=...&status=paid` |
| `repeat_module` | _________________ | _________________ | `item_name=...&status=paid` |
| `late_registration` | _________________ | _________________ | `item_name=...&status=paid` |
| `tuition_fee` | _________________ | _________________ | `item_name=...&status=paid` |
| `library_fine` | _________________ | _________________ | `item_name=...&status=paid` |
| `application_fee` | _________________ | _________________ | `item_name=...&status=paid` |

> **Fill this table completely before proceeding to coding.** The code implementation depends entirely on these mappings.

---

## Step 6 — Add Environment Variables

Add these to your `.env.local` file (and to your deployment environment):

```env
# Zoho Books API Configuration
ZOHO_BOOKS_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
ZOHO_BOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_BOOKS_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyy
ZOHO_BOOKS_ORGANIZATION_ID=10234695
ZOHO_BOOKS_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_BOOKS_API_BASE_URL=https://www.zohoapis.com/books/v3

# Zoho Books Item Name Mapping (exact names from Zoho Books)
# Fill these with the EXACT item names you found in Step 5
ZOHO_BOOKS_ITEM_STUDENT_CARD=Student Card
ZOHO_BOOKS_ITEM_GRADUATION_GOWN=Graduation Gown
ZOHO_BOOKS_ITEM_GRADUATION_FEE=Graduation Fee
ZOHO_BOOKS_ITEM_REPEAT_MODULE=Repeat Module
ZOHO_BOOKS_ITEM_LATE_REGISTRATION=Late Registration
ZOHO_BOOKS_ITEM_TUITION_FEE=Tuition Fee
ZOHO_BOOKS_ITEM_LIBRARY_FINE=Library Fine
ZOHO_BOOKS_ITEM_APPLICATION_FEE=Application Fee

# Student lookup strategy: "contact_name" | "company_name" | "search_text" | "custom_field"
ZOHO_BOOKS_STUDENT_LOOKUP_FIELD=contact_name

# Required only when ZOHO_BOOKS_STUDENT_LOOKUP_FIELD=custom_field
ZOHO_BOOKS_STUDENT_CUSTOM_FIELD_LABEL=Student ID
```

---

## Step 7 — Implement the Zoho Books API Client

> This is the **core integration layer** that talks to Zoho Books' REST API. It handles OAuth token refresh automatically.

### 7.1 Create the Zoho API Client

Create file: `src/app/finance/_lib/zoho-books/client.ts`

```typescript
import { z } from 'zod/v4';

const envSchema = z.object({
  ZOHO_BOOKS_CLIENT_ID: z.string().min(1),
  ZOHO_BOOKS_CLIENT_SECRET: z.string().min(1),
  ZOHO_BOOKS_REFRESH_TOKEN: z.string().min(1),
  ZOHO_BOOKS_ORGANIZATION_ID: z.string().min(1),
  ZOHO_BOOKS_ACCOUNTS_URL: z.string().url().default('https://accounts.zoho.com'),
  ZOHO_BOOKS_API_BASE_URL: z.string().url().default('https://www.zohoapis.com/books/v3'),
});

interface ZohoErrorResponse {
  error?: string;
  code?: number;
  message?: string;
}

function getConfig() {
  return envSchema.parse({
    ZOHO_BOOKS_CLIENT_ID: process.env.ZOHO_BOOKS_CLIENT_ID,
    ZOHO_BOOKS_CLIENT_SECRET: process.env.ZOHO_BOOKS_CLIENT_SECRET,
    ZOHO_BOOKS_REFRESH_TOKEN: process.env.ZOHO_BOOKS_REFRESH_TOKEN,
    ZOHO_BOOKS_ORGANIZATION_ID: process.env.ZOHO_BOOKS_ORGANIZATION_ID,
    ZOHO_BOOKS_ACCOUNTS_URL: process.env.ZOHO_BOOKS_ACCOUNTS_URL,
    ZOHO_BOOKS_API_BASE_URL: process.env.ZOHO_BOOKS_API_BASE_URL,
  });
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function refreshAccessToken(): Promise<string> {
  const config = getConfig();
  const params = new URLSearchParams({
    refresh_token: config.ZOHO_BOOKS_REFRESH_TOKEN,
    client_id: config.ZOHO_BOOKS_CLIENT_ID,
    client_secret: config.ZOHO_BOOKS_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const response = await fetch(`${config.ZOHO_BOOKS_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!response.ok || data.error || !data.access_token || !data.expires_in) {
    throw new Error(
      `Zoho token refresh failed: ${response.status} ${data.error ?? response.statusText}`
    );
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 30) * 1000;
  return cachedAccessToken;
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  return refreshAccessToken();
}

export async function zohoGet<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const config = getConfig();

  async function runRequest(token: string) {
    const searchParams = new URLSearchParams({
      organization_id: config.ZOHO_BOOKS_ORGANIZATION_ID,
      ...params,
    });

    const url = `${config.ZOHO_BOOKS_API_BASE_URL}${endpoint}?${searchParams.toString()}`;
    return fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      cache: 'no-store',
    });
  }

  let response = await runRequest(await getAccessToken());

  if (response.status === 401) {
    response = await runRequest(await getAccessToken(true));
  }

  if (response.status === 429) {
    throw new Error(
      'Zoho Books API rate limit reached. Please try again in a few minutes.'
    );
  }

  const raw = (await response.json()) as T & ZohoErrorResponse;

  if (!response.ok || raw.error || (typeof raw.code === 'number' && raw.code !== 0)) {
    throw new Error(
      `Zoho API error [${response.status}]: ${raw.message ?? raw.error ?? 'Unknown error'}`
    );
  }

  return raw;
}
```

### 7.2 Create Zoho Books Types

Create file: `src/app/finance/_lib/zoho-books/types.ts`

```typescript
export interface ZohoContact {
  contact_id: string;
  contact_name?: string;
  company_name?: string;
  contact_number?: string;
  email?: string;
  status?: string;
  custom_fields?: Array<{
    index: number;
    value?: string;
    label: string;
  }>;
}

export interface ZohoContactsResponse {
  code: number;
  message: string;
  contacts?: ZohoContact[];
}

export interface ZohoLineItem {
  line_item_id: string;
  item_id?: string;
  name?: string;
  description?: string;
  quantity: number;
  rate: number;
  item_total: number;
}

export interface ZohoInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  line_items?: ZohoLineItem[]; // Only present in Get Invoice Detail, not in List Invoices
  reference_number: string;
}

export interface ZohoInvoicesResponse {
  code: number;
  message: string;
  invoices?: ZohoInvoice[];
}

export interface ZohoInvoiceDetailResponse {
  code: number;
  message: string;
  invoice: ZohoInvoice;
}
```

### 7.3 Create Zoho Books Service Functions

Create file: `src/app/finance/_lib/zoho-books/service.ts`

```typescript
import type { ReceiptType } from '@/core/database';
import { zohoGet } from './client';
import type {
  ZohoContact,
  ZohoContactsResponse,
  ZohoInvoiceDetailResponse,
  ZohoInvoicesResponse,
} from './types';

const STUDENT_LOOKUP_FIELD =
  process.env.ZOHO_BOOKS_STUDENT_LOOKUP_FIELD ?? 'contact_name';
const STUDENT_CUSTOM_FIELD_LABEL =
  process.env.ZOHO_BOOKS_STUDENT_CUSTOM_FIELD_LABEL ?? '';

function getZohoItemName(receiptType: ReceiptType): string {
  const mapping: Record<ReceiptType, string | undefined> = {
    student_card: process.env.ZOHO_BOOKS_ITEM_STUDENT_CARD,
    graduation_gown: process.env.ZOHO_BOOKS_ITEM_GRADUATION_GOWN,
    graduation_fee: process.env.ZOHO_BOOKS_ITEM_GRADUATION_FEE,
    repeat_module: process.env.ZOHO_BOOKS_ITEM_REPEAT_MODULE,
    late_registration: process.env.ZOHO_BOOKS_ITEM_LATE_REGISTRATION,
    tuition_fee: process.env.ZOHO_BOOKS_ITEM_TUITION_FEE,
    library_fine: process.env.ZOHO_BOOKS_ITEM_LIBRARY_FINE,
    application_fee: process.env.ZOHO_BOOKS_ITEM_APPLICATION_FEE,
  };

  const itemName = mapping[receiptType];
  if (!itemName) {
    throw new Error(
      `No Zoho Books item name configured for receipt type: ${receiptType}. ` +
      `Set ZOHO_BOOKS_ITEM_${receiptType.toUpperCase()} in environment variables.`
    );
  }
  return itemName;
}

export async function findStudentContact(
  stdNo: number
): Promise<ZohoContact | null> {
  const stdNoStr = String(stdNo);

  const params: Record<string, string> = {};

  switch (STUDENT_LOOKUP_FIELD) {
    case 'contact_name':
      params.contact_name = stdNoStr;
      break;
    case 'company_name':
      params.company_name = stdNoStr;
      break;
    case 'search_text':
    case 'custom_field':
    default:
      params.search_text = stdNoStr;
      break;
  }

  const response = await zohoGet<ZohoContactsResponse>('/contacts', params);

  const contacts = response.contacts ?? [];
  if (contacts.length === 0) {
    return null;
  }

  if (STUDENT_LOOKUP_FIELD === 'contact_name') {
    return contacts.find((contact) => contact.contact_name === stdNoStr) ?? null;
  }

  if (STUDENT_LOOKUP_FIELD === 'company_name') {
    return contacts.find((contact) => contact.company_name === stdNoStr) ?? null;
  }

  if (STUDENT_LOOKUP_FIELD === 'custom_field' && STUDENT_CUSTOM_FIELD_LABEL) {
    return (
      contacts.find((contact) =>
        (contact.custom_fields ?? []).some(
          (field) => field.label === STUDENT_CUSTOM_FIELD_LABEL && field.value === stdNoStr
        )
      ) ?? null
    );
  }

  return contacts[0];
}

export async function findPaidInvoices(
  contactId: string,
  receiptType: ReceiptType
): Promise<ZohoInvoicesResponse['invoices']> {
  const itemName = getZohoItemName(receiptType);

  const response = await zohoGet<ZohoInvoicesResponse>('/invoices', {
    customer_id: contactId,
    status: 'paid',
    item_name: itemName,
    sort_column: 'date',
  });

  return response.invoices ?? [];
}

export async function getInvoiceDetail(
  invoiceId: string
): Promise<ZohoInvoiceDetailResponse['invoice']> {
  const response = await zohoGet<ZohoInvoiceDetailResponse>(
    `/invoices/${invoiceId}`
  );
  return response.invoice;
}

export interface PaymentVerificationResult {
  verified: boolean;
  invoiceNumber: string | null;
  invoiceId: string | null;
  paidAmount: number | null;
  paidDate: string | null;
  error: string | null;
}

export async function verifyStudentPayment(
  stdNo: number,
  receiptType: ReceiptType
): Promise<PaymentVerificationResult> {
  const contact = await findStudentContact(stdNo);

  if (!contact) {
    return {
      verified: false,
      invoiceNumber: null,
      invoiceId: null,
      paidAmount: null,
      paidDate: null,
      error: `Student ${stdNo} not found in Zoho Books. The student may not have a financial account yet.`,
    };
  }

  const invoices = await findPaidInvoices(contact.contact_id, receiptType);

  if (invoices.length === 0) {
    const itemName = getZohoItemName(receiptType);
    return {
      verified: false,
      invoiceNumber: null,
      invoiceId: null,
      paidAmount: null,
      paidDate: null,
      error: `No paid invoice found for "${itemName}" for student ${stdNo}. The student needs to pay for this service first.`,
    };
  }

  const latestInvoice = [...invoices].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0];

  return {
    verified: true,
    invoiceNumber: latestInvoice.invoice_number,
    invoiceId: latestInvoice.invoice_id,
    paidAmount: latestInvoice.total,
    paidDate: latestInvoice.date,
    error: null,
  };
}
```

---

## Step 8 — Implement the Payment Verification Service

> This step connects the Zoho verification to the existing `paymentReceipts` system.

### 8.1 Add a Server Action for Payment Verification

Add to file: `src/app/finance/payment-receipts/_server/actions.ts`

```typescript
'use server';

import type { ReceiptType } from '@/core/database';
import { verifyStudentPayment } from '@finance/_lib/zoho-books/service';
import { paymentReceiptService as service } from './service';

type PaymentReceiptData = {
  receiptType: ReceiptType;
  receiptNo: string;
};

export async function addPaymentReceipt(
  graduationRequestId: number,
  receipt: PaymentReceiptData
) {
  return service.addPaymentReceipt(graduationRequestId, receipt);
}

export async function removePaymentReceipt(receiptId: string) {
  return service.removePaymentReceipt(receiptId);
}

export async function verifyPayment(
  stdNo: number,
  receiptType: ReceiptType
) {
  return verifyStudentPayment(stdNo, receiptType);
}

export async function verifyAndCreateReceipt(
  stdNo: number,
  receiptType: ReceiptType
) {
  const verification = await verifyStudentPayment(stdNo, receiptType);

  if (!verification.verified || !verification.invoiceNumber) {
    return { success: false, error: verification.error };
  }

  // The receipt is created with the Zoho invoice number as the receiptNo
  // This links the local record to the Zoho Books invoice
  try {
    const receipt = await service.create({
      receiptNo: verification.invoiceNumber,
      receiptType,
      stdNo,
    });

    return { success: true, receipt, verification };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.toLowerCase().includes('unique')) {
      return {
        success: true,
        receipt: null,
        verification,
        message: 'Receipt already exists locally for this Zoho invoice.',
      };
    }

    return { success: false, error: message };
  }
}
```

---

## Step 9 — Create Server Actions

The actions from Step 8 can be used directly. Here is how to call them from a component:

```typescript
// In a Server Component or Client Component using TanStack Query
import { verifyPayment } from '@finance/payment-receipts';

// Check payment first
const result = await verifyPayment(studentNumber, 'student_card');

if (result.verified) {
  // Proceed with the operation (e.g., print student card)
} else {
  // Show error: result.error
}
```

---

## Step 10 — Integrate Into the Student Card Flow (Example)

> This is a concrete example of how the integration works end-to-end for the student card scenario.

### 10.1 Flow Diagram

```
Student clicks "Print Student Card"
         │
         ▼
  ┌──────────────────────────┐
  │ Call verifyPayment()     │
  │   stdNo = 901234567      │
  │   receiptType =          │
  │     'student_card'       │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ Zoho Books API:          │
  │ 1. Find contact by       │
  │    student number         │
  │ 2. Search paid invoices   │
  │    with "Student Card"    │
  │    item                   │
  └──────────┬───────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
  Found           Not Found
     │               │
     ▼               ▼
  ┌────────┐   ┌──────────────┐
  │ Create │   │ Show error:  │
  │ local  │   │ "No payment  │
  │ receipt│   │  found"      │
  │ record │   └──────────────┘
  └───┬────┘
      │
      ▼
  ┌──────────────┐
  │ Print student│
  │ card         │
  └──────────────┘
```

### 10.2 Example Integration in a Component

```typescript
'use client';

import { verifyAndCreateReceipt } from '@finance/payment-receipts';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@mantine/core';

type Props = {
  stdNo: number;
};

export default function PrintStudentCardButton({ stdNo }: Props) {
  const mutation = useMutation({
    mutationFn: () => verifyAndCreateReceipt(stdNo, 'student_card'),
    onSuccess: (result) => {
      if (result.success) {
        notifications.show({
          title: 'Payment Verified',
          message: `Invoice ${result.verification?.invoiceNumber} confirmed. Printing student card...`,
          color: 'green',
        });
        // Trigger print logic here
      } else {
        notifications.show({
          title: 'Payment Not Found',
          message: result.error ?? 'No payment found in Zoho Books',
          color: 'red',
        });
      }
    },
    onError: (error) => {
      notifications.show({
        title: 'Verification Error',
        message: error instanceof Error ? error.message : 'Verification failed',
        color: 'red',
      });
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate()}
      loading={mutation.isPending}
    >
      Print Student Card
    </Button>
  );
}
```

---

## Step 11 — Extend to Other Receipt Types

Once student card verification is working, extending to other receipt types is simple:

1. **Find the Zoho Books item name** for the new receipt type (Step 1.2).
2. **Add the environment variable** (e.g., `ZOHO_BOOKS_ITEM_GRADUATION_FEE=Graduation Fee`).
3. **Call `verifyAndCreateReceipt()`** with the appropriate `receiptType`.

No code changes are needed because the mapping is driven by environment variables.

If you introduce a truly new `receiptType` enum value in Registry Web, add it to the schema first.

### Example for Graduation Fee:

```typescript
// In the graduation request flow
const result = await verifyAndCreateReceipt(stdNo, 'graduation_fee');
```

---

## Step 12 — Testing Checklist

### Manual Testing (Do These First)

- [ ] **Token generation works**: Can refresh the access token without errors
- [ ] **Student lookup works**: Can find at least one known student by their student number
- [ ] **Invoice search works**: Can find a paid invoice for a known student and payment type
- [ ] **Full flow works**: `verifyAndCreateReceipt()` returns `{ success: true }` for a student with a paid invoice
- [ ] **Negative case works**: `verifyAndCreateReceipt()` returns `{ success: false }` for a student without a paid invoice
- [ ] **Unknown student works**: `verifyAndCreateReceipt()` returns `{ success: false }` for a non-existent student
- [ ] **Local receipt created**: After verification, a record exists in the `payment_receipts` table with the Zoho invoice number

### Edge Cases to Test

- [ ] What happens when the Zoho API is unreachable? (Should show a user-friendly error)
- [ ] What happens when the access token expires mid-request? (Should auto-refresh)
- [ ] What happens if a student has multiple paid invoices for the same type? (Should use the latest)
- [ ] What happens if the same receipt is verified twice? (Should handle duplicate `receiptNo`)

---

## Step 13 — Rate Limits & Error Handling

### Zoho Books API Limits

| Plan | Daily Requests | Concurrent Calls | Per-Minute Limit |
|------|---------------|-------------------|-----------------|
| Free | 1,000 | 5 | 100 |
| Standard | 2,000 | 10 | 100 |
| Professional | 5,000 | 10 | 100 |
| Premium | 10,000 | 10 | 100 |
| Elite | 10,000 | 10 | 100 |
| Ultimate | 10,000 | 10 | 100 |

### Error Handling Strategy

The Zoho API client in Step 7 already handles token refresh. Additionally:

1. **Rate limit errors (HTTP 429)**: The app should show "Payment verification is temporarily unavailable. Please try again in a few minutes."
2. **Authentication errors**: Log the error and suggest re-generating the refresh token.
3. **Network errors**: Show "Unable to connect to the accounting system. Please check your internet connection."
4. **Not found errors**: Show "Student not found in the accounting system" or "No payment record found."

### Recommended: Add Error Handling to the Client

In the `zohoGet` function, add specific handling for HTTP 429:

```typescript
if (response.status === 429) {
  throw new Error(
    'Zoho Books API rate limit reached. Please try again in a few minutes.'
  );
}
```

---

## Appendix A — Zoho Books API Quick Reference

### Base URL (US Region)

```
https://www.zohoapis.com/books/v3
```

### Authentication Header

```
Authorization: Zoho-oauthtoken {access_token}
```

### Key Endpoints Used

| Purpose | Method | Endpoint | Key Parameters |
|---------|--------|----------|----------------|
| Refresh token | POST | `accounts.zoho.{dc}/oauth/v2/token` | `refresh_token`, `client_id`, `client_secret`, `grant_type=refresh_token` |
| List organizations | GET | `/organizations` | — |
| Search contacts | GET | `/contacts` | `contact_name`, `company_name`, `search_text`, `email`, `phone` |
| List invoices | GET | `/invoices` | `customer_id`, `status`, `item_name`, `search_text` |
| Get invoice detail | GET | `/invoices/{invoice_id}` | — |

### Invoice Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Invoice created but not sent |
| `sent` | Invoice sent to customer |
| `overdue` | Payment past due date |
| `paid` | ✅ Fully paid (this is what we check for) |
| `partially_paid` | Some payment received |
| `unpaid` | Invoice is unpaid (sent or overdue) |
| `viewed` | Invoice has been viewed by the client |
| `void` | Cancelled invoice |

---

## Appendix B — Troubleshooting

### "Student not found in Zoho Books"

- **Cause**: The student number format doesn't match what's in Zoho Books.
- **Fix**: Check Zoho Books manually. Is the student number stored as `"901234567"` or `"90-1234567"` or `"STD-901234567"`? Update the lookup strategy if needed.

### "invalid_code" when generating tokens

- **Cause**: Grant token expired (valid only for the duration you selected) or already used.
- **Fix**: Generate a new grant token from the Zoho Developer Console.

### "INVALID_OAUTHTOKEN" on API calls

- **Cause**: Access token expired and refresh failed.
- **Fix**: Check that the refresh token is still valid. Regenerate if needed (Step 3).

### "This organization does not have permission"

- **Cause**: Wrong `organization_id` or the OAuth app doesn't have access to this org.
- **Fix**: Verify the organization ID from the `/organizations` endpoint.

### Rate limit errors (HTTP 429)

- **Cause**: Too many API calls in a short time.
- **Fix**: The app makes at least 2 API calls per verification (contact lookup + invoice search). If you also fetch invoice detail, that is +1 call per invoice. Stay below 100 requests/minute per organization and plan for retries/backoff.

### "No paid invoice found" but the student definitely paid

- **Cause**: The item name in the environment variable doesn't match exactly what's in Zoho Books (case-sensitive).
- **Fix**: Go to Zoho Books → Settings → Items and copy the exact item name. Update the `ZOHO_BOOKS_ITEM_*` environment variable.

---

## File Structure After Implementation

```
src/app/finance/
├── _lib/
│   └── zoho-books/
│       ├── client.ts       ← Step 7.1 (OAuth + HTTP client)
│       ├── types.ts        ← Step 7.2 (TypeScript types)
│       └── service.ts      ← Step 7.3 (Business logic)
├── payment-receipts/
│   ├── _schema/
│   │   └── paymentReceipts.ts  ← Existing (no changes needed)
│   ├── _server/
│   │   ├── repository.ts      ← Existing (no changes needed)
│   │   ├── service.ts         ← Existing (minor addition for create)
│   │   └── actions.ts         ← Step 8.1 (add verifyPayment actions)
│   └── index.ts               ← Existing (add new exports)
└── ...
```
