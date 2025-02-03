'use server';

import { db } from '@/db';
import { structureSemesters, studentPrograms } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export async function getSemesterModules(
  stdNo: number,
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

  const data =
    result?.semesterModules.map((semesterModule) => semesterModule.module) ||
    [];

  const repeatModules = await getRepeatModules(stdNo, semester);

  return [
    ...data.map((it) => ({ ...it, status: 'Compulsory' as const })),
    ...repeatModules.map((it) => ({ ...it, status: 'Repeat' as const })),
  ];
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
