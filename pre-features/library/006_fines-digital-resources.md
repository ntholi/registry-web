# Step 006: Fines & Digital Resources Features

## Introduction

This step implements two features: the Fines system for overdue loans and Digital Resources for document management. It also includes External Libraries management.

**Previous Steps Completed:**
- ✅ Step 001-003: Complete database schema
- ✅ Step 004: Books, Authors, Categories CRUD
- ✅ Step 005: Loans management (issue, return, renew)

**Database tables available:** `fines`, `digitalResources`, `externalLibraries`, `paymentReceipts`

---

## Part A: Fines Feature

### Context

Fines are automatically created when:
1. A book is returned after the due date
2. Rate: 1 M (Maluti) per day overdue

Fine payment is recorded using the existing `paymentReceipts` table from the finance module.

### Directory Structure

```
src/app/library/
├── fines/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   ├── PaymentModal.tsx
│   │   └── FineCard.tsx
│   ├── _lib/
│   │   ├── types.ts
│   │   └── calculations.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── [id]/
│   │   └── page.tsx
│   └── index.ts
```

### Server Layer

#### Repository (`fines/_server/repository.ts`)

Extend `BaseRepository`:

| Method | Description |
|--------|-------------|
| `findById(id)` | Get fine with loan, student, receipt details |
| `findByStudent(stdNo)` | All fines for a student |
| `findUnpaid()` | All unpaid fines |
| `findByLoan(loanId)` | Fine for a specific loan |
| `createFine(loanId, stdNo, amount, daysOverdue)` | Create fine record |
| `markPaid(id, receiptId)` | Update status to Paid, set receiptId and paidAt |

#### Fine Calculation (`fines/_lib/calculations.ts`)

```
FINE_RATE = 1 // Maluti per day

calculateFine(dueDate: Date, returnDate: Date): { amount: number, daysOverdue: number }
  - daysOverdue = Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24))
  - If daysOverdue <= 0, return { amount: 0, daysOverdue: 0 }
  - amount = daysOverdue * FINE_RATE
  - Return { amount, daysOverdue }
```

#### Actions (`fines/_server/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getFine` | `(id: number)` | Get single fine with relations |
| `getFines` | `(page, search, status?)` | Paginated fines list |
| `getStudentFines` | `(stdNo: number)` | All fines for a student |
| `getUnpaidFines` | `()` | All unpaid fines |
| `createFineForLoan` | `(loanId: number)` | Calculate and create fine |
| `payFine` | `(id: number, receiptNo: string)` | Record fine payment |
| `getTotalUnpaidByStudent` | `(stdNo: number)` | Sum of unpaid fines |

### Integration with Loan Return

Modify the `returnLoan` action from Step 005:
```
After updating loan to returned:
1. Calculate daysOverdue
2. If daysOverdue > 0:
   a. Call createFineForLoan(loanId)
   b. Return loan with fine info
```

### Payment Integration

When paying a fine:
1. Create `paymentReceipt` record in finance module:
   - `receiptType`: Add new enum value 'LibraryFine' to finance enums
   - `stdNo`: Student number
   - `createdBy`: Current user
2. Update fine:
   - `status` = 'Paid'
   - `receiptId` = created receipt ID
   - `paidAt` = current timestamp

### UI Components

#### Payment Modal (`fines/_components/PaymentModal.tsx`)

**Purpose:** Self-contained modal for recording fine payment

**Trigger:** "Pay" button on fine details or list

**Content:**
- Fine summary (book, student, amount, days overdue)
- Payment confirmation
- Receipt number auto-generated or input

**Actions:**
- "Record Payment" button
- Creates receipt and updates fine

#### Fine Card (`fines/_components/FineCard.tsx`)

**Purpose:** Display fine summary card (for student portal)

**Content:**
- Book title
- Fine amount (M {amount})
- Status badge
- Days overdue
- Payment date (if paid)

### Pages

#### Fines List Layout

Use `ListLayout`:
- Display: Student name as label, Book title as description
- Show amount and status badge
- Filter: All, Unpaid, Paid
- Search by student number or name

#### Fine Details Page

`DetailsView` with:
- Fine amount and status
- Days overdue
- Loan details (book, dates)
- Student details
- Payment info (if paid): Receipt number, date
- Pay button (if unpaid)

---

## Part B: Digital Resources Feature

### Context

Digital resources are uploaded documents (past papers, research papers, etc.) stored in Cloudflare R2 via existing storage integration.

### Directory Structure

```
src/app/library/
├── resources/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   ├── Form.tsx
│   │   ├── UploadField.tsx
│   │   └── DocumentViewer.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   └── index.ts
```

### Server Layer

#### Repository (`resources/_server/repository.ts`)

Extend `BaseRepository`:

| Method | Description |
|--------|-------------|
| `findById(id)` | Get resource with uploader details |
| `findByType(type)` | Filter by resource type |
| `search(query, type?)` | Search by title with optional type filter |

#### Actions (`resources/_server/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getResource` | `(id: number)` | Get single resource |
| `getResources` | `(page, search, type?)` | Paginated list with type filter |
| `createResource` | `(data, file: File)` | Upload file and create record |
| `updateResource` | `(id, data, file?: File)` | Update resource, optionally replace file |
| `deleteResource` | `(id: number)` | Delete record and file from storage |
| `getResourceUrl` | `(id: number)` | Get download/view URL |

### File Upload Handling

**Upload Process:**
1. Validate file size (max 10MB)
2. Call `uploadDocument(file, fileName, 'library/resources')`
3. Store returned `fileName` in `digitalResources.fileName`
4. Store original name in `originalName`
5. Store file size and MIME type

**File URL Construction:**
```
Base URL: process.env.R2_PUBLIC_URL (e.g., https://cdn.example.com)
Full URL: {R2_PUBLIC_URL}/library/resources/{fileName}
```

**Delete Process:**
1. Get resource record
2. Call `deleteDocument('library/resources/{fileName}')`
3. Delete database record

### UI Components

#### Resource Form (`resources/_components/Form.tsx`)

Fields:
- `title` - TextInput (required)
- `description` - Textarea (optional)
- `type` - Select (PastPaper, ResearchPaper, Thesis, Journal, Other)
- `isDownloadable` - Checkbox (default: true)
- `file` - File upload component

#### Upload Field (`resources/_components/UploadField.tsx`)

**Features:**
- Drag and drop zone
- File type display with icon
- File size display
- Progress indicator during upload
- Preview for images/PDFs
- Max size validation (10MB)
- Error messages for oversized files

Use Mantine's `Dropzone` component.

#### Document Viewer (`resources/_components/DocumentViewer.tsx`)

**Purpose:** In-browser document viewing

**For PDFs:**
- Embed PDF viewer using `<iframe>` or `<embed>`
- Provide download button if `isDownloadable`

**For Images:**
- Display inline with Mantine `Image`

**For Other Types:**
- Show file info card
- Download button if `isDownloadable`

### Pages

#### Resources List Layout

Use `ListLayout`:
- Display: Title as label, Type as description badge
- Filter by type (tabs or select)
- Search by title
- Action: NewLink to upload new resource

#### Resource Details Page

`DetailsView` with:
- Title, Description
- Type badge
- File info (name, size, type)
- Upload date, Uploaded by
- Document viewer/preview
- Download button (if downloadable)
- Edit/Delete buttons

---

## Part C: External Libraries Feature

### Context

Simple CRUD for managing links to external online library services with credentials.

### Directory Structure

```
src/app/library/
├── external-libraries/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   └── Form.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   └── index.ts
```

### Actions

Standard CRUD:
- `getExternalLibrary(id)`
- `getExternalLibraries(page, search)`
- `getAllExternalLibraries()` - For student portal
- `createExternalLibrary(data)`
- `updateExternalLibrary(id, data)`
- `deleteExternalLibrary(id)`

### UI Components

#### External Library Form

Fields:
- `name` - TextInput (required)
- `url` - TextInput (required, URL validation)
- `username` - TextInput (optional)
- `password` - PasswordInput (optional, with reveal toggle)
- `description` - Textarea (optional)

#### External Library Details Page

Display:
- Name, URL (clickable link, opens in new tab)
- Username (if provided)
- Password (if provided, with copy button)
- Description/Instructions

---

## Expected Files

### Fines
| File Path | Purpose |
|-----------|---------|
| `src/app/library/fines/_server/repository.ts` | Fines repository |
| `src/app/library/fines/_server/service.ts` | Fines service |
| `src/app/library/fines/_server/actions.ts` | Fines actions |
| `src/app/library/fines/_components/PaymentModal.tsx` | Payment modal |
| `src/app/library/fines/_components/FineCard.tsx` | Fine display card |
| `src/app/library/fines/_lib/calculations.ts` | Fine calculation logic |
| `src/app/library/fines/layout.tsx` | List layout |
| `src/app/library/fines/page.tsx` | Empty state |
| `src/app/library/fines/[id]/page.tsx` | Fine details |

### Digital Resources
| File Path | Purpose |
|-----------|---------|
| `src/app/library/resources/_server/repository.ts` | Resources repository |
| `src/app/library/resources/_server/service.ts` | Resources service |
| `src/app/library/resources/_server/actions.ts` | Resources actions |
| `src/app/library/resources/_components/Form.tsx` | Upload form |
| `src/app/library/resources/_components/UploadField.tsx` | File upload component |
| `src/app/library/resources/_components/DocumentViewer.tsx` | Document viewer |
| `src/app/library/resources/layout.tsx` | List layout |
| `src/app/library/resources/page.tsx` | Empty state |
| `src/app/library/resources/new/page.tsx` | Upload new |
| `src/app/library/resources/[id]/page.tsx` | Resource details |
| `src/app/library/resources/[id]/edit/page.tsx` | Edit resource |

### External Libraries
| File Path | Purpose |
|-----------|---------|
| `src/app/library/external-libraries/_server/*` | Server layer |
| `src/app/library/external-libraries/_components/Form.tsx` | Form |
| `src/app/library/external-libraries/*.tsx` | Pages |

---

## Validation Criteria

### Fines
1. Fine is auto-created when returning overdue book
2. Fine amount calculated correctly (days × 1 M)
3. Can view all fines, filter by status
4. Can record fine payment
5. Payment creates receipt in finance module
6. Fine status updates to Paid

### Digital Resources
1. Can upload files up to 10MB
2. Files stored in R2 storage
3. Can view/download based on `isDownloadable` flag
4. Can filter by resource type
5. File deleted from storage when resource deleted

### External Libraries
1. Can create, view, edit, delete external library links
2. URL opens in new tab
3. Password field masked with reveal option

---

## Notes

- Add 'LibraryFine' to `receiptType` enum in `@finance/_database/schema/enums.ts`
- Use transactions when creating fine + receipt together
- Consider caching R2 public URL in environment config
- PDF viewer may need CORS configuration for R2
- Password storage is plain text (acceptable per requirements)
