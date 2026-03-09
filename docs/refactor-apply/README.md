# Apply Module — Refactor Audit

Comprehensive audit of `src/app/apply/` identifying bad practices, inconsistencies, anti-patterns, and unmaintainable code.

## Priority Matrix

| # | Document | Severity | Impact |
|---|----------|----------|--------|
| 1 | [Code Duplication](./01-code-duplication.md) | 🔴 Critical | ~1000 lines of duplicated code across uploads, modals, and constants |
| 2 | [Architecture Violations](./02-architecture-violations.md) | 🔴 Critical | Direct DB access in actions, wrong cross-module imports |
| 3 | [Type Safety](./03-type-safety.md) | 🟠 High | Weak types, name collisions, loose annotations |
| 4 | [Anti-Patterns](./04-anti-patterns.md) | 🟠 High | useEffect misuse, hardcoded constants, missing validation |
| 5 | [Inconsistencies & Style](./05-inconsistencies.md) | 🟡 Medium | Export patterns, inline styles, component reuse failures |

## Summary Statistics

- **Files Audited**: ~50
- **Critical Issues**: 5
- **High Issues**: 8
- **Medium Issues**: 10+
- **Estimated Duplicated Lines**: ~1000+
- **Inline `style={{}}` Usages**: 30+
- **`MAX_FILE_SIZE` Redefinitions**: 5 separate files
- **Direct DB Imports Outside Repositories**: 2 files
- **Cross-Module Private Imports**: 4 files
- **`useEffect` Violations**: 3 occurrences
- **Render-Time State Updates**: 1 occurrence
- **Async Form Initialization Risks**: 1 confirmed occurrence

## File Index

```
src/app/apply/
├── layout.tsx
├── page.tsx                          ← 'use client' landing page, imports Footer from student-portal
├── _components/
│   ├── DocumentUpload.tsx            ← ~480 lines, 95% duplicated with MobileDocumentUpload
│   ├── MobileDocumentUpload.tsx      ← ~540 lines, 95% duplicated with DocumentUpload
│   ├── IdentityConfirmationModal.tsx
│   ├── CertificateConfirmationModal.tsx  ← Wrong getGradeColor import
│   ├── ReceiptConfirmationModal.tsx
│   ├── ApplyHeader.tsx
│   └── ApplyHero.tsx
├── _lib/
│   ├── errors.ts
│   ├── useApplicant.ts              ← 2 useEffect violations
│   └── wizard-utils.ts             ← Weak typing (unknown[])
├── [id]/
│   ├── layout.tsx                   ← Client component (unnecessarily)
│   ├── thank-you/page.tsx
│   ├── (wizard)/
│   │   ├── layout.tsx
│   │   ├── _components/
│   │   │   ├── WizardLayout.tsx     ← Default export (inconsistent)
│   │   │   └── WizardNavigation.tsx ← Default export (inconsistent)
│   │   ├── _lib/wizard-steps.ts     ← WizardStep name collision
│   │   ├── identity/
│   │   ├── qualifications/          ← console statements, wrong import
│   │   ├── program/                 ← Loose typing, render-time state initialization
│   │   ├── personal-info/           ← Missing form validation, async form hydration risk
│   │   ├── review/                  ← Bypasses WizardNavigation
│   │   └── payment/                 ← Direct DB access, hardcoded banking details
├── profile/
│   ├── page.tsx
│   ├── _components/
│   │   ├── ProfileView.tsx          ← Custom CSS via styles prop, redundant applications query
│   │   ├── ApplicationsTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   └── InfoTab.tsx              ← Reinvents FieldView, wrong import
│   └── _lib/status.ts
├── new/page.tsx
├── welcome/page.tsx
├── restricted/page.tsx              ← Local formatRole() utility
└── courses/
    ├── page.tsx
    └── _components/
```
