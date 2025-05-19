import { db } from '@/db';
import { programs, studentModules, students } from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, eq, inArray, like, or, SQL } from 'drizzle-orm';

export default class StudentRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }

  async findStudentByUserId(userId: string) {
    return await db.query.students.findFirst({
      where: eq(students.userId, userId),
      with: {
        structure: {
          with: {
            program: true,
          },
        },
      },
    });
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

  async findStudentsBySemesterModuleId(semesterModuleId: number) {
    const data = await db.query.studentModules.findMany({
      where: eq(studentModules.semesterModuleId, semesterModuleId),
      with: {
        studentSemester: {
          with: {
            studentProgram: {
              with: {
                student: {
                  columns: {
                    stdNo: true,
                    name: true,
                  },
                },
                structure: {
                  with: {
                    program: {
                      columns: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              },
            },
          },
        },
      },
    });

    return data.map((module) => ({
      ...module.studentSemester.studentProgram.student,
      program: module.studentSemester.studentProgram.structure.program
    }));
  }

  async findStudentsByMultipleSemesterModules(semesterModuleIds: number[], programId?: number) {
    const data = await db.query.studentModules.findMany({
      where: inArray(studentModules.semesterModuleId, semesterModuleIds),
      with: {
        studentSemester: {
          with: {
            studentProgram: {
              with: {
                student: {
                  columns: {
                    stdNo: true,
                    name: true,
                  },
                },
                structure: {
                  with: {
                    program: {
                      columns: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              },
            },
          },
        },
      },
    });
    
    // Map the data and filter by program if programId is provided
    const students = data.map((module) => ({
      ...module.studentSemester.studentProgram.student,
      program: module.studentSemester.studentProgram.structure.program
    }));

    // Filter by program if programId is provided
    if (programId) {
      return students.filter(student => student.program.id === programId);
    }

    // Remove duplicates by student ID
    const uniqueStudents = Array.from(
      new Map(students.map(student => [student.stdNo, student]))
    ).map(([_, student]) => student);

    return uniqueStudents;
  }

  async getAllPrograms() {
    return db.query.programs.findMany({
      columns: {
        id: true,
        name: true,
        code: true
      },
      orderBy: programs.name
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

    const { search, searchColumns, ...restOptions } = options;
    const { orderBy, offset, limit } = this.buildQueryCriteria(restOptions);
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
