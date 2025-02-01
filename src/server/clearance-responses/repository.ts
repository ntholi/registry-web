import BaseRepository from '@/server/base/BaseRepository';
import { clearanceTasks, DashboardUser } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class ClearanceResponseRepository extends BaseRepository<
  typeof clearanceTasks,
  'id'
> {
  constructor() {
    super(clearanceTasks, 'id');
  }

  async countPending(department: DashboardUser) {
    return await db.query.clearanceResponses.findMany({
      where: eq(clearanceTasks.status, 'pending'),
    });
  }
}

export const clearanceResponsesRepository = new ClearanceResponseRepository();
