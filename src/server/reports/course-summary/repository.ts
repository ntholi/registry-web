import { db } from '@/db';
import {
  programs,
  structures,
  studentPrograms,
  students,
  studentSemesters,
  studentModules,
  semesterModules,
  modules,
  structureSemesters,
  assignedModules,
  users,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray, asc, sql } from 'drizzle-orm';

export interface StudentModuleReport {
  studentId: number;
  studentName: string;
  studentNumber: string;
  marks: string;
  grade: string;
  status: string;
  reason: string;
  actionTaken: string;
}

export interface CourseSummaryReport {
  courseCode: string;
  courseName: string;
  programName: string;
  programCode: string;
  principalLecturer: string;
  date: string;
  termName: string;
  totalStudents: number;
  totalPasses: number;
  totalFailures: number;
  totalSupplementary: number;
  failedStudents: StudentModuleReport[];
  supplementaryStudents: StudentModuleReport[];
}

export default class CourseSummaryRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }
  async getCourseSummaryData(
    semesterModuleId: number,
    termName: string,
    programFilter?: number,
  ): Promise<CourseSummaryReport | null> {
    const semesterModule = await db.query.semesterModules.findFirst({
      where: eq(semesterModules.id, semesterModuleId),
      with: {
        module: true,
        semester: {
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

    if (!semesterModule || !semesterModule.module) {
      return null;
    }

    const principalLecturer = await this.getPrincipalLecturer(semesterModuleId);
    const studentModulesData = await db.query.studentModules.findMany({
      where: eq(studentModules.semesterModuleId, semesterModuleId),
      with: {
        studentSemester: {
          with: {
            studentProgram: {
              with: {
                student: true,
                structure: {
                  with: {
                    program: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    let validStudentModules = studentModulesData.filter(
      (sm) =>
        sm.studentSemester &&
        sm.studentSemester.term === termName &&
        !['Delete', 'Drop'].includes(sm.status) &&
        !['Deleted', 'Deferred'].includes(sm.studentSemester.status),
    ); // Apply program filter if specified
    if (programFilter) {
      validStudentModules = validStudentModules.filter(
        (sm) =>
          sm.studentSemester?.studentProgram.structure.program.id ===
          programFilter,
      );
    }

    const totalStudents = validStudentModules.length;

    const failedStudents: StudentModuleReport[] = [];
    const supplementaryStudents: StudentModuleReport[] = [];
    let totalPasses = 0;

    validStudentModules.forEach((sm) => {
      const student = sm.studentSemester!.studentProgram.student;
      const marks = parseFloat(sm.marks);
      const isNumericMark = !isNaN(marks);

      let reason = '';
      let actionTaken = '';

      if (this.isFailingGrade(sm.grade) || (isNumericMark && marks < 50)) {
        reason = `Failed ${sm.grade === 'F' ? 'Final Exam' : 'Module'} (${marks}/${100})`;
        actionTaken = 'STUDENT TO REPEAT THE MODULE';

        failedStudents.push({
          studentId: student.stdNo,
          studentName: student.name,
          studentNumber: student.stdNo.toString(),
          marks: sm.marks,
          grade: sm.grade,
          status: sm.status,
          reason,
          actionTaken,
        });
      } else if (
        this.isSupplementaryGrade(sm.grade) ||
        (isNumericMark && marks >= 40 && marks < 50)
      ) {
        reason = `Failed Final Exam (${marks}/${100})`;
        actionTaken = 'STUDENT TO SUPPLEMENT THE EXAM';

        supplementaryStudents.push({
          studentId: student.stdNo,
          studentName: student.name,
          studentNumber: student.stdNo.toString(),
          marks: sm.marks,
          grade: sm.grade,
          status: sm.status,
          reason,
          actionTaken,
        });
      } else {
        totalPasses++;
      }
    });

    return {
      courseCode: semesterModule.module.code,
      courseName: semesterModule.module.name,
      programName:
        semesterModule.semester?.structure.program.name || 'Unknown Program',
      programCode: semesterModule.semester?.structure.program.code || 'Unknown',
      principalLecturer: principalLecturer || 'Unknown Lecturer',
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      termName,
      totalStudents,
      totalPasses,
      totalFailures: failedStudents.length,
      totalSupplementary: supplementaryStudents.length,
      failedStudents: failedStudents.sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      ),
      supplementaryStudents: supplementaryStudents.sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      ),
    };
  }

  private async getPrincipalLecturer(
    semesterModuleId: number,
  ): Promise<string | null> {
    const assignment = await db.query.assignedModules.findFirst({
      where: eq(assignedModules.semesterModuleId, semesterModuleId),
      with: {
        user: true,
      },
    });

    return assignment?.user?.name || null;
  }

  private isFailingGrade(grade: string): boolean {
    return ['F', 'FX', 'X', 'FIN', 'ANN', 'DNC', 'DNA'].includes(grade);
  }

  private isSupplementaryGrade(grade: string): boolean {
    return ['Supplementary', 'PP'].includes(grade);
  }
  async getAvailableModulesForProgram(programId: number, termName: string) {
    const structureList = await db.query.structures.findMany({
      where: eq(structures.programId, programId),
      with: {
        semesters: {
          with: {
            semesterModules: {
              with: {
                module: true,
              },
            },
          },
        },
      },
    });

    const modules: Array<{
      id: number;
      code: string;
      name: string;
      semesterName: string;
      hasStudents: boolean;
    }> = [];

    for (const structure of structureList) {
      for (const semester of structure.semesters) {
        for (const semesterModule of semester.semesterModules) {
          if (semesterModule.module) {
            const hasStudents = await this.checkModuleHasStudents(
              semesterModule.id,
              termName,
            );

            modules.push({
              id: semesterModule.id,
              code: semesterModule.module.code,
              name: semesterModule.module.name,
              semesterName: semester.name,
              hasStudents,
            });
          }
        }
      }
    }

    return modules.filter((m) => m.hasStudents);
  }
  private async checkModuleHasStudents(
    semesterModuleId: number,
    termName: string,
  ): Promise<boolean> {
    const studentCount = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(studentModules)
      .innerJoin(
        studentSemesters,
        eq(studentModules.studentSemesterId, studentSemesters.id),
      )
      .where(
        and(
          eq(studentModules.semesterModuleId, semesterModuleId),
          eq(studentSemesters.term, termName),
          inArray(studentModules.status, [
            'Compulsory',
            'Add',
            'Repeat1',
            'Repeat2',
            'Repeat3',
            'Supplementary',
          ]),
          inArray(studentSemesters.status, ['Active', 'Outstanding', 'Repeat']),
        ),
      );

    return studentCount[0]?.count > 0;
  }
}

export const courseSummaryRepository = new CourseSummaryRepository();
