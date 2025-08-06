import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { blockedStudents, modules } from '@/db/schema';
import { db } from '@/db';
import { and, eq, like } from 'drizzle-orm';
import { SQLiteTableWithColumns, SQLiteColumn } from 'drizzle-orm/sqlite-core';

export default class BlockedStudentRepository extends BaseRepository<
  typeof blockedStudents,
  'id'
> {
  constructor() {
    super(blockedStudents, 'id');
  }

  async findById(id: number) {
    return db.query.blockedStudents.findFirst({
      where: eq(blockedStudents.id, id),
      with: {
        student: true,
      },
    });
  }

  async findByStdNo(
    stdNo: number,
    status: 'blocked' | 'unblocked' = 'blocked'
  ) {
    return db.query.blockedStudents.findFirst({
      where: and(
        eq(blockedStudents.stdNo, stdNo),
        eq(blockedStudents.status, status)
      ),
    });
  }

  async query(options: QueryOptions<typeof blockedStudents>) {
    const criteria = this.buildQueryCriteria(options);

    const data = await db.query.blockedStudents.findMany({
      ...criteria,
      with: {
        student: true,
      },
    });

    return this.createPaginatedResult(data, criteria);
  }
}

export const blockedStudentsRepository = new BlockedStudentRepository();
