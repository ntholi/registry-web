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

  const data = result?.semesterModules.map((sm) => sm.module) || [];
  const repeatModules = await getRepeatModules(stdNo, semester);

  return [
    ...data.map((it) => ({ ...it, status: 'Compulsory' as const })),
    ...repeatModules.map((it) => ({ ...it })),
  ];
}

export async function getRepeatModules(stdNo: number, semester: number) {
  const semesterNumbers = Array.from({ length: 5 }, (_, i) =>
    semester % 2 === 0 ? 2 * (i + 1) : 2 * i + 1
  );

  const studentModules = await db.query.studentPrograms.findMany({
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

  const moduleMap = new Map<
    string,
    {
      failCount: number;
      passed: boolean;
      firstModule: (typeof studentModules)[0]['semesters'][0]['modules'][0] & {
        repeatCount: string;
      };
    }
  >();

  for (const program of studentModules) {
    for (const semester of program.semesters) {
      for (const mod of semester.modules) {
        const marks = parseFloat(mod.marks);
        const currentModule = moduleMap.get(mod.name);

        if (!currentModule) {
          moduleMap.set(mod.name, {
            failCount: marks < 50 ? 1 : 0,
            passed: marks >= 50,
            firstModule: {
              ...mod,
              repeatCount: `Repeat${marks < 50 ? 1 : ''}`,
            },
          });
          continue;
        }

        if (marks >= 50) {
          currentModule.passed = true;
        } else if (marks < 50) {
          currentModule.failCount++;
          currentModule.firstModule.repeatCount = `Repeat${currentModule.failCount}`;
        }
      }
    }
  }

  return Array.from(moduleMap.values())
    .filter(({ passed }) => !passed)
    .map(({ firstModule }) => ({
      id: firstModule.id,
      code: firstModule.code,
      name: firstModule.name,
      type: firstModule.type,
      credits: firstModule.credits,
      status: firstModule.repeatCount,
    }));
}
