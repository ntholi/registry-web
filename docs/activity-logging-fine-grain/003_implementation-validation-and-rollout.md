# 003 — Implementation, Validation, and Rollout

## Phase 1: Type safety and central source of truth
1. Expose activity type union as shared source imported by platform layer.
2. Change audit option type from `string` to catalog-driven `ActivityType` where possible.
3. Add compile-time guard utility for activity type literals.

## Phase 2: Enforced fallback in platform write path
1. Wire `deriveActivityType(tableName, operation, oldValues, newValues, metadata)` into BaseRepository audit write methods.
2. If explicit `activityType` is missing, compute from deterministic rules.
3. Ensure fallback is status-aware for tables like student progression and clearance.

## Phase 3: Module remediation (action-intent specificity)
1. LMS actions: migrate generic `assignment/quiz` to action-based events.
2. Tasks service: split generic updates into intent-specific types.
3. Notifications service: introduce delete-specific and recipient/visibility-specific events.
4. Registry students service: replace non-cataloged `program_structure_update` and add link/unlink user events.
5. Admissions applicant modules: route writes through semantic audit-enabled paths and add specific event types.

## Phase 4: Catalog/map sync and dead-code removal
1. Update activity catalog with new/renamed events.
2. Remove obsolete generic entries after migration window.
3. Keep `TABLE_OPERATION_MAP` only if needed by fallback, otherwise simplify.

## Phase 5: Validation and rollout
1. Run typecheck/lint clean.
2. Validate analytics pages still resolve labels and department grouping.
3. Add smoke checks for key operations to assert correct activity type emission.

## Validation checklist
- Every write operation emits a catalog-valid activity type.
- No feature emits non-cataloged types.
- Delete paths never reuse update labels.
- Intent-specific operations map to intent-specific activity types.
- Metadata includes `changedFields` where update operations occur.

## Query checks (recommended)
1. Non-cataloged activity types:
```sql
select distinct activity_type
from audit_logs
where activity_type is not null
except
select unnest(array[
	-- generated list from catalog keys
]);
```

2. Generic overuse detection:
```sql
select table_name, activity_type, count(*)
from audit_logs
group by 1,2
order by count(*) desc;
```

3. Expected intent distribution per module:
```sql
select activity_type, count(*)
from audit_logs
where changed_at >= now() - interval '30 days'
group by 1
order by 2 desc;
```

## Migration strategy
- Stepwise migration by module to avoid noisy analytics jumps.
- Keep backward-compatible labels during transition where needed.
- Optionally add one-time backfill script for legacy generic events if historical consistency is required.

## Risk controls
- Protect fallback resolver with deterministic tests.
- Keep table+operation baseline mapping for safety.
- For high-volume tables, avoid expensive per-row logic inside write path.

## Non-goals
- No redesign of activity tracker UI in this plan.
- No changes to unrelated domain business logic.

## Done criteria
- Catalog and emitted events are 1:1 aligned.
- No generic LMS activity labels remain.
- Task/notification delete and status transitions are distinguishable in analytics.
- Admissions applicant submodules emit specific activity types with consistent metadata.
