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
      approved: count(
        and(
          eq(registrationClearances.status, 'approved'),
          eq(registrationClearances.department, department),
        ),
      ),
      rejected: count(
        and(
          eq(registrationClearances.status, 'rejected'),
          eq(registrationClearances.department, department),
        ),
      ),
      pending: count(
        and(
          eq(registrationClearances.status, 'pending'),
          eq(registrationClearances.department, department),
        ),
      ),
    })
    .from(registrationClearances)
    .where(
      and(eq(registrationClearances.department, department), dateCondition),
    );

  const staffStats = await db
    .select({
      respondedBy: registrationClearances.respondedBy,
      approved: count(
        and(
          eq(registrationClearances.status, 'approved'),
          eq(registrationClearances.department, department),
        ),
      ),
      rejected: count(
        and(
          eq(registrationClearances.status, 'rejected'),
          eq(registrationClearances.department, department),
        ),
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
