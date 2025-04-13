import { db } from '@/db';
import { studentModules, students } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { eq } from 'drizzle-orm';

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
      columns: {
        studentSemesterId: true,
      },
      with: {
        studentSemester: {
          columns: {
            studentProgramId: true,
          },
          with: {
            studentProgram: {
              columns: {
                stdNo: true,
              },
              with: {
                student: {
                  columns: {
                    stdNo: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return data.map((module) => module.studentSemester.studentProgram.student);
  }
}

export const studentsRepository = new StudentRepository();
