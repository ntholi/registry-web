import BaseRepository from '@/server/base/BaseRepository';
import { blockedStudents } from '@/db/schema';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';

export default class BlockedStudentRepository extends BaseRepository<
  typeof blockedStudents,
  'id'
> {
  constructor() {
    super(blockedStudents, 'id');
  }

  async findByStdNo(
    stdNo: number,
    status: 'blocked' | 'unblocked' = 'blocked',
  ) {
    return db.query.blockedStudents.findFirst({
      where: and(
        eq(blockedStudents.stdNo, stdNo),
        eq(blockedStudents.status, status),
      ),
    });
  }
}

export const blockedStudentsRepository = new BlockedStudentRepository();
