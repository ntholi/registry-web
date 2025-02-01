import BaseRepository from '@/server/base/BaseRepository';
import { clearanceResponses, DashboardUser } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class ClearanceResponseRepository extends BaseRepository<
  typeof clearanceResponses,
  'id'
> {
  constructor() {
    super(clearanceResponses, 'id');
  }

  async countPending(department: DashboardUser) {
    return await db.query.clearanceResponses.findMany({
      where: eq(clearanceResponses.status, 'pending'),
    });
  }
}

export const clearanceResponsesRepository = new ClearanceResponseRepository();
