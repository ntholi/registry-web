import { db } from '@/db';
import {
  programs,
  semesterModules,
  studentModules,
  studentPrograms,
  students,
  studentSemesters,
  structures,
  users,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, desc, eq, like, notInArray, or, SQL } from 'drizzle-orm';

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

  async findByIdWithPrograms(stdNo: number) {
    return await db.query.students.findFirst({
      columns: {
        stdNo: true,
        name: true,
        nationalId: true,
        sem: true, // TODO: remove this
        dateOfBirth: true,
        phone1: true,
        phone2: true,
        gender: true,
        maritalStatus: true,
        userId: true,
      },
      where: eq(students.stdNo, stdNo),
      with: {
        user: true,
        programs: {
          with: {
            structure: {
              with: {
                program: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
            semesters: {
              columns: {
                id: true,
                term: true,
                semesterNumber: true,
                status: true,
              },
              with: {
                studentModules: {
                  columns: {
                    id: true,
                    semesterModuleId: true,
                    grade: true,
                    marks: true,
                    status: true,
                  },
                  with: {
                    semesterModule: {
                      columns: {
                        credits: true,
                        type: true,
                      },
                      with: {
                        module: {
                          columns: {
                            code: true,
                            name: true,
                          },
                        },
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
    return await db
      .select({
        stdNo: students.stdNo,
        name: students.name,
        programId: structures.programId,
        semesterModuleId: studentModules.semesterModuleId,
      })
      .from(students)
      .innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
      .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
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
          notInArray(studentModules.status, ['Delete', 'Drop']),
        ),
      )
      .groupBy(
        students.stdNo,
        students.name,
        structures.programId,
        studentModules.semesterModuleId,
      );
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
  protected override buildQueryCriteria(
    options: QueryOptions<typeof students>,
  ) {
    const criteria = super.buildQueryCriteria(options);
    if (!options.sort || options.sort.length === 0) {
      criteria.orderBy = [desc(students.stdNo)];
    }

    return criteria;
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

    const searchConditions = searchTerms.map((term) => {
      const conditions = [];

      if (!isNaN(Number(term))) {
        conditions.push(eq(students.stdNo, Number(term)));
      }

      const variations = normalizeName(term);
      const termConditions = variations.map((variation) =>
        like(students.name, `%${variation}%`),
      );
      conditions.push(...termConditions);

      return or(...conditions);
    });

    customWhere = and(...searchConditions);
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

  async updateUserId(stdNo: number, userId: string | null) {
    return await db.transaction(async (tx) => {
      const updatedStudent = await tx
        .update(students)
        .set({ userId })
        .where(eq(students.stdNo, stdNo))
        .returning();
      if (userId) {
        await tx
          .update(users)
          .set({ role: 'student' })
          .where(eq(users.id, userId));
      }

      return updatedStudent;
    });
  }
}

function normalizeName(name: string): string[] {
  const variations: string[] = [name];

  const withApostrophe = name.replace(/ts([aeiou])/gi, "ts'$1");
  const withoutApostrophe = name.replace(/ts'([aeiou])/gi, 'ts$1');

  if (withApostrophe !== name) {
    variations.push(withApostrophe);
  }
  if (withoutApostrophe !== name) {
    variations.push(withoutApostrophe);
  }

  return [...new Set(variations)];
}

export const studentsRepository = new StudentRepository();
