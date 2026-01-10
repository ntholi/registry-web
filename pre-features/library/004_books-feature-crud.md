# Step 004: Books Feature (CRUD)

## Introduction

This step implements the complete Books feature including CRUD operations for Books, Authors, and Categories. This is the first feature implementation step, building the server layer (Repository → Service → Actions) and UI components.

**Previous Steps Completed:**
- ✅ Step 001: Core database schema (books, authors, categories)
- ✅ Step 002: Digital resources and external libraries schema
- ✅ Step 003: Loans and fines schema

**Database tables available:** `books`, `authors`, `categories`, `bookAuthors`, `bookCategories`

---

## Context

The Books feature allows librarians/admins to:
- Manage the book catalog (add, edit, view, delete books)
- Manage authors (simple name-based entries)
- Manage categories (flat categories for book classification)
- Associate books with multiple authors and categories
- Auto-fetch book cover images from Google Books API using ISBN

---

## Requirements

### 1. Directory Structure

```
src/app/library/
├── layout.tsx                    # Library module layout
├── library.config.ts             # Module configuration
├── books/
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
│   │   ├── edit/
│   │   │   └── page.tsx
│   │   └── copies/              # Book copies management
│   │       ├── page.tsx
│   │       └── new/
│   │           └── page.tsx
│   └── index.ts
├── book-copies/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   └── Form.tsx
│   └── [id]/
│       ├── page.tsx
│       └── edit/
│           └── page.tsx
├── authors/
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
├── categories/
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
└── _database/                    # (Already created)
```

---

## Feature: Books

### Server Layer

#### Repository (`books/_server/repository.ts`)

Extend `BaseRepository` with custom methods:
- `findById(id)` - Include related authors, categories, and copies (with count)
- `findByIsbn(isbn)` - Search by ISBN
- `search(query)` - Search by title or ISBN
- `getAvailableCopiesCount(id)` - Count copies with status 'Available'
- `getTotalCopiesCount(id)` - Count all non-withdrawn copies

#### Service (`books/_server/service.ts`)

Extend `BaseService` with:
- Role configuration: `byIdRoles: ['dashboard']`, `findAllRoles: ['dashboard']`
- Custom `get(id)` to include relations and computed copy counts

#### Actions (`books/_server/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getBook` | `(id: number)` | Get single book with authors/categories/copies |
| `getBooks` | `(page: number, search: string)` | Paginated list with search |
| `createBook` | `(book: BookInsert, authorIds: number[], categoryIds: number[])` | Create book and associations |
| `updateBook` | `(id: number, book: BookInsert, authorIds: number[], categoryIds: number[])` | Update book and associations |
| `deleteBook` | `(id: number)` | Delete book (cascade deletes associations and copies) |
| `fetchBookCover` | `(isbn: string)` | Fetch cover URL from Google Books API |

### UI Components

#### Book Form (`books/_components/Form.tsx`)

Fields:
- `isbn` - TextInput (required)
- `title` - TextInput (required)
- `publisher` - TextInput (optional)
- `publicationYear` - NumberInput (optional)
- `edition` - TextInput (optional)
- `authors` - MultiSelect (fetch from authors, allow creating new)
- `categories` - MultiSelect (fetch from categories)
- `coverUrl` - Display image preview (auto-fetched from ISBN)

**Note:** Copies are managed separately via the book copies sub-feature.

**ISBN Auto-Fetch Behavior:**
- When ISBN field loses focus (onBlur)
- Call Google Books API: `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- Extract thumbnail URL from response
- Auto-populate `coverUrl` field
- Show loading indicator during fetch

#### Book List Layout (`books/layout.tsx`)

Use `ListLayout` component:
- Display: ISBN as label, title as description
- Show available/total copies badge
- Search by ISBN or title
- Action: NewLink to add book

#### Book Details Page (`books/[id]/page.tsx`)

Use `DetailsView` components:
- Display all book fields
- Show cover image (or placeholder)
- List associated authors (clickable links)
- List associated categories (badges)
- **Copies Summary:**
  - Total copies count
  - Available copies count
  - Link to "Manage Copies" page
- Delete button in header

#### Book Edit Page (`books/[id]/edit/page.tsx`)

Reuse `BookForm` with existing data

---

## Feature: Book Copies

### Server Layer

#### Repository (`book-copies/_server/repository.ts`)

Extend `BaseRepository` with custom methods:
- `findById(id)` - Include book details
- `findByBookId(bookId)` - All copies for a specific book
- `findAvailableByBookId(bookId)` - Available copies for a book
- `findBySerialNumber(serialNumber)` - Look up by barcode/serial
- `updateStatus(id, status)` - Update copy status

#### Service (`book-copies/_server/service.ts`)

Extend `BaseService` with:
- Role configuration: `byIdRoles: ['dashboard']`, `findAllRoles: ['dashboard']`

#### Actions (`book-copies/_server/actions.ts`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `getBookCopy` | `(id: number)` | Get single copy with book info |
| `getBookCopies` | `(bookId: number)` | All copies for a book |
| `createBookCopy` | `(copy: BookCopyInsert)` | Add new copy |
| `updateBookCopy` | `(id: number, copy: BookCopyInsert)` | Update copy details |
| `withdrawBookCopy` | `(id: number)` | Set status to 'Withdrawn' (soft delete) |

### UI Components

#### Book Copy Form (`book-copies/_components/Form.tsx`)

Fields:
- `serialNumber` - TextInput (required, unique)
- `condition` - Select (New, Good, Damaged)
- `location` - TextInput (optional, e.g., "Shelf A3")
- `acquiredAt` - DateInput (optional)

**Note:** `bookId` is passed from parent context (not in form).

#### Book Copies List (`books/[id]/copies/page.tsx`)

Table or List view showing:
- Serial number
- Condition (badge)
- Status (badge: Available/OnLoan/Withdrawn)
- Location
- Actions: Edit, Withdraw (if Available)

**Actions:**
- "Add Copy" button
- Filter by status

#### Book Copy Details (`book-copies/[id]/page.tsx`)

- Serial number
- Condition
- Status
- Location
- Acquired date
- Loan history (if any, from loans table)

---

## Feature: Authors

### Server Layer

Standard CRUD using `BaseRepository` and `BaseService`:
- Search by name (trigram)
- No special custom methods needed

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `getAuthor` | `(id: number)` | Get single author |
| `getAuthors` | `(page: number, search: string)` | Paginated list |
| `getAllAuthors` | `()` | All authors (for select dropdowns) |
| `createAuthor` | `(author: AuthorInsert)` | Create author |
| `updateAuthor` | `(id: number, author: AuthorInsert)` | Update author |
| `deleteAuthor` | `(id: number)` | Delete author |

### UI Components

#### Author Form

Fields:
- `name` - TextInput (required)

#### Author Details Page

- Display name
- List books by this author (query `bookAuthors` junction)

---

## Feature: Categories

### Server Layer

Standard CRUD using `BaseRepository` and `BaseService`:
- Search by name
- Unique constraint on name

### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `getCategory` | `(id: number)` | Get single category |
| `getCategories` | `(page: number, search: string)` | Paginated list |
| `getAllCategories` | `()` | All categories (for select dropdowns) |
| `createCategory` | `(category: CategoryInsert)` | Create category |
| `updateCategory` | `(id: number, category: CategoryInsert)` | Update category |
| `deleteCategory` | `(id: number)` | Delete category |

### UI Components

#### Category Form

Fields:
- `name` - TextInput (required)
- `description` - Textarea (optional)

#### Category Details Page

- Display name and description
- List books in this category

---

## Google Books API Integration

### Endpoint
```
GET https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}
```

### Response Handling

Extract `items[0].volumeInfo.imageLinks.thumbnail` or `smallThumbnail`

### Implementation Location

Create utility function in `src/app/library/_lib/google-books.ts`:
- `fetchBookCoverByIsbn(isbn: string): Promise<string | null>`
- Handle API errors gracefully (return null on failure)
- No API key required for basic queries

---

## Navigation Configuration

### Module Config (`library.config.ts`)

```typescript
export const libraryConfig = {
  title: 'Library',
  path: '/library',
  icon: 'IconBooks',
};
```

### Navigation Items

Add to dashboard navigation:
- Library (parent)
  - Books
  - Authors
  - Categories
  - (More items added in later steps)

---

## Expected Files

| File Path | Purpose |
|-----------|---------|
| `src/app/library/layout.tsx` | Module layout |
| `src/app/library/library.config.ts` | Module configuration |
| `src/app/library/_lib/google-books.ts` | Google Books API utility |
| `src/app/library/books/_server/repository.ts` | Books repository |
| `src/app/library/books/_server/service.ts` | Books service |
| `src/app/library/books/_server/actions.ts` | Books actions |
| `src/app/library/books/_components/Form.tsx` | Book form component |
| `src/app/library/books/layout.tsx` | Books list layout |
| `src/app/library/books/page.tsx` | Books empty state |
| `src/app/library/books/new/page.tsx` | New book page |
| `src/app/library/books/[id]/page.tsx` | Book details |
| `src/app/library/books/[id]/edit/page.tsx` | Edit book |
| `src/app/library/books/index.ts` | Re-exports |
| `src/app/library/authors/_server/*` | Authors server layer |
| `src/app/library/authors/_components/Form.tsx` | Author form |
| `src/app/library/authors/*.tsx` | Authors pages |
| `src/app/library/categories/_server/*` | Categories server layer |
| `src/app/library/categories/_components/Form.tsx` | Category form |
| `src/app/library/categories/*.tsx` | Categories pages |

---

## Validation Criteria

After implementation:
1. `pnpm tsc --noEmit` - no type errors
2. `pnpm lint:fix` - no lint errors
3. Can create, view, edit, delete books
4. Can associate multiple authors and categories to a book
5. ISBN auto-fetches cover image from Google Books
6. Can create, view, edit, delete authors
7. Can create, view, edit, delete categories
8. Can add, view, edit, withdraw book copies
9. Book details show computed available/total copies counts
10. Search works on all list views
11. Pagination works correctly

---

## Notes

- Use Mantine's `MultiSelect` with `searchable` and `creatable` for authors (allows inline creation)
- Cover image should have fallback placeholder
- Copies are managed separately from the book record
- Available/total copies are computed from `bookCopies` table (count by status)
- Book deletion cascades to `bookAuthors`, `bookCategories`, and `bookCopies`
- When withdrawing a copy, status is set to 'Withdrawn' (soft delete)
- Follow existing patterns from `@academic/modules` for form and page structure
