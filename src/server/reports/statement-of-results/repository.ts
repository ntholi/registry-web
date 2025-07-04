import { db } from '@/db';
import {
  programs,
  structures,
  studentPrograms,
  students,
  studentSemesters,
} from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray, ne } from 'drizzle-orm';

export default class StatementOfResultsRepository extends BaseRepository<
  typeof students,
  'stdNo'
> {
  constructor() {
    super(students, 'stdNo');
  }

  async getStudentsForStatementOfResults(programId: number, termName: string) {
    const structureIds = await db
      .select({ id: structures.id })
      .from(structures)
      .where(eq(structures.programId, programId))
      .then((rows) => rows.map((row) => row.id));

    if (structureIds.length === 0) {
      return [];
    }

    const studentProgramIds = await db
      .select({ id: studentPrograms.id })
      .from(studentPrograms)
      .where(
        and(
          inArray(studentPrograms.structureId, structureIds),
          eq(studentPrograms.status, 'Active'),
        ),
      )
      .then((rows) => rows.map((row) => row.id));

    if (studentProgramIds.length === 0) {
      return [];
    }

    const studentNumbers = await db
      .select({ stdNo: studentPrograms.stdNo })
      .from(studentSemesters)
      .innerJoin(
        studentPrograms,
        eq(studentSemesters.studentProgramId, studentPrograms.id),
      )
      .where(
        and(
          eq(studentSemesters.term, termName),
          inArray(studentSemesters.studentProgramId, studentProgramIds),
          ne(studentSemesters.status, 'Deleted'),
        ),
      )
      .then((rows) => rows.map((row) => row.stdNo));

    if (studentNumbers.length === 0) {
      return [];
    }

    const studentsData = await db.query.students.findMany({
      where: inArray(students.stdNo, studentNumbers),
      with: {
        programs: {
          where: eq(studentPrograms.status, 'Active'),
          with: {
            structure: {
              with: {
                program: true,
              },
            },
            semesters: {
              where: ne(studentSemesters.status, 'Deleted'),
              with: {
                studentModules: {
                  where: (modules) =>
                    and(
                      ne(modules.status, 'Delete'),
                      ne(modules.status, 'Drop'),
                    ),
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

    return studentsData.filter((student) =>
      student.programs.some((program) =>
        program.semesters.some((semester) => semester.term === termName),
      ),
    );
  }

  async validateFilters(schoolId: number, programId: number) {
    const program = await db.query.programs.findFirst({
      where: and(eq(programs.id, programId), eq(programs.schoolId, schoolId)),
    });

    if (!program) {
      throw new Error('Program does not belong to the selected school');
    }

    return program;
  }
}

export const statementOfResultsRepository = new StatementOfResultsRepository();
