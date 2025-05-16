import { db } from '@/db';
import {
  modulePrerequisites,
  modules,
  programs,
  schools,
  semesterModules,
  structureSemesters,
  structures,
  studentModules,
  studentSemesters,
  terms,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { desc, eq, like, or, and, inArray, sql } from 'drizzle-orm';

export default class ModuleRepository extends BaseRepository<
  typeof semesterModules,
  'id'
> {
  constructor() {
    super(semesterModules, 'id');
  }

  async search(
    options: QueryOptions<typeof semesterModules>,
    searchKey: string,
  ) {
    const criteria = this.buildQueryCriteria(options);

    const data = await db.query.semesterModules.findMany({
      ...criteria,
      where: like(modules.name, `%${searchKey}%`),
      with: {
        module: true,
      },
    });

    return this.createPaginatedResult(data, criteria);
  }

  override async findById(id: number) {
    return db.query.semesterModules.findFirst({
      where: eq(semesterModules.id, id),
      with: {
        module: true,
      },
    });
  }

  async findByCode(code: string) {
    return db
      .select({
        id: semesterModules.id,
        moduleId: semesterModules.moduleId,
        type: semesterModules.type,
        credits: semesterModules.credits,
        semesterId: semesterModules.semesterId,
        hidden: semesterModules.hidden,
        code: modules.code,
        name: modules.name,
      })
      .from(semesterModules)
      .innerJoin(modules, eq(semesterModules.moduleId, modules.id))
      .where(eq(modules.code, code))
      .limit(1)
      .then((rows) => rows[0] || null);
  }

  async findModulesByStructure(structureId: number, search = '') {
    const data = await db.query.structureSemesters.findMany({
      where: eq(structureSemesters.structureId, structureId),
      with: {
        semesterModules: {
          with: {
            module: true,
          },
          where: search
            ? or(
                like(modules.code, `%${search}%`),
                like(modules.name, `%${search}%`),
              )
            : undefined,
        },
      },
      orderBy: structureSemesters.semesterNumber,
    });
    return data.flatMap((it) => it.semesterModules);
  }

  async addPrerequisite(semesterModuleId: number, prerequisiteId: number) {
    return db.insert(modulePrerequisites).values({
      semesterModuleId,
      prerequisiteId,
    });
  }

  async clearPrerequisites(semesterModuleId: number) {
    return db
      .delete(modulePrerequisites)
      .where(eq(modulePrerequisites.semesterModuleId, semesterModuleId));
  }

  async getPrerequisites(semesterModuleId: number) {
    return db
      .select({
        id: semesterModules.id,
        moduleId: semesterModules.moduleId,
        type: semesterModules.type,
        credits: semesterModules.credits,
        code: modules.code,
        name: modules.name,
      })
      .from(modulePrerequisites)
      .innerJoin(
        semesterModules,
        eq(semesterModules.id, modulePrerequisites.prerequisiteId),
      )
      .innerJoin(modules, eq(modules.id, semesterModules.moduleId))
      .where(eq(modulePrerequisites.semesterModuleId, semesterModuleId))
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
            moduleId: semesterModules.id,
            type: semesterModules.type,
            credits: semesterModules.credits,
            code: modules.code,
            name: modules.name,
          })
          .from(semesterModules)
          .innerJoin(modules, eq(modules.id, semesterModules.moduleId))
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
        semesterModules: {
          with: {
            module: true,
          },
        },
      },
    });
  }

  async searchModulesWithDetails(search = '', term: string) {
    const rawResults = await db
      .select({
        moduleId: modules.id,
        code: modules.code,
        name: modules.name,
        semesterModuleId: semesterModules.id,
        type: semesterModules.type,
        credits: semesterModules.credits,
        semesterId: structureSemesters.id,
        semesterName: structureSemesters.name,
        semesterNumber: structureSemesters.semesterNumber,
        structureId: structureSemesters.structureId,
        programId: structures.programId,
        programName: programs.name,
        studentCount: sql<number>`COUNT(DISTINCT ${studentModules.id})`,
      })
      .from(modules)
      .innerJoin(semesterModules, eq(semesterModules.moduleId, modules.id))
      .leftJoin(
        structureSemesters,
        eq(semesterModules.semesterId, structureSemesters.id),
      )
      .leftJoin(
        structures,
        eq(structureSemesters.structureId, structures.id),
      )
      .leftJoin(
        programs,
        eq(structures.programId, programs.id),
      )
      .leftJoin(
        studentModules,
        eq(studentModules.semesterModuleId, semesterModules.id),
      )
      .leftJoin(
        studentSemesters,
        and(
          eq(studentModules.studentSemesterId, studentSemesters.id),
          eq(studentSemesters.term, term),
        ),
      )
      .where(
        search
          ? or(
              like(modules.code, `%${search}%`),
              like(modules.name, `%${search}%`),
            )
          : undefined,
      )
      .groupBy(
        modules.id,
        semesterModules.id, 
        structureSemesters.id,
        structures.id,
        programs.id,
      )
      .orderBy(modules.code);

    // Group by module to create the nested structure
    const moduleMap = new Map();

    rawResults.forEach((row) => {
      if (!moduleMap.has(row.moduleId)) {
        moduleMap.set(row.moduleId, {
          id: row.moduleId,
          code: row.code,
          name: row.name,
          structureSemesters: [],
        });
      }

      const module = moduleMap.get(row.moduleId);
      
      if (row.semesterId) {
        module.structureSemesters.push({
          id: row.semesterId,
          name: row.semesterName,
          semesterNumber: row.semesterNumber,
          semesterModuleId: row.semesterModuleId,
          type: row.type,
          credits: row.credits,
          structureId: row.structureId,
          programId: row.programId,
          programName: row.programName,
          studentCount: row.studentCount,
        });
      }
    });

    return Array.from(moduleMap.values());
  }
}

export const modulesRepository = new ModuleRepository();
