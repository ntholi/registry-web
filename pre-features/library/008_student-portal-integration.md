# Step 008: Student Portal Integration

## Introduction

This is the final step, integrating the library module into the student portal. Students will be able to view available books, their loan history, access digital resources, and view external library links.

**Previous Steps Completed:**
- ✅ Step 001-003: Complete database schema
- ✅ Step 004: Books, Authors, Categories CRUD
- ✅ Step 005: Loans management
- ✅ Step 006: Fines, Digital Resources, External Libraries
- ✅ Step 007: Reports

**All backend functionality is now complete. This step focuses on student-facing views.**

---

## Context

The Student Portal (`src/app/student-portal/`) has a different layout than the dashboard modules and does NOT follow the `adease` patterns. Students access their personalized view after logging in.

The library section in the student portal will provide:
1. **Browse Books** - View available books in the catalog
2. **My Loans** - View their current and past loans
3. **Digital Resources** - Access uploaded documents
4. **External Libraries** - View links to external library services

Students can only VIEW data—they cannot create loans or manage anything.

---

## Requirements

### Directory Structure

```
src/app/student-portal/
├── library/
│   ├── layout.tsx             # Library section layout
│   ├── page.tsx               # Library home/overview
│   ├── books/
│   │   ├── page.tsx           # Browse all books
│   │   └── [id]/
│   │       └── page.tsx       # Book details
│   ├── my-loans/
│   │   ├── page.tsx           # Student's loan history
│   │   └── [id]/
│   │       └── page.tsx       # Loan details
│   ├── resources/
│   │   ├── page.tsx           # Browse digital resources
│   │   └── [id]/
│   │       └── page.tsx       # Resource view/download
│   └── external-libraries/
│       └── page.tsx           # External library links
```

---

## Server Actions (Read-Only)

Create new actions specifically for the student portal in the library module:

### Location
`src/app/library/_server/portal-actions.ts`

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `getAvailableBooks` | `(page, search, categoryId?)` | Books with available copies (computed from bookCopies) |
| `getBookForPortal` | `(id: number)` | Single book details with copy counts (no edit capabilities) |
| `getMyLoans` | `()` | Current student's loans (uses session) |
| `getMyActiveLoan` | `(id: number)` | Single loan belonging to current student |
| `getMyFines` | `()` | Current student's fines |
| `getPublicResources` | `(page, search, type?)` | All digital resources |
| `getResourceForPortal` | `(id: number)` | Single resource with download URL |
| `getExternalLibrariesForPortal` | `()` | All external library links |

**Authorization:**
- All actions use `withAuth(['student'])` or check session for student role
- Student can only see their own loans and fines
- Resources and external libraries are visible to all authenticated students

---

## Feature 1: Browse Books

### Page: `library/books/page.tsx`

**Purpose:** Let students browse the book catalog

**Layout:**
- Search bar at top
- Category filter (optional dropdown or tabs)
- Grid of book cards

**Book Card Contents:**
- Cover image (or placeholder)
- Title
- Author(s)
- Availability badge: "X copies available" or "Not available"
- Categories as small badges

**Interactions:**
- Click card → Navigate to book details
- Search filters instantly

### Page: `library/books/[id]/page.tsx`

**Purpose:** Show complete book information

**Layout:**
- Large cover image (left)
- Book details (right):
  - Title (heading)
  - Authors list
  - Publisher, Year, Edition
  - ISBN
  - Categories
  - Availability status with count
  - Condition

**Note:** No "Borrow" button—students must visit the library physically.

---

## Feature 2: My Loans

### Page: `library/my-loans/page.tsx`

**Purpose:** Show student's loan history

**Tabs:**
- Current Loans (active + overdue)
- Past Loans (returned)

**Current Loans List:**
- Book cover thumbnail
- Book title
- Loan date
- Due date
- Status badge (Active, Overdue)
- Days until due (or days overdue)

**Past Loans List:**
- Book cover thumbnail
- Book title
- Loan date
- Return date
- Was overdue? (badge if yes)
- Fine paid? (badge if applicable)

**Interactions:**
- Click loan → Navigate to loan details

### Page: `library/my-loans/[id]/page.tsx`

**Purpose:** Show loan details

**Layout:**
- Book info section (cover, title, ISBN)
- Copy info section (serial number, condition)
- Loan timeline:
  - Loan date
  - Due date
  - Return date (if returned)
- Status with visual indicator
- If overdue and unreturned: Warning message with estimated fine
- If fine exists: Fine details (amount, status)
- Renewal history (if any)

**Note:** No action buttons—students cannot renew or return via portal.

---

## Feature 3: Digital Resources

### Page: `library/resources/page.tsx`

**Purpose:** Browse and access digital resources

**Layout:**
- Search bar
- Type filter (tabs: All, Past Papers, Research, Thesis, Journal, Other)
- List/Grid of resource cards

**Resource Card:**
- File type icon (PDF, DOC, etc.)
- Title
- Type badge
- Description (truncated)
- Download icon (if downloadable)

**Interactions:**
- Click card → Navigate to resource details

### Page: `library/resources/[id]/page.tsx`

**Purpose:** View or download resource

**Layout:**
- Title
- Type and description
- File info (name, size, type)
- Upload date

**Actions:**
- View button (opens in new tab or embedded viewer)
- Download button (if `isDownloadable`)

**Document Viewer:**
- For PDFs: Embed in page or open in new tab
- For other types: Show download option only

---

## Feature 4: External Libraries

### Page: `library/external-libraries/page.tsx`

**Purpose:** Show links to external online libraries

**Layout:**
- List of external library cards

**Card Contents:**
- Library name (heading)
- URL (clickable, opens in new tab)
- Description/Instructions
- Credentials (if available):
  - Username (copyable)
  - Password (hidden by default, reveal toggle, copyable)

**Interactions:**
- "Open Library" button → Opens URL in new tab
- Copy buttons for username/password

---

## Library Home Page

### Page: `library/page.tsx`

**Purpose:** Overview/landing page for library section

**Layout:**
- Welcome message: "Library Resources"
- Quick stats (for logged-in student):
  - Current active loans count
  - Overdue loans count (with warning if > 0)
  - Unpaid fines total (with warning if > 0)

- Quick links grid:
  1. Browse Books → `/student-portal/library/books`
  2. My Loans → `/student-portal/library/my-loans`
  3. Digital Resources → `/student-portal/library/resources`
  4. External Libraries → `/student-portal/library/external-libraries`

- Recently added books section (3-4 cards)
- Featured resources section (optional)

---

## Layout

### Page: `library/layout.tsx`

**Purpose:** Layout wrapper for library section

**Features:**
- Navigation tabs or sidebar for library sections
- Breadcrumb navigation
- Back to portal link

**Navigation Items:**
- Overview
- Browse Books
- My Loans
- Digital Resources
- External Libraries

---

## Authorization

All portal pages must verify:
1. User is authenticated
2. User has 'student' role (or is the student associated with the viewed data)
3. For "My Loans" and "My Fines": Data belongs to the logged-in student

Use `withAuth(['student'])` wrapper or session checks in actions.

---

## UI/UX Considerations

### Responsive Design
- Mobile-first approach
- Cards stack on mobile, grid on desktop
- Touch-friendly tap targets

### Empty States
- "No loans found" message for empty loan history
- "No books found" for empty search results
- "No resources available" for empty resources

### Loading States
- Skeleton loaders for cards
- Loading spinner for search

### Error States
- Friendly error messages
- Retry buttons where applicable

### Visual Hierarchy
- Clear section headings
- Consistent card designs
- Status badges with semantic colors:
  - Active: Blue
  - Overdue: Red/Warning
  - Returned: Green
  - Available: Green
  - Unavailable: Gray

---

## Integration with Main Dashboard Navigation

Add library navigation item to student portal menu structure.

Update student portal navigation config (location varies by existing implementation):
```
Library
├── Browse Books
├── My Loans
├── Digital Resources
└── External Libraries
```

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/_server/portal-actions.ts` | Student portal actions |
| `src/app/student-portal/library/layout.tsx` | Library section layout |
| `src/app/student-portal/library/page.tsx` | Library home/overview |
| `src/app/student-portal/library/books/page.tsx` | Browse books |
| `src/app/student-portal/library/books/[id]/page.tsx` | Book details |
| `src/app/student-portal/library/my-loans/page.tsx` | Student's loans |
| `src/app/student-portal/library/my-loans/[id]/page.tsx` | Loan details |
| `src/app/student-portal/library/resources/page.tsx` | Digital resources |
| `src/app/student-portal/library/resources/[id]/page.tsx` | Resource view |
| `src/app/student-portal/library/external-libraries/page.tsx` | External links |

---

## Validation Criteria

1. `pnpm tsc --noEmit` - no type errors
2. `pnpm lint:fix` - no lint errors
3. Student can access library section from portal
4. Student can browse all available books
5. Student can view book details
6. Student can only see their own loans
7. Loan details display correctly with timeline
8. Overdue loans show warning styling
9. Fines display correctly (if any)
10. Student can browse digital resources
11. Downloadable resources have download option
12. Non-downloadable resources only have view option
13. External libraries display with credentials
14. Copy buttons work for credentials
15. All pages are mobile-responsive
16. Unauthorized access redirects appropriately

---

## Notes

- Student portal follows its own design patterns, not `adease`
- Review existing student portal components before creating new ones
- Reuse any existing card, list, or layout components
- Student's `stdNo` is retrieved from session
- No mutations allowed from portal—view only
- Consider adding a "Visit Library" call-to-action for borrowing
- Fine payments are done in person, not through portal
