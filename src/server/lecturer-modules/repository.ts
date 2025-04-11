import { db } from '@/db';
import { lecturerModules } from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { eq } from 'drizzle-orm';

export default class LecturesModuleRepository extends BaseRepository<
  typeof lecturerModules,
  'id'
> {
  constructor() {
    super(lecturerModules, 'id');
  }

  override async findById(id: number) {
    const data = await db.query.lecturerModules.findFirst({
      where: eq(lecturerModules.id, id),
      with: {
        semesterModule: true,
      },
    });
    return data;
  }

  override async query(options: QueryOptions<typeof lecturerModules>) {
    const criteria = this.buildQueryCriteria(options);
    const data = await db.query.lecturerModules.findMany({
      ...criteria,
      with: {
        semesterModule: true,
      },
    });

    return this.createPaginatedResult(data, criteria);
  }
}

export const lecturesModulesRepository = new LecturesModuleRepository();
