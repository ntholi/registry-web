import { db } from '@/db';
import { assignedModules } from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { eq } from 'drizzle-orm';

export default class LecturesModuleRepository extends BaseRepository<
  typeof assignedModules,
  'id'
> {
  constructor() {
    super(assignedModules, 'id');
  }

  override async findById(id: number) {
    const data = await db.query.assignedModules.findFirst({
      where: eq(assignedModules.id, id),
      with: {
        semesterModule: {
          with: {
            module: true,
          },
        },
      },
    });
    return data;
  }

  override async query(options: QueryOptions<typeof assignedModules>) {
    const criteria = this.buildQueryCriteria(options);
    const data = await db.query.assignedModules.findMany({
      ...criteria,
      with: {
        semesterModule: {
          with: {
            module: true,
          },
        },
      },
    });

    return this.createPaginatedResult(data, criteria);
  }
}

export const lecturesModulesRepository = new LecturesModuleRepository();
