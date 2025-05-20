import BaseRepository from '@/server/base/BaseRepository';
import { modules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';

export default class ModuleRepository extends BaseRepository<
  typeof modules,
  'id'
> {
  constructor() {
    super(modules, 'id');
  }

  override async findById(id: number) {
    return db.query.modules.findFirst({
      where: eq(modules.id, id),
      with: {
        assessments: true,
      },
    });
  }
}

export const modulesRepository = new ModuleRepository();
