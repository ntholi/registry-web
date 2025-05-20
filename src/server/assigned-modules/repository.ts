import BaseRepository from '@/server/base/BaseRepository';
import { assignedModules, modules } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';

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

    return (
      results.find((item) => item.semesterModule?.moduleId === moduleId) || null
    );
  }

  async findByModule(semesterModuleId: number) {
    return db.query.assignedModules.findMany({
      where: eq(assignedModules.semesterModuleId, semesterModuleId),
    });
  }

  async findByUser(userId: string) {
    return db.query.assignedModules
      .findMany({
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
      })
      .then((it) => {
        const moduleMap = new Map<number, typeof modules.$inferSelect>();
        it.forEach((item) => {
          const module = item.semesterModule.module;
          if (module) {
            moduleMap.set(module.id, module);
          }
        });
        return Array.from(moduleMap.values());
      });
  }
}

export const assignedModulesRepository = new AssignedModuleRepository();
