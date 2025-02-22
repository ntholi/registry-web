'use server';

import { db } from '@/db';
import {
  structureSemesters,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';
import { getCurrentTerm } from '@/server/terms/actions';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

export async function getFailedPrerequisites(
  stdNo: number,
  structureId: number,
) {
  const programs = await db.query.studentPrograms.findMany({
    where: eq(studentPrograms.stdNo, stdNo),
    with: {
      semesters: {
        where: (semester) =>
          notInArray(semester.status, ['Deleted', 'Deferred']),
        with: {
          studentModules: {
            where: (module) => notInArray(module.status, ['Delete', 'Drop']),
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  const semesterNo = determineNextSemester(
    programs.flatMap((it) => it.semesters),
  );

  const previousSemesterModules = await getSemesterModules(
    semesterNo - 1,
    structureId,
  );

  const passedModules = programs
    .flatMap((it) => it.semesters)
    .flatMap((it) => it.studentModules)
    .filter((it) => parseFloat(it.marks) >= 50)
    .map((it) => it.module.name);

  const failedModules = new Set(
    [...previousSemesterModules]
      .filter((it) => !passedModules.includes(it.name))
      .map((it) => it.name),
  );

  const prerequisites = await db.query.modulePrerequisites.findMany({
    with: {
      module: true,
      prerequisite: true,
    },
  });

  return prerequisites.reduce(
    (acc, { module, prerequisite }) => {
      if (failedModules.has(prerequisite.name)) {
        acc[module.code] = acc[module.code] || [];
        acc[module.code].push(prerequisite.code);
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );
}

export async function getStudentSemesterModules(
  stdNo: number,
  structureId: number,
) {
  const stdPrograms = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active'),
    ),
    with: {
      structure: {
        with: {
          program: true,
        },
      },
      semesters: {
        where: (semester) =>
          notInArray(semester.status, ['Deleted', 'Deferred']),
        with: {
          studentModules: {
            where: (module) => notInArray(module.status, ['Delete', 'Drop']),
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  const semesterNo = determineNextSemester(
    stdPrograms.flatMap((it) => it.semesters),
  );

  const repeatModules = await getRepeatModules(stdNo);

  // For internship students, if they have failed modules, they can only repeat those modules
  const stdProgram = stdPrograms.find((it) => it.status === 'Active')?.structure
    .program;
  if (
    stdProgram?.level === 'diploma' &&
    semesterNo === 5 &&
    repeatModules.length > 0
  ) {
    return repeatModules;
  }

  const attemptedModuleNames = new Set(
    stdPrograms
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.module.name),
  );

  const allSemesterModules = await getSemesterModules(semesterNo, structureId);

  const eligibleModules = allSemesterModules.filter(
    (module) => !attemptedModuleNames.has(module.name),
  );

  const failedPrerequisites = await getFailedPrerequisites(stdNo, structureId);

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

export async function getRepeatModules(stdNo: number) {
  const term = await getCurrentTerm();
  const semesterNumbers =
    term.semester % 2 === 0 ? [2, 4, 6, 8, 10] : [1, 3, 5, 7, 9];

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
            where: (module) => notInArray(module.status, ['Delete', 'Drop']),
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

async function getSemesterModules(semester: number, structureId: number) {
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

function determineNextSemester(
  semesters: (typeof studentSemesters.$inferSelect)[],
) {
  const numbers = semesters
    .map((program) => program.semesterNumber)
    .map(Number);

  const value = Math.max(...numbers) + 1;
  console.log('Next Semester: ', value);
  return value;
}
