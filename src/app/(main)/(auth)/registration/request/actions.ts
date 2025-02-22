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
            with: { module: true },
          },
        },
      },
    },
  });

  const semesterNo = determineNextSemester(
    programs.flatMap((p) => p.semesters),
  );
  const prevSemesterModules = await getSemesterModules(
    semesterNo - 1,
    structureId,
  );

  const passedModules = new Set(
    programs
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .filter((m) => parseFloat(m.marks) >= 50)
      .map((m) => m.module.name),
  );

  const failedModules = new Set(
    prevSemesterModules
      .filter((m) => !passedModules.has(m.name))
      .map((m) => m.name),
  );

  const prerequisites = await db.query.modulePrerequisites.findMany({
    with: { module: true, prerequisite: true },
  });

  return prerequisites.reduce(
    (acc, { module, prerequisite }) => {
      if (failedModules.has(prerequisite.name)) {
        acc[module.code] = [...(acc[module.code] || []), prerequisite.code];
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
      structure: { with: { program: true } },
      semesters: {
        where: (s) => notInArray(s.status, ['Deleted', 'Deferred']),
        with: {
          studentModules: {
            where: (m) => notInArray(m.status, ['Delete', 'Drop']),
            with: { module: true },
          },
        },
      },
    },
  });

  const semesterNo = determineNextSemester(
    stdPrograms.flatMap((p) => p.semesters),
  );
  const repeatModules = await getRepeatModules(stdNo);

  const activeProgram = stdPrograms.find((p) => p.status === 'Active');
  if (
    //Internship Students
    activeProgram?.structure?.program?.level === 'diploma' &&
    semesterNo === 5 &&
    repeatModules.length
  ) {
    return repeatModules;
  }

  if (repeatModules.length >= 3) return repeatModules;

  const attemptedModules = new Set(
    stdPrograms
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.module.name),
  );

  const eligibleModules = (
    await getSemesterModules(semesterNo, structureId)
  ).filter((m) => !attemptedModules.has(m.name));

  const failedPrerequisites = await getFailedPrerequisites(stdNo, structureId);

  return [
    ...eligibleModules.map((m) => ({
      ...m,
      status: m.type === 'Elective' ? 'Elective' : 'Compulsory',
      prerequisites: failedPrerequisites[m.code] || [],
    })),
    ...repeatModules,
  ];
}

export async function getRepeatModules(stdNo: number) {
  const { semester } = await getCurrentTerm();
  const semesterNumbers =
    semester % 2 === 0 ? [2, 4, 6, 8, 10] : [1, 3, 5, 7, 9];

  const studentModules = await db.query.studentPrograms.findMany({
    where: and(
      eq(studentPrograms.stdNo, stdNo),
      eq(studentPrograms.status, 'Active'),
    ),
    with: {
      semesters: {
        where: (s) =>
          and(
            notInArray(s.status, ['Deleted', 'Deferred']),
            inArray(s.semesterNumber, semesterNumbers),
          ),
        with: {
          studentModules: {
            where: (m) => notInArray(m.status, ['Delete', 'Drop']),
            with: { module: true },
          },
        },
      },
    },
  });

  const moduleHistory = studentModules
    .flatMap((p) => p.semesters)
    .flatMap((s) => s.studentModules)
    .reduce(
      (acc, { marks, module }) => {
        const passed = parseFloat(marks) >= 50;
        acc[module.name] = acc[module.name] || {
          failCount: 0,
          passed: false,
          module,
        };

        if (passed) acc[module.name].passed = true;
        else acc[module.name].failCount++;

        return acc;
      },
      {} as Record<string, { failCount: number; passed: boolean; module: any }>,
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
      semesterModules: { with: { module: true } },
    },
  });

  return semesters.flatMap((s) => s.semesterModules.map((sm) => sm.module));
}

const determineNextSemester = (
  semesters: (typeof studentSemesters.$inferSelect)[],
) => {
  const value =
    Math.max(...semesters.map((s) => Number(s.semesterNumber)), 0) + 1;
  console.log('Next Semester: ', value);
  return value;
};
