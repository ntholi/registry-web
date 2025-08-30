import BaseRepository from '@/server/base/BaseRepository';
import { graduationRequests } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class GraduationRequestRepository extends BaseRepository<
  typeof graduationRequests,
  'id'
> {
  constructor() {
    super(graduationRequests, 'id');
  }

  override async findById(id: number) {
    return db.query.graduationRequests.findFirst({
      where: eq(graduationRequests.id, id),
      with: {
        student: true,
        paymentReceipts: true,
        graduationClearances: {
          with: {
            clearance: {
              with: {
                respondedBy: true,
              },
            },
          },
        },
      },
    });
  }

  async findByStudentNo(stdNo: number) {
    return db.query.graduationRequests.findFirst({
      where: eq(graduationRequests.stdNo, stdNo),
      with: {
        student: true,
        paymentReceipts: true,
        graduationClearances: {
          with: {
            clearance: {
              with: {
                respondedBy: true,
              },
            },
          },
        },
      },
    });
  }
}

export const graduationRequestsRepository = new GraduationRequestRepository();
