import { db } from '@/db';
import { programs, schools } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { desc, eq } from 'drizzle-orm';

export default class SchoolRepository extends BaseRepository<
  typeof schools,
  'id'
> {
  constructor() {
    super(schools, 'id');
  }

  async getProgramsBySchoolId(schoolId: number) {
    return db.query.programs.findMany({
      columns: {
        id: true,
        name: true,
        code: true,
      },
      where: eq(programs.schoolId, schoolId),
      orderBy: desc(programs.id),
    });
  }
}

export const schoolsRepository = new SchoolRepository();
