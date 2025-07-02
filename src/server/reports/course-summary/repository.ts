import { db } from '@/db';
import {
  assessmentMarks,
  moduleGrades,
  semesterModules,
  structures,
  studentModules,
  students,
  terms,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray } from 'drizzle-orm';

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

export interface CourseSummaryData {
  courseCode: string;
  courseName: string;
  programName: string;
  programCode: string;
  termName: string;
  moduleId: number;
  studentModules: Array<{
    studentId: number;
    studentName: string;
    studentNumber: string;
    marks: string;
    grade: string;
    status: string;
  }>;
}

export interface CourseSummaryReport {
  courseCode: string;
  courseName: string;
  programName: string;
  programCode: string;
  lecturer: string;
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
  ): Promise<CourseSummaryData | null> {
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
    );

    if (programFilter) {
      validStudentModules = validStudentModules.filter(
        (sm) =>
          sm.studentSemester?.studentProgram.structure.program.id ===
          programFilter,
      );
    }

    return {
      courseCode: semesterModule.module.code,
      courseName: semesterModule.module.name,
      programName:
        semesterModule.semester?.structure.program.name || 'Unknown Program',
      programCode: semesterModule.semester?.structure.program.code || 'Unknown',
      termName,
      moduleId: semesterModule.module.id,
      studentModules: validStudentModules.map((sm) => ({
        studentId: sm.studentSemester!.studentProgram.student.stdNo,
        studentName: sm.studentSemester!.studentProgram.student.name,
        studentNumber:
          sm.studentSemester!.studentProgram.student.stdNo.toString(),
        marks: sm.marks,
        grade: sm.grade,
        status: sm.status,
      })),
    };
  }
  async getAvailableModulesForProgram(programId: number) {
    const structureList = await db.query.structures.findMany({
      where: eq(structures.programId, programId),
      columns: {},
      with: {
        semesters: {
          columns: { name: true },
          with: {
            semesterModules: {
              columns: { id: true },
              with: {
                module: {
                  columns: { code: true, name: true },
                },
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
    }> = [];

    for (const structure of structureList) {
      for (const semester of structure.semesters) {
        for (const semesterModule of semester.semesterModules) {
          if (semesterModule.module) {
            modules.push({
              id: semesterModule.id,
              code: semesterModule.module.code,
              name: semesterModule.module.name,
              semesterName: semester.name,
            });
          }
        }
      }
    }

    return modules;
  }
  async getOptimizedCourseSummaryData(
    semesterModuleId: number,
    termName: string,
    programFilter?: number,
  ) {
    const term = await db.query.terms.findFirst({
      where: eq(terms.name, termName),
      columns: { id: true },
    });

    if (!term) {
      return null;
    }

    const semesterModule = await db.query.semesterModules.findFirst({
      where: eq(semesterModules.id, semesterModuleId),
      columns: {},
      with: {
        module: {
          columns: { id: true, code: true, name: true },
        },
        semester: {
          columns: {},
          with: {
            structure: {
              columns: {},
              with: {
                program: {
                  columns: { id: true, name: true, code: true },
                },
              },
            },
          },
        },
      },
    });

    if (!semesterModule || !semesterModule.module) {
      return null;
    }

    const studentModulesData = await db.query.studentModules.findMany({
      where: eq(studentModules.semesterModuleId, semesterModuleId),
      columns: { status: true, marks: true, grade: true },
      with: {
        studentSemester: {
          columns: { term: true, status: true },
          with: {
            studentProgram: {
              columns: {},
              with: {
                student: {
                  columns: { stdNo: true, name: true },
                },
                structure: {
                  columns: {},
                  with: {
                    program: {
                      columns: { id: true },
                    },
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
    );

    if (programFilter) {
      validStudentModules = validStudentModules.filter(
        (sm) =>
          sm.studentSemester?.studentProgram.structure.program.id ===
          programFilter,
      );
    }

    if (validStudentModules.length === 0) {
      return null;
    }

    const studentNumbers = validStudentModules.map(
      (sm) => sm.studentSemester!.studentProgram.student.stdNo,
    );
    const [moduleGradesData, allAssessmentMarks] = await Promise.all([
      db.query.moduleGrades.findMany({
        where: and(
          eq(moduleGrades.moduleId, semesterModule.module.id),
          inArray(moduleGrades.stdNo, studentNumbers),
        ),
        columns: { stdNo: true, grade: true, weightedTotal: true },
      }),

      db.query.assessmentMarks.findMany({
        where: inArray(assessmentMarks.stdNo, studentNumbers),
        columns: { stdNo: true, marks: true },
        with: {
          assessment: {
            columns: {
              assessmentType: true,
              totalMarks: true,
              moduleId: true,
              termId: true,
            },
          },
        },
      }),
    ]);

    const relevantAssessmentMarks = allAssessmentMarks.filter(
      (am) =>
        am.assessment?.moduleId === semesterModule.module!.id &&
        am.assessment?.termId === term.id,
    );

    const gradesMap = new Map(
      moduleGradesData.map((mg) => [
        mg.stdNo,
        { grade: mg.grade, weightedTotal: mg.weightedTotal },
      ]),
    );

    const assessmentsByStudent = new Map<
      number,
      Array<{
        assessmentType: string;
        marks: number;
        totalMarks: number;
      }>
    >();

    relevantAssessmentMarks.forEach((am) => {
      if (!assessmentsByStudent.has(am.stdNo)) {
        assessmentsByStudent.set(am.stdNo, []);
      }
      assessmentsByStudent.get(am.stdNo)!.push({
        assessmentType: am.assessment!.assessmentType,
        marks: am.marks,
        totalMarks: am.assessment!.totalMarks,
      });
    });

    const students = validStudentModules.map((sm) => {
      const student = sm.studentSemester!.studentProgram.student;
      const gradeData = gradesMap.get(student.stdNo);

      return {
        stdNo: student.stdNo,
        name: student.name,
        status: sm.status,
        grade: gradeData?.grade || sm.grade,
        weightedTotal: gradeData?.weightedTotal || parseFloat(sm.marks),
        marks: sm.marks,
      };
    });

    return {
      courseCode: semesterModule.module.code,
      courseName: semesterModule.module.name,
      programName:
        semesterModule.semester?.structure.program.name || 'Unknown Program',
      programCode: semesterModule.semester?.structure.program.code || 'Unknown',
      termName,
      moduleId: semesterModule.module.id,
      students,
      assessments: Array.from(assessmentsByStudent.entries()).flatMap(
        ([stdNo, assessments]) =>
          assessments.map((assessment) => ({ stdNo, ...assessment })),
      ),
    };
  }
}

export const courseSummaryRepository = new CourseSummaryRepository();
