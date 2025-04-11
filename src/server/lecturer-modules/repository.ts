import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { lecturerModules } from '@/db/schema';
import { SQLiteTableWithColumns, SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db } from '@/db';

export default class LecturesModuleRepository extends BaseRepository<
  typeof lecturerModules,
  'id'
> {
  constructor() {
    super(lecturerModules, 'id');
  }

  async query(options: QueryOptions<typeof lecturerModules>) {
    const criteria = this.buildQueryCriteria(options);
    const data = await db.query.lecturerModules.findMany({
      ...criteria,
      with: {
        module: true,
      },
    });

    return this.createPaginatedResult(data, criteria);
  }
}

export const lecturesModulesRepository = new LecturesModuleRepository();
