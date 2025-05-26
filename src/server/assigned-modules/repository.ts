import { db } from '@/db';
import { assignedModules } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray } from 'drizzle-orm';

export default class AssignedModuleRepository extends BaseRepository<
  typeof assignedModules,
  'id'
> {
  constructor() {
    super(assignedModules, 'id');
  }

  override async findById(id: number) {
    return db.query.assignedModules.findFirst({
      where: eq(assignedModules.id, id),
      with: {
        semesterModule: {
          with: {
            module: true,
            semester: {
              with: {
                structure: {
                  with: {
                    program: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async removeModuleAssignments(userId: string, semesterModuleIds: number[]) {
    if (semesterModuleIds.length === 0) return;

    return db
      .delete(assignedModules)
      .where(
        and(
          eq(assignedModules.userId, userId),
          inArray(assignedModules.semesterModuleId, semesterModuleIds),
        ),
      );
  }

  async createMany(data: (typeof assignedModules.$inferInsert)[]) {
    if (data.length === 0) return [];

    return db.insert(assignedModules).values(data).returning();
  }

  async findByUserAndModule(userId: string, moduleId: number) {
    const results = await db.query.assignedModules.findMany({
      where: eq(assignedModules.userId, userId),
      with: {
        semesterModule: {
          with: {
            module: true,
            semester: {
              with: {
                structure: {
                  with: {
                    program: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return results.filter((item) => item.semesterModule?.moduleId === moduleId);
  }
  async findByModule(semesterModuleId: number) {
    return db.query.assignedModules.findMany({
      where: eq(assignedModules.semesterModuleId, semesterModuleId),
    });
  }

  async findByUser(userId: string) {
    return await db.query.assignedModules.findMany({
      where: eq(assignedModules.userId, userId),
      with: {
        semesterModule: {
          with: {
            module: true,
            semester: {
              with: {
                structure: {
                  with: {
                    program: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

export const assignedModulesRepository = new AssignedModuleRepository();
