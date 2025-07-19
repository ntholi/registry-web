import BaseRepository from '@/server/base/BaseRepository';
import { semesterModules, structures } from '@/db/schema';
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
            semesterModules: {
              with: {
                module: true,
                prerequisites: {
                  with: {
                    prerequisite: {
                      with: {
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async deleteSemesterModule(id: number) {
    await db.delete(semesterModules).where(eq(semesterModules.id, id));
  }
}

export const structuresRepository = new StructureRepository();
