'use server';

import { db } from '@/db';
import { structureSemesters, studentPrograms } from '@/db/schema';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

export async function getFailedPrerequisites(
  stdNo: number,
  semester: number,
  structureId: number,
) {
  const allSemesterModules = await getAllSemesterModules(semester, structureId);

  const requiredModuleNames = new Set(
    allSemesterModules.map(({ name }) => name),
  );

  const attemptedModules = await db.query.studentPrograms.findMany({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        with: {
          studentModules: {
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  const attemptedModuleResults = new Map(
    attemptedModules
      .flatMap((prog) => prog.semesters)
      .flatMap((sem) => sem.studentModules)
      .map((mod) => [mod.module.name, parseFloat(mod.marks)]),
  );

  // A module is failed if:
  // 1. It's in requiredModuleNames but not attempted (missing prerequisite)
  // 2. It was attempted but got marks < 50
  const failedModules = new Set(
    [...requiredModuleNames]
      .filter((moduleName) => {
        const marks = attemptedModuleResults.get(moduleName);
        if (marks === undefined) {
          // Module was required but never attempted
          return true;
        }
        // Module was attempted but failed
        return marks < 50;
      })
      .map(
        (moduleName) =>
          // Find the module code for this module name
          allSemesterModules.find(({ name }) => name === moduleName)?.code,
      )
      .filter((code): code is string => code !== undefined),
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
    >,
  );
}

export async function getSemesterModules(
  stdNo: number,
  semester: number,
  structureId: number,
) {
  const studentModules = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active'),
    ),
    with: {
      semesters: {
        where: (semester) =>
          notInArray(semester.status, ['Deleted', 'Deferred']),
        with: {
          studentModules: {
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  const attemptedModuleNames = new Set(
    studentModules
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.module.name),
  );

  const allSemesterModules = await getAllSemesterModules(semester, structureId);

  const eligibleModules = allSemesterModules.filter(
    (module) => !attemptedModuleNames.has(module.name),
  );

  const repeatModules = await getRepeatModules(stdNo, semester);
  const failedPrerequisites = await getFailedPrerequisites(
    stdNo,
    semester,
    structureId,
  );

  if (repeatModules.length >= 3) {
    return repeatModules;
  }

  return [
    ...eligibleModules.map((module) => ({
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
      eq(studentPrograms.status, 'Active'),
    ),
    with: {
      semesters: {
        where: (semester) =>
          and(
            notInArray(semester.status, ['Deleted', 'Deferred']),
            inArray(semester.semesterNumber, semesterNumbers),
          ),
        with: {
          studentModules: {
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  type Module = (typeof studentModules)[0]['semesters'][0]['studentModules'][0];

  const moduleHistory = studentModules
    .flatMap((p) => p.semesters)
    .flatMap((s) => s.studentModules)
    .reduce(
      (acc, mod) => {
        const marks = parseFloat(mod.marks);
        const passed = marks >= 50;

        acc[mod.module.name] = acc[mod.module.name] || {
          failCount: 0,
          passed: false,
          module: mod.module,
        };

        if (passed) {
          acc[mod.module.name].passed = true;
        } else {
          acc[mod.module.name].failCount++;
        }

        return acc;
      },
      {} as Record<
        string,
        { failCount: number; passed: boolean; module: Module['module'] }
      >,
    );

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

async function getAllSemesterModules(semester: number, structureId: number) {
  const semesters = await db.query.structureSemesters.findMany({
    where: and(
      eq(structureSemesters.structureId, structureId),
      inArray(
        structureSemesters.semesterNumber,
        Array.from({ length: semester }, (_, i) => i + 1),
      ),
    ),
    with: {
      semesterModules: {
        with: {
          module: true,
        },
      },
    },
  });

  return semesters.flatMap((s) => s.semesterModules).map((sm) => sm.module);
}
