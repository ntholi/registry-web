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

interface ModuleWithSemesters {
  code: string;
  name: string;
  moduleId: number;
  id: number;
  studentCount: number;
  semesters: SemesterData[];
}

interface SemesterData {
  id: number;
  type: string;
  credits: number;
  semesterId: number;
  hidden: boolean;
  structureSemester: {
    id: number;
    semesterNumber: number;
    name: string;
    structureId: number;
  };
  program: {
    id: number;
    name: string;
  };
}

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

  async searchModulesWithDetails(
    search = '',
    term: typeof terms.$inferSelect,
  ): Promise<ModuleWithSemesters[]> {
    const termSemester = term.semester;
    const validSemesterNumbers = [];

    for (let i = termSemester; i <= 10; i += 2) {
      validSemesterNumbers.push(i);
    }

    const results = await db
      .select({
        id: semesterModules.id,
        type: semesterModules.type,
        credits: semesterModules.credits,
        semesterId: semesterModules.semesterId,
        hidden: semesterModules.hidden,
        code: modules.code,
        name: modules.name,
        moduleId: modules.id,
        semesterNumber: structureSemesters.semesterNumber,
        semesterName: structureSemesters.name,
        structureId: structureSemesters.structureId,
        programId: programs.id,
        programName: programs.name,
      })
      .from(semesterModules)
      .innerJoin(modules, eq(semesterModules.moduleId, modules.id))
      .innerJoin(
        structureSemesters,
        eq(semesterModules.semesterId, structureSemesters.id),
      )
      .innerJoin(structures, eq(structureSemesters.structureId, structures.id))
      .innerJoin(programs, eq(structures.programId, programs.id))
      .where(
        and(
          search
            ? or(
                like(modules.code, `%${search}%`),
                like(modules.name, `%${search}%`),
              )
            : undefined,
          inArray(structureSemesters.semesterNumber, validSemesterNumbers),
        ),
      )
      .orderBy(modules.code);

    const moduleMap = new Map<string, ModuleWithSemesters>();
    results.forEach((result) => {
      const { code, name, moduleId } = result;
      const moduleKey = moduleId.toString();

      if (!moduleMap.has(moduleKey)) {
        moduleMap.set(moduleKey, {
          code,
          name,
          moduleId,
          id: moduleId,
          studentCount: 0,
          semesters: [],
        });
      }

      const moduleEntry = moduleMap.get(moduleKey);
      if (moduleEntry) {
        moduleEntry.semesters.push({
          id: result.id,
          type: result.type!,
          credits: result.credits!,
          semesterId: result.semesterId!,
          hidden: result.hidden!,
          structureSemester: {
            id: result.semesterId!,
            semesterNumber: result.semesterNumber!,
            name: result.semesterName!,
            structureId: result.structureId!,
          },
          program: {
            id: result.programId!,
            name: result.programName!,
          },
        });
      }
    });

    const modulesResult = Array.from(moduleMap.values());

    for (const moduleResult of modulesResult) {
      const studentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentModules)
        .innerJoin(
          studentSemesters,
          eq(studentModules.studentSemesterId, studentSemesters.id),
        )
        .innerJoin(
          semesterModules,
          eq(studentModules.semesterModuleId, semesterModules.id),
        )
        .where(
          and(
            eq(semesterModules.moduleId, moduleResult.moduleId),
            eq(studentSemesters.term, term.name),
          ),
        )
        .then((result) => result[0]?.count || 0);

      moduleResult.studentCount = studentCount;
    }
    return modulesResult.sort((a, b) => b.studentCount - a.studentCount);
  }
}

export const modulesRepository = new ModuleRepository();
