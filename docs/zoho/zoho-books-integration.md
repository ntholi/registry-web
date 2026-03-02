# Zoho Books Integration Guide

> **Last verified**: 2026-02-28 via live API calls.

> **Goal**: Verify student payments in Zoho Books before allowing operations in the Registry Web app. When a student wants to perform an action (e.g., print a student card), the app checks Zoho Books for a matching **paid** invoice. If found, the operation proceeds and a local `paymentReceipt` record is created. If not found, the operation is denied.

> **Sync Direction**: Zoho Books → App (one-way, on-demand verification)
>
> **Starting Scope**: Student Card payment verification (extend to other receipt types later)

---

## Table of Contents

1. [Zoho Books Account & API Details](#1-zoho-books-account--api-details)
2. [How Students Are Stored](#2-how-students-are-stored)
3. [How Payments Are Stored](#3-how-payments-are-stored)
4. [Student Lookup Strategy](#4-student-lookup-strategy)
5. [Payment Type Mapping](#5-payment-type-mapping)
6. [OAuth Setup](#6-oauth-setup)
7. [Environment Variables](#7-environment-variables)
8. [Implementation — Zoho Books API Client](#8-implementation--zoho-books-api-client)
9. [Implementation — Payment Verification Service](#9-implementation--payment-verification-service)
10. [Implementation — Server Actions](#10-implementation--server-actions)
11. [Integration Example — Student Card Flow](#11-integration-example--student-card-flow)
12. [Extending to Other Receipt Types](#12-extending-to-other-receipt-types)
13. [Testing Checklist](#13-testing-checklist)
14. [Rate Limits & Error Handling](#14-rate-limits--error-handling)
15. [Appendix A — API Quick Reference](#appendix-a--api-quick-reference)
16. [Appendix B — Troubleshooting](#appendix-b--troubleshooting)

---

## 1. Zoho Books Account & API Details

| Detail | Value |
|--------|-------|
| **Organization ID** | `823788793` |
| **Zoho Domain** | `zoho.com` (US / Global data center) |
| **Accounts URL** | `https://accounts.zoho.com` |
| **API Base URL** | `https://www.zohoapis.com/books/v3` |
| **Currency** | LSL (Lesotho Loti) |
| **Auth Method** | OAuth 2.0 Self Client |
| **Required Scopes** | `ZohoBooks.invoices.READ,ZohoBooks.contacts.READ,ZohoBooks.settings.READ` |

---

## 2. How Students Are Stored

Students are **Business** contacts in Zoho Books. The following table shows the confirmed field mapping, verified with three students via the API:

| Field | Student 901017723 | Student 901013251 | Student 901015987 | Purpose |
|-------|-------------------|-------------------|-------------------|---------|
| **`first_name`** | `901017723` | `901013251` | `901015987` | Student number stored as first name |
| **`contact_name`** | `Mathapelo Letsoela` | `Neo Joseph Chere` | `Masole Francis Makoro` | Display name (NOT the student number) |
| **`company_name`** | `Diploma in Information Technology` | `Diploma in Architecture Technology` | `Diploma in Architecture Technology` | Program name |
| **`cf_account_code`** | `901017723` | `901013251` | `901015987` | Custom field "Account Code" — **primary verification field**, populated for all students |
| **`customer_sub_type`** | `business` | `business` | `business` | Always "business" |
| **`contact_id`** | `4172689000000568209` | `4172689000000529161` | `4172689000000549009` | Zoho internal ID |

### Tags

Contacts have tags with metadata:

| Tag Name | Example Value | Notes |
|----------|---------------|-------|
| **Financial Assitance** | `ManPower` | Sponsor/funding source |
| **School** | `FAID` | School abbreviation |
| **Programe** | `DAT` | Program abbreviation |

> Tag names are spelled as configured in Zoho Books (including typos like "Assitance" and "Programe").

### Additional Fields (from Contact Detail endpoint)

| Field | Example | Notes |
|-------|---------|-------|
| **`notes`** | `"Diploma in Architecture Technology Initial Intake Year 2022/06/29"` | Program + intake date |
| **`has_transaction`** | `true` | Whether the contact has any transactions |
| **`unused_credits_receivable_amount`** | `2090.00` | Credit balance |
| **`outstanding_receivable_amount`** | `0.00` | Outstanding balance |
| **`source`** | `csv` | How the contact was imported |

---

## 3. How Payments Are Stored

Payments are stored as **invoices** in Zoho Books. Each invoice has one or more **line items** identifying the service paid for.

### Invoice Structure

| Detail | Value |
|--------|-------|
| **Invoice Number Format** | `INV-XXXXXX` (6-digit zero-padded, e.g., `INV-001651`) |
| **Currency** | LSL (Lesotho Loti) |
| **Terms** | Due on Receipt |
| **Status Values** | `draft`, `sent`, `overdue`, `paid`, `partially_paid`, `unpaid`, `viewed`, `void` |

### Verified Item: Student Card

| Field | Value |
|-------|-------|
| **Item Name** | `Student Card` |
| **Item Description** | `student card` |
| **Item ID** | `4172689000000628015` |
| **Account Code** | `6010/SC01` |
| **Rate** | LSL 250.00 |
| **Qty Unit** | pcs |

### Invoice Notes

- Invoices can contain **multiple items** (e.g., Student Card + other fees combined)
- Paid invoices have `Balance Due = 0.00` and status `"paid"`
- The `invoice_number` (e.g., `INV-001651`) becomes the `receiptNo` in the local database

> ⚠️ **Invoice API access not yet verified** — requires `ZohoBooks.invoices.READ` scope. See [Section 6](#6-oauth-setup) for token setup.

---

## 4. Student Lookup Strategy

**Strategy**: Use `search_text=<stdNo>` to find the contact, then verify the result by checking `cf_account_code` matches the student number.

### Why This Strategy

- The `cf_account_code` custom field (label: "Account Code", api_name: `cf_account_code`) is **not** a supported query parameter on the List Contacts API
- `contact_name` contains the student's **display name** (e.g., "Neo Joseph Chere"), NOT the student number — searching by `contact_name=<stdNo>` returns nothing
- `search_text` searches across: **EmailID, CompanyName, FirstName, LastName, Notes, Name** (confirmed from `page_context.search_criteria` in the API response)
- Since the student number is stored in `first_name`, `search_text=<stdNo>` reliably finds the contact
- After the search, verify the result by checking `cf_account_code === stdNo` (primary) or `first_name === stdNo` (fallback)

### Example: Search by Student Number

```bash
curl -X GET "https://www.zohoapis.com/books/v3/contacts?organization_id=823788793&search_text=901013251" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

Returns contact with `cf_account_code: "901013251"`, `contact_name: "Neo Joseph Chere"`, `company_name: "Diploma in Architecture Technology"`.

### Example: Get Full Contact Detail

```bash
curl -X GET "https://www.zohoapis.com/books/v3/contacts/4172689000000529161?organization_id=823788793" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

Returns extended fields including `notes`, `contact_persons`, `tags`, `unused_credits_receivable_amount`.

---

## 5. Payment Type Mapping

### Known Mappings

| `receiptType` in Registry | Zoho Books Item Name | Zoho Item ID | Status |
|---------------------------|---------------------|--------------|--------|
| `student_card` | `Student Card` | `4172689000000628015` | ✅ Verified |
| `graduation_gown` | `Degree Gown` / `Diploma Gown` | `4172689000000694001` / `4172689000000693001` | ✅ Mapped |
| `graduation_fee` | `Graduation fee` | `4172689000000694036` | ✅ Mapped |
| `late_registration` | `Late Registration Fee` | `4172689000000653071` | ✅ Mapped |

### Pending Mappings

| `receiptType` in Registry | Zoho Books Item Name | Zoho Item ID |
|---------------------------|---------------------|--------------|
| `repeat_module` | _Unknown_ | _Unknown_ |
| `tuition_fee` | _Unknown_ | _Unknown_ |
| `library_fine` | _Unknown_ | _Unknown_ |
| `application_fee` | _Unknown_ | _Unknown_ |

> **TODO**: Check Items list in Zoho Books (Settings → Items) to complete remaining mappings.

### Invoice Search Strategy

For all receipt types, the search approach is the same:

```
GET /invoices?customer_id={contact_id}&status=paid&item_name={zoho_item_name}&sort_column=date
```

---

## 6. OAuth Setup

The app uses a **Self Client** OAuth flow: a permanent refresh token is stored in environment variables and used to obtain short-lived access tokens automatically.

### Initial Setup (one-time)

1. Go to [Zoho API Console](https://api-console.zoho.com/) → **Add Client** → **Self Client**
2. Save the **Client ID** and **Client Secret**
3. Generate a **Grant Token** with scopes:
   ```
   ZohoBooks.invoices.READ,ZohoBooks.contacts.READ,ZohoBooks.settings.READ
   ```
   > **Critical**: Include ALL three scopes. A token generated without `ZohoBooks.invoices.READ` returns `code: 57` ("You are not authorized") when accessing invoices. The contacts scope alone is not sufficient.
4. Exchange the grant token for a **Refresh Token** (within the grant's time limit):
   ```bash
   curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=YOUR_GRANT_TOKEN"
   ```
   No `redirect_uri` is needed for Self Client.
5. The response contains `access_token` and `refresh_token`. Save the **refresh token** — it's permanent until revoked.

### Token Refresh

The app automatically refreshes the access token using the refresh token. Access tokens expire after 3600 seconds (1 hour). The client (Section 8) handles refresh transparently with retry on 401.

> **If you get `invalid_code`**: The grant token expired or was already used. Generate a new one from the Zoho API Console.

---

## 7. Environment Variables

Add to `.env.local` and deployment environment:

```env
# Zoho Books API Configuration
ZOHO_BOOKS_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
ZOHO_BOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_BOOKS_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyy
ZOHO_BOOKS_ORGANIZATION_ID=823788793
ZOHO_BOOKS_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_BOOKS_API_BASE_URL=https://www.zohoapis.com/books/v3

# Zoho Books Item Name Mapping (exact names from Zoho Books, case-sensitive)
ZOHO_BOOKS_ITEM_STUDENT_CARD=Student Card
ZOHO_BOOKS_ITEM_GRADUATION_GOWN=Degree Gown
ZOHO_BOOKS_ITEM_GRADUATION_FEE=Graduation fee
ZOHO_BOOKS_ITEM_LATE_REGISTRATION=Late Registration Fee
# ZOHO_BOOKS_ITEM_REPEAT_MODULE=           (pending - check Zoho Books Items list)
# ZOHO_BOOKS_ITEM_TUITION_FEE=             (pending)
# ZOHO_BOOKS_ITEM_LIBRARY_FINE=            (pending)
# ZOHO_BOOKS_ITEM_APPLICATION_FEE=         (pending)

# Student lookup strategy
ZOHO_BOOKS_STUDENT_LOOKUP_FIELD=search_text

# Custom field used to verify the correct contact after search
# The "Account Code" custom field (api_name: cf_account_code) stores the student number
ZOHO_BOOKS_STUDENT_CUSTOM_FIELD_LABEL=Account Code
```

> **Security**: Never commit secrets to Git. The `.env.local` file is gitignored.

---

## 8. Implementation — Zoho Books API Client

### 8.1 OAuth + HTTP Client

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

### 8.2 TypeScript Types

Create file: `src/app/finance/_lib/zoho-books/types.ts`

```typescript
export interface ZohoContactTag {
  tag_id: string;
  tag_name: string;
  tag_option_id: string;
  tag_option_name: string;
  is_tag_mandatory: boolean;
}

export interface ZohoContact {
  contact_id: string;
  contact_name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_number?: string;
  email?: string;
  status?: string;
  customer_sub_type?: string;
  source?: string;
  custom_fields?: Array<{
    field_id: string;
    index: number;
    value?: string;
    label: string;
    api_name: string;
    data_type: string;
  }>;
  tags?: ZohoContactTag[];
  cf_account_code?: string;
  notes?: string;
  has_transaction?: boolean;
  outstanding_receivable_amount?: number;
  unused_credits_receivable_amount?: number;
}

export interface ZohoContactDetailResponse {
  code: number;
  message: string;
  contact: ZohoContact;
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
  line_items?: ZohoLineItem[];
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

### 8.3 Service Functions

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
  process.env.ZOHO_BOOKS_STUDENT_LOOKUP_FIELD ?? 'search_text';
const STUDENT_CUSTOM_FIELD_LABEL =
  process.env.ZOHO_BOOKS_STUDENT_CUSTOM_FIELD_LABEL ?? 'Account Code';

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

  if (STUDENT_LOOKUP_FIELD === 'search_text') {
    return (
      contacts.find((contact) => contact.cf_account_code === stdNoStr) ??
      contacts.find((contact) => contact.first_name === stdNoStr) ??
      null
    );
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

## 9. Implementation — Payment Verification Service

This connects the Zoho verification to the existing `paymentReceipts` system.

### Server Actions

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

## 10. Implementation — Server Actions

The actions from Section 9 can be used directly:

```typescript
import { verifyPayment } from '@finance/payment-receipts';

const result = await verifyPayment(studentNumber, 'student_card');

if (result.verified) {
  // Proceed with the operation
} else {
  // Show error: result.error
}
```

---

## 11. Integration Example — Student Card Flow

### Flow Diagram

```
Student clicks "Print Student Card"
         │
         ▼
  ┌──────────────────────────┐
  │ Call verifyPayment()     │
  │   stdNo = 901013251      │
  │   receiptType =          │
  │     'student_card'       │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ Zoho Books API:          │
  │ 1. search_text=901013251 │
  │    → find contact        │
  │ 2. Verify cf_account_code│
  │    matches student number│
  │ 3. Search paid invoices  │
  │    with "Student Card"   │
  │    item                  │
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

### Example Component

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

## 12. Extending to Other Receipt Types

Once student card verification is working, extending to other receipt types requires no code changes:

1. Find the Zoho Books item name for the receipt type (Settings → Items)
2. Add the environment variable (e.g., `ZOHO_BOOKS_ITEM_TUITION_FEE=Tuition Fee`)
3. Call `verifyAndCreateReceipt()` with the appropriate `receiptType`

The mapping is entirely driven by environment variables. If you introduce a new `receiptType` enum value in Registry Web, add it to the schema first.

```typescript
const result = await verifyAndCreateReceipt(stdNo, 'graduation_fee');
```

---

## 13. Testing Checklist

### Manual Testing

- [ ] **Token generation works**: Can refresh the access token without errors
- [ ] **Student lookup works**: Can find at least one known student by their student number
- [ ] **Invoice search works**: Can find a paid invoice for a known student and payment type
- [ ] **Full flow works**: `verifyAndCreateReceipt()` returns `{ success: true }` for a student with a paid invoice
- [ ] **Negative case works**: `verifyAndCreateReceipt()` returns `{ success: false }` for a student without a paid invoice
- [ ] **Unknown student works**: `verifyAndCreateReceipt()` returns `{ success: false }` for a non-existent student
- [ ] **Local receipt created**: After verification, a record exists in the `payment_receipts` table with the Zoho invoice number

### Edge Cases

- [ ] Zoho API unreachable → user-friendly error
- [ ] Access token expires mid-request → auto-refresh and retry
- [ ] Student has multiple paid invoices for the same type → uses the latest
- [ ] Same receipt verified twice → handles duplicate `receiptNo` gracefully

---

## 14. Rate Limits & Error Handling

### Zoho Books API Limits

| Plan | Daily Requests | Concurrent Calls | Per-Minute Limit |
|------|---------------|-------------------|-----------------|
| Free | 1,000 | 5 | 100 |
| Standard | 2,000 | 10 | 100 |
| Professional+ | 5,000–10,000 | 10 | 100 |

Each verification makes 2 API calls minimum (contact lookup + invoice search). Invoice detail adds +1 per invoice.

### Error Handling

| Error | User Message |
|-------|-------------|
| HTTP 429 (rate limit) | "Payment verification is temporarily unavailable. Please try again in a few minutes." |
| HTTP 401 (auth) | Auto-retries with refreshed token. If still fails: "Authentication error with accounting system." |
| Network error | "Unable to connect to the accounting system. Please check your internet connection." |
| `code: 57` (unauthorized) | OAuth scopes are missing. Regenerate token with all required scopes. |
| Student not found | "Student not found in the accounting system." |
| No paid invoice | "No payment record found for this service." |

---

## Appendix A — API Quick Reference

### Base URL

```
https://www.zohoapis.com/books/v3
```

### Authentication Header

```
Authorization: Zoho-oauthtoken {access_token}
```

### Endpoints Used

| Purpose | Method | Endpoint | Key Parameters |
|---------|--------|----------|----------------|
| Refresh token | POST | `accounts.zoho.com/oauth/v2/token` | `refresh_token`, `client_id`, `client_secret`, `grant_type=refresh_token` |
| List organizations | GET | `/organizations` | — |
| Search contacts | GET | `/contacts` | `search_text` (searches EmailID, CompanyName, FirstName, LastName, Notes, Name) |
| Get contact detail | GET | `/contacts/{contact_id}` | — |
| List invoices | GET | `/invoices` | `customer_id`, `status`, `item_name`, `sort_column` |
| Get invoice detail | GET | `/invoices/{invoice_id}` | — |

### Invoice Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Created but not sent |
| `sent` | Sent to customer |
| `overdue` | Payment past due date |
| **`paid`** | **Fully paid (this is what we check for)** |
| `partially_paid` | Some payment received |
| `unpaid` | Not paid |
| `viewed` | Viewed by client |
| `void` | Cancelled |

---

## Appendix B — Troubleshooting

### "Student not found in Zoho Books"

**Cause**: Student number format mismatch.  
**Fix**: Verify the student number format in Zoho Books. It is a bare number like `"901234567"` stored in both `first_name` and `cf_account_code`.

### `invalid_code` when generating tokens

**Cause**: Grant token expired or already used.  
**Fix**: Generate a new grant token from the Zoho API Console.

### `INVALID_OAUTHTOKEN` on API calls

**Cause**: Access token expired and refresh failed.  
**Fix**: Verify the refresh token is still valid. Regenerate if needed.

### `code: 57` — "You are not authorized to perform this operation"

**Cause**: The OAuth token was generated without the required scope (e.g., `ZohoBooks.invoices.READ` missing).  
**Fix**: Generate a new grant token with **all three scopes** (`ZohoBooks.invoices.READ,ZohoBooks.contacts.READ,ZohoBooks.settings.READ`), exchange for a new refresh token, and update `.env.local`.

### Rate limit errors (HTTP 429)

**Cause**: Too many API calls.  
**Fix**: Stay below 100 requests/minute. Each verification = 2+ calls.

### "No paid invoice found" but the student definitely paid

**Cause**: Item name in env var doesn't match Zoho Books exactly (case-sensitive).  
**Fix**: Copy the exact item name from Zoho Books → Settings → Items. Update the `ZOHO_BOOKS_ITEM_*` env var.

---

## File Structure After Implementation

```
src/app/finance/
├── _lib/
│   └── zoho-books/
│       ├── client.ts       ← Section 8.1 (OAuth + HTTP client)
│       ├── types.ts        ← Section 8.2 (TypeScript types)
│       └── service.ts      ← Section 8.3 (Business logic)
├── payment-receipts/
│   ├── _schema/
│   │   └── paymentReceipts.ts  ← Existing (no changes needed)
│   ├── _server/
│   │   ├── repository.ts      ← Existing (no changes needed)
│   │   ├── service.ts         ← Existing (minor addition for create)
│   │   └── actions.ts         ← Section 9 (add verifyPayment actions)
│   └── index.ts               ← Existing (add new exports)
└── ...
```
