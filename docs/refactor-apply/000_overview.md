# Apply Module — Refactor Plan

Consolidated action plan for refactoring `src/app/apply/`. Broken into 3 sequential parts.

**Created**: 2026-03-21

## Progress

| Part | Title | Items | Done | Remaining |
|------|-------|-------|------|-----------|
| 001 | Foundation & Deduplication | 8 | 0 | 8 |
| 002 | Architecture & Type Safety | 8 | 0 | 8 |
| 003 | Patterns & Consistency | 10 | 2 | 8 |
| | **Total** | **26** | **2** | **24** |

### Completed
- ✅ 3.6 Console statements removed from `qualifications/_server/actions.ts`
- ✅ 3.10c PersonalInfoForm validation — SKIPPED (needs format specifications)

### Corrections Applied (2026-03-21)
- **1.2**: Split constants — banking details → `AppConfig`, module constants → `apply/_lib/constants.ts`
- **2.5**: Fixed description — query is NOT redundant, needs upstream query enrichment first
- **3.3**: Changed from "relocate" to "remove" geolocation capture entirely
- **3.4**: Noted larger scope — requires layout RSC conversion (links to 3.10a)
- **3.8**: Scoped to component files only — Next.js requires default exports for page/layout files
- **3.10c**: Skipped — validation format specs needed before implementation

## Parts

| # | Document | Severity | Scope |
|---|----------|----------|-------|
| 1 | [Foundation & Deduplication](./001-foundation-deduplication.md) | 🔴 Critical | Shared types, constants, merge ~1000 duplicated lines, extract shared components |
| 2 | [Architecture & Type Safety](./002-architecture-and-types.md) | 🔴 Critical / 🟠 High | DB access violations, cross-module imports, type collisions, weak types |
| 3 | [Patterns & Consistency](./003-patterns-and-consistency.md) | 🟠 High / 🟡 Medium | Anti-patterns (useEffect, render-time state), validation, exports, inline styles |

## Execution Rules
- Complete Part 1 before Part 2 (Part 2 depends on extractions from Part 1)
- Part 3 can partially overlap with Part 2
- Each step concludes with `pnpm tsc --noEmit & pnpm lint:fix`
- Steps within a part can sometimes be parallelized (noted where applicable)

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
