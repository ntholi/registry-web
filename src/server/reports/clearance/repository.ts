import { db } from '@/db';
import { DashboardUser, clearance } from '@/db/schema';
import { and, between, count, eq, sql } from 'drizzle-orm';

type DateInput = Date | string | number;

export interface DateRangeFilter {
  startDate?: DateInput;
  endDate?: DateInput;
}

function normalizeDate(input?: DateInput): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function getClearanceStatsByDepartment(
  department: DashboardUser,
  dateRange?: DateRangeFilter
) {
  let dateCondition = undefined;

  const start = normalizeDate(dateRange?.startDate);
  const end = normalizeDate(dateRange?.endDate);

  if (start && end) {
    dateCondition = between(clearance.responseDate, start, end);
  }
  const overallStats = await db
    .select({
      total: count(clearance.id),
      approved:
        sql`SUM(CASE WHEN ${clearance.status} = 'approved' AND ${clearance.department} = ${department} THEN 1 ELSE 0 END)`.mapWith(
          Number
        ),
      rejected:
        sql`SUM(CASE WHEN ${clearance.status} = 'rejected' AND ${clearance.department} = ${department} THEN 1 ELSE 0 END)`.mapWith(
          Number
        ),
      pending:
        sql`SUM(CASE WHEN ${clearance.status} = 'pending' AND ${clearance.department} = ${department} THEN 1 ELSE 0 END)`.mapWith(
          Number
        ),
    })
    .from(clearance)
    .where(and(eq(clearance.department, department), dateCondition));

  const staffStats = await db
    .select({
      respondedBy: clearance.respondedBy,
      approved:
        sql`SUM(CASE WHEN ${clearance.status} = 'approved' THEN 1 ELSE 0 END)`.mapWith(
          Number
        ),
      rejected:
        sql`SUM(CASE WHEN ${clearance.status} = 'rejected' THEN 1 ELSE 0 END)`.mapWith(
          Number
        ),
      total: count(clearance.id),
    })
    .from(clearance)
    .where(
      and(
        eq(clearance.department, department),
        dateCondition,
        sql`${clearance.respondedBy} IS NOT NULL`
      )
    )
    .groupBy(clearance.respondedBy);

  return {
    overall: overallStats[0],
    staff: staffStats,
  };
}

export async function getUserNamesByIds(userIds: string[]) {
  if (userIds.length === 0) return [];

  return await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.id, userIds),
    columns: {
      id: true,
      name: true,
    },
  });
}
