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
  id: number;
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
    remarks.failedModules.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
    })),
  );
  const repeatModules = await getRepeatModules(
    remarks.failedModules.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
    })),
  );
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

async function getFailedPrerequisites(failedModules: Module[]) {
  if (failedModules.length === 0) {
    return {};
  }

  const failedModulesByCode = failedModules.reduce(
    (acc, module) => {
      acc[module.code] = module;
      return acc;
    },
    {} as Record<string, Module>,
  );

  const failedSemesterModules = await db.query.semesterModules.findMany({
    where: inArray(
      semesterModules.moduleId,
      failedModules.map((m) => m.id),
    ),
    columns: { id: true },
  });

  const prerequisites = await db.query.modulePrerequisites.findMany({
    where: inArray(
      modulePrerequisites.prerequisiteId,
      failedSemesterModules.map((sm) => sm.id),
    ),
    with: {
      semesterModule: { with: { module: true } },
      prerequisite: { with: { module: true } },
    },
  });

  return prerequisites.reduce(
    (acc, { semesterModule: { module }, prerequisite }) => {
      if (
        module &&
        prerequisite.module &&
        failedModulesByCode[prerequisite.module.code]
      ) {
        acc[module.code] = acc[module.code] || [];
        const pModule = failedModulesByCode[prerequisite.module.code];

        if (!acc[module.code].some((p) => p.code === pModule.code)) {
          acc[module.code].push(pModule);
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

  const failedPrerequisites = await getFailedPrerequisites(failedModules);

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
