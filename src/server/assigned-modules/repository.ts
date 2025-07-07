import { db } from '@/db';
import {
  assignedModules,
  users,
  semesterModules,
  structureSemesters,
  structures,
  programs,
} from '@/db/schema';
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
      where: and(
        eq(assignedModules.userId, userId),
        eq(assignedModules.active, true),
      ),
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
  async findByModule(moduleId: number) {
    const results = await db
      .select({
        id: users.id,
        name: users.name,
        position: users.position,
        image: users.image,
        programCode: programs.code,
        semesterName: structureSemesters.name,
      })
      .from(assignedModules)
      .innerJoin(users, eq(assignedModules.userId, users.id))
      .innerJoin(
        semesterModules,
        eq(assignedModules.semesterModuleId, semesterModules.id),
      )
      .innerJoin(
        structureSemesters,
        eq(semesterModules.semesterId, structureSemesters.id),
      )
      .innerJoin(structures, eq(structureSemesters.structureId, structures.id))
      .innerJoin(programs, eq(structures.programId, programs.id))
      .where(eq(semesterModules.moduleId, moduleId));
    const groupedResults = new Map<
      string,
      {
        id: string;
        name: string | null;
        position: string | null;
        image: string | null;
        assignments: Array<{ programCode: string; semesterName: string }>;
      }
    >();

    for (const result of results) {
      if (!groupedResults.has(result.id)) {
        groupedResults.set(result.id, {
          id: result.id,
          name: result.name,
          position: result.position,
          image: result.image,
          assignments: [],
        });
      }

      const lecturer = groupedResults.get(result.id)!;
      lecturer.assignments.push({
        programCode: result.programCode,
        semesterName: result.semesterName,
      });
    }

    return Array.from(groupedResults.values());
  }

  async findByUser(userId: string) {
    return await db.query.assignedModules.findMany({
      where: and(
        eq(assignedModules.userId, userId),
        eq(assignedModules.active, true),
      ),
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
