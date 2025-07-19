import { db } from '@/db';
import {
  modulePrerequisites,
  modules,
  semesterModules,
  structureSemesters,
} from '@/db/schema';
import {
  AcademicRemarks,
  getActiveProgram,
  getCurrentSemester,
  Student,
} from '@/lib/student-helpers';
import { and, eq, inArray } from 'drizzle-orm';

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  prerequisites?: Module[];
};

type Module = {
  code: string;
  name: string;
};

type SemesterModules = {
  modules: ModuleWithStatus[];
  semesterNo: number;
  semesterStatus: 'Active' | 'Repeat';
};

type SemesterModuleWithModule = typeof semesterModules.$inferSelect & {
  module: typeof modules.$inferSelect;
};

export async function getStudentSemesterModulesLogic(
  student: Student,
  remarks: AcademicRemarks,
): Promise<SemesterModules> {
  if (!student) {
    throw new Error('Student not found');
  }

  const activeProgram = getActiveProgram(student);
  if (!activeProgram) {
    throw new Error('No active program found for student');
  }

  const failedPrerequisites = await getFailedPrerequisites(
    remarks.failedModules,
    activeProgram.structureId,
  );
  const repeatModules = await getRepeatModules(remarks.failedModules);
  const nextSemester = (getCurrentSemester(student)?.semesterNumber ?? 0) + 1;

  // if (repeatModules.length >= 3) {
  //   return {
  //     modules: repeatModules,
  //     semesterNo: nextSemester,
  //     semesterStatus: 'Repeat',
  //   };
  // }

  const attemptedModules = new Set(
    student.programs
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.semesterModule.module?.name),
  );

  const eligibleModules = await getNextSemesterModules(
    nextSemester,
    activeProgram.structureId,
  );

  const filteredModules = eligibleModules.filter(
    (m) => !attemptedModules.has(m.module?.name),
  );

  return {
    semesterNo: nextSemester,
    semesterStatus: 'Active',
    modules: [
      ...filteredModules.map(
        (m): ModuleWithStatus => ({
          semesterModuleId: m.id,
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
  };
}

async function getFailedPrerequisites(
  failedModules: Module[],
  structureId: number,
) {
  if (failedModules.length === 0) {
    return {};
  }

  const failedModulesByCode = failedModules.reduce(
    (acc, module) => {
      acc[module.code] = { code: module.code, name: module.name };
      return acc;
    },
    {} as Record<string, Module>,
  );

  const failedModuleCodes = Object.keys(failedModulesByCode);

  const failedModuleIds = await db
    .select({ id: modules.id })
    .from(modules)
    .where(inArray(modules.code, failedModuleCodes))
    .then((rows) => rows.map((r) => r.id));

  if (failedModuleIds.length === 0) {
    return {};
  }

  const failedSemesterModules = await db.query.semesterModules.findMany({
    where: inArray(semesterModules.moduleId, failedModuleIds),
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
      if (
        semesterModule.module &&
        prerequisite.module &&
        failedModulesByCode[prerequisite.module.code]
      ) {
        acc[semesterModule.module.code] = acc[semesterModule.module.code] || [];
        const prereqInfo = failedModulesByCode[prerequisite.module.code];

        if (
          !acc[semesterModule.module.code].some(
            (p) => p.code === prereqInfo.code,
          )
        ) {
          acc[semesterModule.module.code].push(prereqInfo);
        }
      }
      return acc;
    },
    {} as Record<string, Module[]>,
  );
}

async function getRepeatModules(failedModules: Module[]) {
  if (failedModules.length === 0) {
    return [];
  }
  const failedModuleCodes = failedModules.map((m) => m.code);

  const moduleIds = await db
    .select({ id: modules.id })
    .from(modules)
    .where(inArray(modules.code, failedModuleCodes))
    .then((rows) => rows.map((r) => r.id));

  if (moduleIds.length === 0) {
    return [];
  }

  const semesterModulesData = await db.query.semesterModules.findMany({
    where: inArray(semesterModules.moduleId, moduleIds),
    with: {
      module: true,
    },
  });

  const failedPrerequisites = await getFailedPrerequisites(failedModules, 0);

  return semesterModulesData
    .filter((sm) => sm.module && failedModuleCodes.includes(sm.module.code))
    .map((sm, index) => ({
      semesterModuleId: sm.id,
      code: sm.module!.code,
      name: sm.module!.name,
      type: sm.type,
      credits: sm.credits,
      status: `Repeat${index + 1}` as const,
      prerequisites: failedPrerequisites[sm.module!.code] || [],
    }));
}

async function getNextSemesterModules(
  semesterNumber: number,
  structureId: number,
): Promise<SemesterModuleWithModule[]> {
  const semesters = await db.query.structureSemesters.findMany({
    where: and(
      eq(structureSemesters.structureId, structureId),
      eq(structureSemesters.semesterNumber, semesterNumber),
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

  return data.filter((m) => m.module !== null) as SemesterModuleWithModule[];
}
