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
  getNextSemesterNo,
  Student,
} from '@/lib/helpers/students';
import { and, eq, inArray } from 'drizzle-orm';

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Module[];
};

type Module = {
  id: number;
  code: string;
  name: string;
};

type SemesterModuleWithModule = typeof semesterModules.$inferSelect & {
  module: typeof modules.$inferSelect;
  semester: { semesterNumber: number };
};

export async function getStudentSemesterModulesLogic(
  student: Student,
  remarks: AcademicRemarks,
) {
  if (!student) {
    throw new Error('Student not found');
  }

  const activeProgram = getActiveProgram(student);
  if (!activeProgram) {
    throw new Error('No active program found for student');
  }

  if (remarks.status === 'Remain in Semester') {
    throw new Error(`${remarks.status}, ${remarks.details}`);
  }

  const failedPrerequisites = await getFailedPrerequisites(
    remarks.failedModules,
  );
  const repeatModules = await getRepeatModules(
    remarks.failedModules,
    getNextSemesterNo(student),
    activeProgram.structureId,
  );

  const attemptedModules = new Set(
    student.programs
      .flatMap((p) => p.semesters)
      .flatMap((s) => s.studentModules)
      .map((m) => m.semesterModule.module?.name),
  );

  const eligibleModules = await getSemesterModules(
    getNextSemesterNo(student),
    activeProgram.structureId,
  );

  const filteredModules = eligibleModules.filter(
    (m) => !attemptedModules.has(m.module?.name),
  );

  return [
    ...filteredModules.map(
      (m): ModuleWithStatus => ({
        semesterModuleId: m.id,
        code: m.module.code,
        name: m.module.name,
        type: m.type,
        credits: m.credits,
        status: m.type === 'Elective' ? 'Elective' : 'Compulsory',
        semesterNo: m.semester.semesterNumber,
        prerequisites: failedPrerequisites[m.module?.name] || [],
      }),
    ),
    ...repeatModules,
  ];
}

async function getFailedPrerequisites(failedModules: Module[]) {
  if (failedModules.length === 0) {
    return {};
  }

  const failedModulesByName = failedModules.reduce(
    (acc, module) => {
      acc[module.name] = module;
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
        failedModulesByName[prerequisite.module.name]
      ) {
        acc[module.name] = acc[module.name] || [];
        const pModule = failedModulesByName[prerequisite.module.name];

        if (!acc[module.name].some((p) => p.name === pModule.name)) {
          acc[module.name].push(pModule);
        }
      }
      return acc;
    },
    {} as Record<string, Module[]>,
  );
}

async function getRepeatModules(
  failedModules: Module[],
  nextSemester: number,
  structureId: number,
) {
  if (failedModules.length === 0) return [];

  const failedModuleNames = failedModules.map((m) => m.name);
  const failedPrerequisites = await getFailedPrerequisites(failedModules);

  const targetSemesters: number[] = [];
  const isNextSemesterEven = nextSemester % 2 === 0;

  for (let sem = 1; sem < nextSemester; sem++) {
    const isSemesterEven = sem % 2 === 0;
    if (isNextSemesterEven === isSemesterEven) {
      targetSemesters.push(sem);
    }
  }

  if (targetSemesters.length === 0) return [];

  const allRepeatModules: ModuleWithStatus[] = [];

  for (const semesterNumber of targetSemesters) {
    const semesterModules = await getSemesterModules(
      semesterNumber,
      structureId,
    );
    const repeatModulesForSemester = semesterModules.filter(
      (sm) => sm.module && failedModuleNames.includes(sm.module.name),
    );

    repeatModulesForSemester.forEach((sm, index: number) => {
      const globalIndex = allRepeatModules.length + index + 1;
      allRepeatModules.push({
        semesterModuleId: sm.id,
        code: sm.module!.code,
        name: sm.module!.name,
        type: sm.type,
        credits: sm.credits,
        status: `Repeat${globalIndex}` as const,
        semesterNo: sm.semester.semesterNumber,
        prerequisites: failedPrerequisites[sm.module!.name] || [],
      });
    });
  }

  return allRepeatModules;
}

async function getSemesterModules(semesterNumber: number, structureId: number) {
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
      semester: {
        columns: { semesterNumber: true },
      },
    },
    where: and(
      inArray(semesterModules.semesterId, semesterIds),
      eq(semesterModules.hidden, false),
    ),
  });

  return data.filter(
    (m) => m.module !== null && m.semester !== null,
  ) as SemesterModuleWithModule[];
}
