'use server';

import { db } from '@/db';
import { structureSemesters, studentPrograms } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

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
          modules: true,
        },
      },
    },
  });

  if (!studentProgram) return [];

  const allModules = studentProgram
    .flatMap((program) => program.semesters)
    .flatMap((semester) => semester.modules);

  const modulesByName = allModules.reduce<Record<string, typeof allModules>>(
    (acc, module) => {
      if (!acc[module.name]) {
        acc[module.name] = [];
      }
      acc[module.name].push(module);
      return acc;
    },
    {}
  );

  return Object.values(modulesByName)
    .filter((attempts) => {
      const failed = attempts.some((module) => parseFloat(module.marks) < 50);
      const passed = attempts.some((module) => parseFloat(module.marks) >= 50);
      return failed && !passed;
    })
    .map((attempts) => attempts[0]);
}
