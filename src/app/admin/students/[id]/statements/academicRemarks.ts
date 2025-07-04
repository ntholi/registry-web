import {
  isFailingGrade,
  isSupplementaryGrade,
  ModuleForRemarks,
  SemesterModuleData,
  FacultyRemarksResult,
  calculateFacultyRemarks,
} from '@/utils/grades';
import { ModuleStatus } from '@/db/schema';

type StudentModule = {
  grade: string;
  status: string;
  semesterModule: {
    credits: number;
    module?: {
      code: string;
      name: string;
    } | null;
  };
  semesterModuleId: number;
};

type Semester = {
  id: number;
  term: string;
  status: string;
  studentModules?: StudentModule[];
};

type Program = {
  id: number;
  status: string;
  semesters?: Semester[];
  structure: {
    program: {
      name: string;
    };
  };
};

type AcademicRemarksResult = {
  status: 'Proceed' | 'Remain in Semester';
  pendingModules: {
    code: string;
    name: string;
    type: 'Failed' | 'Supplementary';
    semester: string;
  }[];
  details: string;
};

function extractSemesterNumber(term: string): number {
  const match = term.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getNextSemesterNumber(programs: Program[]): number {
  let maxSemester = 0;

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNum = extractSemesterNumber(semester.term);
      if (semesterNum > maxSemester) {
        maxSemester = semesterNum;
      }
    });
  });

  return maxSemester + 1;
}

function getFailedModulesFromMatchingSemesters(
  programs: Program[],
  nextSemesterNumber: number,
): { module: StudentModule; semester: string }[] {
  const failedModules: { module: StudentModule; semester: string }[] = [];
  const nextSemesterParity = nextSemesterNumber % 2;

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNum = extractSemesterNumber(semester.term);
      const semesterParity = semesterNum % 2;

      if (
        semesterParity === nextSemesterParity &&
        semesterNum < nextSemesterNumber
      ) {
        semester.studentModules?.forEach((module: StudentModule) => {
          if (
            isFailingGrade(module.grade) &&
            !['Delete', 'Drop'].includes(module.status)
          ) {
            const hasBeenRepeated = programs.some((p) =>
              p.semesters?.some((s) => {
                const laterSemesterNum = extractSemesterNumber(s.term);
                return (
                  laterSemesterNum > semesterNum &&
                  s.studentModules?.some(
                    (sm: StudentModule) =>
                      sm.semesterModuleId === module.semesterModuleId &&
                      !isFailingGrade(sm.grade) &&
                      !['Delete', 'Drop'].includes(sm.status),
                  )
                );
              }),
            );

            if (!hasBeenRepeated) {
              failedModules.push({ module, semester: semester.term });
            }
          }
        });
      }
    });
  });

  return failedModules;
}

function getLatestSemesterFailures(
  programs: Program[],
): { module: StudentModule; semester: string }[] {
  let latestSemesterNumber = 0;
  let latestSemester: Semester | undefined;

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNum = extractSemesterNumber(semester.term);
      if (semesterNum > latestSemesterNumber) {
        latestSemesterNumber = semesterNum;
        latestSemester = semester;
      }
    });
  });

  if (!latestSemester?.studentModules) return [];

  const failedModules: { module: StudentModule; semester: string }[] = [];
  latestSemester.studentModules.forEach((module: StudentModule) => {
    if (
      isFailingGrade(module.grade) &&
      !['Delete', 'Drop'].includes(module.status)
    ) {
      failedModules.push({ module, semester: latestSemester!.term });
    }
  });

  return failedModules;
}

function getAllPendingModules(
  programs: Program[],
): { module: StudentModule; semester: string }[] {
  const pendingModules: { module: StudentModule; semester: string }[] = [];

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      semester.studentModules?.forEach((module: StudentModule) => {
        if (
          (isFailingGrade(module.grade) ||
            isSupplementaryGrade(module.grade)) &&
          !['Delete', 'Drop'].includes(module.status)
        ) {
          const hasBeenRepeated = programs.some((p) =>
            p.semesters?.some((s) => {
              const currentSemesterNum = extractSemesterNumber(semester.term);
              const laterSemesterNum = extractSemesterNumber(s.term);
              return (
                laterSemesterNum > currentSemesterNum &&
                s.studentModules?.some(
                  (sm: StudentModule) =>
                    sm.semesterModuleId === module.semesterModuleId &&
                    !isFailingGrade(sm.grade) &&
                    sm.grade !== 'PP' &&
                    !['Delete', 'Drop'].includes(sm.status),
                )
              );
            }),
          );

          if (!hasBeenRepeated) {
            pendingModules.push({ module, semester: semester.term });
          }
        }
      });
    });
  });

  return pendingModules;
}

/**
 * Convert programs data to the new semester module data format
 */
function convertToSemesterModuleData(
  programs: Program[],
): SemesterModuleData[] {
  const semesterDataMap = new Map<number, ModuleForRemarks[]>();

  programs.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNumber = extractSemesterNumber(semester.term);

      if (!semesterDataMap.has(semesterNumber)) {
        semesterDataMap.set(semesterNumber, []);
      }

      const modules = semesterDataMap.get(semesterNumber)!;

      semester.studentModules?.forEach((module) => {
        if (!['Delete', 'Drop'].includes(module.status)) {
          modules.push({
            code:
              module.semesterModule.module?.code ??
              `ID:${module.semesterModuleId}`,
            name:
              module.semesterModule.module?.name ??
              `Semester Module ID: ${module.semesterModuleId}`,
            grade: module.grade,
            credits: module.semesterModule.credits,
            status: module.status as ModuleStatus,
            semesterNumber,
            semesterModuleId: module.semesterModuleId,
          });
        }
      });
    });
  });

  return Array.from(semesterDataMap.entries()).map(
    ([semesterNumber, modules]) => ({
      semesterNumber,
      modules,
    }),
  );
}

export function calculateAcademicRemarks(
  programs: Program[],
): AcademicRemarksResult {
  const activePrograms = programs.filter(
    (program) => program.status === 'Active',
  );

  const filteredPrograms = activePrograms.map((program) => ({
    ...program,
    semesters: program.semesters
      ?.filter((semester) => !['Deleted', 'Deferred'].includes(semester.status))
      .map((semester) => ({
        ...semester,
        studentModules: semester.studentModules?.filter(
          (module) => !['Delete', 'Drop'].includes(module.status),
        ),
      })),
  }));

  const nextSemesterNumber = getNextSemesterNumber(filteredPrograms);
  const latestSemesterFailures = getLatestSemesterFailures(filteredPrograms);
  const matchingParityFailures = getFailedModulesFromMatchingSemesters(
    filteredPrograms,
    nextSemesterNumber,
  );
  const allPendingModules = getAllPendingModules(filteredPrograms);
  const pendingModules = allPendingModules.map(({ module, semester }) => ({
    code: module.semesterModule.module?.code ?? `ID:${module.semesterModuleId}`,
    name:
      module.semesterModule.module?.name ??
      `Semester Module ID: ${module.semesterModuleId}`,
    type: isSupplementaryGrade(module.grade)
      ? ('Supplementary' as const)
      : ('Failed' as const),
    semester,
  }));

  const isRemainInSemester =
    latestSemesterFailures.length >= 3 || matchingParityFailures.length >= 3;

  const status = isRemainInSemester ? 'Remain in Semester' : 'Proceed';

  let details = '';
  if (isRemainInSemester) {
    if (latestSemesterFailures.length >= 3) {
      details = `Failed ${latestSemesterFailures.length} modules in the latest semester`;
    } else {
      const parityType = nextSemesterNumber % 2 === 1 ? 'odd' : 'even';
      details = `Failed ${matchingParityFailures.length} unrepeated modules from ${parityType} semesters`;
    }
  } else {
    details = 'Student is eligible to proceed';
  }

  return {
    status,
    pendingModules,
    details,
  };
}

/**
 * Calculate faculty remarks using the new shared logic from grades.ts
 * This provides more detailed remarks including specific module codes
 */
export function calculateDetailedFacultyRemarks(
  programs: Program[],
): FacultyRemarksResult {
  const activePrograms = programs.filter(
    (program) => program.status === 'Active',
  );

  const filteredPrograms = activePrograms.map((program) => ({
    ...program,
    semesters: program.semesters
      ?.filter((semester) => !['Deleted', 'Deferred'].includes(semester.status))
      .map((semester) => ({
        ...semester,
        studentModules: semester.studentModules?.filter(
          (module) => !['Delete', 'Drop'].includes(module.status),
        ),
      })),
  }));

  // Convert to new data structure
  const semesterData = convertToSemesterModuleData(filteredPrograms);
  const nextSemesterNumber = getNextSemesterNumber(filteredPrograms);

  // Get the latest semester modules for current semester analysis
  let latestSemesterNumber = 0;
  let latestSemesterModules: (ModuleForRemarks & {
    code: string;
    name: string;
  })[] = [];

  filteredPrograms.forEach((program) => {
    program.semesters?.forEach((semester) => {
      const semesterNum = extractSemesterNumber(semester.term);
      if (semesterNum > latestSemesterNumber) {
        latestSemesterNumber = semesterNum;
        latestSemesterModules =
          semester.studentModules?.map((module) => ({
            code:
              module.semesterModule.module?.code ??
              `ID:${module.semesterModuleId}`,
            name:
              module.semesterModule.module?.name ??
              `Semester Module ID: ${module.semesterModuleId}`,
            grade: module.grade,
            credits: module.semesterModule.credits,
            status: module.status as ModuleStatus,
            semesterNumber: semesterNum,
            semesterModuleId: module.semesterModuleId,
          })) ?? [];
      }
    });
  });
  // Use the new shared calculation logic
  return calculateFacultyRemarks(
    latestSemesterModules,
    semesterData.filter((s) => s.semesterNumber < latestSemesterNumber),
    nextSemesterNumber,
  );
}
