import { db } from '@/db';
import {
  modulePrerequisites,
  semesterModules,
  programs,
  schools,
  structureSemesters,
  structures,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { eq, like, or, desc } from 'drizzle-orm';

export default class ModuleRepository extends BaseRepository<
  typeof semesterModules,
  'id'
> {
  constructor() {
    super(semesterModules, 'id');
  }

  async findByCode(code: string) {
    return db.query.semesterModules.findFirst({
      where: eq(semesterModules.code, code),
    });
  }

  async findModulesByStructure(structureId: number, search = '') {
    const data = await db.query.structureSemesters.findMany({
      where: eq(structureSemesters.structureId, structureId),
      with: {
        modules: {
          where: or(
            like(semesterModules.code, `%${search}%`),
            like(semesterModules.name, `%${search}%`),
          ),
        },
      },
      orderBy: structureSemesters.semesterNumber,
    });
    return data.flatMap((it) => it.modules);
  }

  async addPrerequisite(moduleId: number, prerequisiteId: number) {
    return db.insert(modulePrerequisites).values({
      moduleId,
      prerequisiteId,
    });
  }

  async clearPrerequisites(moduleId: number) {
    return db
      .delete(modulePrerequisites)
      .where(eq(modulePrerequisites.moduleId, moduleId));
  }

  async getPrerequisites(moduleId: number) {
    return db
      .select({
        id: semesterModules.id,
        code: semesterModules.code,
        name: semesterModules.name,
        type: semesterModules.type,
        credits: semesterModules.credits,
      })
      .from(modulePrerequisites)
      .innerJoin(
        semesterModules,
        eq(semesterModules.id, modulePrerequisites.prerequisiteId),
      )
      .where(eq(modulePrerequisites.moduleId, moduleId))
      .orderBy(semesterModules.code);
  }

  async getModulesByStructure(structureId: number) {
    const semesters = await db
      .select({
        id: structureSemesters.id,
        semesterNumber: structureSemesters.semesterNumber,
        name: structureSemesters.name,
        totalCredits: structureSemesters.totalCredits,
      })
      .from(structureSemesters)
      .where(eq(structureSemesters.structureId, structureId))
      .orderBy(structureSemesters.semesterNumber);

    const semestersWithModules = await Promise.all(
      semesters.map(async (semester) => {
        const modulesList = await db
          .select({
            moduleId: semesterModules.id,
            moduleCode: semesterModules.code,
            moduleName: semesterModules.name,
            moduleType: semesterModules.type,
            moduleCredits: semesterModules.credits,
          })
          .from(semesterModules)
          .orderBy(semesterModules.code);

        return {
          ...semester,
          modules: modulesList,
        };
      }),
    );

    return semestersWithModules;
  }

  async getSchools() {
    return db.select().from(schools).orderBy(schools.id);
  }

  async getProgramsBySchool(schoolId: number) {
    return db
      .select()
      .from(programs)
      .where(eq(programs.schoolId, schoolId))
      .orderBy(programs.code);
  }

  async getStructuresByProgram(programId: number) {
    return db
      .select()
      .from(structures)
      .where(eq(structures.programId, programId))
      .orderBy(desc(structures.id));
  }

  async getModulesForStructure(structureId: number) {
    return await db.query.structureSemesters.findMany({
      where: eq(structureSemesters.structureId, structureId),
      with: {
        modules: true,
      },
    });
  }

  async searchModulesWithDetails(search = '') {
    return await db.query.semesterModules.findMany({
      where: or(
        like(semesterModules.code, `%${search}%`),
        like(semesterModules.name, `%${search}%`),
      ),
      with: {
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
      limit: 20,
    });
  }
}

export const modulesRepository = new ModuleRepository();
