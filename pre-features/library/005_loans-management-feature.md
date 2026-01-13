# Step 005: Loans Management Feature

## Introduction

This step implements the complete Loans Management feature, enabling librarians to issue books to students, process returns, handle renewals, and track loan history. This is the core operational feature of the library module.

**Previous Steps Completed:**
- ✅ Step 001-003: Complete database schema
- ✅ Step 004: Books, Authors, Categories CRUD

**Database tables available:** `loans`, `loanRenewals`, `books`, `bookCopies`, `students`

---

## Context

The loan workflow:
1. Student visits library with their student number
2. Librarian searches for student to verify identity
3. Librarian searches for book by title/ISBN
4. Librarian selects an available copy (by serial number)
5. Librarian creates loan with custom due date
6. System sets `bookCopies.status` to 'OnLoan'
7. On return: Librarian processes check-in, updates loan status
8. System sets `bookCopies.status` to 'Available'
9. If overdue: Fine is calculated (handled in Step 006)

---

## Requirements

### 1. Directory Structure

```
src/app/library/
├── loans/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   ├── LoanForm.tsx           # Create new loan
│   │   ├── ReturnModal.tsx        # Process book return
│   │   ├── RenewalModal.tsx       # Renew loan
│   │   └── StudentSearch.tsx      # Search student component
│   ├── _lib/
│   │   └── types.ts               # Type definitions
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   └── page.tsx
│   └── index.ts
```

---

## Feature: Loans

### Server Layer

#### Repository (`loans/_server/repository.ts`)

Extend `BaseRepository` with custom methods:

| Method | Description |
|--------|-------------|
| `findById(id)` | Get loan with book copy, book, student, issuer details |
| `findByStudent(stdNo, status?)` | Get all loans for a student, optionally filter by status |
| `findActiveLoans()` | All currently active (not returned) loans |
| `findOverdueLoans()` | Loans where dueDate < now AND returnDate is null |
| `createLoan(data)` | Create loan and set copy status to 'OnLoan' |
| `processReturn(id, returnedTo)` | Mark returned, set copy status to 'Available', calculate overdue days |
| `getLoanHistory(page, search, filters)` | Paginated history with filters |

**Complex Queries Required:**
- Join with `bookCopies` for copy serial number and condition
- Join with `books` (via bookCopies) for book details
- Join with `students` for student name
- Join with `users` (as issuedBy, returnedTo) for librarian names
- Include `loanRenewals` count/history

#### Service (`loans/_server/service.ts`)

Extend `BaseService`:
- `byIdRoles: ['dashboard']`
- `findAllRoles: ['dashboard']`
- `createRoles: ['dashboard']` (librarians/admins only)

Custom methods:
- `issueLoan(bookCopyId, stdNo, dueDate, issuedBy)` - Business logic for issuing
- `returnBook(loanId, returnedTo)` - Business logic for returns
- `renewLoan(loanId, newDueDate, renewedBy)` - Create renewal record

#### Actions (`loans/_server/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getLoan` | `(id: number)` | Get single loan with all relations |
| `getLoans` | `(page, search, filters)` | Paginated loans list |
| `getActiveLoans` | `()` | All unreturned loans |
| `getOverdueLoans` | `()` | All overdue loans |
| `getStudentLoans` | `(stdNo: number)` | All loans for a student |
| `createLoan` | `(bookCopyId, stdNo, dueDate)` | Issue book copy to student |
| `returnLoan` | `(id: number)` | Process book return |
| `renewLoan` | `(id, newDueDate)` | Extend loan due date |
| `searchStudents` | `(query: string)` | Search students by stdNo or name |
| `searchBooks` | `(query: string)` | Search books with available copies |
| `getAvailableCopies` | `(bookId: number)` | Get available copies for a book |

---

### UI Components

#### Loan Form (`loans/_components/LoanForm.tsx`)

**Purpose:** Create a new loan (issue book to student)

**Layout:** Two-section form

**Section 1: Student Selection**
- Search input (by student number or name)
- Display student card when selected:
  - Student number
  - Name
  - Current active loans count
  - Any outstanding fines (preview)

**Section 2: Book & Copy Selection**
- Search input (by ISBN or title)
- Display book card when selected:
  - Title, ISBN
  - Cover image thumbnail
- Copy selection (dropdown/list of available copies):
  - Serial number
  - Condition
  - Location

**Section 3: Loan Details**
- Due date picker (DateInput from Mantine Dates)
  - No default value - librarian must select
  - Minimum date: tomorrow
  - Calendar starts on Sunday

**Submit Button:** "Issue Book"

**Validation:**
- Student must be selected
- Book copy must be selected
- Copy must have status 'Available'
- Due date must be in future

#### Return Modal (`loans/_components/ReturnModal.tsx`)

**Purpose:** Self-contained modal for processing book returns

**Trigger:** Button on loan details page or list item

**Content:**
- Loan summary (book title, copy serial number, student, loan date, due date)
- Copy condition update (optional - librarian can update condition on return)
- Current date as return date
- If overdue: Show warning with days overdue and calculated fine
- Confirmation message

**Actions:**
- "Confirm Return" button
- On confirm: Call `returnLoan` action

**Post-Return:**
- Update loan status to "Returned"
- Set `returnDate` to current timestamp
- Set `bookCopies.status` to 'Available'
- If overdue: Create fine record (Step 006 integration)

#### Renewal Modal (`loans/_components/RenewalModal.tsx`)

**Purpose:** Self-contained modal for extending loan due date

**Trigger:** Button on loan details page (only for active loans)

**Content:**
- Current loan info (book, current due date)
- Renewal history (previous renewals if any)
- New due date picker
  - Minimum: current due date + 1 day

**Actions:**
- "Renew Loan" button
- On confirm: Call `renewLoan` action

**Post-Renewal:**
- Create `loanRenewals` record
- Update loan's `dueDate`

#### Student Search Component (`loans/_components/StudentSearch.tsx`)

**Purpose:** Reusable autocomplete for finding students

**Features:**
- Debounced search (300ms)
- Search by student number or name
- Display: "StudentNo - Name"
- Return selected student data

---

### Pages

#### Loans List Layout (`loans/layout.tsx`)

Use `ListLayout` component:
- Display: Book title as label, Student name as description
- Show loan status badge (Active, Returned, Overdue)
- Overdue items highlighted in warning color
- Search by student number, student name, or book title
- Filter tabs or dropdown: All, Active, Overdue, Returned
- Action: NewLink to create new loan

#### Loans Empty State (`loans/page.tsx`)

`NothingSelected` with title "Loans"

#### New Loan Page (`loans/new/page.tsx`)

Render `LoanForm` component

#### Loan Details Page (`loans/[id]/page.tsx`)

Use `DetailsView` components:

**Header:**
- Title: "Loan Details"
- Actions: Return button (if active), Renew button (if active)

**Body:**
- **Book Section:**
  - Book title (link to book details)
  - ISBN
  - Cover image thumbnail

- **Copy Section:**
  - Serial number
  - Condition
  - Location

- **Borrower Section:**
  - Student number (link to student profile in registry)
  - Student name

- **Dates Section:**
  - Loan date
  - Due date
  - Return date (if returned)
  - Days overdue (if applicable)

- **Status Section:**
  - Current status badge
  - Fine amount (if overdue, even if not yet paid)

- **Renewal History:**
  - Table of renewals (if any)
  - Columns: Previous Due, New Due, Renewed By, Date

- **Staff Section:**
  - Issued by (librarian name)
  - Returned to (librarian name, if returned)

---

## Business Logic

### Issuing a Book

```
1. Verify student exists
2. Verify book copy exists and status='Available'
3. Create loan record with status='Active'
4. Set bookCopy.status to 'OnLoan'
5. Return created loan
```

### Returning a Book

```
1. Verify loan exists and status='Active'
2. Calculate daysOverdue = max(0, today - dueDate)
3. Update loan: returnDate=now, status='Returned'
4. Set bookCopy.status to 'Available'
5. Optionally update bookCopy.condition if librarian reports damage
6. If daysOverdue > 0: Create fine (Step 006)
7. Return updated loan with overdue info
```

### Renewing a Loan

```
1. Verify loan exists and status='Active'
2. Create loanRenewals record
3. Update loan.dueDate to newDueDate
4. Return updated loan
```

### Overdue Detection

Loans are overdue when:
- `status = 'Active'`
- `dueDate < current_timestamp`
- `returnDate IS NULL`

Consider creating a scheduled job or calculating dynamically in queries.

---

## Integration Points

### Student Search

Import and use student search from registry module:
- `@registry/students/_server/actions.ts` - if exported
- Or create local action that queries students table

### Book Availability

When displaying books for selection:
- Only show books where `copiesAvailable > 0`
- Show available/total copies count

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/loans/_server/repository.ts` | Loans repository with complex queries |
| `src/app/library/loans/_server/service.ts` | Loans service with business logic |
| `src/app/library/loans/_server/actions.ts` | Loans server actions |
| `src/app/library/loans/_components/LoanForm.tsx` | Create loan form |
| `src/app/library/loans/_components/ReturnModal.tsx` | Return book modal |
| `src/app/library/loans/_components/RenewalModal.tsx` | Renew loan modal |
| `src/app/library/loans/_components/StudentSearch.tsx` | Student search component |
| `src/app/library/loans/_lib/types.ts` | Type definitions |
| `src/app/library/loans/layout.tsx` | Loans list layout |
| `src/app/library/loans/page.tsx` | Empty state |
| `src/app/library/loans/new/page.tsx` | New loan page |
| `src/app/library/loans/[id]/page.tsx` | Loan details |
| `src/app/library/loans/index.ts` | Re-exports |

---

## Validation Criteria

After implementation:
1. `pnpm tsc --noEmit` - no type errors
2. `pnpm lint:fix` - no lint errors
3. Can search and select student for new loan
4. Can search and select available book
5. Can create loan with custom due date
6. Book copies decrement on loan creation
7. Can view loan details with all relations
8. Can process book return
9. Book copies increment on return
10. Can renew active loans
11. Renewal history displays correctly
12. Overdue loans are visually distinguished
13. List filters work (All, Active, Overdue, Returned)

---

## Notes

- Use database transactions for loan creation and return (multiple table updates)
- The fine creation on return will be implemented in Step 006
- Consider using optimistic updates for better UX
- Student search should be fast (use trigram index)
- Book search should search both title and ISBN
