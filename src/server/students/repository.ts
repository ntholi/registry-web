import BaseRepository from '@/server/base/BaseRepository';
import { studentModules, students } from '@/db/schema';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';

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
    const moduleEnrollments = await db.query.studentModules.findMany({
      where: eq(studentModules.semesterModuleId, semesterModuleId),
      with: {
        semester: {
          with: {
            program: {
              with: {
                student: true,
              },
            },
          },
        },
      },
    });

    const studentIds = moduleEnrollments
      .map((enrollment) => enrollment.semester?.program?.student?.stdNo)
      .filter((id): id is number => id !== undefined);

    console.log(
      '\n\nStudent Numbers',
      semesterModuleId,
      '->',
      moduleEnrollments,
    );

    if (studentIds.length === 0) {
      return [];
    }

    return await db.query.students.findMany({
      where: inArray(students.stdNo, studentIds),
    });
  }
}

export const studentsRepository = new StudentRepository();
