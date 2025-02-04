import BaseRepository from '@/server/base/BaseRepository';
import {
  modules,
  semesterModules,
  structureSemesters,
  structures,
  programs,
  schools,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';

export default class ModuleRepository extends BaseRepository<
  typeof modules,
  'id'
> {
  constructor() {
    super(modules, 'id');
  }

  async getModulesByStructure(structureId: number) {
    return db
      .select({
        moduleId: modules.id,
        moduleCode: modules.code,
        moduleName: modules.name,
        moduleType: modules.type,
        moduleCredits: modules.credits,
        semesterNumber: structureSemesters.semesterNumber,
        semesterName: structureSemesters.name,
      })
      .from(modules)
      .innerJoin(semesterModules, eq(semesterModules.moduleId, modules.id))
      .innerJoin(
        structureSemesters,
        eq(structureSemesters.id, semesterModules.semesterId)
      )
      .where(eq(structureSemesters.structureId, structureId));
  }

  async getSchools() {
    return db.select().from(schools);
  }

  async getProgramsBySchool(schoolId: number) {
    return db.select().from(programs).where(eq(programs.schoolId, schoolId));
  }

  async getStructuresByProgram(programId: number) {
    return db
      .select()
      .from(structures)
      .where(eq(structures.programId, programId));
  }
}

export const modulesRepository = new ModuleRepository();
