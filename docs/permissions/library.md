# Library Module — Permission Map

## Navigation (library.config.ts)

| Nav Item | Visibility | Permission Check |
|----------|-----------|-----------------|
| Catalog | `roles: ['admin', 'academic', 'finance', 'library', 'marketing', 'registry', 'resource', 'student_services']` | — |
| Books | `roles: ['admin', 'library']` | — |
| Loans | `roles: ['admin', 'library']` | — |
| Authors | `roles: ['admin', 'library']` | — |
| Categories | `roles: ['admin', 'library']` | — |
| Fines | `roles: ['admin', 'library']` | — |
| Resources > Publications | `roles: ['admin', 'library']` | — |
| Resources > Question Papers | `roles: ['admin', 'library']` | — |
| Settings | `roles: ['admin', 'library']` | — |

---

## Books Service

**File:** `src/app/library/books/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `{ library: ['read'] }` |
| `findByIsbn()` | `{ library: ['read'] }` |
| `createWithRelations()` | `{ library: ['create'] }` |
| `updateWithRelations()` | `{ library: ['update'] }` |

---

## Categories Service

**File:** `src/app/library/categories/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

*(No custom methods)*

---

## Authors Service

**File:** `src/app/library/authors/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

*(No custom methods)*

---

## Book Copies Service

**File:** `src/app/library/book-copies/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithBook()` | `{ library: ['read'] }` |
| `findByBookId()` | `{ library: ['read'] }` |
| `findBySerialNumber()` | `{ library: ['read'] }` |
| `withdraw()` | `{ library: ['update'] }` |

---

## Fines Service

**File:** `src/app/library/fines/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `{ library: ['read'] }` |
| `findByStudent()` | `{ library: ['read'] }` |
| `findByStatus()` | `{ library: ['read'] }` |
| `findByLoan()` | `{ library: ['read'] }` |
| `createFine()` | `{ library: ['create'] }` |
| `markPaid()` | `{ library: ['update'] }` |
| `getTotalUnpaidByStudent()` | `{ library: ['read'] }` |
| `getFines()` | `{ library: ['read'] }` |

---

## Loans Service

**File:** `src/app/library/loans/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `{ library: ['read'] }` |
| `findByStudent()` | `{ library: ['read'] }` |
| `findActiveLoans()` | `{ library: ['read'] }` |
| `findOverdueLoans()` | `{ library: ['read'] }` |
| `issueLoan()` | `{ library: ['create'] }` |
| `returnBook()` | `{ library: ['update'] }` |
| `renewLoan()` | `{ library: ['update'] }` |
| `getLoanHistory()` | `{ library: ['read'] }` |
| `searchStudents()` | `{ library: ['read'] }` |
| `searchBooks()` | `{ library: ['read'] }` |
| `getAvailableCopies()` | `{ library: ['read'] }` |
| `getStudentActiveLoansCount()` | `{ library: ['read'] }` |

---

## Publications Service

**File:** `src/app/library/resources/publications/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `{ library: ['read'] }` |
| `getPublications()` | `{ library: ['read'] }` |

---

## Question Papers Service

**File:** `src/app/library/resources/question-papers/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getWithRelations()` | `{ library: ['read'] }` |
| `getQuestionPapers()` | `{ library: ['read'] }` |

---

## Settings Service

**File:** `src/app/library/settings/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

### Custom Methods

| Method | Auth Requirement |
|--------|-----------------|
| `getSettings()` | `{ library: ['read'] }` |
| `updateSettings()` | `{ library: ['update'] }` |

---

## External Libraries Service

**File:** `src/app/library/external-libraries/_server/service.ts`
**Extends:** `BaseService`

### BaseService Config

| Operation | Auth Requirement |
|-----------|-----------------|
| byIdAuth | `{ library: ['read'] }` |
| findAllAuth | `{ library: ['read'] }` |
| createAuth | `{ library: ['create'] }` |
| updateAuth | `{ library: ['update'] }` |
| deleteAuth | `{ library: ['delete'] }` |

*(No custom methods)*
