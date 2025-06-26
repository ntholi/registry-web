import { db } from '@/db';
import {
  programs,
  structures,
  studentModules,
  studentPrograms,
  students,
  studentSemesters,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray, asc, notInArray, ne } from 'drizzle-orm';

export interface StudentModuleReport {
  studentId: number;
  studentName: string;
  moduleCode: string;
  moduleName: string;
  credits: number;
  marks: string;
  grade: string;
}

export interface StudentSemesterReport {
  studentId: number;
  studentName: string;
  studentModules: StudentModuleReport[];
  modulesCount: number;
  creditsAttempted: number;
  creditsEarned: number;
  totalPoints: number;
  gpa: string;
  cgpa: string;
  facultyRemark?: string;
}

export interface ProgramSemesterReport {
  programId: number;
  programCode: string;
  programName: string;
  semesterNumber: number;
  students: StudentSemesterReport[];
}

export interface FacultyReport {
  facultyId: number;
  facultyName: string;
  termName: string;
  programs: ProgramSemesterReport[];
}

export default class BoeReportRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }

  async getStudentSemestersForFaculty(schoolId: number, termName: string) {
    const facultyPrograms = await db.query.programs.findMany({
      where: eq(programs.schoolId, schoolId),
    });

    const programIds = facultyPrograms.map((program) => program.id);

    const structureRows = await db
      .select({ id: structures.id })
      .from(structures)
      .where(inArray(structures.programId, programIds));

    const structureIds = structureRows.map((row) => row.id);

    const studentProgramRows = await db
      .select({ id: studentPrograms.id })
      .from(studentPrograms)
      .where(inArray(studentPrograms.structureId, structureIds));

    const studentProgramIds = studentProgramRows.map((row) => row.id);

    return await db.query.studentSemesters.findMany({
      where: and(
        eq(studentSemesters.term, termName),
        inArray(studentSemesters.studentProgramId, studentProgramIds),
        ne(studentSemesters.status, 'Deleted'),
      ),
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
        studentModules: {
          where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
          with: {
            semesterModule: {
              with: {
                module: true,
              },
            },
          },
        },
      },
    });
  }

  async getStudentSemestersForProgram(programId: number, termName: string) {
    const structureRows = await db
      .select({ id: structures.id })
      .from(structures)
      .where(eq(structures.programId, programId));

    const structureIds = structureRows.map((row) => row.id);

    const studentProgramRows = await db
      .select({ id: studentPrograms.id })
      .from(studentPrograms)
      .where(inArray(studentPrograms.structureId, structureIds));

    const studentProgramIds = studentProgramRows.map((row) => row.id);

    return await db.query.studentSemesters.findMany({
      where: and(
        eq(studentSemesters.term, termName),
        inArray(studentSemesters.studentProgramId, studentProgramIds),
        ne(studentSemesters.status, 'Deleted'),
      ),
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
        studentModules: {
          where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
          with: {
            semesterModule: {
              with: {
                module: true,
              },
            },
          },
        },
      },
    });
  }

  async getStudentSemesterHistoryForFaculty(schoolId: number) {
    const programIds = await db.query.programs
      .findMany({
        columns: {
          id: true,
        },
        where: eq(programs.schoolId, schoolId),
      })
      .then((rows) => rows.map((row) => row.id));

    if (programIds.length === 0) {
      return [];
    }

    const structureIds = await db
      .select({ id: structures.id })
      .from(structures)
      .where(inArray(structures.programId, programIds))
      .then((rows) => rows.map((row) => row.id));

    if (structureIds.length === 0) {
      return [];
    }

    const studentProgramIds = await db
      .select({ id: studentPrograms.id })
      .from(studentPrograms)
      .where(inArray(studentPrograms.structureId, structureIds))
      .then((rows) => rows.map((row) => row.id));

    if (studentProgramIds.length === 0) {
      return [];
    }

    const allResults = [];
    const batchSize = 100;

    for (let i = 0; i < studentProgramIds.length; i += batchSize) {
      const batch = studentProgramIds.slice(i, i + batchSize);

      const batchResults = await db.query.studentSemesters.findMany({
        where: and(
          inArray(studentSemesters.studentProgramId, batch),
          ne(studentSemesters.status, 'Deleted'),
        ),
        orderBy: [
          asc(studentSemesters.term),
          asc(studentSemesters.semesterNumber),
        ],
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
          studentModules: {
            where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
            with: {
              semesterModule: {
                with: {
                  module: true,
                },
              },
            },
          },
        },
      });

      allResults.push(...batchResults);
    }

    return allResults;
  }

  async getStudentSemesterHistoryForStudents(studentNumbers: number[]) {
    if (studentNumbers.length === 0) {
      return [];
    }

    const allResults = [];
    const batchSize = 50;

    for (let i = 0; i < studentNumbers.length; i += batchSize) {
      const batch = studentNumbers.slice(i, i + batchSize);

      const batchResults = await db.query.studentSemesters.findMany({
        where: and(
          inArray(
            studentSemesters.studentProgramId,
            db
              .select({ id: studentPrograms.id })
              .from(studentPrograms)
              .where(
                and(
                  inArray(studentPrograms.stdNo, batch),
                  eq(studentPrograms.status, 'Active'),
                ),
              ),
          ),
          ne(studentSemesters.status, 'Deleted'),
        ),
        orderBy: [
          asc(studentSemesters.term),
          asc(studentSemesters.semesterNumber),
        ],
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
          studentModules: {
            where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
            with: {
              semesterModule: {
                with: {
                  module: true,
                },
              },
            },
          },
        },
      });

      allResults.push(...batchResults);
    }

    return allResults;
  }
}

export const boeReportRepository = new BoeReportRepository();
