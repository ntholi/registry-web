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
  const semesterNumbers = Array.from({ length: 4 }, (_, i) => semester + i * 2);

  const semesters = await db.query.studentPrograms
    .findFirst({
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
    })
    .then((it) =>
      it?.semesters.filter((semester) =>
        semesterNumbers.includes(semester.semesterNumber)
      )
    );

  const modules =
    result?.semesters
      .filter((semester) => semester.modules.length > 0)
      .map((semester) => semester.modules) || [];

  return modules;
}
