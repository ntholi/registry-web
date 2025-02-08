'use server';

import { db } from '@/db';
import { structureSemesters, studentPrograms } from '@/db/schema';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

export async function getFailedPrerequisites(stdNo: number) {
  const failedModulesQuery = await db.query.studentPrograms.findMany({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        with: {
          modules: true,
        },
      },
    },
  });

  const failedModules = new Set(
    failedModulesQuery
      .flatMap((prog) => prog.semesters)
      .flatMap((sem) => sem.modules)
      .filter((mod) => parseFloat(mod.marks) < 50)
      .map((mod) => mod.code)
  );

  const prerequisites = await db.query.modulePrerequisites.findMany({
    with: {
      module: true,
      prerequisite: true,
    },
  });

  return prerequisites.reduce(
    (acc, { module, prerequisite }) => {
      if (failedModules.has(prerequisite.code)) {
        const entry = {
          moduleCode: module.code,
          prerequisiteCode: prerequisite.code,
          failed: true,
        };

        acc[module.code] = acc[module.code] || [];
        acc[module.code].push(entry);
      }
      return acc;
    },
    {} as Record<
      string,
      Array<{
        prerequisiteCode: string;
        failed: boolean;
      }>
    >
  );
}

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
  const failedPrerequisites = await getFailedPrerequisites(stdNo);

  if (repeatModules.length >= 3) {
    return repeatModules;
  }

  return [
    ...data.map((module) => ({
      ...module,
      status: 'Compulsory' as const,
      prerequisites: failedPrerequisites[module.code] || [],
    })),
    ...repeatModules,
  ];
}

export async function getRepeatModules(stdNo: number, semester: number) {
  const semesterNumbers =
    semester % 2 === 0 ? [2, 4, 6, 8, 10] : [1, 3, 5, 7, 9];

  const studentModules = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active')
    ),
    with: {
      semesters: {
        where: (semester) =>
          and(
            notInArray(semester.status, ['Deleted', 'Deferred']),
            inArray(semester.semesterNumber, semesterNumbers)
          ),
        with: {
          modules: true,
        },
      },
    },
  });

  type Module = (typeof studentModules)[0]['semesters'][0]['modules'][0];

  const moduleHistory = studentModules
    .flatMap((p) => p.semesters)
    .flatMap((s) => s.modules)
    .reduce((acc, mod) => {
      const marks = parseFloat(mod.marks);
      const passed = marks >= 50;

      acc[mod.name] = acc[mod.name] || {
        failCount: 0,
        passed: false,
        module: mod,
      };

      if (passed) {
        acc[mod.name].passed = true;
      } else {
        acc[mod.name].failCount++;
      }

      return acc;
    }, {} as Record<string, { failCount: number; passed: boolean; module: Module }>);

  return Object.values(moduleHistory)
    .filter(({ passed }) => !passed)
    .map(({ failCount, module }) => ({
      id: module.id,
      code: module.code,
      name: module.name,
      type: module.type,
      credits: module.credits,
      status: `Repeat${failCount}`,
    }));
}
