import BaseRepository from '@/server/base/BaseRepository';
import { students } from '@/db/schema';
import { db } from '@/db';
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
                    module: true,
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
    return await db.query.studentPrograms.findMany({
      with: {
        student: true,
        semesters: {
          with: {
            studentModules: {
              with: {
                module: true,
              },
            },
          },
        },
      },
    });
  }
}

export const studentsRepository = new StudentRepository();
