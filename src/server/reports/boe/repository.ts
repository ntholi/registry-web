import { db } from '@/db';
import {
  programs,
  structures,
  studentPrograms,
  students,
  studentSemesters,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray, asc } from 'drizzle-orm';

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

    const structureIds = await db
      .select({ id: structures.id })
      .from(structures)
      .where(inArray(structures.programId, programIds))
      .then((rows) => rows.map((row) => row.id));

    const studentProgramIds = await db
      .select({ id: studentPrograms.id })
      .from(studentPrograms)
      .where(inArray(studentPrograms.structureId, structureIds))
      .then((rows) => rows.map((row) => row.id));

    return await db.query.studentSemesters.findMany({
      where: inArray(studentSemesters.studentProgramId, studentProgramIds),
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
}

export const boeReportRepository = new BoeReportRepository();
