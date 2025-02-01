'use server';

import { db } from '@/db';
import {
  structureSemesters,
  studentModules,
  studentPrograms,
} from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';

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

export async function getRepeatModules(stdNo: number) {
  const result = await db.query.studentPrograms.findFirst({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        with: {
          modules: {
            where: lt(studentModules.marks, '50'),
          },
        },
      },
    },
  });
  const modules =
    result?.semesters
      .filter((semester) => semester.modules.length > 0)
      .map((semester) => semester.modules) || [];

  return modules;
}
