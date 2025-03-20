import { db } from '@/db';
import { DashboardUser, registrationClearances, users } from '@/db/schema';
import { and, count, eq, between, isNull, sql } from 'drizzle-orm';

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export async function getClearanceStatsByDepartment(
  department: DashboardUser,
  dateRange?: DateRangeFilter,
) {
  let dateCondition = undefined;

  if (dateRange?.startDate && dateRange?.endDate) {
    dateCondition = between(
      registrationClearances.responseDate,
      dateRange.startDate,
      dateRange.endDate,
    );
  }
  const overallStats = await db
    .select({
      total: count(registrationClearances.id),
      approved:
        sql`SUM(CASE WHEN ${registrationClearances.status} = 'approved' AND ${registrationClearances.department} = ${department} THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      rejected:
        sql`SUM(CASE WHEN ${registrationClearances.status} = 'rejected' AND ${registrationClearances.department} = ${department} THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      pending:
        sql`SUM(CASE WHEN ${registrationClearances.status} = 'pending' AND ${registrationClearances.department} = ${department} THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
    })
    .from(registrationClearances)
    .where(
      and(eq(registrationClearances.department, department), dateCondition),
    );

  const staffStats = await db
    .select({
      respondedBy: registrationClearances.respondedBy,
      approved:
        sql`SUM(CASE WHEN ${registrationClearances.status} = 'approved' THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      rejected:
        sql`SUM(CASE WHEN ${registrationClearances.status} = 'rejected' THEN 1 ELSE 0 END)`.mapWith(
          Number,
        ),
      total: count(registrationClearances.id),
    })
    .from(registrationClearances)
    .where(
      and(
        eq(registrationClearances.department, department),
        dateCondition,
        sql`${registrationClearances.respondedBy} IS NOT NULL`,
      ),
    )
    .groupBy(registrationClearances.respondedBy);

  console.log('staffStats', staffStats);

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
