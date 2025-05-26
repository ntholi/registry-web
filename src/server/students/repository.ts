import { db } from '@/db';
import {
  programs,
  semesterModules,
  studentModules,
  studentPrograms,
  students,
  studentSemesters,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, eq, like, SQL } from 'drizzle-orm';

export default class StudentRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }
  async findStudentByUserId(userId: string) {
    const student = await db.query.students.findFirst({
      where: eq(students.userId, userId),
      with: {
        programs: {
          where: eq(studentPrograms.status, 'Active'),
          orderBy: (programs, { asc }) => [asc(programs.id)],
          limit: 1,
          with: {
            structure: {
              with: {
                program: true,
              },
            },
          },
        },
      },
    });
    if (!student || !student.programs.length) {
      console.warn(
        `No active program found for userId: ${userId}. Student: ${JSON.stringify(student)}`,
      );
      return null;
    }

    const activeProgram = student.programs[0];
    return {
      ...student,
      structureId: activeProgram.structureId,
      programName: activeProgram.structure.program.name,
    };
  }

  override async findById(stdNo: number) {
    return await db.query.students.findFirst({
      where: eq(students.stdNo, stdNo),
      with: {
        user: true,
        programs: {
          with: {
            structure: {
              with: {
                program: true,
              },
            },
            semesters: {
              with: {
                studentModules: {
                  with: {
                    semesterModule: {
                      with: {
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByModuleId(moduleId: number, termName: string) {
    return await db.query.students.findMany({
      where: (students, { exists }) => {
        return exists(
          db
            .select()
            .from(studentPrograms)
            .innerJoin(
              studentSemesters,
              eq(studentSemesters.studentProgramId, studentPrograms.id),
            )
            .innerJoin(
              studentModules,
              eq(studentModules.studentSemesterId, studentSemesters.id),
            )
            .innerJoin(
              semesterModules,
              eq(studentModules.semesterModuleId, semesterModules.id),
            )
            .where(
              and(
                eq(semesterModules.moduleId, moduleId),
                eq(studentSemesters.term, termName),
                eq(studentPrograms.stdNo, students.stdNo),
              ),
            ),
        );
      },
      with: {
        programs: {
          with: {
            semesters: {
              with: {
                studentModules: {
                  with: {
                    semesterModule: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getAllPrograms() {
    return db.query.programs.findMany({
      columns: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: programs.name,
    });
  }

  override async query(options: QueryOptions<typeof students>) {
    if (!options.search) {
      return super.query(options);
    }

    const searchTerms = options.search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (searchTerms.length === 0) {
      return super.query(options);
    }

    const { orderBy, offset, limit } = this.buildQueryCriteria(options);
    let customWhere: SQL | undefined = undefined;
    const nameConditions = searchTerms.map((term) =>
      like(students.name, `%${term}%`),
    );
    customWhere = and(...nameConditions);
    if (options.filter) {
      customWhere = and(customWhere, options.filter);
    }
    const items = await db
      .select()
      .from(this.table)
      .orderBy(...orderBy)
      .where(customWhere)
      .limit(limit)
      .offset(offset);

    return await this.createPaginatedResult(items, {
      where: customWhere,
      limit,
    });
  }
}

export const studentsRepository = new StudentRepository();
