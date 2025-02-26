import { db } from '@/db';
import {
  modulePrerequisites,
  modules,
  programs,
  schools,
  structureSemesters,
  structures,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { eq, like, or, desc } from 'drizzle-orm';

export default class ModuleRepository extends BaseRepository<
  typeof modules,
  'id'
> {
  constructor() {
    super(modules, 'id');
  }

  async findByCode(code: string) {
    return db.query.modules.findFirst({
      where: eq(modules.code, code),
    });
  }

  async findModulesByStructure(structureId: number, search = '') {
    const data = await db.query.structureSemesters.findMany({
      where: eq(structureSemesters.structureId, structureId),
      with: {
        modules: {
          where: or(
            like(modules.code, `%${search}%`),
            like(modules.name, `%${search}%`),
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
        id: modules.id,
        code: modules.code,
        name: modules.name,
        type: modules.type,
        credits: modules.credits,
      })
      .from(modulePrerequisites)
      .innerJoin(modules, eq(modules.id, modulePrerequisites.prerequisiteId))
      .where(eq(modulePrerequisites.moduleId, moduleId))
      .orderBy(modules.code);
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
          .orderBy(modules.code);

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
}

export const modulesRepository = new ModuleRepository();
