import BaseRepository from '@/server/base/BaseRepository';
import {
  modules,
  semesterModules,
  structureSemesters,
  structures,
  programs,
  schools,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';

export default class ModuleRepository extends BaseRepository<
  typeof modules,
  'id'
> {
  constructor() {
    super(modules, 'id');
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
            moduleId: modules.id,
            moduleCode: modules.code,
            moduleName: modules.name,
            moduleType: modules.type,
            moduleCredits: modules.credits,
          })
          .from(modules)
          .innerJoin(semesterModules, eq(semesterModules.moduleId, modules.id))
          .where(eq(semesterModules.semesterId, semester.id))
          .orderBy(modules.code);

        return {
          ...semester,
          modules: modulesList,
        };
      })
    );

    return semestersWithModules;
  }

  async getSchools() {
    return db.select().from(schools).orderBy(schools.code);
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
      .orderBy(structures.code);
  }
}

export const modulesRepository = new ModuleRepository();
