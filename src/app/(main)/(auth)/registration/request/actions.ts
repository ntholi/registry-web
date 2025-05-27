'use server';

import { db } from '@/db';
import {
  modules,
  modulePrerequisites,
  semesterModules,
  structureSemesters,
  studentPrograms,
  studentSemesters,
} from '@/db/schema';
import { getCurrentTerm } from '@/server/terms/actions';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

type ModuleWithStatus = {
  id: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  prerequisites?: PrerequisiteInfo[];
};

type PrerequisiteInfo = {
  code: string;
  name: string;
};

type SemesterModules = {
  modules: ModuleWithStatus[];
  semesterNo: number;
  semesterStatus: 'Active' | 'Repeat';
};

export async function getFailedPrerequisites(stdNo: number) {
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
              semesterModule: {
                with: {
                  module: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const prevSemesterModules = programs
    .flatMap((p) => p.semesters)
    .flatMap((s) => s.studentModules)
    .map((m) => m.semesterModule.module);

  const passedModules = new Set(
    programs
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .filter((m) => parseFloat(m.marks) >= 50)
      .map((m) => m.semesterModule.module?.code),
  );

  const failedModules = prevSemesterModules.filter(
    (m) => !passedModules.has(m?.code),
  );
  const failedModulesByCode = failedModules.reduce(
    (acc, module) => {
      acc[module!.code] = { code: module!.code, name: module!.name };
      return acc;
    },
    {} as Record<string, PrerequisiteInfo>,
  );

  const failedModuleCodes = Object.keys(failedModulesByCode);
  if (failedModuleCodes.length === 0) {
    return {};
  }

  const failedSemesterModules = await db.query.semesterModules.findMany({
    where: inArray(
      semesterModules.moduleId,
      await db
        .select({ id: modules.id })
        .from(modules)
        .where(inArray(modules.code, failedModuleCodes))
        .then((rows) => rows.map((r) => r.id)),
    ),
    columns: { id: true },
  });

  const failedSemesterModuleIds = failedSemesterModules.map((sm) => sm.id);

  if (failedSemesterModuleIds.length === 0) {
    return {};
  }

  const prerequisites = await db.query.modulePrerequisites.findMany({
    where: inArray(modulePrerequisites.prerequisiteId, failedSemesterModuleIds),
    with: {
      semesterModule: { with: { module: true } },
      prerequisite: { with: { module: true } },
    },
  });

  return prerequisites.reduce(
    (acc, { semesterModule, prerequisite }) => {
      if (failedModulesByCode[prerequisite.module!.code]) {
        acc[semesterModule.module!.code] =
          acc[semesterModule.module!.code] || [];
        const prereqInfo = failedModulesByCode[prerequisite.module!.code];

        // Check if this prerequisite is already in the array to avoid duplicates
        if (
          !acc[semesterModule.module!.code].some(
            (p) => p.code === prereqInfo.code,
          )
        ) {
          acc[semesterModule.module!.code].push(prereqInfo);
        }
      }
      return acc;
    },
    {} as Record<string, PrerequisiteInfo[]>,
  );
}

export async function getStudentSemesterModules(
  stdNo: number,
  structureId: number,
): Promise<SemesterModules> {
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
            with: { semesterModule: { with: { module: true } } },
          },
        },
      },
    },
  });

  const semesterNo = await determineNextSemester(
    stdPrograms.flatMap((p) => p.semesters),
  );
  const failedPrerequisites = await getFailedPrerequisites(stdNo);
  const repeatModules = await getRepeatModules(stdNo, failedPrerequisites);

  const activeProgram = stdPrograms.find((p) => p.status === 'Active');
  if (
    //Internship Students
    activeProgram?.structure?.program?.level === 'diploma' &&
    semesterNo === 6 &&
    repeatModules.length
  ) {
    return {
      modules: repeatModules,
      semesterNo: semesterNo - 2,
      semesterStatus: 'Repeat',
    };
  }

  if (repeatModules.length >= 3) {
    //Remain in semester
    return {
      modules: repeatModules,
      semesterNo: semesterNo,
      semesterStatus: 'Repeat',
    };
  }

  const attemptedModules = new Set(
    stdPrograms
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.semesterModule.module?.name),
  );

  const eligibleModules = (
    await getSemesterModules(semesterNo, structureId)
  ).filter((m) => !attemptedModules.has(m.module?.name));

  return {
    modules: [
      ...eligibleModules.map(
        (m): ModuleWithStatus => ({
          id: m.id,
          code: m.module.code,
          name: m.module.name,
          type: m.type,
          credits: m.credits,
          status: m.type === 'Elective' ? 'Elective' : 'Compulsory',
          prerequisites: failedPrerequisites[m.module?.code] || [],
        }),
      ),
      ...repeatModules,
    ],
    semesterNo,
    semesterStatus: 'Active',
  };
}

export async function getRepeatModules(
  stdNo: number,
  failedPrerequisites?: Record<string, PrerequisiteInfo[]>,
): Promise<ModuleWithStatus[]> {
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
            with: { semesterModule: { with: { module: true } } },
          },
        },
      },
    },
  });

  type Module = typeof semesterModules.$inferSelect & {
    module: typeof modules.$inferSelect;
  };
  const moduleHistory = studentModules
    .flatMap((p) => p.semesters)
    .flatMap((s) => s.studentModules)
    .reduce(
      (acc, { marks, semesterModule }) => {
        const passed = parseFloat(marks) >= 50;
        acc[semesterModule.module!.name] = acc[semesterModule.module!.name] || {
          failCount: 0,
          passed: false,
          semesterModule: semesterModule,
        };

        if (passed) acc[semesterModule.module!.name].passed = true;
        else acc[semesterModule.module!.name].failCount++;

        return acc;
      },
      {} as Record<
        string,
        { failCount: number; passed: boolean; semesterModule: Module }
      >,
    );

  if (!failedPrerequisites) {
    failedPrerequisites = await getFailedPrerequisites(stdNo);
  }

  console.log('moduleHistory', moduleHistory);

  return Object.values(moduleHistory)
    .filter(({ passed }) => !passed)
    .map(({ failCount, semesterModule }) => ({
      id: semesterModule.id,
      code: semesterModule.module.code,
      name: semesterModule.module.name,
      type: semesterModule.type,
      credits: semesterModule.credits,
      status: `Repeat${failCount}`,
      prerequisites: failedPrerequisites![semesterModule.module.code] || [],
    }));
}

async function getSemesterModules(semester: number, structureId: number) {
  const term = await getCurrentTerm();
  const semesterNumbers = Array.from(
    { length: semester },
    (_, i) => i + 1,
  ).filter((i) => i % term.semester === 0);

  const semesters = await db.query.structureSemesters.findMany({
    where: and(
      eq(structureSemesters.structureId, structureId),
      inArray(structureSemesters.semesterNumber, semesterNumbers),
    ),
  });

  const semesterIds = semesters.map((s) => s.id);
  if (semesterIds.length === 0) return [];

  const data = await db.query.semesterModules.findMany({
    with: {
      module: true,
    },
    where: and(
      inArray(semesterModules.semesterId, semesterIds),
      eq(semesterModules.hidden, false),
    ),
  });

  return data.map((m) => ({
    id: m.id,
    type: m.type,
    credits: m.credits,
    module: {
      code: m.module!.code,
      name: m.module!.name,
    },
  }));
}

const determineNextSemester = async (
  semesters: (typeof studentSemesters.$inferSelect)[],
): Promise<number> => {
  const value =
    Math.max(...semesters.map((s) => Number(s.semesterNumber)), 0) + 1;
  const term = await getCurrentTerm();

  const isSameParity = (term.semester % 2 === 0) === (value % 2 === 0);

  if (isSameParity) {
    return value;
  } else {
    return value - 1;
  }
};
