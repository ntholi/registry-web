import BaseRepository from '@/server/base/BaseRepository';
import {  modules, structures } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class StructureRepository extends BaseRepository<
  typeof structures,
  'id'
> {
  constructor() {
    super(structures, 'id');
  }

  override findById(id: number) {
    return db.query.structures.findFirst({
      where: () => eq(structures.id, id),
      with: {
        program: {
          with: {
            school: true,
          },
        },
        semesters: {
          with: {

                modules: true
              
            
          },
        },
      },
    });
  }

  async deleteSemesterModule(id: number) {
    await db.delete(modules).where(eq(modules.id, id));
  }
}

export const structuresRepository = new StructureRepository();
