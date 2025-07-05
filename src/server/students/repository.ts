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
  terms,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, desc, eq, like, notInArray, or, SQL, max } from 'drizzle-orm';
import { StudentFilter } from './actions';

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
        sem: true,
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
          columns: {
            id: true,
            status: true,
            structureId: true,
          },
          with: {
            structure: {
              columns: {
                id: true,
                code: true,
              },
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

  async getProgramsBySchoolId(schoolId: number) {
    return db.query.programs.findMany({
      columns: {
        id: true,
        name: true,
        code: true,
      },
      where: eq(programs.schoolId, schoolId),
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

  async queryBasic(
    options: QueryOptions<typeof students> & { filter?: StudentFilter },
  ): Promise<{
    items: { stdNo: number; name: string }[];
    totalPages: number;
    totalItems: number;
  }> {
    const { orderBy, offset, limit } = this.buildQueryCriteria(options);
    let customWhere: SQL | undefined = undefined;

    if (options.search) {
      const searchTerms = options.search
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      if (searchTerms.length > 0) {
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
      }
    }

    const filterConditions: SQL[] = [];
    if (options.filter) {
      if (options.filter.schoolId) {
        filterConditions.push(eq(programs.schoolId, options.filter.schoolId));
      }

      if (options.filter.programId) {
        filterConditions.push(
          eq(structures.programId, options.filter.programId),
        );
      }

      if (options.filter.termId) {
        filterConditions.push(eq(terms.id, options.filter.termId));
      }

      if (options.filter.semesterNumber) {
        filterConditions.push(
          eq(studentSemesters.semesterNumber, options.filter.semesterNumber),
        );
      }
    }

    if (filterConditions.length > 0) {
      const filterWhere = and(...filterConditions);
      customWhere = customWhere ? and(customWhere, filterWhere) : filterWhere;
    }

    let query = db
      .select({
        stdNo: students.stdNo,
        name: students.name,
      })
      .from(students) as any;

    if (
      options.filter &&
      (options.filter.schoolId ||
        options.filter.programId ||
        options.filter.termId ||
        options.filter.semesterNumber)
    ) {
      query = query
        .innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
        .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
        .innerJoin(programs, eq(structures.programId, programs.id));

      if (options.filter.termId || options.filter.semesterNumber) {
        query = query.innerJoin(
          studentSemesters,
          eq(studentSemesters.studentProgramId, studentPrograms.id),
        );
      }
      if (options.filter.termId) {
        query = query.innerJoin(
          terms,
          eq(terms.name, studentSemesters.term),
        );
      }
    }

    const items = await query
      .orderBy(...orderBy)
      .where(customWhere)
      .limit(limit)
      .offset(offset)
      .groupBy(students.stdNo, students.name);

    let countQuery = db.select({ count: students.stdNo }).from(students) as any;

    if (
      options.filter &&
      (options.filter.schoolId ||
        options.filter.programId ||
        options.filter.termId ||
        options.filter.semesterNumber)
    ) {
      countQuery = countQuery
        .innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
        .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
        .innerJoin(programs, eq(structures.programId, programs.id));

      if (options.filter.termId || options.filter.semesterNumber) {
        countQuery = countQuery.innerJoin(
          studentSemesters,
          eq(studentSemesters.studentProgramId, studentPrograms.id),
        );
      }
      if (options.filter.termId) {
        countQuery = countQuery.innerJoin(
          terms,
          eq(terms.name, studentSemesters.term),
        );
      }
    }

    const totalItems = await countQuery
      .where(customWhere)
      .then((results: any[]) => new Set(results.map((r: any) => r.count)).size);

    return {
      items,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    };
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
