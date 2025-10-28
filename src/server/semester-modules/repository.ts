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
import { SQL, and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';

type ModuleInfo = {
  code: string;
  name: string;
  moduleId: number;
  semesters: Array<{
    semesterModuleId: number;
    semesterId: number;
    structureSemesterId: number;
    semesterName: string;
    structureId: number;
    programId: number;
    programName: string;
    studentCount?: number;
  }>;
};

export default class SemesterModuleRepository extends BaseRepository<
  typeof semesterModules,
  'id'
> {
  constructor() {
    super(semesterModules, semesterModules.id);
  }

  private buildModuleSearchWhere(
    search: string,
    baseWhere?: SQL
  ): SQL | undefined {
    const trimmed = search.trim();
    if (!trimmed) return baseWhere;
    const moduleFilter = inArray(
      semesterModules.moduleId,
      db
        .select({ value: modules.id })
        .from(modules)
        .where(
          or(
            like(modules.code, `%${trimmed}%`),
            like(modules.name, `%${trimmed}%`)
          )
        )
    );
    return baseWhere ? and(baseWhere, moduleFilter) : moduleFilter;
  }

  async search(
    options: QueryOptions<typeof semesterModules>,
    searchKey: string
  ) {
    const criteria = this.buildQueryCriteria(options);

    const where = this.buildModuleSearchWhere(searchKey, criteria.where);

    const data = await db.query.semesterModules.findMany({
      ...criteria,
      where,
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
        semester: {
          with: {
            structure: true,
          },
        },
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
          where: this.buildModuleSearchWhere(search),
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
        eq(semesterModules.id, modulePrerequisites.prerequisiteId)
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
      })
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

  async getStructuresByModule(moduleId: number) {
    return db
      .select({
        id: structures.id,
        code: structures.code,
        programId: programs.id,
        programName: programs.name,
      })
      .from(semesterModules)
      .innerJoin(
        structureSemesters,
        eq(semesterModules.semesterId, structureSemesters.id)
      )
      .innerJoin(structures, eq(structureSemesters.structureId, structures.id))
      .innerJoin(programs, eq(structures.programId, programs.id))
      .where(eq(semesterModules.moduleId, moduleId))
      .groupBy(structures.id, structures.code, programs.id, programs.name)
      .orderBy(programs.name, structures.code)
      .limit(20);
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

  async searchModulesWithDetails(search = '', term: typeof terms.$inferSelect) {
    const results = await db
      .select({
        semesterModuleId: semesterModules.id,
        semesterId: semesterModules.semesterId,
        code: modules.code,
        name: modules.name,
        moduleId: modules.id,
        structureSemesterId: structureSemesters.id,
        semesterName: structureSemesters.name,
        structureId: structureSemesters.structureId,
        programId: programs.id,
        programName: programs.name,
      })
      .from(semesterModules)
      .innerJoin(modules, eq(semesterModules.moduleId, modules.id))
      .innerJoin(
        structureSemesters,
        eq(semesterModules.semesterId, structureSemesters.id)
      )
      .innerJoin(structures, eq(structureSemesters.structureId, structures.id))
      .innerJoin(programs, eq(structures.programId, programs.id))
      .where(
        and(
          search
            ? or(
                like(modules.code, `%${search}%`),
                like(modules.name, `%${search}%`)
              )
            : undefined
        )
      )
      .orderBy(modules.code);

    const semesterModuleIds = results.map((module) => module.semesterModuleId);
    const studentCounts = await db
      .select({
        semesterModuleId: studentModules.semesterModuleId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(studentModules)
      .innerJoin(
        studentSemesters,
        eq(studentModules.studentSemesterId, studentSemesters.id)
      )
      .where(
        and(
          inArray(studentModules.semesterModuleId, semesterModuleIds),
          eq(studentSemesters.term, term.name)
        )
      )
      .groupBy(studentModules.semesterModuleId)
      .then((rows) =>
        rows.reduce(
          (map, { semesterModuleId, count }) =>
            map.set(semesterModuleId, count),
          new Map<number, number>()
        )
      );

    const groupedModules = new Map<string, ModuleInfo>();
    for (const it of results) {
      const key = `${it.code}-${it.name}`;

      if (!groupedModules.has(key)) {
        groupedModules.set(key, {
          code: it.code,
          name: it.name,
          moduleId: it.moduleId,
          semesters: [],
        });
      }

      groupedModules.get(key)?.semesters.push({
        semesterModuleId: it.semesterModuleId,
        semesterId: it.semesterId!,
        structureSemesterId: it.structureSemesterId,
        semesterName: it.semesterName,
        structureId: it.structureId,
        programId: it.programId,
        programName: it.programName,
        studentCount: studentCounts.get(it.semesterModuleId) || 0,
      });
    }
    return (
      Array.from(groupedModules.values())
        .map((module) => ({
          ...module,
          totalStudents: module.semesters.reduce(
            (sum, s) => sum + (s.studentCount || 0),
            0
          ),
        }))
        .sort((a, b) => b.totalStudents - a.totalStudents)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ totalStudents: _, ...module }) => module)
    );
  }
}

export const modulesRepository = new SemesterModuleRepository();
