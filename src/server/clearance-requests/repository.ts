import BaseRepository from '@/server/base/BaseRepository';
import { clearanceRequests } from '@/db/schema';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';

export default class ClearanceRequestRepository extends BaseRepository<
  typeof clearanceRequests,
  'id'
> {
  constructor() {
    super(clearanceRequests, 'id');
  }

  override async findById(id: number) {
    return await db.query.clearanceRequests.findFirst({
      where: eq(clearanceRequests.id, id),
      with: {
        student: true,
        registrationRequest: {
          with: {
            requestedModules: {
              with: {
                module: true,
              },
            },
          },
        },
      },
    });
  }

  async getByStdNo(termId: number, stdNo: number) {
    return await db.query.clearanceRequests.findFirst({
      where: and(
        eq(clearanceRequests.termId, termId),
        eq(clearanceRequests.stdNo, stdNo)
      ),
    });
  }
}

export const clearanceRequestsRepository = new ClearanceRequestRepository();
