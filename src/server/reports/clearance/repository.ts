import { db } from '@/db';
import { DashboardUser, registrationClearances, users } from '@/db/schema';
import { and, count, eq } from 'drizzle-orm';

export async function getClearanceStatsByDepartment(department: DashboardUser) {
  const stats = await db
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
    .where(eq(registrationClearances.department, department))
    .groupBy(registrationClearances.respondedBy);

  return stats;
}

export async function getUserNamesByIds(userIds: string[]) {
  return await db.query.users.findMany({
    where: (users, { inArray }) => inArray(users.id, userIds),
    columns: {
      id: true,
      name: true,
    },
  });
}
