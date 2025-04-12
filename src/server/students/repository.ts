import BaseRepository from '@/server/base/BaseRepository';
import {
  studentModules,
  studentPrograms,
  students,
  studentSemesters,
} from '@/db/schema';
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
    const modules = await db.query.studentModules.findMany({
      where: eq(studentModules.semesterModuleId, semesterModuleId),
      // columns: {
      //   studentSemesterId: true,
      // },
    });
    console.log(modules);
    const studentSemesterIds = Array.from(
      new Set(modules.map((module) => module.studentSemesterId)),
    );

    const semesters = await db.query.studentSemesters.findMany({
      where: inArray(studentSemesters.id, studentSemesterIds),
      columns: {
        studentProgramId: true,
      },
    });

    console.log('studentSemesterIds', studentSemesterIds);
    console.log('semesters', semesters);

    return [];
  }
}

export const studentsRepository = new StudentRepository();
