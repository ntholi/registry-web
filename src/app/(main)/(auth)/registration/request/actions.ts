'use server';

import { db } from '@/db';
import {
  structureSemesters,
  studentModules,
  studentPrograms,
} from '@/db/schema';
import { and, eq, inArray, lt } from 'drizzle-orm';

export async function getSemesterModules(
  structureId: number,
  semester: number
) {
  const result = await db.query.structureSemesters.findFirst({
    where: and(
      eq(structureSemesters.structureId, structureId),
      eq(structureSemesters.semesterNumber, semester)
    ),
    with: {
      semesterModules: {
        with: {
          module: true,
        },
      },
    },
  });

  return (
    result?.semesterModules.map((semesterModule) => semesterModule.module) || []
  );
}

export async function getRepeatModules(stdNo: number, semester: number) {
  const semesterNumbers = Array.from({ length: 5 }, (_, i) =>
    semester % 2 === 0 ? 2 * (i + 1) : 2 * i + 1
  );

  const studentProgram = await db.query.studentPrograms.findMany({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        where: (semester) => inArray(semester.semesterNumber, semesterNumbers),
        with: {
          modules: {
            where: lt(studentModules.marks, '50'),
          },
        },
      },
    },
  });

  if (!studentProgram) return [];

  return studentProgram
    .flatMap((program) => program.semesters)
    .flatMap((semester) => semester.modules);
}
