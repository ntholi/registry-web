# Activity Logging Fine-Grain — Implementation Plan

## Goal
Make activity logs highly specific to the exact business operation being performed, minimizing generic labels and improving audit accuracy.

## Plan Structure

| Step | File | Description |
|------|------|-------------|
| 1 | [001_current-state-deepdive.md](001_current-state-deepdive.md) | Current-state analysis, confirmed issues, and impact summary |
| 2 | [002_gap-matrix-and-taxonomy.md](002_gap-matrix-and-taxonomy.md) | Precision gaps and proposed fine-grained activity taxonomy |
| 3 | [003_implementation-validation-and-rollout.md](003_implementation-validation-and-rollout.md) | Implementation phases, validation, migration strategy, and done criteria |

## Key Outcomes Expected
- Every write operation emits a semantically accurate activity type.
- Generic labels are replaced by operation-intent labels.
- Catalog keys and emitted values remain fully aligned (no dead entries, no uncataloged emissions).
- `TABLE_OPERATION_MAP` wired as fallback in write path for systemic safety.
- All services with `deleteRoles` have matching `delete` activity types.
- Tracker analytics become manager-meaningful and forensically useful.

## Verification Focus
1. Typecheck/lint clean after updates.
2. No non-cataloged or NULL activity values are emitted.
3. High-impact modules (tasks, notifications, finance, certificate reprints, students) emit intent-specific events.
4. 9 newly identified delete-audit gaps are resolved (venues, venue types, applications, documents, deposits, feedback ×3, graduation dates).
5. Dead catalog entries (`sponsorship_assigned`, `sponsorship_updated`, `application_status_changed`) are wired into code.
