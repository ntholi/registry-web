# Phase 18: LMS Credential Migration

> Estimated Implementation Time: 1 to 1.5 hours

**Prerequisites**: Phase 17 complete. Read `000_overview.md` first.

This phase migrates all LMS credential reads from session to the new `lms_credentials` table.

## 18.1 Migrate LMS Credential Reads (~15 files)

Replace `session.user.lmsUserId` / `session.user.lmsToken` with on-demand reads from `lms_credentials` table.

### Create LMS Credentials Helper

File: `src/app/auth/auth-providers/_server/lms-credentials.ts`

```ts
export async function getLmsCredentials(userId: string) {
  return db.query.lmsCredentials.findFirst({
    where: eq(lmsCredentials.userId, userId),
  });
}
```

### Files Requiring Migration

| File | What to change |
|------|---------------|
| `src/core/integrations/moodle.ts` | Replace `session.user.lmsUserId`/`lmsToken` with `getLmsCredentials()` call |
| `src/app/lms/students/_server/repository.ts` | Replace session-based LMS credential access |
| `src/app/lms/students/_server/actions.ts` | Fetch LMS credentials from table instead of session |
| `src/app/lms/courses/_server/actions.ts` | Fetch LMS credentials from table instead of session |
| `src/app/lms/quizzes/_server/actions.ts` | Fetch LMS credentials from table instead of session |
| `src/app/lms/auth/_components/LmsAuthGuard.tsx` | Check LMS credentials from table |
| `src/app/lms/auth/_server/actions.ts` | Read/write LMS credentials via `lms_credentials` table |
| `src/app/admin/users/_server/repository.ts` | Update user LMS credential handling to use separate table |
| `src/app/admin/users/_components/Form.tsx` | LMS credential fields now read/write from `lms_credentials` |

### Migration Pattern

**Before:**
```ts
const session = await auth();
const lmsUserId = session.user.lmsUserId;
const lmsToken = session.user.lmsToken;
```

**After:**
```ts
const session = await getSession();
const creds = await getLmsCredentials(session.user.id);
const lmsUserId = creds?.lmsUserId;
const lmsToken = creds?.lmsToken;
```

## Exit Criteria

- [ ] LMS credentials helper created in `src/app/auth/auth-providers/_server/lms-credentials.ts`
- [ ] All ~15 files migrated from session-based LMS credential access to table reads
- [ ] No `session.user.lmsUserId` or `session.user.lmsToken` references remain
- [ ] `pnpm tsc --noEmit` passes
