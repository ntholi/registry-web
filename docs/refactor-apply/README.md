# Apply Module — Refactor Audit

Comprehensive audit of `src/app/apply/` identifying bad practices, inconsistencies, anti-patterns, and unmaintainable code.
**Last reviewed**: 2026-03-21

## Progress

| Phase | Items | Done | Remaining |
|-------|-------|------|-----------|
| 01 Code Duplication | 6 | 0 | 6 |
| 02 Architecture Violations | 5 | 0 | 5 |
| 03 Type Safety | 3 | 0 | 3 |
| 04 Anti-Patterns | 8 | 1 | 7 |
| 05 Inconsistencies | 4 | 0 | 4 |
| **Total** | **26** | **1** | **25** |

### What's been fixed
- ✅ 4.6 Console statements removed from `qualifications/_server/actions.ts`

## Priority Matrix

| # | Document | Severity | Impact |
|---|----------|----------|--------|
| 1 | [Code Duplication](./01-code-duplication.md) | 🔴 Critical | ~1000 lines of duplicated code across uploads, modals, and constants |
| 2 | [Architecture Violations](./02-architecture-violations.md) | 🔴 Critical | Direct DB access in actions, wrong cross-module imports |
| 3 | [Type Safety](./03-type-safety.md) | 🟠 High | Weak types, name collisions, loose annotations |
| 4 | [Anti-Patterns](./04-anti-patterns.md) | 🟠 High | useEffect misuse, hardcoded constants, missing validation |
| 5 | [Inconsistencies & Style](./05-inconsistencies.md) | 🟡 Medium | Export patterns, inline styles, component reuse failures |

## Summary Statistics (current)

- **Files Audited**: ~50
- **Critical Issues**: 5 (0 fixed)
- **High Issues**: 8 (1 fixed)
- **Medium Issues**: 10+ (0 fixed)
- **Estimated Duplicated Lines**: ~1000+
- **Inline `style={{}}` Usages**: 30+
- **`MAX_FILE_SIZE` Redefinitions**: 5 separate files
- **Direct DB Imports Outside Repositories**: 2 files
- **Cross-Module Private Imports**: 3 files (was 4; `getGradeColor` still in 3)
- **`useEffect` Violations**: 3 occurrences
- **Render-Time State Updates**: 1 occurrence
- **Async Form Initialization Risks**: 1 confirmed occurrence

## File Index

```
src/app/apply/
├── layout.tsx
├── page.tsx                          ← Imports Footer from student-portal/_shared
├── _components/
│   ├── DocumentUpload.tsx            ← ~455 lines, 95% duplicated with MobileDocumentUpload
│   ├── MobileDocumentUpload.tsx      ← ~540 lines, 95% duplicated with DocumentUpload
│   ├── IdentityConfirmationModal.tsx ← Local IDField component
│   ├── CertificateConfirmationModal.tsx  ← Wrong getGradeColor import, local CertField
│   ├── ReceiptConfirmationModal.tsx  ← Local ReceiptField component
│   ├── ApplyHeader.tsx
│   └── ApplyHero.tsx
├── _lib/
│   ├── useApplicant.ts              ← 2 useEffect violations (geolocation, eligibility redirect)
│   └── wizard-utils.ts              ← Weak typing (unknown[]), WizardStep name collision
├── [id]/
│   ├── layout.tsx                   ← Client component (unnecessarily)
│   ├── thank-you/page.tsx
│   ├── (wizard)/
│   │   ├── layout.tsx
│   │   ├── _components/
│   │   │   ├── WizardLayout.tsx
│   │   │   └── WizardNavigation.tsx
│   │   ├── _lib/wizard-steps.ts     ← WizardStep name collision with wizard-utils.ts
│   │   ├── identity/
│   │   ├── qualifications/          ← Module-scope CURRENT_YEAR, wrong getGradeColor import
│   │   ├── program/                 ← Loose typing, render-time state initialization
│   │   ├── personal-info/           ← Form can render empty before data loads
│   │   ├── review/                  ← Bypasses WizardNavigation
│   │   └── payment/                 ← Direct DB access, hardcoded banking details, manual polling
├── profile/
│   ├── page.tsx
│   ├── _components/
│   │   ├── ProfileView.tsx          ← Custom CSS via styles prop, redundant applications query
│   │   ├── ApplicationsTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   └── InfoTab.tsx              ← Reinvents FieldView, wrong getGradeColor import
│   └── _lib/
│       └── status.ts
├── new/page.tsx
├── welcome/page.tsx
├── restricted/page.tsx              ← Local formatRole() utility
└── courses/
    ├── page.tsx
    └── _components/
        ├── CourseCard.tsx
        ├── CoursesFilters.tsx        ← Imported cross-boundary by wizard CourseSelectionForm
        └── CoursesPagination.tsx
```
